import { expect, it, vi } from 'vitest'
import { reconcileAppleEvent } from '@/lib/apple-reconciliation'
import { APPLE_PRODUCTS } from '@/lib/apple-event'

const athleteEvent = {
  providerProductId: APPLE_PRODUCTS.athlete,
  providerReference: 'original-apple-transaction',
  providerTransactionReference: 'apple-period-transaction',
  providerSignedDate: '2026-09-20T10:00:02.000Z',
  periodStartedAt: '2026-09-20T10:00:00.000Z',
  providerExpiresAt: '2026-10-20T10:00:00.000Z',
  customerPriceMilli: 9990,
  customerCurrency: 'EUR',
  storefront: 'ESP',
  offerType: null,
  providerEventType: 'DID_RENEW',
  revocationPercentageMilli: null,
  status: 'active',
  periodEndsAt: '2026-10-20T10:00:00.000Z',
  providerEnvironment: 'Production',
  providerRevocationAt: null,
  providerGracePeriodEndsAt: null,
  providerCustomerReference: '11111111-1111-4111-8111-111111111111',
}

it('records verified athlete billing periods with period-start metadata after entitlement reconciliation', async () => {
  const rpc = vi.fn()
    .mockResolvedValueOnce({ data: [{ accepted: true, duplicate: false, status: 'active', user_id: 'athlete' }], error: null })
    .mockResolvedValueOnce({ data: 'awaiting_apple_report', error: null })
  const result = await reconcileAppleEvent({ rpc } as never, 'athlete', athleteEvent as never)

  expect(result.accepted).toBe(true)
  expect(rpc).toHaveBeenCalledTimes(2)
  expect(rpc.mock.calls[1]).toEqual(['record_apple_subscription_period', expect.objectContaining({
    p_transaction_id: 'apple-period-transaction',
    p_original_transaction_id: 'original-apple-transaction',
    p_athlete_id: 'athlete',
    p_period_started_at: '2026-09-20T10:00:00.000Z',
    p_customer_price_milli: 9990,
    p_customer_currency: 'EUR',
  })])
})

it('does not create coach earnings for the coach capacity subscription', async () => {
  const rpc = vi.fn().mockResolvedValue({ data: [{ accepted: true, duplicate: false, status: 'active', user_id: 'coach' }], error: null })
  await reconcileAppleEvent({ rpc } as never, 'coach', {
    ...athleteEvent,
    providerProductId: 'com.triwavex.coach.monthly',
  } as never)
  expect(rpc).toHaveBeenCalledTimes(1)
})
