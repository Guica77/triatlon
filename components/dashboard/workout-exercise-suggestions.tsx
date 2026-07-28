'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Play, ChevronRight, X, ExternalLink } from 'lucide-react'
import { getExercisesBySportAll } from '@/lib/exercise-loader'
import { Exercise } from '@/lib/exercises-db'
import { SportIllustration } from '@/components/ui/sport-illustration'

interface WorkoutExerciseSuggestionsProps {
  sportType: string
  workoutName?: string
}

export function WorkoutExerciseSuggestions({ sportType, workoutName }: WorkoutExerciseSuggestionsProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [exercises, setExercises] = React.useState<Exercise[]>([])

  React.useEffect(() => {
    const sport = sportType?.toLowerCase() || ''
    // Map workout sport types to exercise sport types
    const map: Record<string, string> = {
      natacion: 'natacion',
      ciclismo: 'ciclismo',
      carrera: 'carrera',
      brick: 'ciclismo',
      fuerza: 'fuerza',
    }
    const exerciseSport = map[sport] || 'ciclismo'
    const all = getExercisesBySportAll(exerciseSport)
    // Show max 3 related exercises
    setExercises(all.slice(0, 3))
  }, [sportType])

  if (exercises.length === 0) return null

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">Ejercicios relacionados</p>
            <p className="text-[9px] text-zinc-500 font-medium mt-0.5">Técnica y forma correcta</p>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-800"
          >
            <div className="p-4 space-y-3">
              {exercises.map((ex, i) => (
                <a
                  key={ex.id}
                  href={`/exercises?id=${ex.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {ex.externalGif ? (
                      <img src={ex.externalGif} alt={ex.name} className="w-full h-full object-cover" />
                    ) : (
                      <SportIllustration sport={ex.sport} size="sm" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{ex.name}</p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">{ex.muscleGroup} • {ex.equipment?.join(', ')}</p>
                  </div>
                  <Play className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                </a>
              ))}
              <a
                href="/exercises"
                className="block text-center text-[10px] text-cyan-400 hover:text-cyan-300 font-bold py-2"
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