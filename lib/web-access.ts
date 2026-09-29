// Browser access policy. The web product is for coaches; athletes use the iOS
// app, which identifies itself with the TriWaveXNative user agent or header.

export const LANDING_URL = 'https://triwavex.com'
export const COACH_HOST = 'entrenadores.triwavex.com'
export const LEGACY_APP_HOST = 'app.triwavex.com'
export const ATHLETE_WEB_PATH = '/descarga-app'
/** Signs a non-coach session out of the coach host. */
export const COACH_ONLY_EXIT_PATH = '/auth/coach-only'
export const COACH_ONLY_MESSAGE = 'Este acceso es solo para entrenadores. Si entrenas con TriWaveX, usa la app de iPhone.'

const COACH_ENTRY_PATHS = new Set(['/login', '/signup', '/register', '/coach/login', '/coach/register'])
const ATHLETE_ENTRY_PATHS = new Set(['/athlete/login', '/athlete/register'])

export function isNativeClient(userAgent: string | null, nativeHeader: string | null) {
  return nativeHeader === '1' || Boolean(userAgent?.includes('TriWaveXNative/'))
}

/** Where a browser request must go instead, or null to serve it as is. */
export function browserRedirect(host: string | undefined, pathname: string, search: URLSearchParams): string | null {
  if (ATHLETE_ENTRY_PATHS.has(pathname)) return ATHLETE_WEB_PATH

  if (host === LEGACY_APP_HOST) {
    // The old app host stays alive for installed iOS builds; people in a
    // browser land on the public site or the coach entrance instead.
    if (pathname === '/') return LANDING_URL
    if (COACH_ENTRY_PATHS.has(pathname)) {
      const target = pathname.startsWith('/coach/') ? pathname : '/login'
      return `https://${COACH_HOST}${target}?role=coach`
    }
    return null
  }

  if (host === COACH_HOST) {
    // The coach host has no athlete sign-up: every registration is a coach one.
    if (pathname === '/signup' || pathname === '/register') return '/coach/register'
    if (pathname === '/login' && search.get('role') !== 'coach') {
      const params = new URLSearchParams(search)
      params.set('role', 'coach')
      return `/login?${params.toString()}`
    }
  }

  return null
}

/** The coach host is exclusive to coaches, whatever the client. */
export function isCoachOnlyHost(host: string | null | undefined) {
  return host?.split(':')[0]?.toLowerCase() === COACH_HOST
}

/** Whether a signed-in profile may use the product on this host and client. */
export function canUseProduct(
  { host, role, native, athleteWebEnabled = false }:
  { host: string | null | undefined; role: string | null | undefined; native: boolean; athleteWebEnabled?: boolean },
) {
  if (isCoachOnlyHost(host)) return role === 'coach'
  return native || browserCanUseProduct(role, athleteWebEnabled)
}

/** Only coaches use the product in a browser, unless explicitly enabled. */
export function browserCanUseProduct(role: string | null | undefined, athleteWebEnabled = false) {
  return role === 'coach' || athleteWebEnabled
}
