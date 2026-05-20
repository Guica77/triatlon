'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface WorkoutStep {
  type: 'Warmup' | 'Interval' | 'Rest' | 'Repeat' | 'Cooldown';
  stepOrder: number;
  repeatCount?: number;
  endCondition: 'LAP_BUTTON' | 'TIME' | 'DISTANCE';
  endConditionValue?: number; // segundos o metros
  targetType: 'POWER' | 'HEART_RATE' | 'PACE' | 'OPEN';
  targetValueOne?: number; // min o limite inferior
  targetValueTwo?: number; // max o limite superior
  workoutSteps?: WorkoutStep[]; // sub-pasos para bloques Repeat
}

export interface StructuredWorkoutPayload {
  workoutName: string;
  sport: 'CYCLED' | 'RUNNING' | 'SWIMMING' | 'GENERIC';
  description: string;
  workoutSegments: {
    segmentOrder: number;
    sport: 'CYCLED' | 'RUNNING' | 'SWIMMING' | 'GENERIC';
    workoutSteps: WorkoutStep[];
  }[];
}

/**
 * 1. Convertir una sesión relacional de Supabase en un árbol estructurado de Garmin / FIT
 */
export async function generateStructuredWorkout(workoutId: string): Promise<StructuredWorkoutPayload | null> {
  const supabase = await createClient();

  const { data: workout } = await supabase.from('user_workouts')
    .select(`
      id, 
      scheduled_date,
      training_sessions (
        sport_type,
        duration_min,
        description,
        day_name
      )
    `)
    .eq('id', workoutId)
    .single();

  if (!workout?.training_sessions) return null;

  const session = workout.training_sessions;
  const sportMap: Record<string, 'CYCLED' | 'RUNNING' | 'SWIMMING' | 'GENERIC'> = {
    ciclismo: 'CYCLED',
    carrera: 'RUNNING',
    natacion: 'SWIMMING',
    brick: 'GENERIC'
  };

  const sport = sportMap[session.sport_type] || 'GENERIC';
  const desc = session.description || '';

  // Parsear heurísticamente la descripción para construir series realistas
  const steps: WorkoutStep[] = [];

  // Paso 1: Calentamiento (10 min o hasta pulsar LAP)
  steps.push({
    type: 'Warmup',
    stepOrder: 1,
    endCondition: 'LAP_BUTTON',
    targetType: sport === 'CYCLED' ? 'POWER' : sport === 'RUNNING' ? 'HEART_RATE' : 'OPEN',
    targetValueOne: sport === 'CYCLED' ? 120 : sport === 'RUNNING' ? 110 : undefined,
    targetValueTwo: sport === 'CYCLED' ? 150 : sport === 'RUNNING' ? 130 : undefined,
  });

  // Paso 2: Bloque Principal (Series / Intervalos según detección en texto)
  const isInterval = desc.includes('series') || desc.includes('x') || desc.includes('Z4') || desc.includes('fuerte');
  
  if (isInterval) {
    // Ejemplo de bloque Repeat: 5x 3 min fuerte con 1.5 min suave
    steps.push({
      type: 'Repeat',
      stepOrder: 2,
      repeatCount: 5,
      endCondition: 'TIME',
      targetType: 'OPEN',
      workoutSteps: [
        {
          type: 'Interval',
          stepOrder: 1,
          endCondition: 'TIME',
          endConditionValue: 180, // 3 min
          targetType: sport === 'CYCLED' ? 'POWER' : sport === 'RUNNING' ? 'PACE' : 'OPEN',
          targetValueOne: sport === 'CYCLED' ? 220 : sport === 'RUNNING' ? 240 : undefined, // 240s = 4:00 min/km
          targetValueTwo: sport === 'CYCLED' ? 250 : sport === 'RUNNING' ? 270 : undefined, // 270s = 4:30 min/km
        },
        {
          type: 'Rest',
          stepOrder: 2,
          endCondition: 'TIME',
          endConditionValue: 90, // 1.5 min
          targetType: sport === 'CYCLED' ? 'POWER' : sport === 'RUNNING' ? 'HEART_RATE' : 'OPEN',
          targetValueOne: sport === 'CYCLED' ? 100 : sport === 'RUNNING' ? 110 : undefined,
          targetValueTwo: sport === 'CYCLED' ? 130 : sport === 'RUNNING' ? 125 : undefined,
        }
      ]
    });
  } else {
    // Bloque continuo aeróbico
    const mainDuration = Math.max(((session.duration_min || 60) - 20) * 60, 1200);
    steps.push({
      type: 'Interval',
      stepOrder: 2,
      endCondition: 'TIME',
      endConditionValue: mainDuration,
      targetType: sport === 'CYCLED' ? 'POWER' : sport === 'RUNNING' ? 'HEART_RATE' : 'OPEN',
      targetValueOne: sport === 'CYCLED' ? 170 : sport === 'RUNNING' ? 130 : undefined,
      targetValueTwo: sport === 'CYCLED' ? 195 : sport === 'RUNNING' ? 145 : undefined,
    });
  }

  // Paso 3: Enfriamiento (Cooldown)
  steps.push({
    type: 'Cooldown',
    stepOrder: 3,
    endCondition: 'TIME',
    endConditionValue: 600, // 10 min
    targetType: 'OPEN'
  });

  return {
    workoutName: `Sesión de ${session.sport_type} • ${session.day_name}`,
    sport,
    description: desc,
    workoutSegments: [
      {
        segmentOrder: 1,
        sport,
        workoutSteps: steps
      }
    ]
  };
}

/**
 * 2. Servicio de Push a Garmin / Strava API con Backoff Exponencial y Cola de Reintentos
 */
export async function pushWorkoutToDevice(workoutId: string, provider: string) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: 'No autorizado' };

    const userId = authData.user.id;

    // Verificar si el usuario tiene credenciales OAuth para este proveedor
    const { data: device } = await supabase.from('user_connected_devices')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (!device) {
      return { error: `No hay conexión activa con ${provider}. Por favor, conecta tu cuenta primero.` };
    }

    // Generar el payload estructurado
    const payload = await generateStructuredWorkout(workoutId);
    if (!payload) return { error: 'No se pudo generar la estructura del entrenamiento' };

    // Buscar o crear el log de sincronización
    let { data: syncLog } = await supabase.from('workout_sync_logs')
      .select('id, attempt_count, status')
      .eq('workout_id', workoutId)
      .eq('provider', provider)
      .single();

    if (!syncLog) {
      const { data: newLog } = await supabase.from('workout_sync_logs').insert({
        workout_id: workoutId,
        user_id: userId,
        provider,
        status: 'pending',
        attempt_count: 1
      }).select().single();
      syncLog = newLog;
    } else {
      await supabase.from('workout_sync_logs').update({
        attempt_count: (syncLog.attempt_count || 0) + 1,
        status: 'pending'
      }).eq('id', syncLog.id);
    }

    if (!syncLog) return { error: 'Error al inicializar el log de sincronización' };

    // Simular llamada HTTP POST a la API oficial (Garmin Training API / Strava)
    // Con un 10% de probabilidad simulamos un error HTTP 429 para demostrar el backoff exponencial
    const isRateLimited = Math.random() < 0.1;

    if (isRateLimited) {
      const attempt = (syncLog.attempt_count || 0) + 1;
      const backoffMinutes = attempt === 2 ? 1 : attempt === 3 ? 5 : 15;
      const nextRetry = new Date(Date.now() + backoffMinutes * 60000).toISOString();

      await supabase.from('workout_sync_logs').update({
        status: attempt > 4 ? 'failed' : 'pending',
        error_message: 'HTTP 429 Too Many Requests (Rate Limit)',
        next_retry_at: attempt > 4 ? null : nextRetry
      }).eq('id', syncLog.id);

      return { 
        error: `Servidor de ${provider} saturado. Reintentando automáticamente en ${backoffMinutes} min (Intento ${attempt}/4).`,
        rateLimited: true,
        nextRetry
      };
    }

    // Éxito en la sincronización
    const externalId = `garmin-ext-${Date.now()}`;
    await supabase.from('workout_sync_logs').update({
      status: 'success',
      external_workout_id: externalId,
      error_message: null,
      next_retry_at: null
    }).eq('id', syncLog.id);

    revalidatePath('/dashboard');
    revalidatePath('/feedback');

    return { 
      success: true, 
      externalId,
      message: `¡Entrenamiento enviado exitosamente a tu reloj ${provider}!` 
    };

  } catch (error: any) {
    console.error('Error en pushWorkoutToDevice:', error);
    return { error: error.message || 'Error en la sincronización con el reloj' };
  }
}

/**
 * 3. Simular la conexión inicial de OAuth 2.0 (Handshake)
 */
export async function connectDeviceProvider(provider: string) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: 'No autorizado' };

    const userId = authData.user.id;

    // Almacenar credenciales simuladas seguras
    const { error } = await supabase.from('user_connected_devices').upsert({
      user_id: userId,
      provider,
      access_token: `oauth-acc-${Math.random().toString(36).substring(7)}`,
      refresh_token: `oauth-ref-${Math.random().toString(36).substring(7)}`,
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(), // +30 días
      scopes: ['workout:write', 'telemetry:read']
    }, { onConflict: 'user_id, provider' });

    if (error) return { error: error.message };

    revalidatePath('/dashboard');
    revalidatePath('/feedback');

    return { success: true, message: `¡Cuenta de ${provider} conectada correctamente!` };

  } catch (error: any) {
    return { error: error.message || 'Error al conectar el proveedor' };
  }
}
