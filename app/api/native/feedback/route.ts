import { createClient } from '@/lib/supabase/server'

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' },
})

const feedbackKinds = new Set(['Idea', 'Problema', 'Mejorar una función'])

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (request.headers.get('x-triwavex-native') !== '1' ||
      request.headers.get('content-type')?.split(';')[0] !== 'application/json' ||
      (origin !== null && origin !== new URL(request.url).origin)) {
    return reply({ error: 'Solicitud no permitida' }, 403)
  }

  const input = await request.json().catch(() => null) as Record<string, unknown> | null
  const kind = typeof input?.kind === 'string' ? input.kind : ''
  const rating = input?.rating
  const message = typeof input?.message === 'string' ? input.message.trim() : ''
  if (!feedbackKinds.has(kind) || typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5 || message.length < 4 || message.length > 2_000) {
    return reply({ error: 'El feedback no es válido.' }, 400)
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)

    const { error } = await supabase.from('app_feedback').insert({
      user_id: user.id,
      days_used: 0,
      rating,
      comments: `[${kind}] ${message}`,
    })
    return error ? reply({ error: 'No se ha podido guardar el feedback.' }, 503) : reply({ saved: true })
  } catch {
    return reply({ error: 'Servicio no disponible.' }, 503)
  }
}
