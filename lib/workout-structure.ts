export type WorkoutBlockType = 'warmup' | 'active' | 'recovery' | 'cooldown' | 'interval'
export type WorkoutTargetType = 'time' | 'distance'

export interface WorkoutBlock {
  id: string
  type: WorkoutBlockType
  notes?: string
  targetType?: WorkoutTargetType
  duration?: number
  distance?: number
  zone?: number
  repeats?: number
  workTargetType?: WorkoutTargetType
  workDuration?: number
  workDistance?: number
  workZone?: number
  restTargetType?: WorkoutTargetType
  restDuration?: number
  restDistance?: number
  restZone?: number
}

export const workoutBlockLabels: Record<WorkoutBlockType, string> = {
  warmup: 'Calentamiento',
  active: 'Trabajo principal',
  recovery: 'Recuperación',
  cooldown: 'Vuelta a la calma',
  interval: 'Series',
}

function estimateDistanceMinutes(distance = 0) {
  return distance >= 1000 ? (distance / 1000) * 5 : (distance / 100) * 1.5
}

export function getTargetMinutes(type?: WorkoutTargetType, duration = 0, distance = 0) {
  return type === 'distance' ? estimateDistanceMinutes(distance) : duration
}

export function getWorkoutBlockMinutes(block: WorkoutBlock) {
  if (block.type === 'interval') {
    const work = getTargetMinutes(block.workTargetType, block.workDuration, block.workDistance)
    const rest = getTargetMinutes(block.restTargetType, block.restDuration, block.restDistance)
    return (work + rest) * Math.max(1, block.repeats || 1)
  }
  return getTargetMinutes(block.targetType, block.duration, block.distance)
}

export function getWorkoutDuration(blocks: WorkoutBlock[]) {
  return Math.round(blocks.reduce((total, block) => total + getWorkoutBlockMinutes(block), 0))
}

export function formatWorkoutTarget(type?: WorkoutTargetType, duration = 0, distance = 0) {
  if (type === 'distance') {
    if (distance >= 1000) return `${Number((distance / 1000).toFixed(2))} km`
    return `${distance} m`
  }
  return `${duration} min`
}

export function validateWorkoutBlocks(blocks: WorkoutBlock[]) {
  if (blocks.length === 0) return 'Añade al menos un bloque para continuar.'
  for (const block of blocks) {
    if (block.type === 'interval') {
      if (!block.repeats || block.repeats < 1) return 'Las series necesitan al menos una repetición.'
      if (!getTargetMinutes(block.workTargetType, block.workDuration, block.workDistance)) return 'Define la duración o distancia del trabajo.'
      if (!getTargetMinutes(block.restTargetType, block.restDuration, block.restDistance)) return 'Define la recuperación de las series.'
    } else if (!getWorkoutBlockMinutes(block)) {
      return `${workoutBlockLabels[block.type]} necesita una duración o distancia.`
    }
    const zones = [block.zone, block.workZone, block.restZone].filter((zone): zone is number => zone !== undefined)
    if (zones.some((zone) => zone < 1 || zone > 5)) return 'Las zonas deben estar entre Z1 y Z5.'
  }
  return null
}

export function workoutTitleFromDescription(description = '', sportType = '') {
  const match = description.match(/Parte principal:\s*(?:\*\*)?([^*\n-]+)(?:\*\*)?\s*-/i)
  if (match?.[1]?.trim()) return match[1].trim()
  return sportType === 'fuerza' ? 'Fuerza y acondicionamiento' : `Sesión de ${sportType || 'entrenamiento'}`
}
