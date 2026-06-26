import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  // 1. Verificación de seguridad de Vercel Cron
  const authHeader = request.headers.get('authorization');
  const isLocalDev = process.env.NODE_ENV === 'development';
  
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    !isLocalDev
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Obtener perfiles de usuarios activos
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*, training_plans(name)')
      .not('active_plan_id', 'is', null);

    if (profilesError) {
      console.error('Error al obtener perfiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const pushResults = [];

    for (const profile of profiles) {
      // Buscar entrenamientos programados para hoy
      const { data: todayWorkouts, error: workoutsError } = await supabase
        .from('user_workouts')
        .select('*, training_sessions(*)')
        .eq('user_id', profile.id)
        .eq('scheduled_date', todayStr);

      if (workoutsError) {
        console.error(`Error al buscar entrenamientos de hoy para el usuario ${profile.id}:`, workoutsError);
        continue;
      }

      const activeWorkouts = todayWorkouts?.filter(w => w.training_sessions?.sport_type !== 'descanso') || [];
      if (activeWorkouts.length === 0) {
        // Hoy era descanso, no molestamos al usuario
        continue;
      }

      // Comprobar los diferentes estados
      const pendingWorkouts = activeWorkouts.filter(w => w.status === 'pending');
      const completedWorkouts = activeWorkouts.filter(w => w.status === 'completed');
      const missedWorkouts = activeWorkouts.filter(w => w.status === 'missed');
      
      const hasPending = pendingWorkouts.length > 0;

      // Si el entrenamiento de hoy no se completó, lo marcamos como 'missed' en BD
      if (hasPending) {
        const { error: updateError } = await supabase
          .from('user_workouts')
          .update({ status: 'missed' })
          .eq('user_id', profile.id)
          .eq('scheduled_date', todayStr)
          .eq('status', 'pending');

        if (updateError) {
          console.error(`Error al actualizar estado a missed para ${profile.id}:`, updateError);
        }
      }

      // Preparar mensaje push
      let title = '';
      let bodyText = '';

      if (hasPending || missedWorkouts.length > 0) {
        const sessionsToReport = hasPending ? pendingWorkouts : missedWorkouts;
        const missedSessionNames = sessionsToReport
          .map(w => w.training_sessions?.sport_type?.toUpperCase() || 'ENTRENAMIENTO')
          .join(' y ');

        title = 'Recordatorio de Tarde 🌙';
        bodyText = `¡Oye, ${profile.first_name || 'Triatleta'}! Hoy tenías sesión de ${missedSessionNames} pendiente. Recuerda que la constancia es la clave. ¡Mañana reajustamos! 🚀`;
      } else if (completedWorkouts.length === activeWorkouts.length) {
        title = '¡Excelente trabajo hoy! 🎉';
        bodyText = `¡Felicidades, ${profile.first_name || 'Triatleta'}! Has completado todas tus sesiones programadas de hoy. ¡Sigue así! 🏆`;
      } else {
        continue; // Fallback
      }

      // Enviar notificación push
      const { sendPushNotification } = await import('@/lib/notifications');
      const pushSuccess = await sendPushNotification(profile.id, {
        title,
        body: bodyText,
        url: '/dashboard'
      });

      pushResults.push({
        userId: profile.id,
        success: pushSuccess,
        method: 'web_push'
      });
    }

    return NextResponse.json({
      success: true,
      processed_date: todayStr,
      results: pushResults
    });

  } catch (error: any) {
    console.error('Excepción general en cron reminders evening:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
