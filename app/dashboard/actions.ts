'use server'

import { createClient } from '@/lib/supabase/server'
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
