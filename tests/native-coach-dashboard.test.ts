import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/native/coach/dashboard/route'

const { getUser, from } = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser }, from }) }))

const query = (value: unknown, error: unknown = null) => ({
  select: vi.fn(() => query(value, error)),
  eq: vi.fn(() => query(value, error)),
  maybeSingle: vi.fn(async () => ({ data: value, error })),
})

const request = (headers: Record<string, string> = {}, url = 'https://triwavex.test/api/native/coach/dashboard') => new Request(url, {
  headers: { 'x-triwavex-native': '1', ...headers },
})

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: null }, error: null })
  from.mockImplementation((table: string) => {
    if (table === 'profiles') return query({ role: 'athlete', first_name: 'Ana' })
    throw new Error(`unexpected table ${table}`)
  })
})

describe('GET /api/native/coach/dashboard security', () => {
  it('rejects browser and cross-origin requests before auth', async () => {
    expect((await GET(request({ 'x-triwavex-native': '' }))).status).toBe(403)
    expect((await GET(request({ origin: 'https://attacker.test' }))).status).toBe(403)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('rejects malformed or oversized date ranges before reading team data', async () => {
    expect((await GET(request({}, 'https://triwavex.test/api/native/coach/dashboard?today=tomorrow'))).status).toBe(400)
    expect((await GET(request({}, 'https://triwavex.test/api/native/coach/dashboard?weekStart=2026-01-01&weekEnd=2026-01-20'))).status).toBe(400)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('requires a verified signed-in user', async () => {
    const response = await GET(request())
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(from).not.toHaveBeenCalled()
  })

  it('denies athlete sessions before querying roster data', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'athlete-id' } }, error: null })
    const response = await GET(request())
    expect(response.status).toBe(403)
    expect(from).toHaveBeenCalledTimes(1)
    expect(from).toHaveBeenCalledWith('profiles')
  })
})
