import { createClient } from '@/lib/supabase/server'
import { issueNativeTelemetryState } from '@/lib/auth/telemetry-oauth'
import { STRAVA_REQUIRED_SCOPES } from '@/lib/telemetry/strava-scopes'

const reply = (body: object, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' },
})

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  if (request.headers.get('x-triwavex-native') !== '1' ||
      (origin !== null && origin !== new URL(request.url).origin)) {
    return reply({ error: 'Solicitud no permitida' }, 403)
  }
  if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
    return reply({ error: 'La conexión con Strava no está disponible.' }, 503)
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return reply({ error: 'Tu sesión ha caducado. Vuelve a iniciar sesión.' }, 401)
  try {
    const state = await issueNativeTelemetryState(user.id)
    const authorizationURL = new URL('https://www.strava.com/oauth/mobile/authorize')
    authorizationURL.search = new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      redirect_uri: 'triwavex://strava/callback',
      response_type: 'code',
      approval_prompt: 'auto',
      scope: STRAVA_REQUIRED_SCOPES.join(','),
      state,
    }).toString()
    return reply({ authorizationURL: authorizationURL.href })
  } catch {
    return reply({ error: 'No se ha podido iniciar la conexión con Strava.' }, 503)
  }
}
