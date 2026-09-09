export const STRAVA_REQUIRED_SCOPES = ['read', 'profile:read_all', 'activity:read_all'] as const

export function normalizeStravaScopes(scopes: string | string[] | null | undefined): string[] {
  if (Array.isArray(scopes)) return scopes.filter((scope): scope is string => typeof scope === 'string')
  return typeof scopes === 'string' ? scopes.split(/[ ,]+/).filter(Boolean) : []
}

export function hasRequiredStravaScopes(scopes: string | string[] | null | undefined): boolean {
  const granted = new Set(normalizeStravaScopes(scopes))
  return STRAVA_REQUIRED_SCOPES.every(scope => granted.has(scope))
}
