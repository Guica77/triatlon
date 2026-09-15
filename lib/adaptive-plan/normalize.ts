import type { PlanSignals, PlanWorkout, WorkoutIntensity, WorkoutSlot, WorkoutStatus } from './types'

type SessionRow = {
  sport_type?: string | null
  duration_min?: number | null
  description?: string | null
  structured_blocks?: unknown
}

export type WorkoutRow = {
  id: string
  scheduled_date: string
  scheduled_slot?: string | null
  status?: string | null
  actual_tss?: number | null
  updated_at?: string | null
  training_sessions?: SessionRow | SessionRow[] | null
}

export type BiometricRow = {
  readiness_score?: number | null
  fatigue_rating?: number | null
}

export type FeedbackRow = {
  pain_localized?: boolean | null
  feeling?: string | null
}

const hardTerms = /\b(interval|intervalos|umbral|threshold|tempo|series|repeticiones|vo2|z4|z5|race pace|ritmo de carrera)\b/i
const easyTerms = /\b(recuperaci[oó]n|suave|easy|z1|z2|t[eé]cnica|movilidad)\b/i

function firstSession(value: WorkoutRow['training_sessions']) {
  return Array.isArray(value) ? value[0] : value
}

function finiteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function inferIntensity(description: string | null | undefined, durationMinutes: number): WorkoutIntensity {
  const text = description?.trim() ?? ''
  if (hardTerms.test(text)) return 'hard'
  if (easyTerms.test(text)) return 'easy'
  if (text || durationMinutes > 0) return 'moderate'
  return 'unknown'
}

export function normalizePlanWorkout(row: WorkoutRow): PlanWorkout {
  const session = firstSession(row.training_sessions)
  const durationMinutes = Math.max(0, Math.round(finiteNumber(session?.duration_min) ?? 0))
  const sport = session?.sport_type?.trim().toLowerCase() || 'descanso'
  const slot: WorkoutSlot = row.scheduled_slot === 'morning' || row.scheduled_slot === 'evening'
    ? row.scheduled_slot
    : 'flexible'
  const status: WorkoutStatus = row.status === 'completed' || row.status === 'missed' ? row.status : 'pending'
  return {
    id: row.id,
    date: row.scheduled_date,
    slot,
    status,
    sport,
    durationMinutes,
    plannedTss: null,
    intensity: sport === 'descanso' ? 'easy' : inferIntensity(session?.description, durationMinutes),
    isBrick: sport === 'brick',
  }
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
}

function mondayFor(value: string) {
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  const weekday = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - weekday + 1)
  return date.toISOString().slice(0, 10)
}

function estimatedLoad(workout: PlanWorkout) {
  const factor = workout.intensity === 'hard' ? 0.9 : workout.intensity === 'moderate' ? 0.75 : 0.6
  return workout.plannedTss ?? Math.round((workout.durationMinutes / 60) * factor * factor * 100)
}

export function derivePlanSignals(input: {
  today: string
  hasCoach: boolean
  workouts: PlanWorkout[]
  biometrics: BiometricRow[]
  feedback: FeedbackRow[]
}): PlanSignals {
  const historical = input.workouts.filter((workout) => workout.date < input.today && workout.sport !== 'descanso')
  const completed = historical.filter((workout) => workout.status === 'completed').length
  const adherence = historical.length ? Math.round((completed / historical.length) * 100) : null
  const weeks = new Map<string, { planned: number; completed: number; load: number }>()
  for (const workout of historical) {
    const week = mondayFor(workout.date)
    if (!week) continue
    const value = weeks.get(week) ?? { planned: 0, completed: 0, load: 0 }
    value.planned += 1
    value.completed += workout.status === 'completed' ? 1 : 0
    value.load += estimatedLoad(workout)
    weeks.set(week, value)
  }
  const recentWeeks = [...weeks.entries()].sort(([left], [right]) => left.localeCompare(right)).slice(-4)
  const stableWeeks = recentWeeks.filter(([, week]) => week.planned >= 3 && week.completed / week.planned >= 0.85).length
  const completedLoads = recentWeeks.map(([, week]) => week.load).filter((load) => load > 0)
  const readiness = input.biometrics.map((row) => finiteNumber(row.readiness_score)).filter((value): value is number => value !== null)
  const fatigue = input.biometrics.map((row) => finiteNumber(row.fatigue_rating)).filter((value): value is number => value !== null)
  const injured = input.feedback.some((row) => row.feeling?.toLowerCase() === 'lesionado')
  const painReported = input.feedback.some((row) => row.pain_localized === true)
  return {
    today: input.today,
    authority: input.hasCoach ? 'coach' : 'self',
    painReported,
    injured,
    averageReadiness: average(readiness),
    averageFatigue: average(fatigue),
    adherence,
    stableWeeks,
    priorWeeklyLoad: average(completedLoads),
  }
}

export function planVersion(rows: WorkoutRow[]) {
  return rows.reduce<string | null>((latest, row) => {
    if (!row.updated_at) return latest
    return latest === null || row.updated_at > latest ? row.updated_at : latest
  }, null)
}
