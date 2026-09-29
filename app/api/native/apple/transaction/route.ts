import { AppStoreServerAPIClient, Environment, InAppOwnershipType, OfferType } from '@apple/app-store-server-library'
import { appleVerifiers, verifyInAnyEnvironment } from '@/lib/apple-verification'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { classifyAppleEvent, planForAppleProduct } from '@/lib/apple-event'
import { reconcileAppleEvent } from '@/lib/apple-reconciliation'
import { nativeAccessForUser } from '@/lib/native-access'
import { selectTrainingPlan } from '@/lib/training-plan-selection'

export const runtime = 'nodejs'

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

function appStoreServerAPIClient(environment: Environment) {
  const issuerID = process.env.APPLE_SERVER_API_ISSUER_ID?.trim()
  const keyID = process.env.APPLE_SERVER_API_KEY_ID?.trim()
  const encodedPrivateKey = process.env.APPLE_SERVER_API_PRIVATE_KEY_BASE64?.trim()
  const bundleID = process.env.APPLE_BUNDLE_ID?.trim()
  if (!issuerID || !keyID || !encodedPrivateKey || !bundleID) return null

  try {
    const privateKey = Buffer.from(encodedPrivateKey, 'base64').toString('utf8')
    if (!privateKey.includes('BEGIN PRIVATE KEY')) return null
    return new AppStoreServerAPIClient(privateKey, keyID, issuerID, bundleID, environment)
  } catch {
    return null
  }
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
    planForAppleProduct(productID) === null ||
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

    const verifiers = appleVerifiers()
    if (!verifiers) return reply({ error: 'La validación de compras no está configurada.' }, 503)

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
    if (planForAppleProduct(input.productID) !== role) return reply({ error: 'El producto no corresponde a tu cuenta.' }, 403)

    // Production also accepts Sandbox: App Review and TestFlight buy there.
    const decoded = await verifyInAnyEnvironment(verifiers, (verifier) => verifier.verifyAndDecodeTransaction(input.signedTransactionInfo))
    if (!decoded) return reply({ error: 'Apple no ha podido validar esta transacción.' }, 400)
    const { value: transaction, verified } = decoded

    let renewal = null
    if (input.signedRenewalInfo) {
      try {
        renewal = await verified.verifier.verifyAndDecodeRenewalInfo(input.signedRenewalInfo)
      } catch {
        return reply({ error: 'Apple no ha podido validar la renovación.' }, 400)
      }
    }

    const expectedEnvironment = verified.environment
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
    const transactionAccountToken = transaction.appAccountToken?.toLowerCase()
    if (input.appAccountToken && input.appAccountToken.toLowerCase() !== user.id.toLowerCase()) {
      return reply({ error: 'La cuenta de Apple no coincide.' }, 403)
    }

    if (transactionAccountToken && transactionAccountToken !== user.id.toLowerCase()) {
      return reply({ error: 'La transacción ya está asociada a otra cuenta.' }, 403)
    }

    if (!transactionAccountToken) {
      const isOfferCodeRedemption = input.eventType === 'OFFER_REDEEMED' && transaction.offerType === OfferType.OFFER_CODE
      if (!isOfferCodeRedemption) return reply({ error: 'La transacción no pertenece a esta cuenta.' }, 403)

      const serverAPI = appStoreServerAPIClient(expectedEnvironment)
      if (!serverAPI) return reply({ error: 'Falta configurar la clave de App Store Server API para asociar códigos de oferta.' }, 503)
      try {
        await serverAPI.setAppAccountToken(transaction.originalTransactionId!, { appAccountToken: user.id })
      } catch {
        return reply({ error: 'Apple no ha podido asociar este código a tu cuenta. No vuelvas a canjearlo; contacta con soporte.' }, 503)
      }
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
