'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, BookOpen, X } from 'lucide-react'
import { EXERCISES, Exercise, SPORT_NAMES, LEVEL_NAMES, searchExercises } from '@/lib/exercises-db'
import { getAllExercises, searchAllExercises, getExternalCount } from '@/lib/exercise-loader'
import { ExerciseCard } from '@/components/exercises/exercise-card'
import { PageHeader } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'

const sports = ['todos', 'natacion', 'ciclismo', 'carrera', 'fuerza', 'movilidad', 'brick'] as const
const levels = ['todos', 'principiante', 'intermedio', 'avanzado'] as const

export default function ExercisesPage() {
  const [selectedSport, setSelectedSport] = React.useState<string>('todos')
  const [selectedLevel, setSelectedLevel] = React.useState<string>('todos')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showFilters, setShowFilters] = React.useState(false)

  const filteredExercises = React.useMemo(() => {
    let results = getAllExercises()

    if (searchQuery) {
      results = searchAllExercises(searchQuery)
    }

    if (selectedSport !== 'todos') {
      results = results.filter(e => e.sport === selectedSport)
    }

    if (selectedLevel !== 'todos') {
      results = results.filter(e => e.level === selectedLevel)
    }

    return results
  }, [selectedSport, selectedLevel, searchQuery])

  const sportCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    const all = getAllExercises()
    sports.forEach(s => {
      counts[s] = s === 'todos' ? all.length : all.filter((e: Exercise) => e.sport === s).length
    })
    return counts
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-8 space-y-6">
        <PageHeader
          icon={BookOpen}
          title="Librería de Ejercicios"
          subtitle={`${EXERCISES.length} ejercicios con video y consejos del coach`}
        />

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar ejercicios... (ej: sentadilla, VO2max, catch-up)"
              className="w-full pl-10 pr-10 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:text-white bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {(selectedSport !== 'todos' || selectedLevel !== 'todos') && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            )}
          </button>

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {/* Sport filter */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Deporte</p>
                  <div className="flex flex-wrap gap-2">
                    {sports.map(sport => (
                      <button
                        key={sport}
                        onClick={() => setSelectedSport(sport)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                          selectedSport === sport
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                        )}
                      >
                        {sport === 'todos' ? 'Todos' : SPORT_NAMES[sport]} ({sportCounts[sport]})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level filter */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Nivel</p>
                  <div className="flex flex-wrap gap-2">
                    {levels.map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                          selectedLevel === level
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                        )}
                      >
                        {level === 'todos' ? 'Todos' : LEVEL_NAMES[level]}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results count */}
        <p className="text-xs text-zinc-500 font-medium">
          {filteredExercises.length} ejercicio{filteredExercises.length !== 1 ? 's' : ''} encontrado{filteredExercises.length !== 1 ? 's' : ''}
        </p>

        {/* Exercise grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredExercises.map((exercise, i) => (
              <ExerciseCard key={exercise.id} exercise={exercise} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-zinc-400">No se encontraron ejercicios</p>
            <p className="text-xs text-zinc-500 mt-1">Prueba con otros filtros o términos de búsqueda</p>
          </div>
        )}
      </main>
    </div>
  )
}