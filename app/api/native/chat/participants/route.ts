import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' } })

export async function GET(request: Request) {
  if (request.headers.get('x-triwavex-native') !== '1') return reply({ error: 'Solicitud no permitida' }, 403)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return reply({ error: 'No autorizado' }, 401)

  const { data: profile } = await supabase.from('profiles').select('role, coach_id').eq('id', user.id).single()
  if (!profile) return reply({ error: 'Perfil no encontrado' }, 404)
  const admin = createAdminClient()

  if (profile.role === 'coach') {
    const { data: links, error } = await supabase.from('coach_athletes').select('athlete_id').eq('coach_id', user.id)
    if (error) return reply({ error: 'No se han podido cargar los atletas' }, 503)
    const ids = (links || []).map(link => link.athlete_id)
    if (!ids.length) return reply({ data: [], role: 'coach' })
    const { data, error: profilesError } = await admin.from('profiles').select('id, first_name, last_name, role').in('id', ids)
    if (profilesError) return reply({ error: 'No se han podido cargar los atletas' }, 503)
    return reply({ data: data || [], role: 'coach' })
  }

  let coachId = profile.coach_id
  if (!coachId) {
    const { data: link } = await supabase.from('coach_athletes').select('coach_id').eq('athlete_id', user.id).maybeSingle()
    coachId = link?.coach_id || null
  }
  if (!coachId) return reply({ data: [], role: 'athlete' })
  const { data: coach, error } = await admin.from('profiles').select('id, first_name, last_name, role').eq('id', coachId).single()
  if (error) return reply({ error: 'No se ha podido cargar el entrenador' }, 503)
  return reply({ data: [coach], role: 'athlete' })
}
