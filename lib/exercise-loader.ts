/**
 * Exercise Loader — Carga y une los datasets de ejercicios
 *
 * Combina:
 * - Ejercicios locales (con ilustraciones SVG)
 * - 1,324 ejercicios externos (con GIFs animados)
 *
 * Los externos se cargan desde el JSON descargado en lib/external-exercises.json
 */

import { EXERCISES, Exercise } from '@/lib/exercises-db'

// ============================================================
// Load external exercises from JSON data
// ============================================================

let externalExercisesCache: Exercise[] | null = null

export function getExternalCount(): number {
  return 1324
}

// Partial translation map for common exercise terms
const TRANSLATIONS: Record<string, string> = {
  'bench press': 'press de banca',
  'squat': 'sentadilla',
  'deadlift': 'peso muerto',
  'pull-up': 'dominada',
  'push-up': 'flexión',
  'shoulder press': 'press de hombro',
  'biceps curl': 'curl de bíceps',
  'triceps extension': 'extensión de tríceps',
  'lateral raise': 'elevación lateral',
  'leg press': 'press de pierna',
  'leg extension': 'extensión de pierna',
  'lat pulldown': 'jalón al pecho',
  'rowing': 'remo',
  'sit-up': 'abdominal',
  'crunch': 'encogimiento',
  'plank': 'plancha',
  'lunge': 'zancada',
  'calf raise': 'elevación de gemelos',
  'hamstring curl': 'curl femoral',
  'chest fly': 'apertura de pecho',
  'dumbbell': 'mancuerna',
  'barbell': 'barra',
  'kettlebell': 'pesa rusa',
  'cable': 'polea',
  'body weight': 'peso corporal',
  'resistance band': 'banda elástica',
  'machine': 'máquina',
  'smith machine': 'máquina smith',
  'butterfly': 'mariposa',
  'reverse fly': 'vuelo inverso',
}

function translateName(englishName: string): string {
  let translated = englishName
  for (const [en, es] of Object.entries(TRANSLATIONS)) {
    if (translated.toLowerCase().includes(en)) {
      translated = translated.replace(new RegExp(en, 'gi'), es)
    }
  }
  // Capitalize first letter
  return translated.charAt(0).toUpperCase() + translated.slice(1)
}

export function loadExternalExercises(): Exercise[] {
  if (externalExercisesCache) return externalExercisesCache

  try {
    // Dynamic import at runtime
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const raw = require('./external-exercises.json') as any[]

    externalExercisesCache = raw.map((ex: any) => {
      const category = ex.category || ''
      const sport = mapCategoryToSport(category)
      const steps = ex.instruction_steps?.es || ex.instruction_steps?.en || []
      const instruction = ex.instructions?.es || ex.instructions?.en || ''

      return {
        id: `ext-${ex.id}`,
        name: translateName(ex.name),
        sport,
        muscleGroup: getCategoryLabel(category),
        level: getLevel(ex.equipment || ''),
        description: steps.slice(0, 2).join(' ') || instruction.slice(0, 120) || `Ejercicio de ${getCategoryLabel(category)}`,
        youtubeId: '',
        externalImage: `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/${ex.id}.jpg`,
        externalGif: `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/${ex.id}.gif`,
        externalSource: true,
        coachTips: steps.slice(0, 4).map((s: string) => s),
        equipment: [ex.equipment || 'body weight'],
        duration: '',
        sets: '',
      }
    })

    return externalExercisesCache
  } catch {
    return []
  }
}

export function getAllExercises(): Exercise[] {
  const external = loadExternalExercises()
  return [...EXERCISES, ...external]
}

export function searchAllExercises(query: string): Exercise[] {
  const all = getAllExercises()
  if (!query) return all

  const q = query.toLowerCase()
  return all.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.muscleGroup.toLowerCase().includes(q) ||
    e.sport.toLowerCase().includes(q)
  )
}

export function getExercisesBySportAll(sport: string): Exercise[] {
  if (sport === 'todos') return getAllExercises()
  return getAllExercises().filter(e => e.sport === sport)
}

function mapCategoryToSport(category: string): Exercise['sport'] {
  const c = category.toLowerCase()
  if (c === 'cardio') return 'carrera'
  if (c === 'cycling') return 'ciclismo'
  if (c === 'swimming') return 'natacion'
  return 'fuerza'
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    waist: 'Core / Abdomen',
    'upper legs': 'Cuádriceps / Femorales',
    back: 'Espalda',
    'lower legs': 'Gemelos / Tibial',
    chest: 'Pecho',
    'upper arms': 'Bíceps / Tríceps',
    cardio: 'Cardio',
    shoulders: 'Hombros / Deltoides',
    'lower arms': 'Antebrazos',
    neck: 'Cuello / Trapecio',
  }
  return labels[category.toLowerCase()] || category
}

function getLevel(equipment: string): Exercise['level'] {
  const e = equipment.toLowerCase()
  if (e === 'body weight' || e === 'body only' || !e) return 'principiante'
  if (e === 'dumbbell' || e === 'kettlebell' || e.includes('band')) return 'intermedio'
  return 'intermedio'
}