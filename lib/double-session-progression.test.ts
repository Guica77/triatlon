import { describe, expect, it } from 'vitest'
import { evaluateDoubleSessionReadiness } from './double-session-progression'

const completedWeek = (monday: string) => [0, 2, 4].map((offset) => {
  const date = new Date(`${monday}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return {
    scheduled_date: date.toISOString().slice(0, 10),
    status: 'completed',
    training_sessions: { sport_type: 'ciclismo', duration_min: 60 },
  }
})

describe('evaluateDoubleSessionReadiness', () => {
  it('proposes a double session only after stable, well-recovered progression', () => {
    const workouts = ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07'].flatMap(completedWeek)
    const result = evaluateDoubleSessionReadiness(
      workouts,
      [{ readiness_score: 78, fatigue_rating: 2 }, { readiness_score: 76, fatigue_rating: 2 }],
    )

    expect(result.eligible).toBe(true)
    expect(result.adherence).toBe(100)
    expect(result.stableWeeks).toBe(4)
  })

  it('does not propose more load when recovery or pain indicates risk', () => {
    const workouts = ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07'].flatMap(completedWeek)
    const result = evaluateDoubleSessionReadiness(
      workouts,
      [{ readiness_score: 54, fatigue_rating: 5 }],
      true,
    )

    expect(result.eligible).toBe(false)
    expect(result.reasons).toHaveLength(3)
  })
})
