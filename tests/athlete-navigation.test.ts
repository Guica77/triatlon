import { describe, expect, it } from 'vitest'
import { athleteArea, matchesRoute, progressSections, trainingSections } from '@/lib/athlete-navigation'

describe('athlete navigation areas', () => {
  it.each(['/dashboard', '/dashboard/workout/example', '/recuperacion', '/exercises'])('%s remains in Entreno', path => {
    expect(athleteArea(path)).toBe('/dashboard')
  })
  it.each(['/plan', '/plan/week/current'])('%s remains in Plan', path => {
    expect(athleteArea(path)).toBe('/plan')
  })
  it.each(['/analytics', '/resumen'])('%s remains in Progreso', path => expect(athleteArea(path)).toBe('/resumen'))
  it('keeps chat and profile directly accessible', () => {
    expect(athleteArea('/chat')).toBe('/chat')
    expect(athleteArea('/settings')).toBe('/settings')
  })
  it('does not capture similarly named or coach routes', () => {
    expect(matchesRoute('/dashboard-other', '/dashboard')).toBe(false)
    expect(athleteArea('/coach/dashboard')).toBeNull()
  })
  it('provides one explicit location for every secondary page', () => {
    expect([...trainingSections, ...progressSections].map(item => item.href)).toEqual([
      '/dashboard', '/plan', '/recuperacion', '/exercises', '/resumen', '/analytics',
    ])
  })
})
