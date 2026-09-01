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

export interface ExercisePage {
  items: ExternalExercise[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  categoryCounts: Record<string, number>
}
