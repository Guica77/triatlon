import { beforeEach, describe, expect, it, vi } from 'vitest'
const h=vi.hoisted(()=>({stored:null as any,fetch:vi.fn()}))
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>({from:()=>{
  const chain:any={upsert:async(row:any)=>{h.stored=row;return {error:null}},select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data:h.stored})};return chain
}})}))
import { rememberAppleToken, revokeAppleAuthorization } from '@/lib/auth/apple-revocation'
describe('Apple token lifecycle',()=>{
  beforeEach(()=>{h.stored=null;h.fetch.mockReset().mockResolvedValue({ok:true});vi.stubGlobal('fetch',h.fetch);vi.stubEnv('TOKEN_ENCRYPTION_KEY','a'.repeat(64));vi.stubEnv('APPLE_CLIENT_ID','test-client');vi.stubEnv('APPLE_CLIENT_SECRET','test-secret')})
  it('encrypts stored tokens and revokes after the provider session has disappeared',async()=>{
    await rememberAppleToken('a',{provider_refresh_token:'private-token'})
    expect(JSON.stringify(h.stored)).not.toContain('private-token')
    expect(await revokeAppleAuthorization('a',null)).toBe('revoked')
    expect(h.fetch.mock.calls[0][1].body.get('token')).toBe('private-token')
  })
  it('does not decrypt a token for a different user',async()=>{
    await rememberAppleToken('a',{provider_refresh_token:'private-token'})
    expect(await revokeAppleAuthorization('b',null)).toBe('manual')
    expect(h.fetch).not.toHaveBeenCalled()
  })
  it('returns explicit manual instructions when no token is available',async()=>{
    expect(await revokeAppleAuthorization('a',null)).toBe('manual')
    expect(h.fetch).not.toHaveBeenCalled()
  })
  it('retries network failure once without throwing away the deletion flow',async()=>{
    h.fetch.mockRejectedValue(new Error('offline'))
    expect(await revokeAppleAuthorization('a',{provider_token:'test-token'})).toBe('manual')
    expect(h.fetch).toHaveBeenCalledTimes(2)
  })
})
