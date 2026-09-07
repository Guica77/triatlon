import { createHash, randomBytes } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const TELEMETRY_COOKIE = 'strava_oauth_state'
export function stateHash(state: string) { return createHash('sha256').update(state).digest('hex') }

export async function issueTelemetryState(userId: string, returnPath: string) {
  const state = randomBytes(32).toString('hex')
  const db = createAdminClient() as any
  const { error } = await db.from('oauth_challenges').insert({
    state_hash: stateHash(state), user_id: userId, return_path: returnPath,
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  })
  if (error) throw new Error('No se pudo iniciar la conexión segura')
  return state
}

export async function consumeTelemetryState(userId: string, state: string | null, cookie: string | undefined) {
  if (!state || !/^[a-f0-9]{64}$/.test(state) || cookie !== state) return null
  const db = createAdminClient() as any
  const { data, error } = await db.from('oauth_challenges').delete()
    .eq('state_hash', stateHash(state)).eq('user_id', userId)
    .gt('expires_at', new Date().toISOString()).select('return_path').maybeSingle()
  if (error || !data) return null
  return data.return_path === '/dashboard' ? '/dashboard' : '/settings'
}
