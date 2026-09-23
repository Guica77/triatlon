import { beforeEach, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/native/register/route'

const { signUp, upsert, from } = vi.hoisted(() => ({
  signUp: vi.fn(), upsert: vi.fn(), from: vi.fn(),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { signUp } }) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from }) }))
vi.mock('@/lib/native-access', () => ({
  nativeAccessForUser: async (_client: unknown, id: string) => ({
    destination: '/onboarding', userID: id, role: 'coach', entitled: false,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  signUp.mockResolvedValue({
    data: { user: { id: 'new-coach' }, session: { access_token: 'secret' } }, error: null,
  })
  upsert.mockResolvedValue({ error: null })
  from.mockReturnValue({ upsert })
})

const request = (body: unknown) => new Request('https://triwavex.test/api/native/register', {
  method: 'POST', body: JSON.stringify(body),
  headers: { 'content-type': 'application/json', 'x-triwavex-native': '1' },
})

const validInput = { email: 'coach@example.org', password: 'secure-password', firstName: 'Coach', lastName: 'One' }

it('persists coach role in auth metadata and the profile, and returns server access', async () => {
  const response = await POST(request({ ...validInput, role: 'coach' }))
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ userID: 'new-coach', role: 'coach', destination: '/onboarding' })
  expect(signUp).toHaveBeenCalledWith(expect.objectContaining({
    options: { data: { full_name: 'Coach One', role: 'coach' } },
  }))
  expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-coach', role: 'coach' }), { onConflict: 'id' })
})

it('defaults legacy clients to athlete and rejects unsupported roles before signup', async () => {
  expect((await POST(request(validInput))).status).toBe(200)
  expect(signUp).toHaveBeenCalledWith(expect.objectContaining({ options: { data: { full_name: 'Coach One', role: 'athlete' } } }))
  signUp.mockClear()
  expect((await POST(request({ ...validInput, role: 'admin' }))).status).toBe(400)
  expect(signUp).not.toHaveBeenCalled()
})
