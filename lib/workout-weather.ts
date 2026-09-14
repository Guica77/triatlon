const weatherContextSports = new Set([
  'ciclismo',
  'carrera',
  'brick',
  'natacion',
  'bike',
  'bicycle',
  'run',
  'running',
  'correr',
])

/** Whether a session should present the live weather context to the athlete. */
export function showsWeatherContext(sport: string | null | undefined) {
  return weatherContextSports.has(sport || '')
}
