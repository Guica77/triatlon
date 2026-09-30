'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { reportChatMessageFor, setChatBlockFor } from '@/lib/chat-safety'

export async function setChatBlock(target: string, blocked: boolean) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'No autorizado.' }
  const result = await setChatBlockFor(db, user.id, target, blocked)
  if (result.success) revalidatePath('/chat')
  return result
}

export async function reportChatMessage(messageId: string, kind: 'direct' | 'group', reason: string) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error:'No autorizado.' }
  return reportChatMessageFor(db, createAdminClient(), user.id, messageId, kind, reason)
}
