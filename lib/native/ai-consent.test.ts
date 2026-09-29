import { describe, expect, it } from 'vitest'
import { isConsentCurrent, parseAIConsentInput } from './ai-consent'

describe('parseAIConsentInput', () => {
  it('accepts a decision for the current disclosure', () => {
    expect(parseAIConsentInput({ granted: true, version: 'v1' }, 'v1')).toEqual({ granted: true, version: 'v1' })
    expect(parseAIConsentInput({ granted: false, version: 'v1' }, 'v1')).toEqual({ granted: false, version: 'v1' })
  })

  it('flags a decision made on an outdated disclosure', () => {
    expect(parseAIConsentInput({ granted: true, version: 'old' }, 'v1')).toBe('stale')
  })

  it('rejects malformed bodies', () => {
    expect(parseAIConsentInput(null, 'v1')).toBeNull()
    expect(parseAIConsentInput({ granted: 'yes', version: 'v1' }, 'v1')).toBeNull()
    expect(parseAIConsentInput({ granted: true }, 'v1')).toBeNull()
  })
})

describe('isConsentCurrent', () => {
  it('requires a granted row for the current version', () => {
    expect(isConsentCurrent({ granted: true, version: 'v1' }, 'v1')).toBe(true)
    expect(isConsentCurrent({ granted: true, version: 'v0' }, 'v1')).toBe(false)
    expect(isConsentCurrent({ granted: false, version: 'v1' }, 'v1')).toBe(false)
    expect(isConsentCurrent(null, 'v1')).toBe(false)
  })
})
