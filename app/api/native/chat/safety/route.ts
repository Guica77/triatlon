import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { reportChatMessageFor, setChatBlockFor } from '@/lib/chat-safety'

const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' } })

// Report a message or block/unblock a contact from the native chat (App Review 1.2).
export async function POST(request: Request) {
  if (request.headers.get('x-triwavex-native') !== '1' || request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply({ error: 'Solicitud no permitida' }, 403)
  const input = await request.json().catch(() => null)
  if (!input || typeof input !== 'object') return reply({ error: 'Solicitud inválida' }, 400)
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return reply({ error: 'No autorizado' }, 401)

  const result = input.action === 'report'
    ? await reportChatMessageFor(db, createAdminClient(), user.id, input.messageId, 'direct', input.reason)
    : input.action === 'block' || input.action === 'unblock'
      ? await setChatBlockFor(db, user.id, input.participantId, input.action === 'block')
      : { error: 'Acción no válida' }
  if (result.error) return reply(result, 400)
  return reply(result)
}
