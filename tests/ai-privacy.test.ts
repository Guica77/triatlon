import { beforeEach, describe, expect, it, vi } from 'vitest'
const h = vi.hoisted(() => ({ rows: [] as any[], error: null as any, slot: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({
  from: () => ({ select: () => ({ in: async () => ({ data: h.rows, error: h.error }) }) }), rpc: h.slot,
}) }))
import { aiDisclosure, authorizeAIRequest } from '@/lib/ai-privacy'
describe('consent before third-party AI', () => {
  beforeEach(() => { h.rows = []; h.error = null; vi.stubEnv('GEMINI_API_KEY','configured'); vi.stubEnv('ANTHROPIC_API_KEY',''); h.slot.mockReset().mockResolvedValue({ data: true }) })
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
    expect((await authorizeAIRequest('c','a')).allowed).toBe(true)
  })
  it('withdrawal and a changed provider invalidate permission', async () => {
    h.rows = [{ user_id:'a', version:aiDisclosure().version, granted:false }]
    expect((await authorizeAIRequest('a','a')).allowed).toBe(false)
    h.rows[0].granted=true; vi.stubEnv('ANTHROPIC_API_KEY','new-provider')
    expect((await authorizeAIRequest('a','a')).allowed).toBe(false)
  })
  it('denies a request when the server quota is exhausted', async () => {
    h.rows = [{ user_id:'a', version:aiDisclosure().version, granted:true }]
    h.slot.mockResolvedValue({ data:false })
    expect((await authorizeAIRequest('a','a')).code).toBe('AI_RATE_LIMIT')
  })
})
