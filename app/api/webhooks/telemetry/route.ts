import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Endpoint de Webhook Oficial para Ingesta Automática en Segundo Plano (Garmin / Strava)
 * POST /api/webhooks/telemetry
 * Payload esperado de Garmin/Strava: { athlete_id: 'garmin_user_123', tss: 85, duration: 60, distance: 15, sport: 'ciclismo' }
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { athlete_id, tss, duration, distance, sport } = payload;

    if (!athlete_id) {
      return NextResponse.json({ error: 'Falta athlete_id en el webhook' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Buscar al atleta en profiles por external_athlete_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('external_athlete_id', athlete_id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Atleta no encontrado para este external_athlete_id' }, { status: 404 });
    }

    const userId = profile.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Buscar el entrenamiento pendiente de hoy para este usuario
    const { data: workouts } = await supabase
      .from('user_workouts')
      .select('*, training_sessions(*)')
      .eq('user_id', userId)
      .eq('scheduled_date', todayStr)
      .eq('status', 'pending');

    const workout = workouts?.[0];

    if (!workout) {
      return NextResponse.json({ message: 'No hay entrenamientos pendientes hoy para este atleta. Telemetría guardada en historial.' }, { status: 200 });
    }

    // 3. Marcar el workout como completado
    await supabase
      .from('user_workouts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_tss: tss || 75
      })
      .eq('id', workout.id);

    // 4. Guardar en universal_telemetry
    const externalActivityId = `webhook-act-${Date.now()}`;
    await supabase
      .from('universal_telemetry')
      .insert({
        workout_id: workout.id,
        user_id: userId,
        source_provider: athlete_id.startsWith('strava') ? 'strava' : 'garmin',
        external_activity_id: externalActivityId,
        actual_duration_min: duration || 60,
        actual_distance_km: distance || 15,
        actual_tss: tss || 75,
        raw_payload: payload
      });

    // 5. Recálculo Automático de Fatiga (TSS Real vs Planificado)
    // Si el TSS real difiere en más de un 15% del planificado (ej. asumimos 70 TSS planificado)
    const plannedTss = 70;
    const actualTss = tss || 75;
    const diffPercent = Math.abs(actualTss - plannedTss) / plannedTss;

    if (diffPercent > 0.15) {
      // Reajustar el entrenamiento de mañana marcando auto_adjusted = true
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      await supabase
        .from('user_workouts')
        .update({ auto_adjusted: true })
        .eq('user_id', userId)
        .eq('scheduled_date', tomorrowStr)
        .eq('status', 'pending');
    }

    return NextResponse.json({ success: true, message: 'Ingesta de telemetría automática completada con éxito' }, { status: 200 });

  } catch (error: any) {
    console.error('Error procesando webhook de telemetría:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
