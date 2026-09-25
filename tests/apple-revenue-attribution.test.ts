import { describe, expect, it } from 'vitest'
import { NotificationTypeV2 } from '@apple/app-store-server-library'
import { classifyAppleEvent } from '@/lib/apple-event'

describe('Apple subscription-period accounting metadata', () => {
  it('keeps the signed billing-period start and price as a report-matching weight', () => {
    const event = classifyAppleEvent({
      eventType: NotificationTypeV2.DID_RENEW,
      transaction: {
        productId: 'com.triwavex.athlete.monthly',
        originalTransactionId: 'original-transaction-1',
        transactionId: 'transaction-2',
        purchaseDate: Date.parse('2026-09-20T10:00:00.000Z'),
        expiresDate: Date.parse('2026-10-20T10:00:00.000Z'),
        signedDate: Date.parse('2026-09-20T10:00:02.000Z'),
        price: 9990,
        currency: 'EUR',
        storefront: 'ESP',
        offerType: 1,
        revocationPercentage: 50_000,
      },
    })

    expect(event).toMatchObject({
      periodStartedAt: '2026-09-20T10:00:00.000Z',
      customerPriceMilli: 9990,
      customerCurrency: 'EUR',
      storefront: 'ESP',
      offerType: 1,
      revocationPercentageMilli: 50_000,
    })
  })

  it('does not turn invalid price, currency, or refund percentage into accounting inputs', () => {
    const event = classifyAppleEvent({
      eventType: NotificationTypeV2.SUBSCRIBED,
      transaction: {
        productId: 'com.triwavex.athlete.monthly',
        originalTransactionId: 'original-transaction-1',
        transactionId: 'transaction-1',
        purchaseDate: Date.parse('2026-09-20T10:00:00.000Z'),
        expiresDate: Date.parse('2026-10-20T10:00:00.000Z'),
        signedDate: Date.parse('2026-09-20T10:00:02.000Z'),
        price: -1,
        currency: 'EURO',
        revocationPercentage: 100_001,
      },
    })

    expect(event?.customerPriceMilli).toBeNull()
    expect(event?.customerCurrency).toBeNull()
    expect(event?.revocationPercentageMilli).toBeNull()
  })
})
