import { describe, expect, it } from 'vitest'
import { evaluateLoadIncrease, evaluateMove } from './rules'
import type { PlanSignals, PlanWorkout } from './types'

const signals: PlanSignals = {
  today: '2026-09-15', authority: 'self', painReported: false, injured: false,
  averageReadiness: 78, averageFatigue: 2, adherence: 92, stableWeeks: 4, priorWeeklyLoad: 400,
}

const workout = (overrides: Partial<PlanWorkout> = {}): PlanWorkout => ({
  id: 'run', date: '2026-09-15', slot: 'morning', status: 'pending', sport: 'carrera',
  durationMinutes: 60, plannedTss: 70, intensity: 'hard', isBrick: false, ...overrides,
})

describe('adaptive plan move rules', () => {
  it('accepts a safe move but still requires confirmation', () => {
    const result = evaluateMove([workout()], { kind: 'move', workoutId: 'run', targetDate: '2026-09-18', targetSlot: 'morning' }, signals)
    expect(result.decision).toBe('safe')
    expect(result.requiresConfirmation).toBe(true)
  })

  it('recommends a nearby safe date when hard sessions would be consecutive', () => {
    const workouts = [workout(), workout({ id: 'bike', date: '2026-09-18', sport: 'ciclismo' })]
    const result = evaluateMove(workouts, { kind: 'move', workoutId: 'run', targetDate: '2026-09-17', targetSlot: 'morning' }, signals)
    expect(result.decision).toBe('recommendation')
    expect(result.reasons.map((entry) => entry.code)).toContain('hard_sessions_too_close')
    expect(result.alternative?.date).toBe('2026-09-16')
  })

  it('recommends another date for an occupied slot', () => {
    const workouts = [workout(), workout({ id: 'swim', date: '2026-09-18', intensity: 'easy' })]
    const result = evaluateMove(workouts, { kind: 'move', workoutId: 'run', targetDate: '2026-09-18', targetSlot: 'morning' }, signals)
    expect(result.decision).toBe('recommendation')
    expect(result.reasons.map((entry) => entry.code)).toContain('slot_conflict')
    expect(result.alternative).not.toBeNull()
  })

  it('blocks completed sessions and dates outside the editable horizon', () => {
    expect(evaluateMove([workout({ status: 'completed' })], { kind: 'move', workoutId: 'run', targetDate: '2026-09-18', targetSlot: 'morning' }, signals).decision).toBe('blocked')
    expect(evaluateMove([workout()], { kind: 'move', workoutId: 'run', targetDate: '2026-11-30', targetSlot: 'morning' }, signals).reasons[0].code).toBe('outside_editable_horizon')
  })

  it('routes coach-managed plans to coach review without running adaptive choices', () => {
    const result = evaluateMove([workout()], { kind: 'move', workoutId: 'run', targetDate: '2026-09-18', targetSlot: 'morning' }, { ...signals, authority: 'coach' })
    expect(result.decision).toBe('coach_review')
    expect(result.alternative).toBeNull()
  })

  it('blocks a move that would exceed weekly load growth', () => {
    const workouts = [workout(), workout({ id: 'bike', date: '2026-09-21', plannedTss: 110 }), workout({ id: 'swim', date: '2026-09-22', plannedTss: 110, intensity: 'easy' })]
    const result = evaluateMove(workouts, { kind: 'move', workoutId: 'run', targetDate: '2026-09-23', targetSlot: 'evening' }, { ...signals, priorWeeklyLoad: 200 })
    expect(result.decision).toBe('blocked')
    expect(result.reasons.map((entry) => entry.code)).toContain('weekly_load_growth')
  })
})

describe('adaptive load increase rules', () => {
  it('proposes only a confirmed increase within ten percent', () => {
    const result = evaluateLoadIncrease(workout({ intensity: 'easy' }), 66, signals)
    expect(result).toMatchObject({ eligible: true, suggestedDurationMinutes: 66, requiresConfirmation: true })
  })

  it.each([
    [{ painReported: true }, 'pain_or_injury'],
    [{ averageReadiness: 58 }, 'recovery_too_low'],
    [{ stableWeeks: 2 }, 'insufficient_evidence'],
    [{ authority: 'coach' as const }, 'coach_controls_plan'],
  ])('rejects an increase when %s', (overrides, code) => {
    const result = evaluateLoadIncrease(workout({ intensity: 'easy' }), 66, { ...signals, ...overrides })
    expect(result.eligible).toBe(false)
    expect(result.reasons.map((entry) => entry.code)).toContain(code)
  })

  it('rejects increases above ten percent', () => {
    const result = evaluateLoadIncrease(workout({ intensity: 'easy' }), 67, signals)
    expect(result.eligible).toBe(false)
    expect(result.reasons.map((entry) => entry.code)).toContain('weekly_load_growth')
  })
})
