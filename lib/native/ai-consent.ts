export type AIConsentInput = { granted: boolean; version: string }

/** Validates a native consent decision against the disclosure the user saw. */
export function parseAIConsentInput(raw: unknown, currentVersion: string): AIConsentInput | 'stale' | null {
  if (!raw || typeof raw !== 'object') return null
  const { granted, version } = raw as Record<string, unknown>
  if (typeof granted !== 'boolean' || typeof version !== 'string' || version.length > 2_000) return null
  // Consent is only valid for the exact providers/models that were shown.
  if (version !== currentVersion) return 'stale'
  return { granted, version }
}

/** A stored decision only counts for the current disclosure version. */
export function isConsentCurrent(row: { version: string; granted: boolean } | null | undefined, currentVersion: string) {
  return Boolean(row && row.granted === true && row.version === currentVersion)
}
