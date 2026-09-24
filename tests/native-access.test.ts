import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nativeAccessForUser } from '@/lib/native-access'

const { maybeSingleProfile, maybeSingleEntitlement } = vi.hoisted(() => ({
  maybeSingleProfile: vi.fn(),
  maybeSingleEntitlement: vi.fn(),
}))

const client = {
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: table === 'profiles' ? maybeSingleProfile : maybeSingleEntitlement,
      }),
    }),
  }),
} as never

describe('nativeAccessForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    maybeSingleProfile.mockResolvedValue({ data: { role: 'athlete', active_plan_id: null }, error: null })
    maybeSingleEntitlement.mockResolvedValue({ data: { plan: 'athlete', status: 'expired' }, error: null })
  })

  it('sends a new athlete to onboarding before a plan exists', async () => {
    expect(await nativeAccessForUser(client, 'user-1')).toMatchObject({ destination: '/onboarding', entitled: false })
  })

  it('resumes at checkout when an athlete already saved a plan', async () => {
    maybeSingleProfile.mockResolvedValue({ data: { role: 'athlete', active_plan_id: 'plan-1' }, error: null })
    expect(await nativeAccessForUser(client, 'user-1')).toMatchObject({ destination: '/checkout', entitled: false })
  })

  it('sends an entitled athlete to the dashboard', async () => {
    maybeSingleEntitlement.mockResolvedValue({
      data: { plan: 'athlete', status: 'active', period_ends_at: '2099-01-01T00:00:00.000Z' }, error: null,
    })
    expect(await nativeAccessForUser(client, 'user-1')).toMatchObject({ destination: '/dashboard', entitled: true })
  })
})
