import { beforeEach, describe, expect, it, vi } from 'vitest'
const h = vi.hoisted(() => ({ rows: [] as any[], error: null as any, slot: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({
  from: () => ({ select: () => ({ in: async () => ({ data: h.rows, error: h.error }) }) }), rpc: h.slot,
}) }))
import { aiDisclosure, authorizeAIRequest, hasAIConsent } from '@/lib/ai-privacy'
describe('consent before third-party AI', () => {
  beforeEach(() => { vi.unstubAllEnvs(); h.rows = []; h.error = null; vi.stubEnv('GEMINI_API_KEY','configured'); vi.stubEnv('ANTHROPIC_API_KEY',''); h.slot.mockReset().mockResolvedValue({ data: true }) })
  it('denies absent or unreadable consent without spending quota', async () => {
    expect((await authorizeAIRequest('a','a')).allowed).toBe(false)
    h.error = new Error('database unavailable')
    expect((await authorizeAIRequest('a','a')).allowed).toBe(false)
    expect(h.slot).not.toHaveBeenCalled()
  })
  it('requires both coach and athlete to consent', async () => {
    h.rows = [{ user_id:'c', version:aiDisclosure().version, granted:true }]
    expect((await authorizeAIRequest('c','a')).allowed).toBe(false)
    h.rows.push({ user_id:'a', version:aiDisclosure().version, granted:true })
    expect(await hasAIConsent('c', 'a')).toBe(true)
    expect((await authorizeAIRequest('c','a')).allowed).toBe(true)
  })

  it('does not authorize indexing when any affected user has not consented', async () => {
    h.rows = [{ user_id:'c', version:aiDisclosure().version, granted:true }]
    expect(await hasAIConsent('c', 'a')).toBe(false)
    expect(h.slot).not.toHaveBeenCalled()
  })
  it('withdrawal and a changed provider invalidate permission', async () => {
    h.rows = [{ user_id:'a', version:aiDisclosure().version, granted:false }]
    expect((await authorizeAIRequest('a','a')).allowed).toBe(false)
    h.rows[0].granted=true; vi.stubEnv('ANTHROPIC_API_KEY','new-provider')
    expect((await authorizeAIRequest('a','a')).allowed).toBe(false)
  })
  it('includes native providers in the consent version', () => {
    vi.stubEnv('GEMINI_API_KEY','')
    vi.stubEnv('COHERE_API_KEY','configured')
    vi.stubEnv('CLOUDFLARE_API_TOKEN','configured')
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID','account')
    const disclosure = aiDisclosure()
    expect(disclosure.providers).toContain('Cohere')
    expect(disclosure.providers).toContain('Cloudflare Workers AI')
    expect(disclosure.models).toContain('Cohere · command-r')
    expect(disclosure.version).toContain('Cohere')
    expect(disclosure.version).toContain('Cloudflare Workers AI')
  })

  it('does not disclose placeholder credentials as active AI providers', () => {
    vi.stubEnv('GEMINI_API_KEY', 'tu-gemini-api-key')
    vi.stubEnv('GOOGLE_GENAI_API_KEY', '')
    expect(aiDisclosure().providers).not.toContain('Google Gemini')
  })

  it('denies a request when the server quota is exhausted', async () => {
    h.rows = [{ user_id:'a', version:aiDisclosure().version, granted:true }]
    h.slot.mockResolvedValue({ data:false })
    expect((await authorizeAIRequest('a','a')).code).toBe('AI_RATE_LIMIT')
  })
})
