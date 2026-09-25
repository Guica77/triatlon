import {
  InAppOwnershipType,
  NotificationTypeV2,
  type JWSRenewalInfoDecodedPayload,
  type JWSTransactionDecodedPayload,
} from '@apple/app-store-server-library'

export const APPLE_PRODUCTS = {
  athlete: 'com.triwavex.athlete.monthly',
  coach: 'com.triwavex.coach.monthly',
} as const

export function coachCapacityForAppleProduct(productID: string): number | null {
  if (productID === APPLE_PRODUCTS.coach) return 10
  const match = /^com\.triwavex\.coach\.monthly\.(\d{2,10})$/.exec(productID)
  if (!match) return null

  const capacity = Number(match[1])
  if (
    !Number.isSafeInteger(capacity) ||
    capacity < 15 ||
    capacity > 2_147_483_647 ||
    (capacity - 10) % 5 !== 0
  ) return null

  return capacity
}

export type ApplePlan = keyof typeof APPLE_PRODUCTS
type AppleStatus = 'active' | 'past_due' | 'cancelled' | 'expired'

export type ClassifiedAppleEvent = {
  providerEventType: string
  status: AppleStatus
  periodEndsAt: string | null
  providerExpiresAt: string | null
  providerRevocationAt: string | null
  providerGracePeriodEndsAt: string | null
  providerProductId: string
  providerEnvironment: string | null
  providerReference: string
  providerTransactionReference: string
  providerCustomerReference: string | null
  providerSignedDate: string
  periodStartedAt: string | null
  customerPriceMilli: number | null
  customerCurrency: string | null
  storefront: string | null
  offerType: number | null
  revocationPercentageMilli: number | null
}

function appleDate(value: number | undefined): Date | null {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function iso(value: number | undefined): string | null {
  return appleDate(value)?.toISOString() ?? null
}

const STATE_EVENTS = new Set<string>([
  NotificationTypeV2.SUBSCRIBED,
  NotificationTypeV2.DID_RENEW,
  NotificationTypeV2.DID_FAIL_TO_RENEW,
  NotificationTypeV2.GRACE_PERIOD_EXPIRED,
  NotificationTypeV2.EXPIRED,
  NotificationTypeV2.REFUND,
  NotificationTypeV2.REVOKE,
  NotificationTypeV2.REFUND_REVERSED,
  NotificationTypeV2.OFFER_REDEEMED,
  NotificationTypeV2.RENEWAL_EXTENSION,
  NotificationTypeV2.RENEWAL_EXTENDED,
])

export function isAppleStateEvent(eventType: string | undefined): boolean {
  return Boolean(eventType && STATE_EVENTS.has(eventType))
}

export function classifyAppleEvent(input: {
  eventType: string
  notificationSignedDate?: number
  transaction: JWSTransactionDecodedPayload
  renewal?: JWSRenewalInfoDecodedPayload | null
}): ClassifiedAppleEvent | null {
  const { eventType, transaction, renewal } = input
  if (!isAppleStateEvent(eventType)) return null

  const providerReference = transaction.originalTransactionId
  const providerTransactionReference = transaction.transactionId
  const signedDate = appleDate(input.notificationSignedDate) ?? appleDate(transaction.signedDate) ?? appleDate(renewal?.signedDate)
  const expiresAt = appleDate(transaction.expiresDate)
  const periodStartedAt = appleDate(transaction.purchaseDate)
  const transactionProduct = planForAppleProduct(transaction.productId || '')
  const renewalProduct = renewal?.productId || renewal?.autoRenewProductId
  const renewalPlan = renewalProduct ? planForAppleProduct(renewalProduct) : transactionProduct

  if (
    !providerReference ||
    !providerTransactionReference ||
    !transaction.productId ||
    !transactionProduct ||
    !signedDate ||
    transaction.inAppOwnershipType === InAppOwnershipType.FAMILY_SHARED ||
    (renewal?.originalTransactionId && renewal.originalTransactionId !== providerReference) ||
    (renewalPlan && renewalPlan !== transactionProduct) ||
    (renewal?.appAccountToken && transaction.appAccountToken && renewal.appAccountToken !== transaction.appAccountToken) ||
    (renewal?.environment && transaction.environment && String(renewal.environment) !== String(transaction.environment))
  ) return null

  if (!expiresAt && eventType !== NotificationTypeV2.REVOKE && eventType !== NotificationTypeV2.REFUND) return null

  const expiresInFuture = Boolean(expiresAt && expiresAt.getTime() > Date.now())
  const status: AppleStatus = (() => {
    switch (eventType) {
      case NotificationTypeV2.DID_FAIL_TO_RENEW:
        return 'past_due'
      case NotificationTypeV2.GRACE_PERIOD_EXPIRED:
      case NotificationTypeV2.EXPIRED:
        return 'expired'
      case NotificationTypeV2.REFUND:
      case NotificationTypeV2.REVOKE:
        return 'cancelled'
      case NotificationTypeV2.REFUND_REVERSED:
      case NotificationTypeV2.SUBSCRIBED:
      case NotificationTypeV2.DID_RENEW:
      case NotificationTypeV2.OFFER_REDEEMED:
      case NotificationTypeV2.RENEWAL_EXTENSION:
      case NotificationTypeV2.RENEWAL_EXTENDED:
        return expiresInFuture ? 'active' : 'expired'
      default:
        return 'expired'
    }
  })()

  return {
    providerEventType: eventType,
    status,
    periodEndsAt: iso(transaction.expiresDate),
    providerExpiresAt: iso(transaction.expiresDate),
    providerRevocationAt: iso(transaction.revocationDate),
    providerGracePeriodEndsAt: iso(renewal?.gracePeriodExpiresDate),
    providerProductId: transaction.productId,
    providerEnvironment: transaction.environment ? String(transaction.environment) : renewal?.environment ? String(renewal.environment) : null,
    providerReference,
    providerTransactionReference,
    providerCustomerReference: transaction.appAccountToken ?? renewal?.appAccountToken ?? null,
    providerSignedDate: signedDate.toISOString(),
    periodStartedAt: periodStartedAt?.toISOString() ?? null,
    customerPriceMilli: typeof transaction.price === 'number' && Number.isSafeInteger(transaction.price) && transaction.price >= 0
      ? transaction.price
      : null,
    customerCurrency: typeof transaction.currency === 'string' && /^[A-Z]{3}$/.test(transaction.currency)
      ? transaction.currency
      : null,
    storefront: typeof transaction.storefront === 'string' && transaction.storefront.length <= 64
      ? transaction.storefront
      : null,
    offerType: typeof transaction.offerType === 'number' && Number.isSafeInteger(transaction.offerType)
      ? transaction.offerType
      : null,
    revocationPercentageMilli: typeof transaction.revocationPercentage === 'number' &&
      Number.isSafeInteger(transaction.revocationPercentage) &&
      transaction.revocationPercentage >= 0 && transaction.revocationPercentage <= 100_000
      ? transaction.revocationPercentage
      : null,
  }
}

export function planForAppleProduct(productID: string): ApplePlan | null {
  if (productID === APPLE_PRODUCTS.athlete) return 'athlete'
  if (coachCapacityForAppleProduct(productID) !== null) return 'coach'
  return null
}
