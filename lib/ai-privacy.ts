import { createAdminClient } from '@/lib/supabase/admin'

export function aiDisclosure() {
  const providers: string[] = []
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY) providers.push('Google Gemini')
  if (process.env.ANTHROPIC_API_KEY) providers.push('Anthropic Claude')
  return { providers, version: `2026-09-07:${providers.join(',')}` }
}

export async function authorizeAIRequest(actorId: string, athleteId: string) {
  try {
  const { version, providers } = aiDisclosure()
  if (!providers.length) return { allowed: false, code: 'AI_UNAVAILABLE' }
  const db = createAdminClient() as any
  const ids = [...new Set([actorId, athleteId])]
  const { data, error } = await db.from('ai_consents').select('user_id, version, granted').in('user_id', ids)
  if (error || !ids.every(id => data?.some((row: any) => row.user_id === id && row.version === version && row.granted === true))) {
    return { allowed: false, code: 'AI_CONSENT_REQUIRED' }
  }
  const slot = await db.rpc('take_ai_request_slot', { target: actorId })
  if (slot.error || slot.data !== true) return { allowed: false, code: 'AI_RATE_LIMIT' }
  return { allowed: true, code: 'OK' }
  } catch { return { allowed: false, code: 'AI_UNAVAILABLE' } }
}
