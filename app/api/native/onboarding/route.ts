import { createClient } from '@/lib/supabase/server'
import { nativeAccessForUser } from '@/lib/native-access'
import { selectTrainingPlan } from '@/lib/training-plan-selection'

const RACE_DISTANCES = [
  'sprint', 'olimpico', 'half', 'full', '5k', '10k', 'medio_maraton', 'maraton', 'ultra', 'trail', 'ultra_trail',
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

type TrainingSession = {
  id: string
  week_number: number
  day_name: string
  sport_type: string
}

function sessionsForModality(sessions: TrainingSession[], modality: OnboardingInput['modality']) {
  return sessions.filter((session) => {
    const sport = session.sport_type.toLocaleLowerCase('es')
    if (modality === 'carrera' && (
      sport.includes('natacion') || sport.includes('swim') || sport.includes('ciclismo') ||
      sport.includes('bike') || sport.includes('transicion') || sport.includes('brick')
    )) return false
    if (modality === 'duatlon' && (sport.includes('natacion') || sport.includes('swim'))) return false
    if (modality === 'acuatlon' && (sport.includes('ciclismo') || sport.includes('bike'))) return false
    return true
  })
}

function mondayOfCurrentWeekUTC() {
  const now = new Date()
  const mondayOffset = (now.getUTCDay() + 6) % 7
  const daysUntilNextTrainingWeek = mondayOffset === 0 ? 0 : 7 - mondayOffset
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilNextTrainingWeek))
}

function scheduledDateForSession(startOfWeek: Date, session: TrainingSession) {
  const days: Record<string, number> = {
    lunes: 0, martes: 1, miercoles: 2, jueves: 3,
    viernes: 4, sabado: 5, domingo: 6,
  }
  const day = days[session.day_name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')] ?? 0
  const date = new Date(startOfWeek)
  date.setUTCDate(date.getUTCDate() + (Math.max(1, session.week_number) - 1) * 7 + day)
  return date.toISOString().slice(0, 10)
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

    const { data: rawSessions, error: sessionsError } = await supabase
      .from('training_sessions')
      .select('id, week_number, day_name, sport_type')
      .eq('plan_id', selectedPlan.id)
      .order('week_number', { ascending: true })
    if (sessionsError) return reply({ error: 'No se han podido cargar las sesiones del plan.' }, 503)
    const sessions = sessionsForModality((rawSessions || []) as TrainingSession[], input.modality)
    if (!sessions.length) return reply({ error: 'Esta plantilla aún no tiene entrenamientos compatibles.' }, 409)

    const weeklyBand = input.weeklyHours <= 6 ? '4-6h' : input.weeklyHours <= 11 ? '7-10h' : '12+h'
    const today = new Date().toISOString().slice(0, 10)
    const { data: previousWorkouts, error: previousWorkoutsError } = await supabase
      .from('user_workouts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gte('scheduled_date', today)
    if (previousWorkoutsError) return reply({ error: 'No se ha podido preparar tu calendario.' }, 503)

    const weekStart = mondayOfCurrentWeekUTC()
    const workoutInserts = sessions.map((session) => ({
      user_id: user.id,
      session_id: session.id,
      scheduled_date: scheduledDateForSession(weekStart, session),
      status: 'pending',
    }))
    const { data: insertedWorkouts, error: workoutsError } = await supabase
      .from('user_workouts')
      .insert(workoutInserts)
      .select('id')
    if (workoutsError || !insertedWorkouts?.length) return reply({ error: 'No se han podido guardar los entrenamientos en tu calendario.' }, 503)

    const { data: updatedProfiles, error: profileError } = await supabase.from('profiles').update({
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
    }).eq('id', user.id).select('id')
    if (profileError || !updatedProfiles?.length) {
      await supabase.from('user_workouts').delete().eq('user_id', user.id).in('id', insertedWorkouts.map((workout) => workout.id))
      return reply({ error: 'No se ha podido guardar tu perfil y el plan. Comprueba tu conexión e inténtalo de nuevo.' }, 503)
    }

    const previousIDs = (previousWorkouts || []).map((workout: { id: string }) => workout.id)
    if (previousIDs.length) {
      const { error: cleanupError } = await supabase.from('user_workouts').delete().eq('user_id', user.id).in('id', previousIDs)
      if (cleanupError) console.warn('No se pudieron retirar todos los entrenamientos pendientes sustituidos durante el onboarding')
    }

    const access = await nativeAccessForUser(supabase, user.id)
    return reply({
      success: true,
      preview: {
        name: selectedPlan.name,
        description: selectedPlan.description,
        durationWeeks: selectedPlan.duration_weeks,
        sessions: sessions
          .filter((session) => session.week_number === 1)
          .map((session) => ({ day: session.day_name.slice(0, 3), sport: session.sport_type })),
      },
      ...access,
    })
  } catch {
    return reply({ error: 'Servicio no disponible' }, 503)
  }
}
