export const MAX_RACE_PROOF_BYTES = 4 * 1024 * 1024

export type RaceProofContentType = 'image/jpeg' | 'image/png' | 'application/pdf'

export function validateRaceProofFile(file: { type: string; size: number }, bytes: Uint8Array): RaceProofContentType | null {
  if (file.size <= 0 || file.size > MAX_RACE_PROOF_BYTES || bytes.byteLength !== file.size) return null

  if (file.type === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (file.type === 'image/png' && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png'
  if (file.type === 'application/pdf' && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) return 'application/pdf'

  return null
}

export function normalizeRaceName(value: string) {
  const name = value.trim().replace(/\s+/g, ' ')
  return name.length >= 2 && name.length <= 120 ? name : null
}

export function isValidAppleOfferCode(value: string) {
  return /^[A-Za-z0-9-]{4,64}$/.test(value.trim())
}

export function isValidRaceDate(value: string, now = new Date()) {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false
  const earliest = new Date(now)
  earliest.setUTCFullYear(earliest.getUTCFullYear() - 1)
  const latest = new Date(now)
  latest.setUTCFullYear(latest.getUTCFullYear() + 5)
  return date >= earliest && date <= latest
}
