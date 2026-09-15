import { describe, expect, it } from 'vitest'
import { derivePlanSignals, inferIntensity, normalizePlanWorkout, planVersion } from './normalize'

describe('adaptive plan normalization', () => {
  it('classifies intensity conservatively from structured session wording', () => {
    expect(inferIntensity('6 x 800 m VO2', 60)).toBe('hard')
    expect(inferIntensity('Rodaje suave Z2', 45)).toBe('easy')
    expect(inferIntensity('Ciclismo continuo', 90)).toBe('moderate')
    expect(inferIntensity(null, 0)).toBe('unknown')
  })

  it('normalizes legacy workout values without inventing planned load', () => {
    expect(normalizePlanWorkout({
      id: 'one', scheduled_date: '2026-09-15', scheduled_slot: null, status: 'planned',
      training_sessions: [{ sport_type: 'Carrera', duration_min: 45, description: 'Rodaje suave' }],
    })).toMatchObject({ slot: 'flexible', status: 'pending', sport: 'carrera', durationMinutes: 45, plannedTss: null, intensity: 'easy' })
  })

  it('derives evidence without treating missing biometrics as positive', () => {
    const workouts = ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07'].flatMap((monday, index) => [0, 2, 4].map((offset) => {
      const date = new Date(`${monday}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + offset)
      return normalizePlanWorkout({ id: `${index}-${offset}`, scheduled_date: date.toISOString().slice(0, 10), status: 'completed', training_sessions: { sport_type: 'carrera', duration_min: 45, description: 'Rodaje Z2' } })
    }))
    const result = derivePlanSignals({ today: '2026-09-15', hasCoach: false, workouts, biometrics: [], feedback: [] })
    expect(result).toMatchObject({ adherence: 100, stableWeeks: 4, averageReadiness: null, averageFatigue: null, authority: 'self' })
    expect(result.priorWeeklyLoad).toBeGreaterThan(0)
  })

  it('detects coach authority and safety feedback', () => {
    const result = derivePlanSignals({
      today: '2026-09-15', hasCoach: true, workouts: [],
      biometrics: [{ readiness_score: 62, fatigue_rating: 4 }],
      feedback: [{ pain_localized: true, feeling: 'lesionado' }],
    })
    expect(result).toMatchObject({ authority: 'coach', painReported: true, injured: true, averageReadiness: 62, averageFatigue: 4 })
  })

  it('uses the newest workout update as the plan version', () => {
    expect(planVersion([
      { id: 'a', scheduled_date: '2026-09-15', updated_at: '2026-09-15T08:00:00Z' },
      { id: 'b', scheduled_date: '2026-09-16', updated_at: '2026-09-15T09:00:00Z' },
    ])).toBe('2026-09-15T09:00:00Z')
  })
})
