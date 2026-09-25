import { beforeEach, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/native/coach/earnings/route'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profile: vi.fn(),
  earnings: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profile }) }) }),
    rpc: mocks.earnings,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'coach-a' } } })
  mocks.profile.mockResolvedValue({ data: { role: 'coach' }, error: null })
  mocks.earnings.mockResolvedValue({ data: [{
    pending_apple_report_count: 3,
    pending_refund_adjustment_count: 1,
    reconciled_balances: [{ currency: 'EUR', amount: '12.3456' }],
    entries: [],
  }], error: null })
})

it('returns the authenticated coach account’s own privacy-limited ledger summary', async () => {
  const response = await GET(new Request('https://triwavex.test/api/native/coach/earnings', {
    headers: { 'x-triwavex-native': '1' },
  }))

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({
    pendingAppleReportCount: 3,
    pendingRefundAdjustmentCount: 1,
    reconciledBalances: [{ currency: 'EUR', amount: '12.3456' }],
    entries: [],
  })
  expect(mocks.earnings).toHaveBeenCalledOnce()
})

it('rejects browser and unauthenticated requests before looking up earnings', async () => {
  expect((await GET(new Request('https://triwavex.test/api/native/coach/earnings'))).status).toBe(403)
  mocks.getUser.mockResolvedValueOnce({ data: { user: null } })
  expect((await GET(new Request('https://triwavex.test/api/native/coach/earnings', {
    headers: { 'x-triwavex-native': '1' },
  }))).status).toBe(401)
  expect(mocks.earnings).not.toHaveBeenCalled()
})

it('rejects athlete accounts', async () => {
  mocks.profile.mockResolvedValueOnce({ data: { role: 'athlete' }, error: null })
  const response = await GET(new Request('https://triwavex.test/api/native/coach/earnings', {
    headers: { 'x-triwavex-native': '1' },
  }))
  expect(response.status).toBe(403)
  expect(mocks.earnings).not.toHaveBeenCalled()
})
