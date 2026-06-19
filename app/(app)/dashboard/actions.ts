'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath, revalidateTag } from 'next/cache'
import { sendWorkoutCompletionEmail } from '@/lib/email'
import { evaluateFeedbackAndAdjustPlan } from '@/app/telemetry/telemetry-actions'

function safeWaitUntil(promise: Promise<any>) {
  if (typeof (globalThis as any).waitUntil === 'function') {
    (globalThis as any).waitUntil(promise);
  } else {
    promise.catch(err => {
      console.error('Error in safeWaitUntil background task:', err);
    });
  }
}

export async function createManualWorkoutAction(formData: {
  title: string;
  sport_type: string;
  duration_min: number;
  scheduled_date: string;
  description?: string;
  status: 'pending' | 'completed';
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No autenticado")
  }

  const { title, sport_type, duration_min, scheduled_date, description, status } = formData

  // Obtener nombre del día de la semana
  const dateObj = new Date(scheduled_date)
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const dayName = days[dateObj.getDay()]

  const adminSupabase = createAdminClient()

  // 1. Insertar la sesión de entrenamiento correspondiente
  const { data: session, error: sessionError } = await adminSupabase
    .from('training_sessions')
    .insert({
      plan_id: null,
      week_number: 1,
      day_name: dayName,
      sport_type,
      duration_min,
      description: description || `Sesión de ${sport_type} creada manualmente: ${title}`
    })
    .select()
    .single()

  if (sessionError || !session) {
    console.error("Error creando sesión manual:", sessionError)
    throw new Error("No se pudo crear la sesión de entrenamiento")
  }

  // 2. Instanciar en el calendario del usuario
  const { data: workout, error: workoutError } = await adminSupabase
    .from('user_workouts')
    .insert({
      user_id: user.id,
      session_id: session.id,
      scheduled_date,
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    })
    .select()
    .single()

  if (workoutError || !workout) {
    console.error("Error creando workout manual:", workoutError)
    throw new Error("No se pudo programar el entrenamiento")
  }

  if (status === 'completed') {
    safeWaitUntil(
      sendWorkoutCompletionEmail(
        user.id,
        workout.id,
        0,
        'manual'
      ).catch(err => {
        console.error('Error sending manual completion email:', err);
      })
    );
  }

  (revalidateTag as any)('analytics')
  revalidatePath('/dashboard')
  return { success: true, workoutId: workout.id }
}

export async function updateWorkoutStatus(workoutId: string, newStatus: 'pending' | 'completed' | 'missed') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No autenticado")
  }

  const completedAt = newStatus === 'completed' ? new Date().toISOString() : null

  const { error } = await supabase
    .from('user_workouts')
    .update({ 
      status: newStatus,
      completed_at: completedAt 
    })
    .eq('id', workoutId)
    .eq('user_id', user.id)

  if (error) {
    console.error("Error actualizando estado del workout:", error)
    throw new Error("No se pudo actualizar el estado")
  }

  if (newStatus === 'completed') {
    safeWaitUntil(
      sendWorkoutCompletionEmail(
        user.id,
        workoutId,
        0,
        'manual'
      ).catch(err => {
        console.error('Error sending manual completion email:', err);
      })
    );
  }

  (revalidateTag as any)('analytics')
  revalidatePath('/dashboard')
  return { status: newStatus }
}

export async function toggleWorkoutStatus(workoutId: string, currentStatus: string) {
  const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  return updateWorkoutStatus(workoutId, newStatus);
}

export async function completeWorkoutWithFeedback(
  workoutId: string,
  rpe: number,
  feeling: string,
  intensityAdherence: string,
  painLocalized: boolean,
  notes: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No autenticado")
  }

  // Obtener coach_id del perfil del atleta
  const { data: profile } = await supabase.from('profiles').select('coach_id').eq('id', user.id).single();

  // Guardar feedback en BD
  const { error } = await supabase
    .from('workout_feedback')
    .insert({ 
      workout_id: workoutId,
      user_id: user.id,
      rpe_score: rpe,
      feeling: feeling,
      intensity_adherence: intensityAdherence,
      pain_localized: painLocalized,
      notes: notes || null
    })

  if (error) {
    console.error("Error guardando feedback:", error)
    throw new Error("No se pudo guardar el feedback")
  }

  const hasFatigueAlert = rpe >= 8 || feeling === 'fatigado' || feeling === 'lesionado' || painLocalized;

  // Si tiene entrenador y NO es una alerta de fatiga extrema/lesión, enviarle un mensaje automático de éxito al chat
  if (profile?.coach_id && !hasFatigueAlert) {
    const adminSupabase = createAdminClient();
    const feelingEmoji: Record<string, string> = {
      excelente: '😃 Excelente',
      buena: '🙂 Bueno',
      fatigado: '🥱 Fatigado',
      lesionado: '🤕 Lesionado'
    };
    await adminSupabase.from('chat_messages').insert({
      sender_id: user.id,
      receiver_id: profile.coach_id,
      message: `¡Entrenamiento completado! 🎯\n- Esfuerzo percibido (RPE): **${rpe}/10**\n- Sensaciones: **${feelingEmoji[feeling] || feeling}**\n- Adherencia: **${intensityAdherence}**\n${notes ? `\nNotas: ${notes}` : ''}`
    });
  }

  // Si tiene alertas, disparar el motor adaptativo (que ya gestiona su mensaje de alerta al coach si procede)
  try {
    await evaluateFeedbackAndAdjustPlan(user.id, workoutId, rpe, feeling, painLocalized);
  } catch (adjustError) {
    console.error('Error al ejecutar evaluación adaptativa de feedback:', adjustError);
  }

  // Marcar como completado
  return updateWorkoutStatus(workoutId, 'completed');
}
