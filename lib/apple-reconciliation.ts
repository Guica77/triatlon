import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { planForAppleProduct, type ClassifiedAppleEvent } from '@/lib/apple-event'

export type ReconciliationResult = {
  accepted: boolean
  duplicate: boolean
  status: string
  user_id: string
}

type ReconciliationClient = SupabaseClient<Database>

export async function reconcileAppleEvent(
  admin: ReconciliationClient,
  userID: string,
  event: ClassifiedAppleEvent,
  activePlanID: string | null = null,
): Promise<ReconciliationResult> {
  const { data, error } = await admin.rpc('reconcile_app_store_entitlement', {
    p_user_id: userID,
    p_plan: planForAppleProduct(event.providerProductId) ?? (() => { throw new Error('invalid_app_store_product') })(),
    p_status: event.status,
    p_period_ends_at: event.periodEndsAt,
    p_provider_reference: event.providerReference,
    p_provider_transaction_reference: event.providerTransactionReference,
    p_provider_customer_reference: event.providerCustomerReference,
    p_provider_signed_date: event.providerSignedDate,
    p_provider_environment: event.providerEnvironment,
    p_provider_product_id: event.providerProductId,
    p_provider_expires_at: event.providerExpiresAt,
    p_provider_revocation_at: event.providerRevocationAt,
    p_provider_grace_period_ends_at: event.providerGracePeriodEndsAt,
    p_provider_event_type: event.providerEventType,
    p_active_plan_id: activePlanID,
  })
  if (error) throw error
  const result = Array.isArray(data) ? data[0] : data
  if (!result) throw new Error('empty_app_store_reconciliation_result')
  return result as ReconciliationResult
}
