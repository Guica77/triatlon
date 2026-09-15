import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { consumeTelemetryState } from '@/lib/auth/telemetry-oauth'
import { fetchWithTimeout } from '@/lib/fetch-with-timeout'

const AUTHORITY = 'https://mcpeu.coros.com'
const COOKIE = 'coros_oauth'

type CorosCookie = { state: string; verifier: string; clientId: string }
function parseCookie(value: string | undefined): CorosCookie | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return typeof parsed.state === 'string' && /^[a-f0-9]{64}$/.test(parsed.state) && typeof parsed.verifier === 'string' && parsed.verifier.length >= 43 && typeof parsed.clientId === 'string' && parsed.clientId.length <= 512 ? parsed : null
  } catch { return null }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))
  const jar = await cookies()
  const stored = parseCookie(jar.get(COOKIE)?.value)
  jar.delete(COOKIE)
  try {
    const returnPath = await consumeTelemetryState(user.id, request.nextUrl.searchParams.get('state'), stored?.state)
    const code = request.nextUrl.searchParams.get('code')
    if (!returnPath || !stored || !code || request.nextUrl.searchParams.has('error')) throw new Error('Invalid COROS callback')
    const callback = new URL('/api/auth/coros/callback', process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).href
    const response = await fetchWithTimeout(`${AUTHORITY}/oauth2/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', client_id: stored.clientId, code, redirect_uri: callback, code_verifier: stored.verifier, resource: AUTHORITY }).toString(),
    })
    if (!response.ok) throw new Error('COROS token exchange failed')
    const token = await response.json()
    if (typeof token.access_token !== 'string' || typeof token.refresh_token !== 'string' || !Number.isFinite(token.expires_in)) throw new Error('Invalid COROS token')
    const admin = createAdminClient()
    const { error } = await (admin as any).from('user_connected_devices').upsert({ user_id: user.id, provider: 'coros', access_token: token.access_token, refresh_token: token.refresh_token, expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(), scopes: typeof token.scope === 'string' ? token.scope.split(/\s+/) : [] }, { onConflict: 'user_id, provider' })
    if (error) throw error
    return NextResponse.redirect(new URL(`${returnPath}?telemetry_connected=coros`, request.url))
  } catch {
    return NextResponse.redirect(new URL('/settings?error=coros_connection_failed', request.url))
  }
}
