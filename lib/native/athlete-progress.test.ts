import { describe, expect, it } from 'vitest'
import { buildNativeAthleteProgress, nativeProgressDateRange, type NativeWorkoutRow } from './athlete-progress'

const now = new Date('2026-09-10T12:00:00Z')
const workout = (overrides: Partial<NativeWorkoutRow> = {}): NativeWorkoutRow => ({
  id: crypto.randomUUID(), scheduled_date: '2026-09-10', completed_at: null,
  actual_tss: null, status: 'planned',
  training_sessions: { sport_type: 'ciclismo', duration_min: 60, description: 'Rodaje' },
  universal_telemetry: null, ...overrides,
})

describe('buildNativeAthleteProgress', () => {
  it('uses actual, telemetry, and estimated TSS in that order', () => {
    const result = buildNativeAthleteProgress({
      profile: { first_name: 'Ana' }, biometrics: null, now,
      workouts: [
        workout({ id: 'actual', actual_tss: 99, status: 'completed' }),
        workout({ id: 'telemetry', actual_tss: null, status: 'completed', universal_telemetry: [{ actual_distance_km: 20, actual_duration_min: 70, actual_tss: 77 }] }),
        workout({ id: 'estimated', actual_tss: null, status: 'completed', training_sessions: { sport_type: 'carrera', duration_min: 60, description: null } }),
      ],
    })
    expect(result.week.totalTss).toBe(99 + 77 + 56)
    expect(result.week.totalMinutes).toBe(60 + 70 + 60)
    expect(result.summary.tssBySport).toEqual({ swim: 0, bike: 176, run: 56 })
  })

  it('uses telemetry distance and duration, with duration-based distance fallback', () => {
    const result = buildNativeAthleteProgress({
      profile: { first_name: 'Ana' }, biometrics: null, now,
      workouts: [
        workout({ id: 'swim', status: 'completed', training_sessions: { sport_type: 'natacion', duration_min: 50, description: null } }),
        workout({ id: 'bike', status: 'completed', universal_telemetry: [{ actual_distance_km: 32.5, actual_duration_min: 80, actual_tss: null }] }),
        workout({ id: 'run', status: 'completed', training_sessions: { sport_type: 'carrera', duration_min: 30, description: null } }),
      ],
    })
    expect(result.summary.distanceKm).toEqual({ swim: 2, bike: 32.5, run: 6 })
    expect(result.summary.totalMinutes).toBe(50 + 80 + 30)
  })

  it('excludes rest sessions and calculates the weekly completion percentage', () => {
    const result = buildNativeAthleteProgress({
      profile: { first_name: 'Ana' }, biometrics: null, now,
      workouts: [
        workout({ id: 'done', status: 'completed' }),
        workout({ id: 'planned', status: 'planned' }),
        workout({ id: 'rest', status: 'planned', training_sessions: { sport_type: 'descanso', duration_min: null, description: null } }),
      ],
    })
    expect(result.week).toMatchObject({ plannedSessions: 2, completedSessions: 1, completionPercent: 50 })
  })

  it('returns today workout, recovery, empty state, and fallback athlete name', () => {
    const empty = buildNativeAthleteProgress({ profile: { first_name: ' ' }, workouts: [], biometrics: null, now })
    expect(empty.state).toBe('empty')
    expect(empty.athlete.firstName).toBe('Triatleta')

    const ready = buildNativeAthleteProgress({
      profile: { first_name: null }, now,
      biometrics: { date: '2026-09-10', readiness_score: 82, hrv: 55, sleep_hours: 7.5, fatigue_rating: 2 },
      workouts: [workout({ id: 'today', status: 'completed' })],
    })
    expect(ready.state).toBe('ready')
    expect(ready.todayWorkout).toMatchObject({ id: 'today', completed: true, date: '2026-09-10' })
    expect(ready.recovery).toMatchObject({ readinessScore: 82, hrv: 55 })
  })

  it('counts consecutive weeks at 70 percent or better', () => {
    const currentWeek = [workout({ id: 'current', status: 'completed' })]
    const priorWeek = [
      ...Array.from({ length: 7 }, (_, index) => workout({
        id: `prior-done-${index}`,
        scheduled_date: index < 6 ? '2026-08-31' : '2026-09-01',
        status: 'completed',
      })),
      ...Array.from({ length: 3 }, (_, index) => workout({
        id: `prior-planned-${index}`,
        scheduled_date: '2026-09-02',
        status: 'planned',
      })),
    ]
    const result = buildNativeAthleteProgress({ profile: { first_name: 'Ana' }, biometrics: null, now, workouts: [...currentWeek, ...priorWeek] })
    expect(result.summary.streakWeeks).toBe(2)
  })
})

describe('nativeProgressDateRange', () => {
  it('covers the prior 52 weeks through the current Sunday', () => {
    expect(nativeProgressDateRange(now)).toEqual({ start: '2025-09-08', end: '2026-09-13' })
  })
})
