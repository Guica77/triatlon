import { describe, expect, it } from 'vitest'
import { proposeWeatherAdjustment } from '@/lib/weather-training-adjustment'

describe('proposeWeatherAdjustment', () => {
  it('propone reducir una sesión exterior cuando hace calor', () => {
    expect(proposeWeatherAdjustment('carrera', true, { temperatureC: 31, humidityPercent: 55, windKmh: 10 }))
      .toMatchObject({ durationFactor: 0.9, zoneOffset: -1, reason: 'Calor previsto' })
  })

  it('es más conservador con calor extremo o humedad alta', () => {
    expect(proposeWeatherAdjustment('ciclismo', true, { temperatureC: 34, humidityPercent: 82, windKmh: 8 }))
      .toMatchObject({ durationFactor: 0.8, zoneOffset: -1 })
  })

  it('no propone reducir por viento o frío, pero explica la adaptación', () => {
    expect(proposeWeatherAdjustment('ciclismo', true, { temperatureC: 16, humidityPercent: 40, windKmh: 35 }))
      .toMatchObject({ durationFactor: 1, reason: 'Viento intenso' })
    expect(proposeWeatherAdjustment('carrera', true, { temperatureC: 1, humidityPercent: 60, windKmh: 8 }))
      .toMatchObject({ durationFactor: 1, reason: 'Frío previsto' })
  })

  it('no cambia sesiones interiores, natación ni datos inválidos', () => {
    expect(proposeWeatherAdjustment('carrera', false, { temperatureC: 35, humidityPercent: 80, windKmh: 0 })).toBeNull()
    expect(proposeWeatherAdjustment('natacion', true, { temperatureC: 35, humidityPercent: 80, windKmh: 0 })).toBeNull()
    expect(proposeWeatherAdjustment('carrera', true, { temperatureC: 90, humidityPercent: 80, windKmh: 0 })).toBeNull()
  })
})
