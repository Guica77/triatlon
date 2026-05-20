'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getStrengthExercisesForUser() {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getFallbackExercises();

    // 1. Obtener todos los ejercicios del catálogo
    const { data: exercises, error: exError } = await supabase.from('strength_exercises').select('*');
    if (exError || !exercises || exercises.length === 0) {
      return getFallbackExercises();
    }

    // 2. Obtener el progreso del atleta
    const { data: metrics } = await supabase
      .from('athlete_strength_metrics')
      .select('*')
      .eq('user_id', user.id);

    // 3. Mezclar y enviar al Frontend
    return (exercises as any[]).map((ex: any) => {
      const userMetric = (metrics as any[])?.find((m: any) => m.exercise_id === ex.id);
      return {
        id: ex.id,
        name: ex.name,
        muscle_group: ex.muscle_group,
        targetSets: 3, 
        targetReps: ex.name.includes('Dominadas') ? 12 : 10,
        lastLift: userMetric?.max_weight_lifted_kg || (ex.name.includes('Dominadas') ? 0 : 20),
        img: getExerciseImage(ex.name)
      };
    }).slice(0, 4); // Enviamos los 4 primeros para el entreno del día
  } catch (error) {
    console.error("Error fetching strength exercises:", error);
    return getFallbackExercises();
  }
}

export async function logStrengthSet(workoutId: string, exerciseId: string, setNumber: number, weight: number, reps: number, rir: number) {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // 1. Insertar el log de esta serie
    const { error: logError } = await supabase.from('workout_strength_logs').insert({
      user_workout_id: workoutId,
      exercise_id: exerciseId,
      set_number: setNumber,
      reps_completed: reps,
      weight_kg: weight,
      rir: rir
    });

    if (logError) throw logError;

    // 2. Auto-mejora: Actualizar el Peso Máximo (1RM) si el usuario lo ha superado
    const { data: metric } = await supabase
      .from('athlete_strength_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('exercise_id', exerciseId)
      .maybeSingle();

    const current1RM = calculate1RM(weight, reps, rir);

    if (!metric) {
      await supabase.from('athlete_strength_metrics').insert({
        user_id: user.id,
        exercise_id: exerciseId,
        max_weight_lifted_kg: weight,
        estimated_1rm_kg: current1RM
      });
    } else if (weight > (metric.max_weight_lifted_kg || 0) || current1RM > (metric.estimated_1rm_kg || 0)) {
      await supabase.from('athlete_strength_metrics')
        .update({
          max_weight_lifted_kg: Math.max(weight, metric.max_weight_lifted_kg || 0),
          estimated_1rm_kg: Math.max(current1RM, metric.estimated_1rm_kg || 0),
          last_updated_at: new Date().toISOString()
        })
        .eq('id', metric.id);
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("Error logging strength set:", error);
    return { success: false, error: error.message };
  }
}

// Fórmulas de Biomecánica y Auto-Regulación
function calculate1RM(weight: number, reps: number, rir: number) {
  // Fórmula de Epley ajustada por RIR (Reps in Reserve)
  // Si hiciste 10 reps con RIR 2, tu cuerpo era capaz de hacer 12.
  const effectiveReps = reps + rir;
  if (effectiveReps === 1) return weight;
  return Math.round(weight * (1 + effectiveReps / 30));
}

function getExerciseImage(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('sentadilla') || lower.includes('prensa')) return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=800';
  if (lower.includes('peso muerto') || lower.includes('isquio')) return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800';
  if (lower.includes('dominada') || lower.includes('remo')) return 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=800';
  return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800';
}

function getFallbackExercises() {
  return [
    { id: 'fallback-1', name: 'Sentadilla Búlgara', muscle_group: 'Piernas', targetSets: 3, targetReps: 10, lastLift: 24, img: getExerciseImage('sentadilla') },
    { id: 'fallback-2', name: 'Peso Muerto Rumano', muscle_group: 'Isquiosurales', targetSets: 3, targetReps: 8, lastLift: 60, img: getExerciseImage('peso muerto') },
    { id: 'fallback-3', name: 'Dominadas Asistidas', muscle_group: 'Espalda', targetSets: 3, targetReps: 12, lastLift: 0, img: getExerciseImage('dominadas') },
  ];
}
