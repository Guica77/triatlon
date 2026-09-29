import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aiDisclosure } from '@/lib/ai-privacy'
import { isConsentCurrent, parseAIConsentInput } from '@/lib/native/ai-consent'

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' },
})

function rejected(request: Request, requiresJSON: boolean) {
  const origin = request.headers.get('origin')
  return request.headers.get('x-triwavex-native') !== '1' ||
    (requiresJSON && request.headers.get('content-type')?.split(';')[0] !== 'application/json') ||
    (origin !== null && origin !== new URL(request.url).origin)
}

async function currentState(userId: string) {
  const disclosure = aiDisclosure()
  // The table is service-role writable only; the user can read their own row via RLS.
  const supabase = await createClient()
  const { data } = await (supabase as any).from('ai_consents').select('version,granted').eq('user_id', userId).maybeSingle()
  return {
    available: disclosure.providers.length > 0,
    providers: disclosure.providers,
    models: disclosure.models,
    version: disclosure.version,
    granted: isConsentCurrent(data as { version: string; granted: boolean } | null, disclosure.version),
  }
}

export async function GET(request: Request) {
  if (rejected(request, false)) return reply({ error: 'Solicitud no permitida' }, 403)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)
    return reply(await currentState(user.id))
  } catch {
    return reply({ error: 'Servicio no disponible.' }, 503)
  }
}

export async function POST(request: Request) {
  if (rejected(request, true)) return reply({ error: 'Solicitud no permitida' }, 403)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)

    const disclosure = aiDisclosure()
    const input = parseAIConsentInput(await request.json().catch(() => null), disclosure.version)
    if (input === 'stale') return reply({ error: 'La lista de proveedores de IA ha cambiado. Revísala antes de decidir.' }, 409)
    if (!input) return reply({ error: 'La decisión no es válida.' }, 400)
    if (input.granted && disclosure.providers.length === 0) return reply({ error: 'La IA no está disponible en este momento.' }, 409)

    const admin = createAdminClient() as any
    const { error } = await admin.from('ai_consents').upsert({
      user_id: user.id,
      granted: input.granted,
      version: input.version,
      updated_at: new Date().toISOString(),
    })
    if (error) return reply({ error: 'No se ha podido guardar tu decisión. Inténtalo de nuevo.' }, 503)
    return reply(await currentState(user.id))
  } catch {
    return reply({ error: 'Servicio no disponible.' }, 503)
  }
}
