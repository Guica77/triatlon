import { beforeEach, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/native/oauth/route'

const { signInWithOAuth } = vi.hoisted(() => ({ signInWithOAuth: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { signInWithOAuth } }) }))

beforeEach(() => {
  vi.clearAllMocks()
  signInWithOAuth.mockResolvedValue({ data: { url: 'https://accounts.example.test/oauth?state=opaque' }, error: null })
})

it('starts only supported OAuth providers and records the provider in http-only cookies', async () => {
  const response = await GET(new Request('https://staging.triwavex.com/api/native/oauth?provider=apple'))
  expect(response.headers.get('location')).toBe('https://accounts.example.test/oauth?state=opaque')
  expect(response.headers.get('set-cookie')).toContain('oauth_provider=apple')
  expect(response.headers.get('set-cookie')).toContain('oauth_role=athlete')
  expect(response.headers.get('set-cookie')).toContain('HttpOnly')
  expect(signInWithOAuth).toHaveBeenCalledWith({ provider: 'apple', options: { redirectTo: 'https://staging.triwavex.com/auth/callback' } })
})

it('preserves the selected coach role for a new OAuth account', async () => {
  const response = await GET(new Request('https://staging.triwavex.com/api/native/oauth?provider=google&role=coach'))
  expect(response.headers.get('set-cookie')).toContain('oauth_role=coach')
})

it('does not send an unrecognised provider to Supabase', async () => {
  const response = await GET(new Request('https://staging.triwavex.com/api/native/oauth?provider=evil'))
  expect(response.headers.get('location')).toBe('https://staging.triwavex.com/login')
  expect(signInWithOAuth).not.toHaveBeenCalled()
})

it('returns to the login screen if the configured provider is unavailable', async () => {
  signInWithOAuth.mockResolvedValue({ data: {}, error: new Error('private provider detail') })
  const response = await GET(new Request('https://staging.triwavex.com/api/native/oauth?provider=google'))
  expect(response.headers.get('location')).toBe('https://staging.triwavex.com/login?error=AuthCallbackError')
})
