'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleWorkoutStatus(workoutId: string, currentStatus: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No autenticado")
  }

  const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
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

  revalidatePath('/dashboard')
  return { status: newStatus }
}
