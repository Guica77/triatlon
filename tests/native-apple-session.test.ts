import { beforeEach, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/native/apple/session/route'

const { signInWithIdToken, maybeSingle, eq } = vi.hoisted(() => ({
  signInWithIdToken: vi.fn(), maybeSingle: vi.fn(), eq: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { signInWithIdToken }, from: () => ({ select: () => ({ eq }) }),
}) }))

beforeEach(() => {
  vi.clearAllMocks()
  signInWithIdToken.mockResolvedValue({ data: { user: { id: 'apple-user' }, session: { access_token: 'not-returned' } }, error: null })
  eq.mockReturnValue({ maybeSingle })
  maybeSingle.mockResolvedValue({ data: { role: 'athlete', active_plan_id: null }, error: null })
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

it('verifies the Apple ID token with its matching nonce and returns no tokens', async () => {
  const response = await POST(request())
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ destination: '/onboarding' })
  expect(signInWithIdToken).toHaveBeenCalledWith({ provider: 'apple', token: 'apple.jwt', nonce: 'unhashed-random-nonce' })
  expect(eq).toHaveBeenCalledWith('id', 'apple-user')
})

it('does not disclose provider details when Apple rejects a credential', async () => {
  signInWithIdToken.mockResolvedValueOnce({ data: {}, error: new Error('private provider detail') })
  const response = await POST(request())
  expect(response.status).toBe(401)
  expect(await response.text()).not.toContain('private provider detail')
})
