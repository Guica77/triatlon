'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath, revalidateTag } from 'next/cache'
import { sendWorkoutCompletionEmail } from '@/lib/email'

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

