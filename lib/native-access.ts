import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type NativeAccessRole = 'athlete' | 'coach'

export type NativeAccess = {
  destination: '/dashboard' | '/coach/dashboard' | '/onboarding'
  userID: string
  role: NativeAccessRole
  entitled: boolean
}

type NativeSupabaseClient = SupabaseClient<Database>

function isFuture(value: string | null | undefined) {
  return Boolean(value && Number.isFinite(new Date(value).getTime()) && new Date(value).getTime() > Date.now())
}

export async function nativeAccessForUser(
  supabase: NativeSupabaseClient,
  userID: string,
): Promise<NativeAccess> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, active_plan_id')
    .eq('id', userID)
    .maybeSingle()
  if (profileError) throw profileError

  const role: NativeAccessRole = profile?.role === 'coach' ? 'coach' : 'athlete'
  const { data: entitlement, error: entitlementError } = await supabase
    .from('billing_entitlements')
    .select('plan, status, period_ends_at, trial_ends_at, provider_grace_period_ends_at')
    .eq('user_id', userID)
    .maybeSingle()
  if (entitlementError) throw entitlementError

  const hasProviderPeriod = isFuture(entitlement?.period_ends_at) || isFuture(entitlement?.trial_ends_at)
  const inGracePeriod = entitlement?.status === 'past_due' && isFuture(entitlement?.provider_grace_period_ends_at)
  const entitled = entitlement?.plan === role && (
    (entitlement.status === 'active' && hasProviderPeriod) ||
    inGracePeriod
  )

  if (!entitled) return { destination: '/onboarding', userID, role, entitled: false }
  if (role === 'coach') return { destination: '/coach/dashboard', userID, role, entitled: true }
  return { destination: '/dashboard', userID, role, entitled: true }
}
