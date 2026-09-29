import { Environment, SignedDataVerifier } from '@apple/app-store-server-library'

export type AppleVerifier = {
  environment: Environment
  verifier: SignedDataVerifier
}

/**
 * Verifiers to try in order. A production server must also accept Sandbox:
 * App Review and TestFlight always purchase in the sandbox, even against the
 * production backend, and Apple rejects apps whose purchases then fail.
 * Returns null when Apple verification is not configured.
 */
export function appleVerifiers(): AppleVerifier[] | null {
  const roots = process.env.APPLE_ROOT_CERTS_BASE64
    ?.split(',')
    .map((value) => Buffer.from(value.trim(), 'base64'))
    .filter((value) => value.length > 0)
  const bundleID = process.env.APPLE_BUNDLE_ID?.trim()
  const appAppleID = Number(process.env.APPLE_APP_ID)

  if (!roots?.length || !bundleID || !Number.isSafeInteger(appAppleID) || appAppleID <= 0) return null

  const environments = process.env.APPLE_NOTIFICATION_ENV === 'production'
    ? [Environment.PRODUCTION, Environment.SANDBOX]
    : [Environment.SANDBOX]

  return environments.map((environment) => ({
    environment,
    verifier: new SignedDataVerifier(roots, true, environment, bundleID, appAppleID),
  }))
}

/** Decodes with the first verifier that accepts the signed data, or null. */
export async function verifyInAnyEnvironment<T>(
  verifiers: AppleVerifier[],
  decode: (verifier: SignedDataVerifier) => Promise<T>,
): Promise<{ value: T, verified: AppleVerifier } | null> {
  for (const candidate of verifiers) {
    try {
      return { value: await decode(candidate.verifier), verified: candidate }
    } catch {
      // Signed for another environment (or invalid): try the next one.
    }
  }
  return null
}
