import { createClient } from '@/lib/supabase/server'

const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } })

function permitted(request: Request) {
  const origin = request.headers.get('origin')
  return request.headers.get('x-triwavex-native') === '1' && (origin === null || origin === new URL(request.url).origin)
}

export async function GET(request: Request) {
  if (!permitted(request)) return reply({ error: 'Solicitud no permitida' }, 403)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)
  const { data, error } = await supabase.from('profiles').select('deletion_scheduled_for').eq('id', user.id).maybeSingle()
  if (error || !data) return reply({ error: 'No se ha podido cargar tu cuenta.' }, 503)
  return reply({ deletionScheduledFor: data.deletion_scheduled_for })
}

export async function POST(request: Request) {
  if (!permitted(request) || request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply({ error: 'Solicitud no permitida' }, 403)
  const body = await request.json().catch(() => null)
  const action = body && typeof body === 'object' && 'action' in body ? body.action : null
  if (!['signout', 'scheduleDeletion', 'cancelDeletion'].includes(String(action))) return reply({ error: 'Solicitud inválida' }, 400)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)

  if (action === 'scheduleDeletion') {
    const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('profiles').update({ deletion_requested_at: new Date().toISOString(), deletion_scheduled_for: scheduledFor }).eq('id', user.id)
    if (error) return reply({ error: 'No se ha podido programar la eliminación.' }, 503)
    await supabase.auth.signOut({ scope: 'local' })
    return reply({ deletionScheduledFor: scheduledFor })
  }
  if (action === 'cancelDeletion') {
    const { error } = await supabase.from('profiles').update({ deletion_requested_at: null, deletion_scheduled_for: null }).eq('id', user.id)
    if (error) return reply({ error: 'No se ha podido cancelar la eliminación.' }, 503)
    return reply({ deletionScheduledFor: null })
  }
  await supabase.auth.signOut({ scope: 'local' })
  return reply({ success: true })
}
