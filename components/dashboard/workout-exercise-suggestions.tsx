'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Play, ChevronRight, X } from 'lucide-react'
import { getExercisesBySportAll, ExternalExercise } from '@/lib/exercise-loader'

interface WorkoutExerciseSuggestionsProps {
  sportType: string
  workoutName?: string
}

export function WorkoutExerciseSuggestions({ sportType }: WorkoutExerciseSuggestionsProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [exercises, setExercises] = React.useState<ExternalExercise[]>([])

  React.useEffect(() => {
    const sport = sportType?.toLowerCase() || ''
    const map: Record<string, string> = {
      natacion: 'cardio',
      ciclismo: 'cardio',
      carrera: 'cardio',
      brick: 'cardio',
      fuerza: 'upper legs',
    }
    const exerciseSport = map[sport] || 'cardio'
    const all = getExercisesBySportAll(exerciseSport)
    setExercises(all.slice(0, 3))
  }, [sportType])

  if (exercises.length === 0) return null

  return (
    <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-coral-500/10 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-coral-500" />
          </div>
          <span className="text-xs font-bold text-text-primary">Ejercicios relacionados</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border-subtle overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {exercises.map((ex) => (
                <a
                  key={ex.id}
                  href={`/exercises`}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-hover border border-border-subtle fine-hover:bg-surface-hover/80 transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-card flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={ex.thumbnailUrl}
                      alt={ex.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate group-hover:text-coral-500 transition-colors">{ex.name}</p>
                    <p className="text-[9px] text-text-muted mt-0.5">{ex.muscleGroup} · {ex.equipment}</p>
                  </div>
                  <Play className="w-3.5 h-3.5 text-text-muted group-hover:text-coral-500 transition-colors shrink-0" />
                </a>
              ))}
              <a
                href="/exercises"
                className="block text-center text-[10px] text-coral-500 hover:text-coral-400 font-bold py-2 transition-colors"
              >
                Ver todos los ejercicios →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
