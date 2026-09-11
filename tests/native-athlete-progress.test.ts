import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/native/athlete/progress/route'

const { getUser, from, profileQuery, workoutQuery, biometricsQuery } = vi.hoisted(() => ({
  getUser: vi.fn(), from: vi.fn(), profileQuery: {}, workoutQuery: {}, biometricsQuery: {},
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser }, from }) }))

const query = (value: unknown, error: unknown = null) => ({
  select: vi.fn(() => query(value, error)),
  eq: vi.fn(() => query(value, error)),
  gte: vi.fn(() => query(value, error)),
  lte: vi.fn(() => query(value, error)),
  order: vi.fn(() => query(value, error)),
  limit: vi.fn(() => query(value, error)),
  maybeSingle: vi.fn(async () => ({ data: value, error })),
})

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: { id: 'authenticated-athlete' } }, error: null })
  from.mockImplementation((table: string) => {
    if (table === 'profiles') return query({ first_name: 'Ana', role: 'athlete' })
    if (table === 'user_workouts') return query([])
    if (table === 'user_biometrics') return query(null)
    throw new Error(`unexpected table ${table}`)
  })
})

const request = (url = 'https://triwavex.test/api/native/athlete/progress', headers: Record<string, string> = {}) =>
  new Request(url, { headers: { 'x-triwavex-native': '1', ...headers } })

describe('GET /api/native/athlete/progress', () => {
  it('rejects missing native header and external origins before auth', async () => {
    expect((await GET(request(undefined, { 'x-triwavex-native': '' }))).status).toBe(403)
    expect((await GET(request(undefined, { origin: 'https://attacker.test' }))).status).toBe(403)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('requires an authenticated session', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    const response = await GET(request())
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('derives every query from the authenticated user and ignores client ids', async () => {
    const response = await GET(request('https://triwavex.test/api/native/athlete/progress?user_id=other-user'))
    expect(response.status).toBe(200)
    expect(from).toHaveBeenCalledWith('profiles')
    expect(from).toHaveBeenCalledWith('user_workouts')
    expect(from).toHaveBeenCalledWith('user_biometrics')
    for (const call of from.mock.results) {
      const builder = call.value
      expect(builder.eq).toBeDefined()
    }
  })

  it('serializes the contract and returns an empty state without fabricated data', async () => {
    const response = await GET(request())
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('vary')).toBe('Cookie')
    expect(await response.json()).toMatchObject({
      athlete: { firstName: 'Ana' }, state: 'empty', todayWorkout: null,
      week: { plannedSessions: 0, completedSessions: 0, completionPercent: 0 },
    })
  })

  it('returns a generic service error when a query fails', async () => {
    from.mockImplementationOnce(() => query(null, new Error('private database detail')))
    const response = await GET(request())
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain('private database detail')
  })
})
