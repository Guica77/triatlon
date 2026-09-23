import { beforeEach, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/native/onboarding/route'

const { getUser, selectPlans, updateProfile, updateEq, nativeAccessForUser } = vi.hoisted(() => ({
  getUser: vi.fn(), selectPlans: vi.fn(), updateProfile: vi.fn(), updateEq: vi.fn(), nativeAccessForUser: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser },
  from: (table: string) => table === 'training_plans'
    ? { select: selectPlans }
    : { update: updateProfile },
}) }))
vi.mock('@/lib/native-access', () => ({ nativeAccessForUser }))

const request = (body: object) => new Request('https://triwavex.test/api/native/onboarding', {
  method: 'POST', body: JSON.stringify(body),
  headers: { 'content-type': 'application/json', 'x-triwavex-native': '1' },
})

const validInput = {
  goal: 'Mi próximo 70.3', targetRaceDistance: 'half', modality: 'triatlon',
  level: 'intermedio', weeklyHours: 8, wantsCoach: false, previousInjuries: '',
  targetRaceDate: null, healthDataConsent: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: { id: 'athlete-id' } } })
  selectPlans.mockResolvedValue({ data: [{ id: 'plan-id', name: '70.3 Intermedio', description: 'Plan progresivo', distance: '70.3', duration_weeks: 16, level: 'intermedio' }], error: null })
  updateProfile.mockReturnValue({ eq: updateEq })
  updateEq.mockResolvedValue({ error: null })
  nativeAccessForUser.mockResolvedValue({ destination: '/onboarding', userID: 'athlete-id', role: 'athlete', entitled: false })
})

it('requires the distance needed to create an initial plan', async () => {
  const { targetRaceDistance: _, ...withoutDistance } = validInput
  expect((await POST(request(withoutDistance))).status).toBe(400)
  expect(selectPlans).not.toHaveBeenCalled()
})

it('returns a plan preview and stores the compatible active plan', async () => {
  const response = await POST(request(validInput))
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({
    success: true,
    preview: {
      name: '70.3 Intermedio',
      sessions: [
        { day: 'Lun', sport: 'natacion' }, { day: 'Mié', sport: 'ciclismo' },
        { day: 'Vie', sport: 'carrera' }, { day: 'Dom', sport: 'transicion' },
      ],
    },
  })
  expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ active_plan_id: 'plan-id', target_race_distance: 'half', target_race_date: null, health_data_consent_at: null }))
})

it('does not accept health answers without explicit consent', async () => {
  const response = await POST(request({ ...validInput, previousInjuries: 'Lesión de rodilla' }))
  expect(response.status).toBe(400)
  expect(updateProfile).not.toHaveBeenCalled()
})

it('records consent and keeps an explicitly selected race date', async () => {
  const response = await POST(request({ ...validInput, targetRaceDate: '2027-05-16', previousInjuries: 'Lesión de rodilla', healthDataConsent: true }))
  expect(response.status).toBe(200)
  expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ target_race_date: '2027-05-16', previous_injuries: 'Lesión de rodilla', health_data_consent_at: expect.any(String) }))
})

it('rejects invalid or past race dates', async () => {
  expect((await POST(request({ ...validInput, targetRaceDate: '2027-02-30' }))).status).toBe(400)
  expect((await POST(request({ ...validInput, targetRaceDate: '2020-01-01' }))).status).toBe(400)
  expect(updateProfile).not.toHaveBeenCalled()
})
