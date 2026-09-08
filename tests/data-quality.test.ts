import { describe, expect, it } from 'vitest'
import { isDemoAccount } from '@/lib/data-quality'

describe('data quality filters', () => {
  it('filters seeded demo accounts', () => {
    expect(isDemoAccount({ email: 'demo@triatlonpro.com', first_name: 'Demo', last_name: 'Atleta' })).toBe(true)
    expect(isDemoAccount({ email: 'carlos.garcia@triatlonpro.com', first_name: 'Carlos', last_name: 'García' })).toBe(true)
  })

  it('keeps real profiles', () => {
    expect(isDemoAccount({ email: 'persona@example.com', first_name: 'Guillermo', last_name: 'Haya' })).toBe(false)
  })
})
