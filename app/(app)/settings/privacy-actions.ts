'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aiDisclosure } from '@/lib/ai-privacy'
import { revalidatePath } from 'next/cache'

export async function setAIConsent(granted: boolean, version: string) {
  if (typeof granted !== 'boolean' || version !== aiDisclosure().version) return { error: 'El aviso ha cambiado. Recarga la página antes de decidir.' }
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { error: 'Inicia sesión para gestionar tu permiso.' }
  const admin = createAdminClient() as any
  const { error } = await admin.from('ai_consents').upsert({ user_id: user.id, granted, version, updated_at: new Date().toISOString() })
  if (error) return { error: 'No se pudo guardar tu decisión. Inténtalo de nuevo.' }
  revalidatePath('/settings')
  return { success: true }
}
