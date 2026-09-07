import { describe, expect, it, vi } from 'vitest'
const h = vi.hoisted(() => ({ from: vi.fn(() => { throw new Error('Unexpected database write') }) }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: {
  getUser: async () => ({ data: { user: { id: 'athlete' } } }),
}, from: h.from }) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
import { saveGarminCredentialsAction, pushWeekWorkoutsToGarminAction, updateSubscriptionStatus } from '@/app/(app)/settings/actions'

describe('unavailable integrations never pretend to succeed', () => {
  it('never stores a Garmin password', async () => {
    expect((await saveGarminCredentialsAction('a@example.org', 'private')).error).toBeTruthy()
    expect(h.from).not.toHaveBeenCalled()
  })
  it('never grants a paid subscription from client input', async () => {
    expect((await updateSubscriptionStatus('pro')).error).toBeTruthy()
    expect(h.from).not.toHaveBeenCalled()
  })
  it('never reports a fake upload to a watch', async () => {
    expect((await pushWeekWorkoutsToGarminAction()).error).toBeTruthy()
    expect(h.from).not.toHaveBeenCalled()
  })
})
