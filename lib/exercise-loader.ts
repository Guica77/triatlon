/**
 * Exercise Loader — Carga ejercicios desde el dataset local
 *
 * Dataset: https://github.com/hasaneyldrm/exercises-dataset
 * 1,324 ejercicios con GIFs animados, thumbnails e instrucciones en español
 */

const GITHUB_RAW = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main'

// Trimmed dataset (es-only instructions, ~91% smaller than the full multi-language JSON)
import exercisesLite from './exercises-lite.json'
import type { ExercisePage, ExternalExercise } from './exercise-types'

export type { ExercisePage, ExternalExercise } from './exercise-types'

let cache: ExternalExercise[] | null = null

export function getExternalCount(): number {
  return 1324
}

export function loadExternalExercises(): ExternalExercise[] {
  if (cache) return cache

  try {
    const raw = exercisesLite as any[]

    cache = raw.map((ex: any) => ({
      id: `ext-${ex.id}`,
      name: ex.name,
      category: ex.category || '',
      bodyPart: ex.body_part || '',
      equipment: ex.equipment || '',
      instructions: ex.instructions || '',
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

export const EXERCISE_PAGE_SIZE = 24
export const MAX_EXERCISE_PAGE_SIZE = 48

export interface ExerciseQuery {
  query?: string
  category?: string
  equipment?: string
  page?: number
  pageSize?: number
}

export function queryExercises({
  query = '',
  category = 'todos',
  equipment = 'todos',
  page = 1,
  pageSize = EXERCISE_PAGE_SIZE,
}: ExerciseQuery = {}): ExercisePage {
  const normalizedQuery = query.trim().toLowerCase().slice(0, 100)
  const normalizedCategory = category.trim().toLowerCase().slice(0, 40) || 'todos'
  const normalizedEquipment = equipment.trim().toLowerCase().slice(0, 60) || 'todos'
  const safePageSize = Math.min(MAX_EXERCISE_PAGE_SIZE, Math.max(1, Math.trunc(pageSize) || EXERCISE_PAGE_SIZE))
  const all = loadExternalExercises()

  const categoryCounts: Record<string, number> = { todos: all.length }
  for (const categoryInfo of CATEGORIES) {
    if (categoryInfo.key === 'todos') continue
    categoryCounts[categoryInfo.key] = all.filter(exercise =>
      exercise.category === categoryInfo.key || exercise.muscleGroup.toLowerCase() === categoryInfo.key
    ).length
  }

  const filtered = all.filter(exercise => {
    const matchesQuery = !normalizedQuery || [
      exercise.name,
      exercise.muscleGroup,
      exercise.equipment,
      exercise.instructions,
    ].some(value => value.toLowerCase().includes(normalizedQuery))
    const matchesCategory = normalizedCategory === 'todos'
      || exercise.category === normalizedCategory
      || exercise.muscleGroup.toLowerCase() === normalizedCategory
    const matchesEquipment = normalizedEquipment === 'todos'
      || exercise.equipment.toLowerCase().includes(normalizedEquipment)

    return matchesQuery && matchesCategory && matchesEquipment
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / safePageSize))
  const safePage = Math.min(totalPages, Math.max(1, Math.trunc(page) || 1))
  const start = (safePage - 1) * safePageSize

  return {
    items: filtered.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
    categoryCounts,
  }
}
