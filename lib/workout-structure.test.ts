import { describe, expect, it } from 'vitest'
import { getWorkoutDuration, validateWorkoutBlocks, WorkoutBlock } from './workout-structure'

describe('workout structure', () => {
  it('calculates regular and interval blocks', () => {
    const blocks: WorkoutBlock[] = [
      { id: 'warmup', type: 'warmup', targetType: 'time', duration: 10, zone: 2 },
      { id: 'series', type: 'interval', repeats: 4, workTargetType: 'time', workDuration: 3, workZone: 4, restTargetType: 'time', restDuration: 1, restZone: 1 },
      { id: 'cooldown', type: 'cooldown', targetType: 'time', duration: 5, zone: 1 },
    ]
    expect(getWorkoutDuration(blocks)).toBe(31)
    expect(validateWorkoutBlocks(blocks)).toBeNull()
  })

  it('rejects an empty workout', () => {
    expect(validateWorkoutBlocks([])).toContain('al menos un bloque')
  })
})
