import { beforeEach, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/native/google/session/route'

const { signInWithIdToken, from, insert } = vi.hoisted(() => ({ signInWithIdToken: vi.fn(), from: vi.fn(), insert: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { signInWithIdToken }, from }) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => ({ insert }) }) }))

beforeEach(() => {
  vi.clearAllMocks()
  signInWithIdToken.mockResolvedValue({ data: {}, error: new Error('provider details') })
  from.mockImplementation((table: string) => {
    const value = table === 'profiles'
      ? (from.mock.calls.filter(([name]) => name === 'profiles').length === 1
        ? { id: 'google-user' }
        : { role: 'athlete', active_plan_id: 'plan-id' })
      : { plan: 'athlete', status: 'active', period_ends_at: '2099-01-01T00:00:00.000Z' }
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      maybeSingle: vi.fn(async () => ({ data: value, error: null })),
    }
    return builder
  })
})

const request = (body = JSON.stringify({ identityToken: 'google.jwt', role: 'athlete' }), headers = {}) =>
  new Request('https://triwavex.test/api/native/google/session', {
    method: 'POST', body, headers: { 'content-type': 'application/json', 'x-triwavex-native': '1', ...headers },
  })

it('rejects non-native, cross-origin, and malformed Google sign-in requests', async () => {
  expect((await POST(request(undefined, { origin: 'https://attacker.test' }))).status).toBe(403)
  expect((await POST(request('{}'))).status).toBe(400)
  expect((await POST(request('x'.repeat(16385)))).status).toBe(413)
  expect(signInWithIdToken).not.toHaveBeenCalled()
})

it('verifies the Google ID token server-side and hides provider errors', async () => {
  const response = await POST(request())
  expect(response.status).toBe(401)
  expect(await response.text()).not.toContain('provider details')
  expect(signInWithIdToken).toHaveBeenCalledWith({ provider: 'google', token: 'google.jwt' })
})

it('returns the persisted role and server-owned access for an existing Google user', async () => {
  signInWithIdToken.mockResolvedValue({
    data: { user: { id: 'google-user' }, session: { access_token: 'never-return-this' } }, error: null,
  })
  const response = await POST(request(JSON.stringify({ identityToken: 'google.jwt', role: 'coach' })))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    destination: '/dashboard', userID: 'google-user', role: 'athlete', entitled: true,
  })
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(insert).not.toHaveBeenCalled()
})
