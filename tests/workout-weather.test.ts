import { describe, expect, it } from 'vitest'
import { showsWeatherContext } from '@/lib/workout-weather'

describe('workout weather context', () => {
  it.each(['ciclismo', 'carrera', 'brick', 'natacion'])('shows the weather for %s', sport => {
    expect(showsWeatherContext(sport)).toBe(true)
  })

  it.each(['fuerza', 'descanso'])('does not show it for %s', sport => {
    expect(showsWeatherContext(sport)).toBe(false)
  })
})
