import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchWithTimeout } from '@/lib/fetch-with-timeout'
import { consumeNativeTelemetryState } from '@/lib/auth/telemetry-oauth'
import { hasRequiredStravaScopes, normalizeStravaScopes } from '@/lib/telemetry/strava-scopes'

const reply = (body: object, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' },
})

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (request.headers.get('x-triwavex-native') !== '1' ||
      request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' ||
      (origin !== null && origin !== new URL(request.url).origin)) return reply({ error: 'Solicitud no permitida' }, 403)
  if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) return reply({ error: 'La conexión con Strava no está disponible.' }, 503)
  try {
    const body = await request.text()
    if (body.length > 4096) return reply({ error: 'Respuesta inválida de Strava.' }, 413)
    const input: unknown = JSON.parse(body)
    if (!input || typeof input !== 'object' || !('code' in input) || !('state' in input) ||
        typeof input.code !== 'string' || typeof input.state !== 'string' ||
        !input.code || input.code.length > 1024 || !/^[a-f0-9]{64}$/.test(input.state)) return reply({ error: 'Respuesta inválida de Strava.' }, 400)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado. Vuelve a iniciar sesión.' }, 401)
    if (!await consumeNativeTelemetryState(user.id, input.state)) return reply({ error: 'La conexión ha caducado. Vuelve a intentarlo.' }, 400)
    const exchange = await fetchWithTimeout('https://www.strava.com/oauth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: process.env.STRAVA_CLIENT_ID, client_secret: process.env.STRAVA_CLIENT_SECRET, code: input.code, grant_type: 'authorization_code' }),
    })
    if (!exchange.ok) return reply({ error: 'Strava no ha podido autorizar la cuenta.' }, 502)
    const token = await exchange.json()
    if (typeof token.access_token !== 'string' || typeof token.refresh_token !== 'string' ||
        !Number.isFinite(token.expires_at) || !Number.isSafeInteger(token.athlete?.id)) return reply({ error: 'Respuesta inválida de Strava.' }, 502)
    const scopes = normalizeStravaScopes(token.scope)
    if (!hasRequiredStravaScopes(scopes)) return reply({ error: 'Necesitamos permiso para actividades y perfil. Vuelve a conectar Strava.' }, 403)
    const admin = createAdminClient()
    const { error: deviceError } = await admin.from('user_connected_devices').upsert({
      user_id: user.id, provider: 'strava', access_token: token.access_token, refresh_token: token.refresh_token,
      expires_at: new Date(token.expires_at * 1000).toISOString(), scopes,
    }, { onConflict: 'user_id, provider' })
    if (deviceError) throw new Error('device')
    const { error: profileError } = await admin.from('profiles').update({
      strava_connected: true, external_athlete_id: `strava_user_${token.athlete.id}`,
    }).eq('id', user.id)
    if (profileError) throw new Error('profile')
    return reply({ connected: true })
  } catch {
    return reply({ error: 'No se ha podido conectar Strava. Inténtalo de nuevo.' }, 503)
  }
}
