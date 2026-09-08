const DEMO_ACCOUNT_EMAILS = new Set([
  'demo@triatlonpro.com',
  'coach-demo@triatlonpro.com',
  'carlos.garcia@triatlonpro.com',
  'marta.ruiz@triatlonpro.com',
])

export function isDemoAccount(profile: { email?: string | null; first_name?: string | null; last_name?: string | null }) {
  const email = profile.email?.trim().toLowerCase()
  if (email && DEMO_ACCOUNT_EMAILS.has(email)) return true
  return profile.first_name?.trim().toLowerCase() === 'demo'
    && Boolean(profile.last_name?.trim())
}
