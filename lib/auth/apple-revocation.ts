import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

function key() {
  const value = process.env.TOKEN_ENCRYPTION_KEY || ''
  if (!/^[a-fA-F0-9]{64}$/.test(value)) return null
  return Buffer.from(value, 'hex')
}
export async function rememberAppleToken(userId: string, session: { provider_refresh_token?: string | null; provider_token?: string | null } | null) {
  const secret = key()
  const token = session?.provider_refresh_token || session?.provider_token
  if (!secret || !token) return false
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', secret, iv)
  cipher.setAAD(Buffer.from(userId))
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const { error } = await (createAdminClient() as any).from('apple_revocation_tokens').upsert({
    user_id: userId, encrypted: encrypted.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'),
    token_type: session?.provider_refresh_token ? 'refresh_token' : 'access_token',
  })
  return !error
}

export async function revokeAppleAuthorization(userId: string, session: { provider_refresh_token?: string | null; provider_token?: string | null } | null): Promise<'revoked' | 'manual'> {
  try {
    let token = session?.provider_refresh_token || session?.provider_token
    let tokenType = session?.provider_refresh_token ? 'refresh_token' : 'access_token'
    const secret = key()
    if (!token && secret) {
      const { data, error } = await (createAdminClient() as any).from('apple_revocation_tokens').select('encrypted, iv, tag, token_type').eq('user_id', userId).maybeSingle()
      if (!error && data) {
        const cipher = createDecipheriv('aes-256-gcm', secret, Buffer.from(data.iv,'base64'))
        cipher.setAAD(Buffer.from(userId)); cipher.setAuthTag(Buffer.from(data.tag,'base64'))
        token = Buffer.concat([cipher.update(Buffer.from(data.encrypted,'base64')),cipher.final()]).toString('utf8')
        tokenType = data.token_type
      }
    }
    if (!token || !process.env.APPLE_CLIENT_ID || !process.env.APPLE_CLIENT_SECRET) return 'manual'
    const body = new URLSearchParams({ token, client_id:process.env.APPLE_CLIENT_ID, client_secret:process.env.APPLE_CLIENT_SECRET, token_type_hint:tokenType })
    for (let attempt=0; attempt<2; attempt++) {
      try {
        const response = await fetch('https://appleid.apple.com/auth/revoke', { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body, signal:AbortSignal.timeout(8000), cache:'no-store' })
        if (response.ok) return 'revoked'
        if (response.status < 500) break
      } catch { /* Retry once; never record the token in logs. */ }
    }
  } catch { /* Missing storage/key must not prevent account deletion. */ }
  return 'manual'
}
