import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({
  user: null as { id: string } | null,
  upsert: vi.fn(async () => ({ error: null })),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: h.user } }) },
    from: () => ({ upsert: h.upsert }),
  }),
}))

import { POST } from '@/app/api/native/health/sync/route'

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://app.triwavex.com/api/native/health/sync', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-triwavex-native': '1',
      origin: 'https://app.triwavex.com',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

const metrics = { date: '2026-09-13', sleepHours: 7.4, hrv: 62.8, restingHeartRate: 48.2 }

describe('POST /api/native/health/sync', () => {
  beforeEach(() => {
    h.user = null
    h.upsert.mockClear()
  })

  it('rechaza llamadas que no vienen de la app nativa', async () => {
    const response = await POST(request(metrics, { 'x-triwavex-native': '0' }))
    expect(response.status).toBe(403)
    expect(h.upsert).not.toHaveBeenCalled()
  })

  it('valida todas las métricas antes de guardarlas', async () => {
    h.user = { id: 'athlete-1' }
    const response = await POST(request({ ...metrics, hrv: 999 }))
    expect(response.status).toBe(400)
    expect(h.upsert).not.toHaveBeenCalled()
  })

  it('requiere una sesión autenticada', async () => {
    const response = await POST(request(metrics))
    expect(response.status).toBe(401)
    expect(h.upsert).not.toHaveBeenCalled()
  })

  it('guarda datos de Salud validados para el atleta autenticado', async () => {
    h.user = { id: 'athlete-1' }
    const response = await POST(request(metrics))
    expect(response.status).toBe(200)
    expect(h.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'athlete-1',
        date: '2026-09-13',
        sleep_hours: 7.4,
        hrv: 63,
        rhr: 48,
        source: 'apple_health',
      }),
      { onConflict: 'user_id,date' },
    )
  })
})
