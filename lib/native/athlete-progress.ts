export type NativeWorkoutRow = {
  id: string
  scheduled_date: string
  completed_at: string | null
  actual_tss: number | null
  status: string | null
  training_sessions?: {
    sport_type: string | null
    duration_min: number | null
    description: string | null
  } | null
  universal_telemetry?: Array<{
    actual_distance_km: number | null
    actual_duration_min: number | null
    actual_tss: number | null
  }> | null
}

export type NativeBiometricsRow = {
  date: string
  readiness_score: number | null
  hrv: number | null
  sleep_hours: number | null
  fatigue_rating: number | null
}

export type NativeAthleteProgress = {
  athlete: { firstName: string }
  recovery: {
    date: string | null
    readinessScore: number | null
    hrv: number | null
    sleepHours: number | null
    fatigueRating: number | null
  }
  todayWorkout: {
    id: string
    date: string
    sport: string
    durationMinutes: number
    description: string | null
    status: string | null
    completed: boolean
  } | null
  week: {
    startDate: string
    endDate: string
    plannedSessions: number
    completedSessions: number
    completionPercent: number
    totalTss: number
    totalMinutes: number
  }
  summary: {
    completedSessions: number
    totalTss: number
    totalMinutes: number
    distanceKm: { swim: number; bike: number; run: number }
    tssBySport: { swim: number; bike: number; run: number }
    streakWeeks: number
  }
  state: 'ready' | 'empty'
  generatedAt: string
}

type NativeProfile = { first_name: string | null }

type Sport = 'natacion' | 'ciclismo' | 'carrera'

const SPORT_KEYS: Record<Sport, keyof NativeAthleteProgress['summary']['distanceKm']> = {
  natacion: 'swim',
  ciclismo: 'bike',
  carrera: 'run',
}

function asPositiveNumber(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

function estimateTss(durationMin: number | null | undefined): number {
  const duration = asPositiveNumber(durationMin)
  return duration > 0 ? Math.round((duration / 60) * Math.pow(0.75, 2) * 100) : 0
}

function workoutTss(workout: NativeWorkoutRow): number {
  const actualTss = asPositiveNumber(workout.actual_tss)
  if (actualTss > 0) return actualTss
  const telemetryTss = asPositiveNumber(workout.universal_telemetry?.[0]?.actual_tss)
  return telemetryTss > 0 ? telemetryTss : estimateTss(workout.training_sessions?.duration_min)
}

function workoutMinutes(workout: NativeWorkoutRow): number {
  const telemetryMinutes = asPositiveNumber(workout.universal_telemetry?.[0]?.actual_duration_min)
  return telemetryMinutes > 0 ? telemetryMinutes : asPositiveNumber(workout.training_sessions?.duration_min)
}

function workoutDistanceKm(workout: NativeWorkoutRow, sport: Sport): number {
  const telemetryDistance = asPositiveNumber(workout.universal_telemetry?.[0]?.actual_distance_km)
  if (telemetryDistance > 0) return telemetryDistance

  const duration = asPositiveNumber(workout.training_sessions?.duration_min)
  if (sport === 'natacion') return (duration * 40) / 1000
  if (sport === 'ciclismo') return duration * 0.4
  return duration * 0.2
}

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function startOfWeek(date: Date): Date {
  const result = new Date(date)
  const day = result.getUTCDay() || 7
  result.setUTCDate(result.getUTCDate() - day + 1)
  return result
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function isTrainingWorkout(workout: NativeWorkoutRow): boolean {
  return workout.training_sessions?.sport_type !== 'descanso'
}

function normalizedSport(value: string | null | undefined): Sport | null {
  const sport = value?.toLowerCase()
  return sport === 'natacion' || sport === 'ciclismo' || sport === 'carrera' ? sport : null
}

export function buildNativeAthleteProgress({
  profile,
  workouts,
  biometrics,
  now = new Date(),
}: {
  profile: NativeProfile
  workouts: NativeWorkoutRow[]
  biometrics: NativeBiometricsRow | null
  now?: Date
}): NativeAthleteProgress {
  const today = dateString(now)
  const monday = startOfWeek(now)
  const sunday = addDays(monday, 6)
  const weekStart = dateString(monday)
  const weekEnd = dateString(sunday)
  const weeklyWorkouts = workouts.filter((workout) => workout.scheduled_date >= weekStart && workout.scheduled_date <= weekEnd)
  const plannedWorkouts = weeklyWorkouts.filter(isTrainingWorkout)
  const completedWorkouts = plannedWorkouts.filter((workout) => workout.status === 'completed')
  const completionPercent = plannedWorkouts.length > 0
    ? Math.round((completedWorkouts.length / plannedWorkouts.length) * 100)
    : 0

  const distanceKm = { swim: 0, bike: 0, run: 0 }
  const tssBySport = { swim: 0, bike: 0, run: 0 }
  let totalTss = 0
  let totalMinutes = 0

  for (const workout of completedWorkouts) {
    const tss = workoutTss(workout)
    totalTss += tss
    totalMinutes += workoutMinutes(workout)
    const sport = normalizedSport(workout.training_sessions?.sport_type)
    if (sport) {
      const key = SPORT_KEYS[sport]
      tssBySport[key] += tss
      distanceKm[key] += workoutDistanceKm(workout, sport)
    }
  }

  let streakWeeks = 0
  for (let offset = 0; offset < 52; offset += 1) {
    const end = addDays(sunday, -(offset * 7))
    const start = addDays(end, -6)
    const startString = dateString(start)
    const endString = dateString(end)
    const weekWorkouts = workouts.filter((workout) =>
      isTrainingWorkout(workout) && workout.scheduled_date >= startString && workout.scheduled_date <= endString,
    )
    if (weekWorkouts.length === 0) break
    const completed = weekWorkouts.filter((workout) => workout.status === 'completed').length
    if (completed >= weekWorkouts.length * 0.7) streakWeeks += 1
    else break
  }

  const todayWorkout = weeklyWorkouts.find((workout) =>
    workout.scheduled_date === today && isTrainingWorkout(workout),
  )
  const hasData = Boolean(
    biometrics || todayWorkout || plannedWorkouts.length || completedWorkouts.length,
  )

  return {
    athlete: { firstName: profile.first_name?.trim() || 'Triatleta' },
    recovery: {
      date: biometrics?.date || null,
      readinessScore: biometrics?.readiness_score ?? null,
      hrv: biometrics?.hrv ?? null,
      sleepHours: biometrics?.sleep_hours ?? null,
      fatigueRating: biometrics?.fatigue_rating ?? null,
    },
    todayWorkout: todayWorkout ? {
      id: todayWorkout.id,
      date: todayWorkout.scheduled_date,
      sport: todayWorkout.training_sessions?.sport_type || 'entrenamiento',
      durationMinutes: Math.round(workoutMinutes(todayWorkout)),
      description: todayWorkout.training_sessions?.description || null,
      status: todayWorkout.status,
      completed: todayWorkout.status === 'completed',
    } : null,
    week: {
      startDate: weekStart,
      endDate: weekEnd,
      plannedSessions: plannedWorkouts.length,
      completedSessions: completedWorkouts.length,
      completionPercent,
      totalTss: Math.round(totalTss),
      totalMinutes: Math.round(totalMinutes),
    },
    summary: {
      completedSessions: completedWorkouts.length,
      totalTss: Math.round(totalTss),
      totalMinutes: Math.round(totalMinutes),
      distanceKm: {
        swim: Number(distanceKm.swim.toFixed(1)),
        bike: Number(distanceKm.bike.toFixed(1)),
        run: Number(distanceKm.run.toFixed(1)),
      },
      tssBySport: {
        swim: Math.round(tssBySport.swim),
        bike: Math.round(tssBySport.bike),
        run: Math.round(tssBySport.run),
      },
      streakWeeks,
    },
    state: hasData ? 'ready' : 'empty',
    generatedAt: new Date().toISOString(),
  }
}

export function nativeProgressDateRange(now = new Date()): { start: string; end: string } {
  const monday = startOfWeek(now)
  return { start: dateString(addDays(monday, -364)), end: dateString(addDays(monday, 6)) }
}
