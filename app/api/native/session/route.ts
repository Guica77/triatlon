import { createClient } from '@/lib/supabase/server'
import { nativeAccessForUser } from '@/lib/native-access'

const reply = (body: object, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' },
})

export async function GET(request: Request) {
  if (request.headers.get('x-triwavex-native') !== '1') {
    return reply({ error: 'Solicitud no permitida' }, 403)
  }
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return reply({ error: 'Sesión no disponible' }, 401)
    const access = await nativeAccessForUser(supabase, user.id)
    return reply(access)
  } catch {
    return reply({ error: 'Servicio no disponible' }, 503)
  }
}

export async function POST(request: Request) {
  // JSON plus a custom header prevents browser form login-CSRF. Do not enable CORS.
  const origin = request.headers.get('origin')
  if (request.headers.get('x-triwavex-native') !== '1' ||
      request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' ||
      (origin !== null && origin !== new URL(request.url).origin)) {
    return reply({ error: 'Solicitud no permitida' }, 403)
  }
  try {
    const body = await request.text()
    if (body.length > 8192) return reply({ error: 'Solicitud demasiado grande' }, 413)
    let input: unknown
    try { input = JSON.parse(body) } catch { return reply({ error: 'Solicitud inválida' }, 400) }
    if (!input || typeof input !== 'object' || !('email' in input) || !('password' in input) ||
        typeof input.email !== 'string' || typeof input.password !== 'string' ||
        !input.email.trim() || input.email.length > 320 || !input.password || input.password.length > 4096) {
      return reply({ error: 'Credenciales inválidas' }, 400)
    }
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email: input.email.trim(), password: input.password })
    if (error || !data.user || !data.session) return reply({ error: 'Credenciales inválidas o correo no confirmado' }, 401)
    const access = await nativeAccessForUser(supabase, data.user.id)
    return reply(access)
  } catch {
    return reply({ error: 'Servicio no disponible' }, 503)
  }
}
