import { describe, expect, it } from 'vitest'
import { APPLE_PRODUCTS, coachCapacityForAppleProduct, planForAppleProduct } from '@/lib/apple-event'

describe('Apple subscription products', () => {
  it('maps every coach capacity tier to the coach role and its encoded seats', () => {
    for (const capacity of [10, 15, 20, 25, 30, 35, 40, 45, 50]) {
      const product = capacity === 10 ? APPLE_PRODUCTS.coach : `${APPLE_PRODUCTS.coach}.${capacity}`
      expect(planForAppleProduct(product)).toBe('coach')
      expect(coachCapacityForAppleProduct(product)).toBe(capacity)
    }
  })

  it('supports valid configured tiers above 50 without accepting arbitrary seat counts', () => {
    for (const capacity of [55, 60, 100, 500]) {
      const product = `${APPLE_PRODUCTS.coach}.${capacity}`
      expect(planForAppleProduct(product)).toBe('coach')
      expect(coachCapacityForAppleProduct(product)).toBe(capacity)
    }
    for (const product of [
      `${APPLE_PRODUCTS.coach}.11`,
      `${APPLE_PRODUCTS.coach}.56`,
      `${APPLE_PRODUCTS.coach}.2147483650`,
      `${APPLE_PRODUCTS.coach}.not-a-number`,
    ]) {
      expect(planForAppleProduct(product)).toBeNull()
      expect(coachCapacityForAppleProduct(product)).toBeNull()
    }
  })

  it('keeps the athlete product distinct and rejects unknown/fabricated tiers', () => {
    expect(planForAppleProduct(APPLE_PRODUCTS.athlete)).toBe('athlete')
    expect(coachCapacityForAppleProduct(APPLE_PRODUCTS.athlete)).toBeNull()
    for (const product of ['com.triwavex.coach.monthly.11', 'coach.monthly.15']) {
      expect(planForAppleProduct(product)).toBeNull()
      expect(coachCapacityForAppleProduct(product)).toBeNull()
    }
  })
})
