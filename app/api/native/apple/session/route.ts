import { createClient } from '@/lib/supabase/server'
import { oauthDisplayName } from '@/lib/auth/oauth'

const reply = (body: object, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' },
})

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (request.headers.get('x-triwavex-native') !== '1' ||
      request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' ||
      (origin !== null && origin !== new URL(request.url).origin)) {
    return reply({ error: 'Solicitud no permitida' }, 403)
  }

  try {
    const body = await request.text()
    if (body.length > 16384) return reply({ error: 'Solicitud demasiado grande' }, 413)
    let input: unknown
    try { input = JSON.parse(body) } catch { return reply({ error: 'Solicitud inválida' }, 400) }
    if (!input || typeof input !== 'object' || !('identityToken' in input) || !('nonce' in input) ||
        typeof input.identityToken !== 'string' || typeof input.nonce !== 'string' ||
        !input.identityToken || !input.nonce || input.identityToken.length > 12288 || input.nonce.length > 256) {
      return reply({ error: 'Credencial de Apple inválida' }, 400)
    }
    const role = (input as Record<string, unknown>).role === 'coach' ? 'coach' : 'athlete'

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple', token: input.identityToken, nonce: input.nonce,
    })
    if (error || !data.user || !data.session) return reply({ error: 'No se ha podido verificar Apple' }, 401)

    const { data: initialProfile, error: profileError } = await supabase.from('profiles')
      .select('role, active_plan_id').eq('id', data.user.id).maybeSingle()
    if (profileError) return reply({ error: 'No se ha podido cargar el perfil' }, 503)
    let profile = initialProfile
    if (!profile) {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const name = oauthDisplayName(data.user.user_metadata)
      const { error: createProfileError } = await createAdminClient().from('profiles').insert({
        id: data.user.id,
        email: data.user.email || '',
        first_name: name.firstName,
        last_name: name.lastName,
        role,
        level: 'intermedio',
      })
      if (createProfileError) return reply({ error: 'No se ha podido preparar el perfil' }, 503)
      profile = { role, active_plan_id: null }
    }
    const destination = profile?.role === 'coach' ? '/coach/dashboard' : profile?.active_plan_id ? '/dashboard' : '/onboarding'
    return reply({ destination })
  } catch {
    return reply({ error: 'Servicio no disponible' }, 503)
  }
}
