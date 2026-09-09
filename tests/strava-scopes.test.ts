import { describe, expect, it } from 'vitest'
import { hasRequiredStravaScopes, STRAVA_REQUIRED_SCOPES } from '@/lib/telemetry/strava-scopes'

describe('Strava OAuth scopes', () => {
  it('requires private activity and detailed-profile consent for physiology sync', () => {
    expect(STRAVA_REQUIRED_SCOPES).toEqual(['read', 'profile:read_all', 'activity:read_all'])
  })

  it('rejects legacy connections that did not grant detailed-profile consent', () => {
    expect(hasRequiredStravaScopes(['read', 'activity:read_all'])).toBe(false)
  })

  it('accepts the complete scope set returned by Strava', () => {
    expect(hasRequiredStravaScopes('read,profile:read_all,activity:read_all')).toBe(true)
  })
})
