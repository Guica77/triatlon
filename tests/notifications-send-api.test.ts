import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({
  user: null as { id: string } | null,
  message: null as { id: string; sender_id: string; receiver_id: string; message: string } | null,
  sendPushNotification: vi.fn(),
}))

function query(): any {
  return {
    select: () => query(),
    eq: () => query(),
    maybeSingle: async () => ({ data: h.message, error: null }),
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.user } }) },
    from: () => query(),
  }),
}))

vi.mock('@/lib/notifications', () => ({
  sendPushNotification: h.sendPushNotification,
}))

import { POST } from '@/app/api/notifications/send/route'

function request(body: unknown) {
  return new Request('http://localhost/api/notifications/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/notifications/send', () => {
  beforeEach(() => {
    h.user = null
    h.message = null
    h.sendPushNotification.mockReset()
  })

  it('rechaza remitentes sin autenticar', async () => {
    expect((await POST(request({ message_id: 'message-1' }))).status).toBe(401)
    expect(h.sendPushNotification).not.toHaveBeenCalled()
  })

  it('no permite notificar usando el mensaje de otro remitente', async () => {
    h.user = { id: 'attacker' }
    h.message = { id: 'message-1', sender_id: 'sender-1', receiver_id: 'receiver-1', message: 'Privado' }

    expect((await POST(request({ message_id: 'message-1' }))).status).toBe(403)
    expect(h.sendPushNotification).not.toHaveBeenCalled()
  })

  it('deriva destinatario y contenido del mensaje persistido, no del cuerpo del cliente', async () => {
    h.user = { id: 'sender-1' }
    h.message = { id: 'message-1', sender_id: 'sender-1', receiver_id: 'receiver-1', message: 'Mensaje guardado' }
    h.sendPushNotification.mockResolvedValue(true)

    const response = await POST(request({
      message_id: 'message-1',
      receiver_id: 'victim',
      message_body: 'Contenido manipulado',
    }))

    expect(response.status).toBe(200)
    expect(h.sendPushNotification).toHaveBeenCalledWith('receiver-1', {
      title: 'Nuevo mensaje en Triatlón Pro',
      body: 'Mensaje guardado',
      url: '/chat',
    })
  })
})
