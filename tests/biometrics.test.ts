import { describe, expect, it } from 'vitest'
import { hasCompleteReadinessInputs } from '@/lib/biometrics'

describe('readiness inputs', () => {
  const completeEntry = {
    hrv: 58,
    rhr: 49,
    sleep_hours: 7.25,
    fatigue_rating: 3,
    stress_level: 2,
  }

  it('requires every metric instead of accepting illustrative defaults', () => {
    expect(hasCompleteReadinessInputs(completeEntry)).toBe(true)
    expect(hasCompleteReadinessInputs({ ...completeEntry, hrv: null })).toBe(false)
    expect(hasCompleteReadinessInputs({ ...completeEntry, sleep_hours: undefined })).toBe(false)
  })
})
