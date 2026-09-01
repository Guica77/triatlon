import { describe, expect, it } from 'vitest'
import { MAX_EXERCISE_PAGE_SIZE, queryExercises } from '@/lib/exercise-loader'

describe('queryExercises', () => {
  it('returns a stable first page with totals', () => {
    const result = queryExercises()
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(24)
    expect(result.items).toHaveLength(24)
    expect(result.total).toBe(1324)
    expect(result.totalPages).toBe(Math.ceil(1324 / 24))
  })

  it('combines text, category and equipment filters', () => {
    const result = queryExercises({ query: 'press', category: 'chest', equipment: 'dumbbell' })
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.items.every(item => item.category === 'chest' || item.muscleGroup === 'chest')).toBe(true)
    expect(result.items.every(item => item.equipment.includes('dumbbell'))).toBe(true)
  })

  it('caps page size and clamps pages beyond the result set', () => {
    const result = queryExercises({ query: 'sit-up', page: 999, pageSize: 500 })
    expect(result.pageSize).toBe(MAX_EXERCISE_PAGE_SIZE)
    expect(result.page).toBe(result.totalPages)
    expect(result.items.length).toBeLessThanOrEqual(MAX_EXERCISE_PAGE_SIZE)
  })

  it('returns an empty page with useful pagination metadata', () => {
    const result = queryExercises({ query: 'no-existe-este-ejercicio' })
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(1)
  })
})
