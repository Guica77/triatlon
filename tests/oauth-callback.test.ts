import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ create: vi.fn(), admin: vi.fn(), cookies: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.create }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.admin }))
vi.mock('next/headers', () => ({ cookies: mocks.cookies }))
vi.mock('@/lib/auth/apple-revocation', () => ({ rememberAppleToken: vi.fn() }))
import { GET } from '@/app/auth/callback/route'

describe('OAuth profile and destination', () => {
  beforeEach(() => vi.resetAllMocks())
  for (const provider of ['google', 'apple']) {
    for (const role of ['coach', 'athlete']) {
      it(`${provider} creates a new ${role} and uses its destination`, async () => {
        const insert = setup(provider, role, null, null)
        const response = await GET(new Request('https://example.com/auth/callback?code=test'))
        expect(insert).toHaveBeenCalledWith(expect.objectContaining({ role, id: 'user' }))
        expect(new URL(response.headers.get('location')!).searchParams.get('next')).toBe(role === 'coach' ? '/coach/dashboard' : '/onboarding')
      })
    }
  }
  it('preserves an existing athlete when coach was selected', async () => {
    const insert = setup('google', 'coach', 'athlete', null)
    const response = await GET(new Request('https://example.com/auth/callback?code=test'))
    expect(insert).not.toHaveBeenCalled()
    expect(new URL(response.headers.get('location')!).searchParams.get('next')).toBe('/onboarding')
  })
  it('does not continue when profile creation fails', async () => {
    setup('google', 'coach', null, { message: 'Database unavailable' })
    const response = await GET(new Request('https://example.com/auth/callback?code=test'))
    const url = new URL(response.headers.get('location')!)
    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('role')).toBe('coach')
    expect(url.searchParams.get('error')).toBe('ProfileSetupError')
  })
})

function setup(provider: string, role: string, existing: string | null, error: unknown) {
  mocks.cookies.mockResolvedValue({ get: (key: string) => ({ value: key === 'oauth_role' ? role : key === 'oauth_provider' ? provider : '' }), delete: vi.fn() })
  const insert = vi.fn().mockResolvedValue({ error })
  mocks.admin.mockReturnValue({ from: () => ({ insert, select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existing ? { id: 'user' } : null, error: null }) }) }) }) })
  mocks.create.mockResolvedValue({ auth: { exchangeCodeForSession: async () => ({ data: { user: { id: 'user', email: 'test@example.com', identities: [{ provider }] }, session: null }, error: null }) }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: existing || role, active_plan_id: null, coach_id: null }, error: null }) }) }) }) })
  return insert
}
