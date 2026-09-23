import { describe, expect, it } from 'vitest'
import { APPLE_COACH_CAPACITIES, APPLE_PRODUCTS, coachCapacityForAppleProduct, planForAppleProduct } from '@/lib/apple-event'

describe('Apple subscription products', () => {
  it('maps every coach capacity tier to the coach role and its encoded seats', () => {
    expect(APPLE_COACH_CAPACITIES).toEqual([10, 15, 20, 25, 30, 35, 40, 45, 50])
    for (const capacity of APPLE_COACH_CAPACITIES) {
      const product = capacity === 10 ? APPLE_PRODUCTS.coach : `${APPLE_PRODUCTS.coach}.${capacity}`
      expect(planForAppleProduct(product)).toBe('coach')
      expect(coachCapacityForAppleProduct(product)).toBe(capacity)
    }
  })

  it('keeps the athlete product distinct and rejects unknown/fabricated tiers', () => {
    expect(planForAppleProduct(APPLE_PRODUCTS.athlete)).toBe('athlete')
    expect(coachCapacityForAppleProduct(APPLE_PRODUCTS.athlete)).toBeNull()
    for (const product of ['com.triwavex.coach.monthly.11', 'com.triwavex.coach.monthly.55', 'coach.monthly.15']) {
      expect(planForAppleProduct(product)).toBeNull()
      expect(coachCapacityForAppleProduct(product)).toBeNull()
    }
  })
})
