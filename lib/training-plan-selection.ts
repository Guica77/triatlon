export type TrainingPlanCandidate = {
  id: string
  distance?: string | null
  level?: string | null
}

const DISTANCE_ALIASES: Record<string, string[]> = {
  sprint: ['sprint'],
  olimpico: ['olimpico', 'olympic'],
  half: ['half', '70.3', '703', 'media'],
  full: ['full', 'ironman', 'larga'],
  '5k': ['5k', '5 km', 'cinco km'],
  '10k': ['10k', '10 km', 'diez km'],
  'medio maraton': ['medio maraton', 'media maraton', 'half marathon', '21k', '21 km'],
  maraton: ['maraton', 'marathon', '42k', '42 km'],
  ultra: ['ultra'],
}

const DISTANCE_EXCLUSIONS: Record<string, string[]> = {
  half: ['media maraton', 'medio maraton', 'half marathon'],
  full: ['full marathon'],
  maraton: ['media maraton', 'medio maraton', 'half marathon'],
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\/_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchesTrainingPlanDistance(
  planDistance: string | null | undefined,
  targetDistance: string | null | undefined,
): boolean {
  const aliases = DISTANCE_ALIASES[normalize(targetDistance || '')]
  if (!aliases || !planDistance) return false

  const normalizedPlanDistance = normalize(planDistance)
  const targetKey = normalize(targetDistance || '')
  const excludedPhrases = DISTANCE_EXCLUSIONS[targetKey] || []
  if (excludedPhrases.some((phrase) => normalizedPlanDistance.includes(phrase))) {
    return false
  }

  return aliases.some((alias) => {
    const normalizedAlias = normalize(alias)
    if (normalizedAlias.includes(' ')) {
      return normalizedPlanDistance.includes(normalizedAlias)
    }

    return new RegExp(`(?:^|\\s)${normalizedAlias}(?:$|\\s)`).test(normalizedPlanDistance)
  })
}

export function selectTrainingPlan<T extends TrainingPlanCandidate>(
  plans: T[] | null | undefined,
  targetDistance: string | null | undefined,
  athleteLevel: string | null | undefined,
): T | null {
  if (!plans?.length) return null

  const distanceMatches = plans.filter((plan) =>
    matchesTrainingPlanDistance(plan.distance, targetDistance),
  )
  if (!distanceMatches.length) return null

  const targetLevel = normalize(athleteLevel || 'intermedio')
  return (
    distanceMatches.find((plan) => {
      const planLevel = normalize(plan.level || '')
      return (
        planLevel === targetLevel ||
        (targetLevel === 'principiante' && planLevel === 'principiante absoluto')
      )
    }) || distanceMatches[0]
  )
}
