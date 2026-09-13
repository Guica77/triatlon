export type OutdoorSport = 'carrera' | 'ciclismo'

export type TrainingWeather = {
  temperatureC: number
  humidityPercent: number
  windKmh: number
}

export type WeatherAdjustment = {
  durationFactor: number
  zoneOffset: number
  reason: string
  guidance: string
}

const valid = (value: number, min: number, max: number) => Number.isFinite(value) && value >= min && value <= max

export function proposeWeatherAdjustment(
  sport: string,
  isOutdoor: boolean,
  weather: TrainingWeather | null,
): WeatherAdjustment | null {
  if (!isOutdoor || (sport !== 'carrera' && sport !== 'ciclismo') || !weather) return null
  if (!valid(weather.temperatureC, -50, 60) || !valid(weather.humidityPercent, 0, 100) || !valid(weather.windKmh, 0, 180)) return null

  const heatStress = weather.temperatureC >= 28 || (weather.temperatureC >= 24 && weather.humidityPercent >= 70)
  if (heatStress) {
    const durationFactor = weather.temperatureC >= 33 || weather.humidityPercent >= 80 ? 0.8 : 0.9
    return {
      durationFactor,
      zoneOffset: -1,
      reason: 'Calor previsto',
      guidance: 'Reduce el esfuerzo, prioriza hidratación y busca un horario o recorrido menos expuesto.',
    }
  }
  if (weather.windKmh >= 30) {
    return {
      durationFactor: 1,
      zoneOffset: 0,
      reason: 'Viento intenso',
      guidance: 'Mantén la duración y guía el esfuerzo por sensaciones, no por ritmo. Elige un recorrido resguardado.',
    }
  }
  if (weather.temperatureC <= 3) {
    return {
      durationFactor: 1,
      zoneOffset: 0,
      reason: 'Frío previsto',
      guidance: 'Añade un calentamiento más largo y lleva una capa ligera para el inicio.',
    }
  }
  return null
}
