import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/native/athlete/profile/route'

const { getUser, from } = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }))

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser }, from }) }))

const query = (value: unknown, error: unknown = null) => ({
  select: vi.fn(() => query(value, error)),
  eq: vi.fn(() => query(value, error)),
  order: vi.fn(() => query(value, error)),
  limit: vi.fn(() => query(value, error)),
  maybeSingle: vi.fn(async () => ({ data: value, error })),
  then: (resolve: (result: { data: unknown; error: unknown }) => unknown) => resolve({ data: value, error }),
})

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: { id: 'authenticated-athlete' } }, error: null })
  from.mockImplementation((table: string) => {
    if (table === 'profiles') return query({ first_name: 'Ana', last_name: 'López', level: 'Intermedio', strava_connected: false, garmin_connected: false })
    if (table === 'user_connected_devices') return query([{ provider: 'strava' }])
    if (table === 'user_biometrics') return query(null)
    throw new Error(`unexpected table ${table}`)
  })
})

const request = (headers: Record<string, string> = {}) => new Request('https://triwavex.test/api/native/athlete/profile', {
  headers: { 'x-triwavex-native': '1', ...headers },
})

describe('GET /api/native/athlete/profile', () => {
  it('rejects non-native or cross-origin requests before reading the session', async () => {
    expect((await GET(request({ 'x-triwavex-native': '' }))).status).toBe(403)
    expect((await GET(request({ origin: 'https://attacker.test' }))).status).toBe(403)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('requires an authenticated session', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    expect((await GET(request())).status).toBe(401)
  })

  it('returns only the authenticated athlete profile and truthful connection state', async () => {
    const response = await GET(request())
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toMatchObject({
      athlete: { firstName: 'Ana', lastName: 'López', level: 'Intermedio' },
      connections: { strava: true, garmin: false },
      recovery: null,
    })
  })
})
