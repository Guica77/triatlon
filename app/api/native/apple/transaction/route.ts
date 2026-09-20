import { Environment, InAppOwnershipType, SignedDataVerifier } from '@apple/app-store-server-library'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { classifyAppleEvent, planForAppleProduct } from '@/lib/apple-event'
import { reconcileAppleEvent } from '@/lib/apple-reconciliation'
import { nativeAccessForUser } from '@/lib/native-access'
import { selectTrainingPlan } from '@/lib/training-plan-selection'

export const runtime = 'nodejs'

const PRODUCTS = {
  athlete: 'com.triwavex.athlete.monthly',
  coach: 'com.triwavex.coach.monthly',
} as const

const EVENT_TYPES = new Set([
  'SUBSCRIBED',
  'DID_RENEW',
  'DID_FAIL_TO_RENEW',
  'GRACE_PERIOD_EXPIRED',
  'EXPIRED',
  'REFUND',
  'REVOKE',
  'REFUND_REVERSED',
  'OFFER_REDEEMED',
  'RENEWAL_EXTENSION',
  'RENEWAL_EXTENDED',
])

type TransactionInput = {
  signedTransactionInfo: string
  signedRenewalInfo?: string
  productID: string
  transactionID: string
  originalTransactionID: string
  appAccountToken?: string
  eventType: string
}

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' },
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
    process.env.APPLE_NOTIFICATION_ENV === 'production'
      ? Environment.PRODUCTION
      : Environment.SANDBOX,
    bundleID,
    appAppleID,
  )
}

function isTransactionReference(value: string) {
  return /^[A-Za-z0-9._-]{1,256}$/.test(value)
}

function isUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function inputFrom(value: unknown): TransactionInput | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const signedTransactionInfo = raw.signedTransactionInfo
  const signedRenewalInfo = raw.signedRenewalInfo
  const productID = raw.productID
  const transactionID = raw.transactionID
  const originalTransactionID = raw.originalTransactionID
  const appAccountToken = raw.appAccountToken
  const eventType = raw.eventType ?? 'SUBSCRIBED'

  if (
    typeof signedTransactionInfo !== 'string' ||
    signedTransactionInfo.length < 32 ||
    signedTransactionInfo.length > 128_000 ||
    (signedRenewalInfo !== undefined && (typeof signedRenewalInfo !== 'string' || signedRenewalInfo.length < 32 || signedRenewalInfo.length > 128_000)) ||
    typeof productID !== 'string' ||
    !Object.values(PRODUCTS).includes(productID as typeof PRODUCTS[keyof typeof PRODUCTS]) ||
    typeof transactionID !== 'string' ||
    !isTransactionReference(transactionID) ||
    typeof originalTransactionID !== 'string' ||
    !isTransactionReference(originalTransactionID) ||
    (appAccountToken !== undefined && (typeof appAccountToken !== 'string' || !isUUID(appAccountToken))) ||
    typeof eventType !== 'string' ||
    !EVENT_TYPES.has(eventType)
  ) return null

  return {
    signedTransactionInfo,
    ...(typeof signedRenewalInfo === 'string' ? { signedRenewalInfo } : {}),
    productID,
    transactionID,
    originalTransactionID,
    ...(typeof appAccountToken === 'string' ? { appAccountToken } : {}),
    eventType,
  }
}

function dateFromAppleMilliseconds(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (
    request.headers.get('x-triwavex-native') !== '1' ||
    request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' ||
    (origin !== null && origin !== new URL(request.url).origin)
  ) return reply({ error: 'Solicitud no permitida' }, 403)

  try {
    const body = await request.text()
    if (body.length > 256_000) return reply({ error: 'Solicitud demasiado grande' }, 413)

    let value: unknown
    try { value = JSON.parse(body) } catch { return reply({ error: 'Solicitud inválida' }, 400) }
    const input = inputFrom(value)
    if (!input) return reply({ error: 'Transacción de Apple inválida.' }, 400)

    const verify = verifier()
    if (!verify) return reply({ error: 'La validación de compras no está configurada.' }, 503)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isUUID(user.id)) return reply({ error: 'Tu sesión ha caducado.' }, 401)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, level, target_race_distance')
      .eq('id', user.id)
      .maybeSingle()
    if (profileError) return reply({ error: 'No se ha podido cargar tu perfil.' }, 503)

    const role = profile?.role === 'coach' ? 'coach' : 'athlete'
    if (input.productID !== PRODUCTS[role]) return reply({ error: 'El producto no corresponde a tu cuenta.' }, 403)

    let transaction
    try {
      transaction = await verify.verifyAndDecodeTransaction(input.signedTransactionInfo)
    } catch {
      return reply({ error: 'Apple no ha podido validar esta transacción.' }, 400)
    }

    let renewal = null
    if (input.signedRenewalInfo) {
      try {
        renewal = await verify.verifyAndDecodeRenewalInfo(input.signedRenewalInfo)
      } catch {
        return reply({ error: 'Apple no ha podido validar la renovación.' }, 400)
      }
    }

    const expectedEnvironment = process.env.APPLE_NOTIFICATION_ENV === 'production'
      ? Environment.PRODUCTION
      : Environment.SANDBOX
    if (
      transaction.bundleId !== process.env.APPLE_BUNDLE_ID?.trim() ||
      transaction.environment !== expectedEnvironment ||
      transaction.productId !== input.productID ||
      transaction.transactionId !== input.transactionID ||
      transaction.originalTransactionId !== input.originalTransactionID ||
      transaction.inAppOwnershipType !== InAppOwnershipType.PURCHASED ||
      (transaction.revocationDate !== undefined && !['REFUND', 'REVOKE'].includes(input.eventType))
    ) return reply({ error: 'La transacción no coincide con la compra solicitada.' }, 409)

    const purchaseDate = dateFromAppleMilliseconds(transaction.purchaseDate)
    const signedDate = dateFromAppleMilliseconds(transaction.signedDate)
    const expirationDate = dateFromAppleMilliseconds(transaction.expiresDate)
    if (!purchaseDate || !signedDate || (!expirationDate && !['REFUND', 'REVOKE'].includes(input.eventType)) || (expirationDate && expirationDate <= purchaseDate && !['REFUND', 'REVOKE'].includes(input.eventType))) {
      return reply({ error: 'La transacción no tiene fechas válidas.' }, 409)
    }
    if (transaction.appAccountToken?.toLowerCase() !== user.id.toLowerCase()) {
      return reply({ error: 'La transacción no pertenece a esta cuenta.' }, 403)
    }
    if (input.appAccountToken && input.appAccountToken.toLowerCase() !== user.id.toLowerCase()) {
      return reply({ error: 'La cuenta de Apple no coincide.' }, 403)
    }

    const event = classifyAppleEvent({
      eventType: input.eventType,
      transaction,
      renewal,
    })
    if (!event || planForAppleProduct(event.providerProductId) !== role) {
      return reply({ error: 'La transacción no contiene datos de suscripción válidos.' }, 409)
    }

    const admin = createAdminClient()
    const { data: plans, error: plansError } = role === 'athlete'
      ? await admin.from('training_plans').select('id, distance, level')
      : { data: null, error: null }
    if (plansError) return reply({ error: 'No se han podido consultar los planes.' }, 503)

    const selectedPlan = role === 'athlete'
      ? selectTrainingPlan(plans, profile?.target_race_distance, profile?.level)
      : null
    const reconciliation = await reconcileAppleEvent(admin, user.id, event, selectedPlan?.id ?? null)
    const access = await nativeAccessForUser(admin, user.id)
    return reply({
      accepted: reconciliation.accepted,
      duplicate: reconciliation.duplicate,
      status: reconciliation.status,
      destination: access.destination,
      userID: access.userID,
      role: access.role,
      entitled: access.entitled,
      transactionID: transaction.transactionId,
    })
  } catch {
    return reply({ error: 'Servicio no disponible' }, 503)
  }
}
