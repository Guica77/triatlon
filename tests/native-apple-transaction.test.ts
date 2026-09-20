import { beforeEach, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/native/apple/transaction/route'

const {
  verifyAndDecodeTransaction,
  verifyAndDecodeRenewalInfo,
  profileMaybeSingle,
  planMaybeSingle,
  eq,
  reconcileAppleEvent,
  nativeAccessForUser,
  classifyAppleEvent,
  selectTrainingPlan,
} = vi.hoisted(() => ({
  verifyAndDecodeTransaction: vi.fn(),
  verifyAndDecodeRenewalInfo: vi.fn(),
  profileMaybeSingle: vi.fn(),
  planMaybeSingle: vi.fn(),
  eq: vi.fn(),
  reconcileAppleEvent: vi.fn(),
  nativeAccessForUser: vi.fn(),
  classifyAppleEvent: vi.fn(),
  selectTrainingPlan: vi.fn(),
}))

vi.mock('@apple/app-store-server-library', () => ({
  Environment: { PRODUCTION: 'Production', SANDBOX: 'Sandbox' },
  InAppOwnershipType: { PURCHASED: 'PURCHASED', FAMILY_SHARED: 'FAMILY_SHARED' },
  SignedDataVerifier: class {
    verifyAndDecodeTransaction = verifyAndDecodeTransaction
    verifyAndDecodeRenewalInfo = verifyAndDecodeRenewalInfo
  },
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: USER_ID } } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: profileMaybeSingle }) }) }),
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: planMaybeSingle }) }),
    }),
  }),
}))
vi.mock('@/lib/apple-event', () => ({
  classifyAppleEvent,
  planForAppleProduct: (productID: string) => productID === ATHLETE_PRODUCT ? 'athlete' : productID === COACH_PRODUCT ? 'coach' : null,
}))
vi.mock('@/lib/apple-reconciliation', () => ({ reconcileAppleEvent }))
vi.mock('@/lib/native-access', () => ({ nativeAccessForUser }))
vi.mock('@/lib/training-plan-selection', () => ({ selectTrainingPlan }))

const USER_ID = '11111111-1111-4111-8111-111111111111'
const ATHLETE_PRODUCT = 'com.triwavex.athlete.monthly'
const COACH_PRODUCT = 'com.triwavex.coach.monthly'
const SIGNED_TRANSACTION = 'signed-transaction-' + 'x'.repeat(32)

const transaction = {
  bundleId: 'com.guillermohaya.triwavex',
  environment: 'Sandbox',
  productId: ATHLETE_PRODUCT,
  transactionId: 'transaction-123',
  originalTransactionId: 'original-123',
  inAppOwnershipType: 'PURCHASED',
  appAccountToken: USER_ID,
  purchaseDate: Date.parse('2026-01-01T00:00:00.000Z'),
  signedDate: Date.parse('2026-01-01T00:01:00.000Z'),
  expiresDate: Date.parse('2099-01-01T00:00:00.000Z'),
  revocationDate: undefined,
}

const request = (
  body: unknown,
  headers: Record<string, string> = {},
) => new Request('https://triwavex.test/api/native/apple/transaction', {
  method: 'POST',
  body: JSON.stringify(body),
  headers: {
    'content-type': 'application/json',
    'x-triwavex-native': '1',
    ...headers,
  },
})

const validBody = (overrides: Record<string, unknown> = {}) => ({
  signedTransactionInfo: SIGNED_TRANSACTION,
  productID: ATHLETE_PRODUCT,
  transactionID: 'transaction-123',
  originalTransactionID: 'original-123',
  appAccountToken: USER_ID,
  eventType: 'SUBSCRIBED',
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  process.env.APPLE_ROOT_CERTS_BASE64 = Buffer.from('root').toString('base64')
  process.env.APPLE_BUNDLE_ID = transaction.bundleId
  process.env.APPLE_APP_ID = '123456789'
  process.env.APPLE_NOTIFICATION_ENV = 'sandbox'

  profileMaybeSingle.mockResolvedValue({ data: { role: 'athlete', level: 'intermediate', target_race_distance: 'olympic' }, error: null })
  planMaybeSingle.mockResolvedValue({ data: [{ id: 'plan-1', distance: 'olympic', level: 'intermediate' }], error: null })
  verifyAndDecodeTransaction.mockResolvedValue(transaction)
  verifyAndDecodeRenewalInfo.mockResolvedValue(null)
  classifyAppleEvent.mockReturnValue({
    providerEventType: 'SUBSCRIBED',
    status: 'active',
    periodEndsAt: '2099-01-01T00:00:00.000Z',
    providerExpiresAt: '2099-01-01T00:00:00.000Z',
    providerRevocationAt: null,
    providerGracePeriodEndsAt: null,
    providerProductId: ATHLETE_PRODUCT,
    providerEnvironment: 'Sandbox',
    providerReference: 'original-123',
    providerTransactionReference: 'transaction-123',
    providerCustomerReference: USER_ID,
    providerSignedDate: '2026-01-01T00:01:00.000Z',
  })
  selectTrainingPlan.mockReturnValue({ id: 'plan-1' })
  reconcileAppleEvent.mockResolvedValue({ accepted: true, duplicate: false, status: 'active' })
  nativeAccessForUser.mockResolvedValue({ destination: '/dashboard', userID: USER_ID, role: 'athlete', entitled: true })
})

it('rejects malformed native requests before authenticating or constructing Apple verification', async () => {
  expect((await POST(request({}, { origin: 'https://attacker.test' }))).status).toBe(403)
  expect((await POST(request({ signedTransactionInfo: 'short' }))).status).toBe(400)
  expect((await POST(request(validBody(), { 'content-type': 'text/plain' }))).status).toBe(403)
  expect(verifyAndDecodeTransaction).not.toHaveBeenCalled()
})

it('does not accept a transaction when Apple verification fails', async () => {
  verifyAndDecodeTransaction.mockRejectedValueOnce(new Error('private Apple certificate detail'))

  const response = await POST(request(validBody()))

  expect(response.status).toBe(400)
  expect(await response.text()).not.toContain('private Apple certificate detail')
  expect(reconcileAppleEvent).not.toHaveBeenCalled()
})

it('rejects a product that does not match the server-owned account role', async () => {
  const response = await POST(request(validBody({ productID: COACH_PRODUCT })))

  expect(response.status).toBe(403)
  expect(verifyAndDecodeTransaction).not.toHaveBeenCalled()
  expect(reconcileAppleEvent).not.toHaveBeenCalled()
})

it('returns the typed server authorization after successful verification and reconciliation', async () => {
  const response = await POST(request(validBody()))

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({
    accepted: true,
    duplicate: false,
    status: 'active',
    destination: '/dashboard',
    userID: USER_ID,
    role: 'athlete',
    entitled: true,
    transactionID: 'transaction-123',
  })
  expect(reconcileAppleEvent).toHaveBeenCalledWith(expect.anything(), USER_ID, expect.objectContaining({ providerTransactionReference: 'transaction-123' }), 'plan-1')
})

it('does not turn a reconciliation failure into a successful entitlement response', async () => {
  reconcileAppleEvent.mockRejectedValueOnce(new Error('private database detail'))

  const response = await POST(request(validBody()))

  expect(response.status).toBe(503)
  expect(await response.text()).not.toContain('private database detail')
  expect(nativeAccessForUser).not.toHaveBeenCalled()
})
