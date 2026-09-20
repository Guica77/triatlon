import { Environment, InAppOwnershipType, SignedDataVerifier } from '@apple/app-store-server-library'
import { createAdminClient } from '@/lib/supabase/admin'
import { classifyAppleEvent } from '@/lib/apple-event'
import { reconcileAppleEvent } from '@/lib/apple-reconciliation'

export const runtime = 'nodejs'

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
})

function verifier() {
  const roots = process.env.APPLE_ROOT_CERTS_BASE64
    ?.split(',')
    .map((value) => Buffer.from(value.trim(), 'base64'))
    .filter((value) => value.length > 0)
  const bundleID = process.env.APPLE_BUNDLE_ID?.trim()
  const appAppleID = Number(process.env.APPLE_APP_ID)

  if (!roots?.length || !bundleID || !Number.isSafeInteger(appAppleID) || appAppleID <= 0) return null

  return new SignedDataVerifier(
    roots,
    true,
    process.env.APPLE_NOTIFICATION_ENV === 'production' ? Environment.PRODUCTION : Environment.SANDBOX,
    bundleID,
    appAppleID,
  )
}

function isUUID(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

function isAppleReference(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9._-]{1,256}$/.test(value))
}

async function resolveUserID(
  admin: ReturnType<typeof createAdminClient>,
  appAccountToken: string | null,
  transactionID: string,
  originalTransactionID: string,
) {
  const candidates = new Set<string>()

  if (appAccountToken && isUUID(appAccountToken)) {
    const { data } = await admin
      .from('billing_entitlements')
      .select('user_id')
      .eq('provider_customer_reference', appAccountToken)
      .maybeSingle()
    if (data?.user_id) candidates.add(data.user_id)
  }

  for (const reference of [transactionID, originalTransactionID]) {
    const { data } = await admin
      .from('billing_provider_transactions')
      .select('user_id')
      .eq('provider', 'app_store')
      .or(`transaction_reference.eq.${reference},original_transaction_reference.eq.${reference}`)
      .maybeSingle()
    if (data?.user_id) candidates.add(data.user_id)
  }

  for (const column of ['provider_reference', 'provider_transaction_reference'] as const) {
    const { data } = await admin
      .from('billing_entitlements')
      .select('user_id')
      .eq(column, column === 'provider_reference' ? originalTransactionID : transactionID)
      .maybeSingle()
    if (data?.user_id) candidates.add(data.user_id)
  }

  return candidates.size === 1 ? [...candidates][0] : null
}

export async function POST(request: Request) {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    return reply({ error: 'Solicitud inválida.' }, 400)
  }

  const body = await request.text()
  if (body.length > 256_000) return reply({ error: 'Solicitud demasiado grande.' }, 413)

  let input: { signedPayload?: unknown } | null = null
  try { input = JSON.parse(body) as { signedPayload?: unknown } } catch { return reply({ error: 'Solicitud inválida.' }, 400) }
  if (!input || typeof input.signedPayload !== 'string' || input.signedPayload.length < 32 || input.signedPayload.length > 256_000) {
    return reply({ error: 'signedPayload requerido.' }, 400)
  }

  const verify = verifier()
  if (!verify) return reply({ error: 'Notificaciones de Apple no configuradas.' }, 503)

  let notification
  try {
    notification = await verify.verifyAndDecodeNotification(input.signedPayload)
  } catch {
    return reply({ error: 'Notificación de Apple no válida.' }, 400)
  }

  const admin = createAdminClient()
  const eventID = notification.notificationUUID || `${notification.signedDate || Date.now()}:${notification.notificationType || 'unknown'}`
  const eventType = notification.notificationType || 'unknown'
  const { error: insertError } = await admin.from('billing_webhook_events').insert({
    provider: 'app_store',
    event_id: eventID,
    event_type: eventType,
  })
  if (insertError?.code === '23505') return reply({ received: true, duplicate: true })
  if (insertError) return reply({ error: 'No se pudo registrar la notificación.' }, 503)

  const data = notification.data
  const expectedEnvironment = process.env.APPLE_NOTIFICATION_ENV === 'production'
    ? Environment.PRODUCTION
    : Environment.SANDBOX
  if (
    !data ||
    data.bundleId !== process.env.APPLE_BUNDLE_ID?.trim() ||
    data.environment !== expectedEnvironment ||
    data.appAppleId !== Number(process.env.APPLE_APP_ID) ||
    typeof data.signedTransactionInfo !== 'string'
  ) {
    return reply({ received: true, reconciled: false })
  }

  let transaction
  try {
    transaction = await verify.verifyAndDecodeTransaction(data.signedTransactionInfo)
  } catch {
    return reply({ received: true, reconciled: false })
  }

  let renewal = null
  if (data.signedRenewalInfo) {
    try {
      renewal = await verify.verifyAndDecodeRenewalInfo(data.signedRenewalInfo)
    } catch {
      return reply({ received: true, reconciled: false })
    }
  }

  if (
    transaction.bundleId !== process.env.APPLE_BUNDLE_ID?.trim() ||
    transaction.environment !== expectedEnvironment ||
    !isAppleReference(transaction.transactionId) ||
    !isAppleReference(transaction.originalTransactionId) ||
    transaction.inAppOwnershipType !== InAppOwnershipType.PURCHASED
  ) return reply({ received: true, reconciled: false })

  const event = classifyAppleEvent({
    eventType,
    notificationSignedDate: notification.signedDate,
    transaction,
    renewal,
  })
  if (!event) return reply({ received: true, reconciled: false })

  const appAccountToken = transaction.appAccountToken || renewal?.appAccountToken || null
  const userID = await resolveUserID(
    admin,
    appAccountToken,
    transaction.transactionId,
    transaction.originalTransactionId,
  )
  if (!userID) return reply({ received: true, reconciled: false })

  if (appAccountToken && (!isUUID(appAccountToken) || appAccountToken.toLowerCase() !== userID.toLowerCase())) {
    return reply({ received: true, reconciled: false })
  }

  try {
    const result = await reconcileAppleEvent(admin, userID, event)
    return reply({
      received: true,
      reconciled: result.accepted || result.duplicate,
      duplicate: result.duplicate,
      status: result.status,
    })
  } catch {
    return reply({ error: 'No se pudo reconciliar la notificación.' }, 503)
  }
}
