import { describe, expect, it } from 'vitest'
import { calculateChurnRates } from '@/lib/admin-metrics'

describe('business churn metrics', () => {
  it('bounds churn to the current user base', () => {
    expect(calculateChurnRates(100, 3)).toEqual({ monthlyChurnRate: 3, quarterlyChurnRate: 8.7 })
    expect(calculateChurnRates(10, 20).monthlyChurnRate).toBe(100)
  })

  it('returns zero when there are no users', () => {
    expect(calculateChurnRates(0, 4)).toEqual({ monthlyChurnRate: 0, quarterlyChurnRate: 0 })
  })
})
