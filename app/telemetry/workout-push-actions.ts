'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { parsePaceToSeconds } from '@/lib/zones-utility';

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
      user_id,
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

  // Obtener métricas fisiológicas del perfil para adaptar los objetivos
  const { data: profile } = await supabase.from('profiles')
    .select('current_ftp, current_swim_pace, current_run_pace')
    .eq('id', workout.user_id)
    .single();

  const ftp = profile?.current_ftp || 180;
  const runPaceSec = parsePaceToSeconds(profile?.current_run_pace, 330); // 5:30 min/km
  const swimPaceSec = parsePaceToSeconds(profile?.current_swim_pace, 120); // 2:00 min/100m

  // Parsear heurísticamente la descripción para construir series realistas
  const steps: WorkoutStep[] = [];

  // Paso 1: Calentamiento (10 min o hasta pulsar LAP)
  steps.push({
    type: 'Warmup',
    stepOrder: 1,
    endCondition: 'LAP_BUTTON',
    targetType: sport === 'CYCLED' ? 'POWER' : sport === 'RUNNING' ? 'PACE' : 'OPEN',
    targetValueOne: sport === 'CYCLED' ? Math.round(ftp * 0.50) : sport === 'RUNNING' ? Math.round(runPaceSec * 1.25) : undefined,
    targetValueTwo: sport === 'CYCLED' ? Math.round(ftp * 0.65) : sport === 'RUNNING' ? Math.round(runPaceSec * 1.35) : undefined,
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
          targetValueOne: sport === 'CYCLED' ? Math.round(ftp * 0.91) : sport === 'RUNNING' ? Math.round(runPaceSec * 0.95) : undefined,
          targetValueTwo: sport === 'CYCLED' ? Math.round(ftp * 1.05) : sport === 'RUNNING' ? Math.round(runPaceSec * 1.00) : undefined,
        },
        {
          type: 'Rest',
          stepOrder: 2,
          endCondition: 'TIME',
          endConditionValue: 90, // 1.5 min
          targetType: sport === 'CYCLED' ? 'POWER' : sport === 'RUNNING' ? 'PACE' : 'OPEN',
          targetValueOne: sport === 'CYCLED' ? Math.round(ftp * 0.50) : sport === 'RUNNING' ? Math.round(runPaceSec * 1.20) : undefined,
          targetValueTwo: sport === 'CYCLED' ? Math.round(ftp * 0.55) : sport === 'RUNNING' ? Math.round(runPaceSec * 1.25) : undefined,
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
      targetType: sport === 'CYCLED' ? 'POWER' : sport === 'RUNNING' ? 'PACE' : 'OPEN',
      targetValueOne: sport === 'CYCLED' ? Math.round(ftp * 0.56) : sport === 'RUNNING' ? Math.round(runPaceSec * 1.12) : undefined,
      targetValueTwo: sport === 'CYCLED' ? Math.round(ftp * 0.75) : sport === 'RUNNING' ? Math.round(runPaceSec * 1.24) : undefined,
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
export async function pushWorkoutToDevice(_workoutId: string, _provider: string): Promise<{ error?: string; success?: boolean; message?: string; externalId?: string }> {
  return { error: 'El envío directo de sesiones al reloj todavía no está disponible.' };
}

export async function connectDeviceProvider(_provider: string): Promise<{ error?: string; success?: boolean; message?: string }> {
  return { error: 'Utiliza la autorización de Strava desde Ajustes. Los demás proveedores todavía no están disponibles.' };
}
