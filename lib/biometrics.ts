export interface ReadinessInputs {
  hrv: number | null | undefined
  rhr: number | null | undefined
  sleep_hours: number | null | undefined
  fatigue_rating: number | null | undefined
  stress_level: number | null | undefined
}

export interface CompleteReadinessInputs {
  hrv: number
  rhr: number
  sleep_hours: number
  fatigue_rating: number
  stress_level: number
}

export function hasCompleteReadinessInputs(values: ReadinessInputs): values is ReadinessInputs & CompleteReadinessInputs {
  const metrics = [
    values.hrv,
    values.rhr,
    values.sleep_hours,
    values.fatigue_rating,
    values.stress_level,
  ]

  return metrics.every(value => typeof value === 'number' && Number.isFinite(value) && value > 0)
}
