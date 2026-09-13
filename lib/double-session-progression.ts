export type ProgressionWorkout = {
  scheduled_date: string
  status: 'pending' | 'completed' | 'missed' | string | null
  scheduled_slot?: string | null
  training_sessions?: { duration_min?: number | null; sport_type?: string | null } | null
}

export type ProgressionBiometric = {
  readiness_score?: number | null
  fatigue_rating?: number | null
}

export type DoubleSessionReadiness = {
  eligible: boolean
  hasDoubleSessionAlready: boolean
  adherence: number
  stableWeeks: number
  averageReadiness: number | null
  averageFatigue: number | null
  weeklyLoadChange: number | null
  reasons: string[]
}

const dateKey = (date: Date) => date.toISOString().slice(0, 10)

function mondayFor(dateString: string) {
  const date = new Date(`${dateString}T12:00:00Z`)
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - day + 1)
  return dateKey(date)
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null
}

/**
 * Conservative, deterministic gate for proposing—not silently applying—a second session.
 * The evaluator purposely requires four weeks of evidence and never accepts two hard
 * sessions as a consequence of being eligible. Scheduling remains a coach/plan decision.
 */
export function evaluateDoubleSessionReadiness(
  workouts: ProgressionWorkout[],
  biometrics: ProgressionBiometric[],
  painReported = false,
): DoubleSessionReadiness {
  const training = workouts.filter((workout) => workout.training_sessions?.sport_type !== 'descanso')
  const completed = training.filter((workout) => workout.status === 'completed').length
  const adherence = training.length ? Math.round((completed / training.length) * 100) : 0
  const hasDoubleSessionAlready = new Set(training.map((workout) => workout.scheduled_date)).size < training.length

  const weekly = new Map<string, { planned: number; completed: number; load: number }>()
  for (const workout of training) {
    const key = mondayFor(workout.scheduled_date)
    const current = weekly.get(key) || { planned: 0, completed: 0, load: 0 }
    current.planned += 1
    current.completed += workout.status === 'completed' ? 1 : 0
    current.load += workout.training_sessions?.duration_min || 0
    weekly.set(key, current)
  }

  const weeks = [...weekly.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-4)
  const stableWeeks = weeks.filter(([, week]) => week.planned >= 3 && week.completed / week.planned >= 0.85).length
  const currentLoad = weeks.at(-1)?.[1].load ?? 0
  const priorLoads = weeks.slice(0, -1).map(([, week]) => week.load).filter(Boolean)
  const priorAverage = average(priorLoads)
  const weeklyLoadChange = priorAverage && priorAverage > 0
    ? Math.round(((currentLoad - priorAverage) / priorAverage) * 100)
    : null

  const averageReadiness = average(
    biometrics.map((entry) => entry.readiness_score).filter((value): value is number => typeof value === 'number'),
  )
  const averageFatigue = average(
    biometrics.map((entry) => entry.fatigue_rating).filter((value): value is number => typeof value === 'number'),
  )

  const reasons: string[] = []
  if (hasDoubleSessionAlready) reasons.push('Ya hay dos sesiones previstas en al menos un día.')
  if (weeks.length < 4 || stableWeeks < 3) reasons.push('Necesitamos tres de las últimas cuatro semanas con buena continuidad.')
  if (adherence < 85) reasons.push('La adherencia reciente debe ser al menos del 85%.')
  if (averageReadiness === null || averageReadiness < 70) reasons.push('La recuperación media debe mantenerse en 70 o más.')
  if (averageFatigue === null || averageFatigue > 3) reasons.push('La fatiga media debe mantenerse en 3 o menos.')
  if (painReported) reasons.push('Hay una señal de dolor o lesión pendiente de revisar.')
  if (weeklyLoadChange !== null && weeklyLoadChange > 10) reasons.push('La carga de esta semana ya ha subido más de un 10%.')

  return {
    eligible: reasons.length === 0,
    hasDoubleSessionAlready,
    adherence,
    stableWeeks,
    averageReadiness,
    averageFatigue,
    weeklyLoadChange,
    reasons,
  }
}
