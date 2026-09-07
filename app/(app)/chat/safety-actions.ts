'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function setChatBlock(target: string, blocked: boolean) {
  if (!uuid.test(target) || typeof blocked !== 'boolean') return { error: 'Usuario no válido.' }
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user || user.id === target) return { error: 'No autorizado.' }
  const result = blocked
    ? await (db as any).from('chat_blocks').upsert({ blocker_id:user.id, blocked_id:target }, { onConflict:'blocker_id,blocked_id', ignoreDuplicates:true })
    : await (db as any).from('chat_blocks').delete().eq('blocker_id',user.id).eq('blocked_id',target)
  if (result.error) return { error:'No se pudo cambiar el bloqueo.' }
  revalidatePath('/chat')
  return { success:true }
}

export async function reportChatMessage(messageId: string, kind: 'direct' | 'group', reason: string) {
  if (!uuid.test(messageId) || !['direct','group'].includes(kind) || typeof reason !== 'string' || reason.trim().length < 5 || reason.length > 1000) return { error:'Describe el motivo entre 5 y 1000 caracteres.' }
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error:'No autorizado.' }
  // Read using the caller's RLS, never service-role access to arbitrary messages.
  const { data: message, error } = await db.from(kind === 'direct' ? 'chat_messages' : 'group_messages').select('sender_id').eq('id',messageId).maybeSingle()
  if (error || !message || message.sender_id === user.id) return { error:'No se puede denunciar este mensaje.' }
  const admin = createAdminClient() as any
  const { count, error: countError } = await admin.from('chat_reports').select('id',{count:'exact',head:true}).eq('reporter_id',user.id).gte('created_at',new Date(Date.now()-86400000).toISOString())
  if (countError || (count ?? 0) >= 10) return { error:'No se pueden enviar más avisos por ahora. Utiliza Soporte si necesitas ayuda.' }
  const result = await admin.from('chat_reports').upsert({ reporter_id:user.id, reported_id:message.sender_id, message_id:messageId, message_kind:kind, reason:reason.trim() },{onConflict:'reporter_id,message_id,message_kind',ignoreDuplicates:true})
  if (result.error) return { error:'No se pudo registrar la denuncia.' }
  return { success:true }
}
