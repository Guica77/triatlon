import { createClient } from '@/lib/supabase/server'

const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' } })
const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(request: Request) {
  if (request.headers.get('x-triwavex-native') !== '1') return reply({ error: 'Solicitud no permitida' }, 403)
  const participantId = new URL(request.url).searchParams.get('participantId') || ''
  if (!uuid(participantId)) return reply({ error: 'Conversación inválida' }, 400)
  const { supabase, user } = await currentUser()
  if (!user) return reply({ error: 'No autorizado' }, 401)
  const { data, error } = await supabase.from('chat_messages').select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true }).order('id', { ascending: true }).limit(100)
  if (error) return reply({ error: 'No se ha podido cargar la conversación' }, 503)
  return reply({ data: data || [] })
}

export async function POST(request: Request) {
  if (request.headers.get('x-triwavex-native') !== '1' || request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply({ error: 'Solicitud no permitida' }, 403)
  const input = await request.json().catch(() => null)
  if (!input || typeof input.participantId !== 'string' || typeof input.message !== 'string' || typeof input.clientMessageId !== 'string' || !uuid(input.participantId) || !uuid(input.clientMessageId) || !input.message.trim() || input.message.length > 4000) return reply({ error: 'Mensaje inválido' }, 400)
  const { supabase, user } = await currentUser()
  if (!user) return reply({ error: 'No autorizado' }, 401)
  const { data, error } = await supabase.from('chat_messages').insert({ id: input.clientMessageId, sender_id: user.id, receiver_id: input.participantId, message: input.message.trim() }).select('*').single()
  if (error?.code === '23505') {
    const { data: saved } = await supabase.from('chat_messages').select('*').eq('id', input.clientMessageId).eq('sender_id', user.id).single()
    if (saved) return reply({ data: saved })
  }
  if (error) return reply({ error: 'No se ha podido enviar el mensaje' }, 503)
  return reply({ data })
}
