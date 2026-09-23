import { beforeEach, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/native/apple/transaction/route'

const {
  verifyAndDecodeTransaction,
  verifyAndDecodeRenewalInfo,
  setAppAccountToken,
  appStoreServerAPIClientConstructor,
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
  setAppAccountToken: vi.fn(),
  appStoreServerAPIClientConstructor: vi.fn(),
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
  OfferType: { OFFER_CODE: 3 },
  AppStoreServerAPIClient: class {
    constructor(...args: unknown[]) { appStoreServerAPIClientConstructor(...args) }
    setAppAccountToken = setAppAccountToken
  },
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
  planForAppleProduct: (productID: string) => productID === ATHLETE_PRODUCT ? 'athlete' : /^com\.triwavex\.coach\.monthly(?:\.(?:15|20|25|30|35|40|45|50))?$/.test(productID) ? 'coach' : null,
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
  delete process.env.APPLE_SERVER_API_ISSUER_ID
  delete process.env.APPLE_SERVER_API_KEY_ID
  delete process.env.APPLE_SERVER_API_PRIVATE_KEY_BASE64
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

it('accepts a verified coach capacity product only for a coach account', async () => {
  const tierProduct = 'com.triwavex.coach.monthly.25'
  profileMaybeSingle.mockResolvedValueOnce({ data: { role: 'coach', level: null, target_race_distance: null }, error: null })
  verifyAndDecodeTransaction.mockResolvedValueOnce({ ...transaction, productId: tierProduct })
  classifyAppleEvent.mockReturnValueOnce({
    providerEventType: 'SUBSCRIBED', status: 'active', periodEndsAt: '2099-01-01T00:00:00.000Z',
    providerExpiresAt: '2099-01-01T00:00:00.000Z', providerRevocationAt: null,
    providerGracePeriodEndsAt: null, providerProductId: tierProduct, providerEnvironment: 'Sandbox',
    providerReference: 'original-coach', providerTransactionReference: 'transaction-coach',
    providerCustomerReference: USER_ID, providerSignedDate: '2026-01-01T00:01:00.000Z',
  })
  nativeAccessForUser.mockResolvedValueOnce({ destination: '/coach/dashboard', userID: USER_ID, role: 'coach', entitled: true })

  const response = await POST(request(validBody({ productID: tierProduct })))

  expect(response.status, await response.clone().text()).toBe(200)
  expect(reconcileAppleEvent).toHaveBeenCalledWith(expect.anything(), USER_ID, expect.objectContaining({ providerProductId: tierProduct }), null)
})

it('accepts and reconciles Apple offer-code transactions through the verified native path', async () => {
  const response = await POST(request(validBody({ eventType: 'OFFER_REDEEMED' })))

  expect(response.status).toBe(200)
  expect(classifyAppleEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'OFFER_REDEEMED' }))
  expect(reconcileAppleEvent).toHaveBeenCalledWith(expect.anything(), USER_ID, expect.objectContaining({ providerTransactionReference: 'transaction-123' }), 'plan-1')
})

it('associates a verified code redemption with the signed-in user through Apple Server API', async () => {
  process.env.APPLE_SERVER_API_ISSUER_ID = 'issuer-id'
  process.env.APPLE_SERVER_API_KEY_ID = 'key-id'
  process.env.APPLE_SERVER_API_PRIVATE_KEY_BASE64 = Buffer.from('-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----').toString('base64')
  verifyAndDecodeTransaction.mockResolvedValueOnce({ ...transaction, appAccountToken: undefined, offerType: 3 })

  const response = await POST(request(validBody({ eventType: 'OFFER_REDEEMED', appAccountToken: undefined })))

  expect(response.status).toBe(200)
  expect(appStoreServerAPIClientConstructor).toHaveBeenCalledWith(expect.any(String), 'key-id', 'issuer-id', transaction.bundleId, 'Sandbox')
  expect(setAppAccountToken).toHaveBeenCalledWith('original-123', { appAccountToken: USER_ID })
  expect(reconcileAppleEvent).toHaveBeenCalled()
})

it('does not grant a code redemption when the Apple Server API key is missing', async () => {
  verifyAndDecodeTransaction.mockResolvedValueOnce({ ...transaction, appAccountToken: undefined, offerType: 3 })

  const response = await POST(request(validBody({ eventType: 'OFFER_REDEEMED', appAccountToken: undefined })))

  expect(response.status).toBe(503)
  expect(await response.text()).toContain('App Store Server API')
  expect(reconcileAppleEvent).not.toHaveBeenCalled()
})

it('does not grant an offer when Apple rejects associating it to the account', async () => {
  process.env.APPLE_SERVER_API_ISSUER_ID = 'issuer-id'
  process.env.APPLE_SERVER_API_KEY_ID = 'key-id'
  process.env.APPLE_SERVER_API_PRIVATE_KEY_BASE64 = Buffer.from('-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----').toString('base64')
  verifyAndDecodeTransaction.mockResolvedValueOnce({ ...transaction, appAccountToken: undefined, offerType: 3 })
  setAppAccountToken.mockRejectedValueOnce(new Error('Apple API failure'))

  const response = await POST(request(validBody({ eventType: 'OFFER_REDEEMED', appAccountToken: undefined })))

  expect(response.status).toBe(503)
  expect(reconcileAppleEvent).not.toHaveBeenCalled()
})

it('rejects a missing account token unless Apple signed this as an offer-code transaction', async () => {
  verifyAndDecodeTransaction.mockResolvedValueOnce({ ...transaction, appAccountToken: undefined, offerType: undefined })

  const response = await POST(request(validBody({ appAccountToken: undefined })))

  expect(response.status).toBe(403)
  expect(reconcileAppleEvent).not.toHaveBeenCalled()
})

it('does not turn a reconciliation failure into a successful entitlement response', async () => {
  reconcileAppleEvent.mockRejectedValueOnce(new Error('private database detail'))

  const response = await POST(request(validBody()))

  expect(response.status).toBe(503)
  expect(await response.text()).not.toContain('private database detail')
  expect(nativeAccessForUser).not.toHaveBeenCalled()
})
