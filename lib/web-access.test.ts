import { describe, expect, it } from 'vitest'
import { browserCanUseProduct, browserRedirect, canUseProduct, isCoachOnlyHost, isNativeClient } from './web-access'

const none = new URLSearchParams()

describe('isNativeClient', () => {
  it('recognises the iOS app by user agent or header', () => {
    expect(isNativeClient('Mozilla/5.0 TriWaveXNative/1.0', null)).toBe(true)
    expect(isNativeClient('TriWaveXNative/1.0', null)).toBe(true)
    expect(isNativeClient('Mozilla/5.0 Safari', '1')).toBe(true)
    expect(isNativeClient('Mozilla/5.0 Safari', null)).toBe(false)
    expect(isNativeClient(null, null)).toBe(false)
  })
})

describe('browserRedirect', () => {
  it('sends the old app host root to the landing', () => {
    expect(browserRedirect('app.triwavex.com', '/', none)).toBe('https://triwavex.com')
  })

  it('moves login and sign-up on the old host to the coach entrance', () => {
    expect(browserRedirect('app.triwavex.com', '/login', none)).toBe('https://entrenadores.triwavex.com/login?role=coach')
    expect(browserRedirect('app.triwavex.com', '/signup', none)).toBe('https://entrenadores.triwavex.com/login?role=coach')
    expect(browserRedirect('app.triwavex.com', '/coach/register', none)).toBe('https://entrenadores.triwavex.com/coach/register?role=coach')
  })

  it('keeps callbacks, APIs and legal pages on the old host', () => {
    for (const path of ['/auth/callback', '/api/native/session', '/legal/privacidad', '/soporte', '/auth/reset-password', '/dashboard']) {
      expect(browserRedirect('app.triwavex.com', path, none)).toBeNull()
    }
  })

  it('opens the coach entrance with the coach role selected', () => {
    expect(browserRedirect('entrenadores.triwavex.com', '/login', none)).toBe('/login?role=coach')
    expect(browserRedirect('entrenadores.triwavex.com', '/login', new URLSearchParams('error=AuthCallbackError')))
      .toBe('/login?error=AuthCallbackError&role=coach')
    expect(browserRedirect('entrenadores.triwavex.com', '/login', new URLSearchParams('role=coach'))).toBeNull()
  })

  it('turns every sign-up on the coach host into a coach one', () => {
    expect(browserRedirect('entrenadores.triwavex.com', '/signup', none)).toBe('/coach/register')
    expect(browserRedirect('entrenadores.triwavex.com', '/register', none)).toBe('/coach/register')
    expect(browserRedirect('entrenadores.triwavex.com', '/coach/register', none)).toBeNull()
  })

  it('sends athlete entry pages to the app download page on any host', () => {
    expect(browserRedirect('entrenadores.triwavex.com', '/athlete/login', none)).toBe('/descarga-app')
    expect(browserRedirect('localhost', '/athlete/register', none)).toBe('/descarga-app')
  })

  it('leaves other hosts alone', () => {
    expect(browserRedirect('localhost', '/', none)).toBeNull()
    expect(browserRedirect('localhost', '/login', none)).toBeNull()
  })
})

describe('browserCanUseProduct', () => {
  it('lets only coaches use the web product by default', () => {
    expect(browserCanUseProduct('coach')).toBe(true)
    expect(browserCanUseProduct('athlete')).toBe(false)
    expect(browserCanUseProduct(null)).toBe(false)
    expect(browserCanUseProduct('athlete', true)).toBe(true)
  })
})

describe('coach host', () => {
  it('is recognised with or without a port and in any case', () => {
    expect(isCoachOnlyHost('entrenadores.triwavex.com')).toBe(true)
    expect(isCoachOnlyHost('Entrenadores.TriWaveX.com:443')).toBe(true)
    expect(isCoachOnlyHost('app.triwavex.com')).toBe(false)
    expect(isCoachOnlyHost(null)).toBe(false)
  })

  it('admits only coaches, even from the app or with athlete web access on', () => {
    const host = 'entrenadores.triwavex.com'
    expect(canUseProduct({ host, role: 'coach', native: false })).toBe(true)
    expect(canUseProduct({ host, role: 'athlete', native: false })).toBe(false)
    expect(canUseProduct({ host, role: 'athlete', native: true })).toBe(false)
    expect(canUseProduct({ host, role: 'athlete', native: false, athleteWebEnabled: true })).toBe(false)
    expect(canUseProduct({ host, role: null, native: true })).toBe(false)
  })

  it('keeps the other hosts as before', () => {
    expect(canUseProduct({ host: 'app.triwavex.com', role: 'athlete', native: true })).toBe(true)
    expect(canUseProduct({ host: 'app.triwavex.com', role: 'athlete', native: false })).toBe(false)
    expect(canUseProduct({ host: 'localhost', role: 'athlete', native: false, athleteWebEnabled: true })).toBe(true)
  })
})
