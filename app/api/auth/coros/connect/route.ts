import { createHash, randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { issueTelemetryState } from '@/lib/auth/telemetry-oauth'
import { fetchWithTimeout } from '@/lib/fetch-with-timeout'

const AUTHORITY = 'https://mcpeu.coros.com'
const CALLBACK_PATH = '/api/auth/coros/callback'
const COOKIE = 'coros_oauth'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    const callback = new URL(CALLBACK_PATH, origin).href
    const registration = await fetchWithTimeout(`${AUTHORITY}/connect/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: 'TriWaveX', redirect_uris: [callback], grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none', scope: 'openid mcp.tools offline_access' }),
    })
    if (!registration.ok) throw new Error('COROS registration failed')
    const client = await registration.json()
    if (typeof client.client_id !== 'string' || client.client_id.length > 512) throw new Error('Invalid COROS client')
    const state = await issueTelemetryState(user.id, request.nextUrl.searchParams.get('onboarding') === 'true' ? '/dashboard' : '/settings')
    const verifier = randomBytes(48).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    const jar = await cookies()
    jar.set(COOKIE, JSON.stringify({ state, verifier, clientId: client.client_id }), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 })
    const url = new URL(`${AUTHORITY}/oauth2/authorize`)
    url.search = new URLSearchParams({ client_id: client.client_id, response_type: 'code', redirect_uri: callback, scope: 'openid mcp.tools offline_access', state, code_challenge: challenge, code_challenge_method: 'S256', resource: AUTHORITY }).toString()
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.redirect(new URL('/settings?error=coros_connection_failed', request.url))
  }
}
