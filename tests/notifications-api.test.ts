import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({
  user: null as { id: string } | null,
  sendPushNotification: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.user } }) },
  }),
}))

vi.mock('@/lib/notifications', () => ({
  sendPushNotification: h.sendPushNotification,
}))

import { POST } from '@/app/api/notifications/test/route'

describe('POST /api/notifications/test', () => {
  beforeEach(() => {
    h.user = null
    h.sendPushNotification.mockReset()
  })

  it('rechaza peticiones sin una sesión autenticada', async () => {
    const response = await POST(new Request('http://localhost/api/notifications/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }))

    expect(response.status).toBe(401)
    expect(h.sendPushNotification).not.toHaveBeenCalled()
  })

  it('envía la prueba solo a la suscripción guardada del usuario autenticado', async () => {
    h.user = { id: 'user-1' }
    h.sendPushNotification.mockResolvedValue(true)

    const response = await POST(new Request('http://localhost/api/notifications/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        subscription: { endpoint: 'https://attacker.example/push' },
        payload: { title: 'Contenido controlado por el cliente' },
      }),
    }))

    expect(response.status).toBe(200)
    expect(h.sendPushNotification).toHaveBeenCalledWith('user-1', {
      title: '¡Prueba exitosa! 🎉',
      body: 'Las notificaciones push están funcionando correctamente en tu dispositivo.',
      url: '/settings',
    })
  })

  it('devuelve un error operativo si no hay una suscripción válida o VAPID no funciona', async () => {
    h.user = { id: 'user-1' }
    h.sendPushNotification.mockResolvedValue(false)

    const response = await POST(new Request('http://localhost/api/notifications/test', { method: 'POST' }))

    expect(response.status).toBe(503)
  })
})
