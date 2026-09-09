import { describe, expect, it } from 'vitest'
import { selectTrainingPlan } from '@/lib/training-plan-selection'

const plans = [
  { id: 'sprint-intermedio', distance: 'sprint', level: 'intermedio' },
  { id: 'half-principiante', distance: '70.3', level: 'principiante' },
  { id: 'full-avanzado', distance: 'Ironman / Full', level: 'avanzado' },
  { id: '5k-intermedio', distance: '5K', level: 'intermedio' },
  { id: '10k-intermedio', distance: '10 km', level: 'intermedio' },
  { id: 'half-marathon-intermedio', distance: 'Media Maratón', level: 'intermedio' },
  { id: 'marathon-intermedio', distance: 'Maratón', level: 'intermedio' },
  { id: 'ultra-intermedio', distance: 'Ultra Trail', level: 'intermedio' },
]

describe('selectTrainingPlan', () => {
  it.each([
    ['5k', '5k-intermedio'],
    ['10k', '10k-intermedio'],
    ['medio_maraton', 'half-marathon-intermedio'],
    ['maraton', 'marathon-intermedio'],
    ['ultra', 'ultra-intermedio'],
  ])('selects the requested running distance: %s', (distance, expectedId) => {
    expect(selectTrainingPlan(plans, distance, 'intermedio')?.id).toBe(expectedId)
  })

  it('matches triathlon aliases and the requested level', () => {
    expect(selectTrainingPlan(plans, 'full', 'avanzado')?.id).toBe('full-avanzado')
    expect(selectTrainingPlan(plans, 'half', 'principiante')?.id).toBe('half-principiante')
  })

  it('falls back to another level only within the requested distance', () => {
    expect(selectTrainingPlan(plans, 'sprint', 'avanzado')?.id).toBe('sprint-intermedio')
  })

  it('does not select the first plan when no distance matches', () => {
    expect(selectTrainingPlan(plans, 'unknown-distance', 'intermedio')).toBeNull()
  })
})
