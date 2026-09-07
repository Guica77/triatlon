import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ user: null as any, from: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: h.user } }) }, from: h.from,
}) }))
import { checkAdminAccess, getBusinessMetrics } from '@/app/admin/actions'

describe('administrator authorization', () => {
  beforeEach(() => {
    h.user = { id: 'ordinary-user', email: 'guillermo.other@example.org' }
    h.from.mockReset().mockImplementation(() => {
      const chain: any = { select: () => chain, update: () => chain, eq: () => chain,
        maybeSingle: async () => ({ data: { role: 'owner' } }) }
      return chain
    })
    vi.stubEnv('ADMIN_USER_IDS', 'trusted-user')
  })
  it('rejects an ordinary user even with a matching email and editable owner role', async () => {
    expect(await checkAdminAccess()).toBe(false)
    expect(h.from).not.toHaveBeenCalled()
  })
  it('checks permissions inside the metrics action', async () => {
    await expect(getBusinessMetrics()).rejects.toThrow('No autorizado')
    expect(h.from).not.toHaveBeenCalled()
  })
  it('allows only the explicitly configured immutable user ID', async () => {
    h.user = { id: 'trusted-user', email: 'unrelated@example.org' }
    expect(await checkAdminAccess()).toBe(true)
    expect(h.from).not.toHaveBeenCalled()
  })
  it('fails closed when no administrators are configured', async () => {
    vi.stubEnv('ADMIN_USER_IDS', '')
    expect(await checkAdminAccess()).toBe(false)
  })
})
