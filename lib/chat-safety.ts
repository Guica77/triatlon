// Shared by the web server actions and the native API so both clients apply
// the same validation, RLS reads and daily report limit.

export type ChatSafetyResult = { success?: true; error?: string }
export type ChatMessageKind = 'direct' | 'group'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isChatUUID = (value: unknown): value is string => typeof value === 'string' && uuid.test(value)

export const MAX_REPORTS_PER_DAY = 10

export function validateReportInput(messageId: unknown, kind: unknown, reason: unknown): { messageId: string; kind: ChatMessageKind; reason: string } | null {
  if (!isChatUUID(messageId) || (kind !== 'direct' && kind !== 'group') || typeof reason !== 'string') return null
  const trimmed = reason.trim()
  if (trimmed.length < 5 || reason.length > 1000) return null
  return { messageId, kind, reason: trimmed }
}

/** `db` is the caller's session client, so RLS decides which blocks they own. */
export async function setChatBlockFor(db: any, userId: string, target: unknown, blocked: unknown): Promise<ChatSafetyResult> {
  if (!isChatUUID(target) || typeof blocked !== 'boolean') return { error: 'Usuario no válido.' }
  if (userId === target) return { error: 'No autorizado.' }
  const result = blocked
    ? await db.from('chat_blocks').upsert({ blocker_id: userId, blocked_id: target }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true })
    : await db.from('chat_blocks').delete().eq('blocker_id', userId).eq('blocked_id', target)
  if (result.error) return { error: 'No se pudo cambiar el bloqueo.' }
  return { success: true }
}

/**
 * The message is read with the caller's RLS (never service-role access to
 * arbitrary messages); only the report itself is written with `admin`.
 */
export async function reportChatMessageFor(db: any, admin: any, userId: string, messageId: unknown, kind: unknown, reason: unknown): Promise<ChatSafetyResult> {
  const input = validateReportInput(messageId, kind, reason)
  if (!input) return { error: 'Describe el motivo entre 5 y 1000 caracteres.' }
  const { data: message, error } = await db.from(input.kind === 'direct' ? 'chat_messages' : 'group_messages').select('sender_id').eq('id', input.messageId).maybeSingle()
  if (error || !message || message.sender_id === userId) return { error: 'No se puede denunciar este mensaje.' }
  const { count, error: countError } = await admin.from('chat_reports').select('id', { count: 'exact', head: true }).eq('reporter_id', userId).gte('created_at', new Date(Date.now() - 86_400_000).toISOString())
  if (countError || (count ?? 0) >= MAX_REPORTS_PER_DAY) return { error: 'No se pueden enviar más avisos por ahora. Utiliza Soporte si necesitas ayuda.' }
  const result = await admin.from('chat_reports').upsert(
    { reporter_id: userId, reported_id: message.sender_id, message_id: input.messageId, message_kind: input.kind, reason: input.reason },
    { onConflict: 'reporter_id,message_id,message_kind', ignoreDuplicates: true },
  )
  if (result.error) return { error: 'No se pudo registrar la denuncia.' }
  return { success: true }
}
