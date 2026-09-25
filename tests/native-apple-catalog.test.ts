import { beforeEach, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/native/apple/catalog/route'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profile: vi.fn(),
  catalog: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profile }) }) }),
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ rpc: mocks.catalog }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({ data: { user: { id: '11111111-1111-4111-8111-111111111111' } } })
  mocks.profile.mockResolvedValue({ data: { role: 'coach' }, error: null })
  mocks.catalog.mockResolvedValue({ data: [
    { product_id: 'com.triwavex.athlete.monthly', plan: 'athlete', coach_capacity: null },
    { product_id: 'com.triwavex.coach.monthly', plan: 'coach', coach_capacity: 10 },
    { product_id: 'com.triwavex.coach.monthly.55', plan: 'coach', coach_capacity: 55 },
  ], error: null })
})

it('returns only server-enabled product IDs for the signed-in account role', async () => {
  const response = await GET(new Request('https://triwavex.test/api/native/apple/catalog', {
    headers: { 'x-triwavex-native': '1' },
  }))

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({ products: [
    { productID: 'com.triwavex.coach.monthly', role: 'coach', capacity: 10 },
    { productID: 'com.triwavex.coach.monthly.55', role: 'coach', capacity: 55 },
  ] })
})

it('rejects browser callers and does not leak the catalog to unauthenticated callers', async () => {
  const browserResponse = await GET(new Request('https://triwavex.test/api/native/apple/catalog'))
  expect(browserResponse.status).toBe(403)
  expect(mocks.catalog).not.toHaveBeenCalled()

  mocks.getUser.mockResolvedValueOnce({ data: { user: null } })
  const unauthenticatedResponse = await GET(new Request('https://triwavex.test/api/native/apple/catalog', {
    headers: { 'x-triwavex-native': '1' },
  }))
  expect(unauthenticatedResponse.status).toBe(401)
  expect(mocks.catalog).not.toHaveBeenCalled()
})
