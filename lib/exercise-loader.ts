/**
 * Exercise Loader — Carga ejercicios desde el dataset local
 *
 * Dataset: https://github.com/hasaneyldrm/exercises-dataset
 * 1,324 ejercicios con GIFs animados, thumbnails e instrucciones en español
 */

const GITHUB_RAW = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main'

export interface ExternalExercise {
  id: string
  name: string
  category: string
  bodyPart: string
  equipment: string
  instructions: string
  muscleGroup: string
  secondaryMuscles: string
  target: string
  thumbnailUrl: string
  gifUrl: string
  attribution: string
}

let cache: ExternalExercise[] | null = null

export function getExternalCount(): number {
  return 1324
}

export function loadExternalExercises(): ExternalExercise[] {
  if (cache) return cache

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const raw = require('../public/exercises-data/exercises.json') as any[]

    cache = raw.map((ex: any) => ({
      id: `ext-${ex.id}`,
      name: ex.name,
      category: ex.category || '',
      bodyPart: ex.body_part || '',
      equipment: ex.equipment || '',
      instructions: ex.instructions?.es || ex.instructions?.en || ex.instruction_steps?.es?.join('. ') || '',
      muscleGroup: ex.muscle_group || ex.category || '',
      secondaryMuscles: ex.secondary_muscles || '',
      target: ex.target || '',
      thumbnailUrl: `/exercises-data/images/${ex.image?.split('/').pop() || ''}`,
      gifUrl: `${GITHUB_RAW}/${ex.gif_url || ''}`,
      attribution: ex.attribution || '',
    }))

    return cache
  } catch (e) {
    console.error('Failed to load exercises dataset:', e)
    return []
  }
}

export function getAllExercises(): ExternalExercise[] {
  return loadExternalExercises()
}

export function searchExercises(query: string): ExternalExercise[] {
  const all = loadExternalExercises()
  if (!query) return all

  const q = query.toLowerCase()
  return all.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.muscleGroup.toLowerCase().includes(q) ||
    e.equipment.toLowerCase().includes(q) ||
    e.instructions.toLowerCase().includes(q)
  )
}

export function getExercisesByCategory(category: string): ExternalExercise[] {
  const all = loadExternalExercises()
  if (!category || category === 'todos') return all
  return all.filter(e => e.category === category || e.muscleGroup === category)
}

/** @deprecated Use getExercisesByCategory instead */
export function getExercisesBySportAll(sport: string): ExternalExercise[] {
  return getExercisesByCategory(sport)
}

// Category mapping for UI filters
export interface CategoryInfo {
  key: string
  label: string
  icon: string
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'todos', label: 'Todos', icon: 'dumbbell' },
  { key: 'chest', label: 'Pecho', icon: 'dumbbell' },
  { key: 'back', label: 'Espalda', icon: 'dumbbell' },
  { key: 'shoulders', label: 'Hombros', icon: 'dumbbell' },
  { key: 'upper arms', label: 'Bíceps / Tríceps', icon: 'dumbbell' },
  { key: 'lower arms', label: 'Antebrazos', icon: 'dumbbell' },
  { key: 'upper legs', label: 'Cuádriceps / Femorales', icon: 'dumbbell' },
  { key: 'lower legs', label: 'Gemelos', icon: 'dumbbell' },
  { key: 'waist', label: 'Core / Abdomen', icon: 'dumbbell' },
  { key: 'neck', label: 'Cuello / Trapecio', icon: 'dumbbell' },
  { key: 'cardio', label: 'Cardio', icon: 'dumbbell' },
]

export const EQUIPMENT_OPTIONS = [
  'body weight', 'dumbbell', 'barbell', 'kettlebell', 'cable',
  'band', 'resistance band', 'medicine ball', 'stability ball',
  'machine', 'smith machine', 'roller', 'rope', 'other',
]
