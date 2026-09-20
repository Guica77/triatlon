import { beforeEach, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/native/session/route'

const { signInWithPassword, profileMaybeSingle, entitlementMaybeSingle, eq } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(), profileMaybeSingle: vi.fn(), entitlementMaybeSingle: vi.fn(), eq: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { signInWithPassword }, from: () => ({ select: () => ({ eq }) }),
}) }))
beforeEach(() => {
  vi.clearAllMocks()
  signInWithPassword.mockResolvedValue({ data: { user: { id: 'athlete-id' }, session: { access_token: 'never-return-this' } }, error: null })
  eq.mockImplementation((column: string) => ({ maybeSingle: column === 'id' ? profileMaybeSingle : entitlementMaybeSingle }))
  profileMaybeSingle.mockResolvedValue({ data: { role: 'athlete', active_plan_id: 'plan-id' }, error: null })
  entitlementMaybeSingle.mockResolvedValue({
    data: { plan: 'athlete', status: 'active', period_ends_at: '2099-01-01T00:00:00.000Z', trial_ends_at: null, provider_grace_period_ends_at: null },
    error: null,
  })
})
const request = (body = JSON.stringify({ email: 'test@example.org', password: 'test-password' }), headers = {}) =>
  new Request('https://triwavex.test/api/native/session', { method: 'POST', body,
    headers: { 'content-type': 'application/json', 'x-triwavex-native': '1', ...headers } })

it('rejects cross-origin login and missing native header before authentication', async () => {
  for (const headers of [{ origin: 'https://attacker.test' }, { 'x-triwavex-native': '' }, { 'content-type': 'text/plain' }]) {
    expect((await POST(request(undefined, headers))).status).toBe(403)
  }
  expect(signInWithPassword).not.toHaveBeenCalled()
})
it('rejects malformed and oversized input', async () => {
  expect((await POST(request('{'))).status).toBe(400)
  expect((await POST(request('null'))).status).toBe(400)
  expect((await POST(request('x'.repeat(8193)))).status).toBe(413)
  expect(signInWithPassword).not.toHaveBeenCalled()
})
it('returns server-owned access data, not tokens', async () => {
  const response = await POST(request())
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ destination: '/dashboard', userID: 'athlete-id', role: 'athlete', entitled: true })
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(eq).toHaveBeenNthCalledWith(1, 'id', 'athlete-id')
  expect(eq).toHaveBeenNthCalledWith(2, 'user_id', 'athlete-id')
})
it('routes coaches and athletes without plans from the stored profile', async () => {
  profileMaybeSingle.mockResolvedValueOnce({ data: { role: 'coach', active_plan_id: null }, error: null })
  entitlementMaybeSingle.mockResolvedValueOnce({
    data: { plan: 'coach', status: 'active', period_ends_at: '2099-01-01T00:00:00.000Z', trial_ends_at: null, provider_grace_period_ends_at: null },
    error: null,
  })
  expect(await (await POST(request())).json()).toEqual({ destination: '/coach/dashboard', userID: 'athlete-id', role: 'coach', entitled: true })
  profileMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
  entitlementMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
  expect(await (await POST(request())).json()).toEqual({ destination: '/onboarding', userID: 'athlete-id', role: 'athlete', entitled: false })
})
it('does not treat invalid credentials or a failed profile lookup as success', async () => {
  signInWithPassword.mockResolvedValueOnce({ data: {}, error: new Error('private provider detail') })
  const denied = await POST(request())
  expect(denied.status).toBe(401)
  expect(await denied.text()).not.toContain('private provider detail')
  profileMaybeSingle.mockResolvedValueOnce({ data: null, error: new Error('database offline') })
  expect((await POST(request())).status).toBe(503)
})
