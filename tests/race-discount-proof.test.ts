import { describe, expect, it } from 'vitest'
import { isValidAppleOfferCode, isValidRaceDate, normalizeRaceName, validateRaceProofFile } from '@/lib/race-discount-proof'

describe('race discount proof validation', () => {
  it('accepts a real JPEG signature and rejects a MIME spoof', () => {
    expect(validateRaceProofFile({ type: 'image/jpeg', size: 3 }, new Uint8Array([0xff, 0xd8, 0xff]))).toBe('image/jpeg')
    expect(validateRaceProofFile({ type: 'image/png', size: 3 }, new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull()
  })

  it('accepts PNG and PDF signatures', () => {
    expect(validateRaceProofFile({ type: 'image/png', size: 8 }, new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    expect(validateRaceProofFile({ type: 'application/pdf', size: 5 }, new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe('application/pdf')
  })

  it('rejects empty, oversized, and length-mismatched files', () => {
    expect(validateRaceProofFile({ type: 'image/jpeg', size: 0 }, new Uint8Array())).toBeNull()
    expect(validateRaceProofFile({ type: 'image/jpeg', size: 6 * 1024 * 1024 }, new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull()
    expect(validateRaceProofFile({ type: 'image/jpeg', size: 4 }, new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull()
  })

  it('normalizes race names and bounds their length', () => {
    expect(normalizeRaceName('  Ironman   Barcelona  ')).toBe('Ironman Barcelona')
    expect(normalizeRaceName('x')).toBeNull()
    expect(normalizeRaceName('x'.repeat(121))).toBeNull()
  })

  it('validates Apple-generated code shape without accepting arbitrary text', () => {
    expect(isValidAppleOfferCode('ABC-123-XYZ')).toBe(true)
    expect(isValidAppleOfferCode('enter code')).toBe(false)
  })

  it('accepts optional and real ISO dates within the supported window', () => {
    const now = new Date('2026-09-23T12:00:00.000Z')
    expect(isValidRaceDate('', now)).toBe(true)
    expect(isValidRaceDate('2027-05-15', now)).toBe(true)
    expect(isValidRaceDate('2027-02-30', now)).toBe(false)
    expect(isValidRaceDate('2035-01-01', now)).toBe(false)
  })
})
