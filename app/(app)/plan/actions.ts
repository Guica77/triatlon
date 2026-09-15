'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { previewPlanMove } from '@/lib/adaptive-plan/server'
import { notifyCoachOfPlanRequest } from '@/lib/adaptive-plan/notifications'

const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))
const validUUID = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

export async function previewOwnWorkoutMove(workoutId: string, newDate: string, targetSlot: 'morning' | 'evening' | 'flexible', idempotencyKey: string) {
  if (!validUUID(workoutId) || !validDate(newDate) || !['morning', 'evening', 'flexible'].includes(targetSlot) || !validUUID(idempotencyKey)) {
    return { error: 'La propuesta no es válida.' }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión ha caducado.' }
  const result = await previewPlanMove({
    userId: user.id,
    idempotencyKey,
    intent: { kind: 'move', workoutId, targetDate: newDate, targetSlot },
  })
  return 'error' in result ? { error: result.error } : result.data
}

export async function confirmOwnPlanChange(proposalId: string) {
  if (!validUUID(proposalId)) return { error: 'La propuesta no es válida.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión ha caducado.' }
  const rpc = supabase as unknown as {
    rpc(name: 'confirm_plan_adjustment', args: { proposal: string }): Promise<{ data: unknown; error: { code?: string; message: string } | null }>
  }
  const { data, error } = await rpc.rpc('confirm_plan_adjustment', { proposal: proposalId })
  if (error?.code === '40001') return { error: 'El plan cambió mientras lo revisabas. Vuelve a calcular la propuesta.' }
  if (error?.code === '42501') return { error: 'No tienes permiso para confirmar este cambio.' }
  if (error) return { error: 'No se ha podido confirmar el cambio.' }
  revalidateTag('analytics', 'max')
  revalidatePath('/plan')
  revalidatePath('/dashboard')
  return { success: true, result: data }
}

export async function submitOwnPlanRequest(proposalId: string) {
  if (!validUUID(proposalId)) return { error: 'La propuesta no es válida.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión ha caducado.' }
  const rpc = supabase as unknown as {
    rpc(name: 'submit_plan_adjustment_request', args: { proposal: string }): Promise<{ data: unknown; error: { code?: string; message: string } | null }>
  }
  const { data, error } = await rpc.rpc('submit_plan_adjustment_request', { proposal: proposalId })
  if (error?.code === '42501') return { error: 'Esta solicitud ya no está disponible. Vuelve a prepararla.' }
  if (error) return { error: 'No se ha podido enviar la solicitud al entrenador.' }
  if (data && typeof data === 'object' && 'coachId' in data && typeof data.coachId === 'string') {
    await notifyCoachOfPlanRequest(data.coachId)
  }
  return { success: true, result: data }
}

export async function undoOwnPlanChange(eventId: string) {
  if (!validUUID(eventId)) return { error: 'El cambio no es válido.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión ha caducado.' }
  const rpc = supabase as unknown as {
    rpc(name: 'undo_plan_adjustment', args: { event: string }): Promise<{ data: unknown; error: { code?: string; message: string } | null }>
  }
  const { data, error } = await rpc.rpc('undo_plan_adjustment', { event: eventId })
  if (error?.code === '40001') return { error: 'Esta sesión se ha actualizado de nuevo, así que no se puede deshacer con seguridad.' }
  if (error?.code === '42501') return { error: 'No tienes permiso para deshacer este cambio.' }
  if (error) return { error: 'No se ha podido deshacer el cambio.' }
  revalidateTag('analytics', 'max')
  revalidatePath('/plan')
  revalidatePath('/dashboard')
  return { success: true, result: data }
}
