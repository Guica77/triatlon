import { beforeEach, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/native/apple/session/route'

const { signInWithIdToken, maybeSingle, eq, insert } = vi.hoisted(() => ({
  signInWithIdToken: vi.fn(), maybeSingle: vi.fn(), eq: vi.fn(), insert: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { signInWithIdToken }, from: () => ({ select: () => ({ eq }) }),
}) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => ({ insert }) }) }))

beforeEach(() => {
  vi.clearAllMocks()
  signInWithIdToken.mockResolvedValue({ data: { user: { id: 'apple-user' }, session: { access_token: 'not-returned' } }, error: null })
  eq.mockReturnValue({ maybeSingle })
  maybeSingle.mockResolvedValueOnce({ data: { id: 'apple-user' }, error: null })
    .mockResolvedValueOnce({ data: { role: 'athlete', active_plan_id: null }, error: null })
    .mockResolvedValueOnce({ data: null, error: null })
  insert.mockResolvedValue({ error: null })
})

const request = (body = JSON.stringify({ identityToken: 'apple.jwt', nonce: 'unhashed-random-nonce' }), headers = {}) =>
  new Request('https://triwavex.test/api/native/apple/session', {
    method: 'POST', body, headers: { 'content-type': 'application/json', 'x-triwavex-native': '1', ...headers },
  })

it('only accepts the native JSON request shape before calling Supabase', async () => {
  expect((await POST(request(undefined, { origin: 'https://attacker.test' }))).status).toBe(403)
  expect((await POST(request('{}'))).status).toBe(400)
  expect((await POST(request('x'.repeat(16385)))).status).toBe(413)
  expect(signInWithIdToken).not.toHaveBeenCalled()
})

it('verifies the Apple ID token with its matching nonce and returns server-owned access', async () => {
  const response = await POST(request())
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    destination: '/onboarding',
    userID: 'apple-user',
    role: 'athlete',
    entitled: false,
  })
  expect(signInWithIdToken).toHaveBeenCalledWith({ provider: 'apple', token: 'apple.jwt', nonce: 'unhashed-random-nonce' })
  expect(eq).toHaveBeenCalledWith('id', 'apple-user')
})

it('creates a new Apple profile with the requested supported role', async () => {
  maybeSingle.mockReset()
  maybeSingle
    .mockResolvedValueOnce({ data: null, error: null })
    .mockResolvedValueOnce({ data: { role: 'coach', active_plan_id: null }, error: null })
    .mockResolvedValueOnce({ data: null, error: null })

  const response = await POST(request(JSON.stringify({
    identityToken: 'apple.jwt', nonce: 'unhashed-random-nonce', role: 'coach',
  })))

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    destination: '/onboarding',
    userID: 'apple-user',
    role: 'coach',
    entitled: false,
  })
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ id: 'apple-user', role: 'coach' }))
})

it('preserves an existing persisted coach role only when the server entitlement authorizes it', async () => {
  maybeSingle.mockReset()
  maybeSingle
    .mockResolvedValueOnce({ data: { id: 'apple-user' }, error: null })
    .mockResolvedValueOnce({ data: { role: 'coach', active_plan_id: null }, error: null })
    .mockResolvedValueOnce({
      data: {
        plan: 'coach',
        status: 'active',
        period_ends_at: '2099-01-01T00:00:00.000Z',
        trial_ends_at: null,
        provider_grace_period_ends_at: null,
      },
      error: null,
    })

  const response = await POST(request(JSON.stringify({
    identityToken: 'apple.jwt', nonce: 'unhashed-random-nonce', role: 'athlete',
  })))

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    destination: '/coach/dashboard',
    userID: 'apple-user',
    role: 'coach',
    entitled: true,
  })
  expect(insert).not.toHaveBeenCalled()
})

it('does not disclose provider details when Apple rejects a credential', async () => {
  signInWithIdToken.mockResolvedValueOnce({ data: {}, error: new Error('private provider detail') })
  const response = await POST(request())
  expect(response.status).toBe(401)
  expect(await response.text()).not.toContain('private provider detail')
})
