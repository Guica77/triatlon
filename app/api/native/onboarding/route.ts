import { createClient } from '@/lib/supabase/server'
import { nativeAccessForUser } from '@/lib/native-access'
import { selectTrainingPlan } from '@/lib/training-plan-selection'

const RACE_DISTANCES = [
  'sprint', 'olimpico', 'half', 'full', '5k', '10k', 'medio_maraton', 'maraton', 'ultra',
] as const

type RaceDistance = typeof RACE_DISTANCES[number]

function isRaceDistance(value: unknown): value is RaceDistance {
  return typeof value === 'string' && RACE_DISTANCES.includes(value as RaceDistance)
}

function isISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' },
})

type OnboardingInput = {
  goal: string
  targetRaceDistance: RaceDistance
  targetRaceDate: string | null
  modality: 'triatlon' | 'carrera' | 'duatlon' | 'acuatlon'
  level: 'principiante' | 'intermedio' | 'avanzado'
  weeklyHours: number
  wantsCoach: boolean
  previousInjuries?: string
  healthDataConsent: boolean
}

function inputFrom(value: unknown): OnboardingInput | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const targetRaceDistance = isRaceDistance(raw.targetRaceDistance) ? raw.targetRaceDistance : null
  const modality = ['triatlon', 'carrera', 'duatlon', 'acuatlon'].includes(raw.modality as string) ? raw.modality as OnboardingInput['modality'] : null
  const level = ['principiante', 'intermedio', 'avanzado'].includes(raw.level as string) ? raw.level as OnboardingInput['level'] : null
  const weeklyHours = typeof raw.weeklyHours === 'number' ? raw.weeklyHours : NaN
  const targetRaceDate = raw.targetRaceDate === null || raw.targetRaceDate === undefined || raw.targetRaceDate === ''
    ? null
    : isISODate(raw.targetRaceDate)
      ? raw.targetRaceDate
      : undefined
  const healthDataConsent = raw.healthDataConsent === true
  if (!targetRaceDistance || !modality || !level || targetRaceDate === undefined || (targetRaceDate !== null && targetRaceDate < new Date().toISOString().slice(0, 10)) || typeof raw.goal !== 'string' || raw.goal.trim().length < 2 || raw.goal.trim().length > 120 || !Number.isFinite(weeklyHours) || weeklyHours < 2 || weeklyHours > 30 || typeof raw.wantsCoach !== 'boolean' || typeof raw.healthDataConsent !== 'boolean') return null
  const injuries = typeof raw.previousInjuries === 'string' ? raw.previousInjuries.trim().slice(0, 1000) : undefined
  if (injuries && !healthDataConsent) return null
  return { goal: raw.goal.trim(), targetRaceDistance, targetRaceDate, modality, level, weeklyHours, wantsCoach: raw.wantsCoach, previousInjuries: injuries, healthDataConsent }
}

function suggestedSessions(modality: OnboardingInput['modality'], weeklyHours: number) {
  const schedule = {
    triatlon: [{ day: 'Lun', sport: 'natacion' }, { day: 'Mié', sport: 'ciclismo' }, { day: 'Vie', sport: 'carrera' }, { day: 'Dom', sport: 'transicion' }],
    carrera: [{ day: 'Mar', sport: 'carrera' }, { day: 'Jue', sport: 'carrera' }, { day: 'Sáb', sport: 'carrera' }, { day: 'Dom', sport: 'fuerza' }],
    duatlon: [{ day: 'Mar', sport: 'carrera' }, { day: 'Jue', sport: 'ciclismo' }, { day: 'Sáb', sport: 'carrera' }, { day: 'Dom', sport: 'transicion' }],
    acuatlon: [{ day: 'Mar', sport: 'natacion' }, { day: 'Jue', sport: 'carrera' }, { day: 'Sáb', sport: 'natacion' }, { day: 'Dom', sport: 'transicion' }],
  }[modality]
  return weeklyHours <= 6 ? schedule.slice(0, 3) : schedule
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (request.headers.get('x-triwavex-native') !== '1' ||
      request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' ||
      (origin !== null && origin !== new URL(request.url).origin)) return reply({ error: 'Solicitud no permitida' }, 403)

  try {
    const body = await request.text()
    if (body.length > 8192) return reply({ error: 'Solicitud demasiado grande' }, 413)
    let value: unknown
    try { value = JSON.parse(body) } catch { return reply({ error: 'Solicitud inválida' }, 400) }
    const input = inputFrom(value)
    if (!input) return reply({ error: 'Revisa los datos de tu plan.' }, 400)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)
    const { data: plans, error: plansError } = await supabase
      .from('training_plans')
      .select('id, name, description, distance, duration_weeks, level')
    if (plansError) return reply({ error: 'No se han podido cargar los planes.' }, 503)
    const selectedPlan = selectTrainingPlan(plans, input.targetRaceDistance, input.level)
    if (!selectedPlan) return reply({ error: 'No hay un plan compatible disponible todavía.' }, 409)

    const weeklyBand = input.weeklyHours <= 6 ? '4-6h' : input.weeklyHours <= 11 ? '7-10h' : '12+h'
    const { error: profileError } = await supabase.from('profiles').update({
      level: input.level,
      active_plan_id: selectedPlan.id,
      target_race_name: input.goal,
      target_race_date: input.targetRaceDate,
      target_race_distance: input.targetRaceDistance,
      target_race_modality: input.modality,
      baseline_training_hours: weeklyBand,
      swim_weekly_hours: input.modality === 'carrera' || input.modality === 'duatlon' ? 0 : Math.max(1, Math.round(input.weeklyHours * 0.2)),
      bike_weekly_hours: input.modality === 'carrera' || input.modality === 'acuatlon' ? 0 : Math.max(1, Math.round(input.weeklyHours * 0.45)),
      run_weekly_hours: Math.max(1, Math.round(input.weeklyHours * 0.35)),
      previous_injuries: input.previousInjuries || null,
      health_data_consent_at: input.healthDataConsent ? new Date().toISOString() : null,
    }).eq('id', user.id)
    if (profileError) return reply({ error: 'No se ha podido guardar tu perfil.' }, 503)

    const access = await nativeAccessForUser(supabase, user.id)
    return reply({
      success: true,
      preview: {
        name: selectedPlan.name,
        description: selectedPlan.description,
        durationWeeks: selectedPlan.duration_weeks,
        sessions: suggestedSessions(input.modality, input.weeklyHours),
      },
      ...access,
    })
  } catch {
    return reply({ error: 'Servicio no disponible' }, 503)
  }
}
