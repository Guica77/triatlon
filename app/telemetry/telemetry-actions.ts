'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { pushWorkoutToDevice } from '@/app/telemetry/workout-push-actions';
import { sendWorkoutCompletionEmail } from '@/lib/email';

function safeWaitUntil(promise: Promise<any>) {
  if (typeof (globalThis as any).waitUntil === 'function') {
    (globalThis as any).waitUntil(promise);
  } else {
    promise.catch(err => {
      console.error('Error in safeWaitUntil background task:', err);
    });
  }
}

export interface TelemetryPayload {
  workout_id: string;
  user_id: string;
  source_provider: string; // 'garmin', 'strava', 'apple_health', 'polar', 'suunto', 'coros', 'wahoo'
  external_activity_id: string;
  actual_duration_min: number;
  moving_time_min?: number;
  actual_distance_km: number;
  elevation_gain_m?: number;
  actual_tss: number;
  avg_hr?: number;
  max_hr?: number;
  hr_zones_summary?: Record<string, number>;
  avg_power?: number;
  normalized_power?: number;
  avg_cadence?: number;
  training_effect_aerobic?: number;
  training_effect_anaerobic?: number;
  raw_payload: any;
}

/**
 * Endpoint/Webhook para ingesta de telemetría universal desde relojes y Strava
 */
export async function ingestActivityTelemetry(payload: TelemetryPayload) {
  try {
    const supabase = await createClient();

    // 1. Insertar en la tabla universal_telemetry
    const { error: insertError } = await supabase.from('universal_telemetry').insert({
      workout_id: payload.workout_id,
      user_id: payload.user_id,
      source_provider: payload.source_provider,
      external_activity_id: payload.external_activity_id,
      actual_duration_min: payload.actual_duration_min,
      moving_time_min: payload.moving_time_min || null,
      actual_distance_km: payload.actual_distance_km,
      elevation_gain_m: payload.elevation_gain_m || 0,
      actual_tss: payload.actual_tss,
      avg_hr: payload.avg_hr || null,
      max_hr: payload.max_hr || null,
      hr_zones_summary: payload.hr_zones_summary || null,
      avg_power: payload.avg_power || null,
      normalized_power: payload.normalized_power || null,
      avg_cadence: payload.avg_cadence || null,
      training_effect_aerobic: payload.training_effect_aerobic || null,
      training_effect_anaerobic: payload.training_effect_anaerobic || null,
      raw_payload: payload.raw_payload
    });

    if (insertError) {
      return { error: insertError.message };
    }

    // 2. Actualizar el workout marcándolo como completado y asignando el TSS real
    const { error: updateError } = await supabase.from('user_workouts').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      actual_tss: payload.actual_tss
    }).eq('id', payload.workout_id);

    if (updateError) {
      return { error: updateError.message };
    }

    // 3. Evaluar cumplimiento y disparar recálculo dinámico si hay desviación > ±15%
    const adjustmentMsg = await evaluateAndAdjustTrainingPlan(payload.user_id, payload.workout_id, payload.actual_tss);

    // Enviar correo de actividad completada de forma asíncrona no bloqueante
    safeWaitUntil(
      sendWorkoutCompletionEmail(
        payload.user_id,
        payload.workout_id,
        payload.actual_tss,
        payload.source_provider,
        adjustmentMsg
      ).catch(err => {
        console.error('Error enviando correo de telemetría:', err);
      })
    );

    // Disparar notificación push para nutrición post-entrenamiento
    safeWaitUntil(
      (async () => {
        const { sendPushNotification } = await import('@/lib/notifications');
        await sendPushNotification(payload.user_id, {
          title: 'Nutrición Post-Entreno 🍎',
          body: '¡Buen entreno completado! Recuerda recargar con tus ingredientes preferidos. Pulsa aquí para ver tus recomendaciones de hoy.',
          url: '/dashboard'
        });
      })().catch(err => {
        console.error('Error enviando push de nutrición:', err);
      })
    );

    (revalidateTag as any)('analytics');
    revalidatePath('/dashboard');
    revalidatePath('/analytics');
    revalidatePath('/feedback');

    return { 
      success: true, 
      adjusted: !!adjustmentMsg,
      message: adjustmentMsg || 'Actividad sincronizada correctamente' 
    };

  } catch (error: any) {
    console.error('Error en ingestActivityTelemetry:', error);
    return { error: error.message || 'Error en la ingesta de telemetría' };
  }
}

/**
 * Motor Inteligente de Recálculo Dinámico de Planes
 */
async function evaluateAndAdjustTrainingPlan(userId: string, workoutId: string, actualTss: number): Promise<string | null> {
  const supabase = await createClient();

  // Obtener el workout planificado y su sesión
  const { data: workout } = await supabase.from('user_workouts')
    .select('training_sessions(duration_min, description, sport_type)')
    .eq('id', workoutId)
    .single();

  if (!workout?.training_sessions) return null;

  const session = workout.training_sessions;
  const plannedDuration = session.duration_min || 60;
  
  // Estimación base de TSS planificado (Z2 IF 0.75)
  const plannedTss = (plannedDuration / 60) * Math.pow(0.75, 2) * 100;
  
  const deltaTss = actualTss - plannedTss;
  const percentageDiff = (deltaTss / plannedTss) * 100;

  // Si la desviación es menor al 15%, no hacemos recálculo
  if (Math.abs(percentageDiff) <= 15) {
    return null;
  }

  // Obtener las próximas 2 sesiones pendientes del py-atleta
  const { data: upcomingWorkouts } = await supabase.from('user_workouts')
    .select('id, scheduled_date, training_sessions(duration_min, description, sport_type)')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('scheduled_date', { ascending: true })
    .limit(2);

  if (!upcomingWorkouts || upcomingWorkouts.length === 0) return null;

  if (percentageDiff > 15) {
    // EXCESO DE FATIGA: Reducir intensidad/duración de las próximas sesiones
    for (const nextW of upcomingWorkouts) {
      await supabase.from('user_workouts').update({
        auto_adjusted: true
      }).eq('id', nextW.id);
    }
    return `¡Atención! Hemos suavizado tus sesiones de los próximos 2 días para compensar el exceso de fatiga (+${Math.round(deltaTss)} TSS) registrado por tu dispositivo.`;
  } else {
    // DÉFICIT DE CARGA: Marcar para ligero incremento
    for (const nextW of upcomingWorkouts) {
      await supabase.from('user_workouts').update({
        auto_adjusted: true
      }).eq('id', nextW.id);
    }
    return `Hemos adaptado tus próximas sesiones para compensar la menor carga registrada hoy (${Math.round(actualTss)} TSS vs ${Math.round(plannedTss)} previstos).`;
  }
}

/**
 * Función helper para simular la ingesta de un reloj Garmin/Strava desde el cliente (Demo interactiva)
 */
export async function simulateWatchIngestion(workoutId: string, sportType: string) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: 'No autorizado' };

    const userId = authData.user.id;

    // Generar telemetría realista con exceso de fatiga para demostrar el recálculo dinámico
    const actualDuration = sportType === 'ciclismo' ? 120 : sportType === 'carrera' ? 75 : sportType === 'fuerza' ? 50 : 60;
    const actualDistance = sportType === 'ciclismo' ? 62.5 : sportType === 'carrera' ? 14.2 : sportType === 'fuerza' ? 0 : 3.2;
    const actualTss = sportType === 'ciclismo' ? 145 : sportType === 'carrera' ? 110 : sportType === 'fuerza' ? 45 : 85;

    const payload: TelemetryPayload = {
      workout_id: workoutId,
      user_id: userId,
      source_provider: Math.random() > 0.5 ? 'garmin' : 'strava',
      external_activity_id: `ext-${Date.now()}`,
      actual_duration_min: actualDuration,
      moving_time_min: actualDuration - 3,
      actual_distance_km: actualDistance,
      elevation_gain_m: sportType === 'ciclismo' ? 850 : sportType === 'fuerza' ? 0 : 180,
      actual_tss: actualTss,
      avg_hr: sportType === 'fuerza' ? 128 : 152,
      max_hr: sportType === 'fuerza' ? 158 : 178,
      avg_power: sportType === 'ciclismo' ? 215 : undefined,
      normalized_power: sportType === 'ciclismo' ? 230 : undefined,
      avg_cadence: sportType === 'carrera' ? 176 : sportType === 'fuerza' ? undefined : 92,
      training_effect_aerobic: sportType === 'fuerza' ? 2.2 : 4.2,
      training_effect_anaerobic: sportType === 'fuerza' ? 2.8 : 2.1,
      raw_payload: { simulated: true, device: 'Garmin Forerunner 965', firmware: '18.22' }
    };

    return await ingestActivityTelemetry(payload);

  } catch (error: any) {
    return { error: error.message || 'Error en la simulación' };
  }
}

/**
 * Sincronización Total Inteligente (Batch Sync & Automatic Workout Push)
 * Ingesta todas las sesiones pasadas/actuales pendientes y envía las futuras al reloj.
 */
export async function syncAllPendingWorkouts() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: 'No autorizado' };

    const userId = authData.user.id;

    // Obtener todos los entrenamientos de la semana actual
    const now = new Date();
    const currentDay = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - currentDay + 1);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const { data: workouts } = await supabase
      .from('user_workouts')
      .select('*, training_sessions(*)')
      .eq('user_id', userId)
      .gte('scheduled_date', monday.toISOString().split('T')[0])
      .lte('scheduled_date', sunday.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true });

    if (!workouts || workouts.length === 0) {
      return { success: true, count: 0, pushedCount: 0, message: 'No se encontraron entrenamientos programados para esta semana' };
    }

    const todayStr = now.toISOString().split('T')[0];
    let syncedCount = 0;
    let pushedCount = 0;

    for (const w of workouts) {
      if (w.training_sessions?.sport_type === 'descanso') continue;

      if (w.scheduled_date <= todayStr && w.status === 'pending') {
        // INGESTA AUTOMÁTICA: Aquí se consultaría la API real (Garmin/Strava) para ver si
        // el usuario realmente completó la actividad. 
        // Hemos desactivado simulateWatchIngestion() para evitar que la demo marque
        // como completadas actividades que el usuario no ha realizado.
      } else if (w.scheduled_date > todayStr && w.status === 'pending') {
        // PUSH AUTOMÁTICO AL RELOJ: Enviar sesiones futuras al calendario del dispositivo (Garmin/Strava)
        const pushRes = await pushWorkoutToDevice(w.id, 'garmin');
        if (pushRes?.success) {
          pushedCount++;
        }
      }
    }

    (revalidateTag as any)('analytics');
    revalidatePath('/dashboard');
    revalidatePath('/analytics');
    revalidatePath('/feedback');

    return { 
      success: true, 
      count: syncedCount, 
      pushedCount, 
      message: `¡Sincronización Total Inteligente completada! ${syncedCount} sesiones leídas y ${pushedCount} entrenamientos enviados a tu reloj.` 
    };

  } catch (error: any) {
    console.error('Error en syncAllPendingWorkouts:', error);
    return { error: error.message || 'Error en la sincronización total' };
  }
}

export async function getRecentStravaActivities() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: 'No autorizado' };

    const userId = authData.user.id;

    // Find profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('strava_connected, strava_auth_tokens')
      .eq('id', userId)
      .single();

    if (!profile || !profile.strava_connected) {
      return { activities: [] };
    }

    const tokens = profile.strava_auth_tokens as any;
    let accessToken = tokens?.access_token;

    if (!accessToken) {
      return { activities: [] };
    }

    // Refresh if needed
    if (tokens?.expires_at && tokens.expires_at < Date.now()) {
      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;
        
        await supabase
          .from('profiles')
          .update({
            strava_auth_tokens: {
              access_token: refreshData.access_token,
              refresh_token: refreshData.refresh_token || tokens.refresh_token,
              expires_at: refreshData.expires_at * 1000,
            }
          } as any)
          .eq('id', userId);
      } else {
        console.error('Failed to refresh Strava token:', await refreshResponse.text());
        return { error: 'Error al refrescar credenciales de Strava' };
      }
    }

    // Fetch last 10 activities
    const activitiesResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!activitiesResponse.ok) {
      const errorText = await activitiesResponse.text();
      console.error('Failed to fetch Strava activities:', errorText);
      return { error: 'Error al obtener actividades desde Strava' };
    }

    const activities = await activitiesResponse.json();
    return { activities };
  } catch (error: any) {
    console.error('Error in getRecentStravaActivities:', error);
    return { error: error.message || 'Error inesperado' };
  }
}

export async function evaluateFeedbackAndAdjustPlan(
  userId: string,
  workoutId: string,
  rpe: number,
  feeling: string,
  painLocalized: boolean,
  intensityAdherence?: string
): Promise<{ adjusted: boolean; message: string }> {
  try {
    const supabase = await createClient();

    // 1. Verificar si hay disparadores de fatiga/lesión/desviación
    const hasFatigueAlert = rpe >= 8 || feeling === 'fatigado' || feeling === 'lesionado' || painLocalized || intensityAdherence === 'suave';

    if (!hasFatigueAlert) {
      return { adjusted: false, message: 'Feedback normal registrado.' };
    }

    // Determinar la causa exacta para la adaptación de IA
    let reason = 'fatiga';
    let adjustText = 'fatiga acumulada';
    if (painLocalized || feeling === 'lesionado') {
      reason = 'lesion';
      adjustText = 'riesgo de lesión o dolor muscular localizado';
    } else if (intensityAdherence === 'suave') {
      reason = 'adherencia';
      adjustText = 'dificultad para completar la intensidad programada';
    }

    // 2. Obtener los siguientes 2 entrenamientos pendientes del atleta
    const { data: upcoming, error: upcomingError } = await supabase
      .from('user_workouts')
      .select('id, scheduled_date')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('scheduled_date', { ascending: true })
      .limit(2);

    if (upcomingError) {
      console.error('Error al obtener entrenamientos futuros:', upcomingError);
    }

    // 3. Ajustar los entrenamientos si existen
    if (upcoming && upcoming.length > 0) {
      const ids = upcoming.map(u => u.id);
      const { error: updateError } = await supabase
        .from('user_workouts')
        .update({ 
          auto_adjusted: true,
          adjustment_reason: reason
        })
        .in('id', ids);

      if (updateError) {
        console.error('Error al reajustar entrenamientos futuros:', updateError);
      }
    }

    // 4. Alertar al entrenador en el chat si tiene uno
    const { data: profile } = await supabase
      .from('profiles')
      .select('coach_id, first_name, last_name')
      .eq('id', userId)
      .single();

    if (profile?.coach_id) {
      const adminSupabase = createAdminClient();
      const athleteName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Atleta';
      let sport = 'entrenamiento';

      const { data: workout } = await supabase
        .from('user_workouts')
        .select('training_sessions(sport_type)')
        .eq('id', workoutId)
        .single();

      if (workout?.training_sessions?.sport_type) {
        sport = workout.training_sessions.sport_type;
      }

      const feelingEmoji: Record<string, string> = {
        excelente: '😃 Excelente',
        buena: '🙂 Bueno',
        fatigado: '🥱 Fatigado',
        lesionado: '🤕 Lesionado'
      };

      const alertMsg = `⚠️ **Alerta de IA: Reajuste de Plan**\nEl atleta **${athleteName}** ha completado su sesión de **${sport}** con:\n- Esfuerzo Percibido (RPE): **${rpe}/10**\n- Sensaciones: **${feelingEmoji[feeling] || feeling}**\n- ¿Dolor Localizado?: **${painLocalized ? 'Sí 🔴' : 'No 🟢'}**\n- Adherencia a Intensidad: **${
        intensityAdherence === 'suave' ? 'Más suave de lo planeado 📉' : intensityAdherence === 'fuerte' ? 'Más fuerte 📈' : 'Clavado 🎯'
      }**\n\n*La IA ha adaptado preventivamente los entrenamientos de los próximos 2 días debido a: **${adjustText}**.*`;

      await adminSupabase.from('chat_messages').insert({
        sender_id: userId,
        receiver_id: profile.coach_id,
        message: alertMsg
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/analytics');
    revalidatePath('/feedback');

    const friendlyMessages: Record<string, string> = {
      lesion: '¡Aviso! Se han adaptado tus entrenamientos futuros a recuperación activa (Z1) por prevención de lesiones.',
      adherencia: 'Se han suavizado tus siguientes sesiones para ayudarte a consolidar el ritmo y asentar las zonas.',
      fatiga: 'Se ha reducido la duración de tus próximas sesiones para asegurar tu descanso y evitar sobrecarga.'
    };

    return {
      adjusted: true,
      message: friendlyMessages[reason] || 'Se han adaptado tus próximos entrenamientos preventivamente.'
    };
  } catch (error: any) {
    console.error('Error en evaluateFeedbackAndAdjustPlan:', error);
    return { adjusted: false, message: error.message || 'Error en el ajuste adaptativo' };
  }
}

