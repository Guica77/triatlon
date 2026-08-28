'use client'

import * as React from 'react'
import { Search, Filter, BookOpen, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAllExercises, searchExercises, getExercisesByCategory, ExternalExercise, CATEGORIES, EQUIPMENT_OPTIONS } from '@/lib/exercise-loader'
import { ExerciseCard } from '@/components/exercises/exercise-card'
import { cn } from '@/lib/utils'

const PER_PAGE = 24

export default function ExercisesPage() {
  const [category, setCategory] = React.useState('todos')
  const [equipment, setEquipment] = React.useState('todos')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showFilters, setShowFilters] = React.useState(false)
  const [page, setPage] = React.useState(1)

  const all = React.useMemo(() => getAllExercises(), [])

  const filtered = React.useMemo(() => {
    let results: ExternalExercise[] = all

    if (searchQuery) results = searchExercises(searchQuery)
    else if (category !== 'todos') results = getExercisesByCategory(category)

    if (equipment !== 'todos') {
      results = results.filter(e => e.equipment.toLowerCase().includes(equipment))
    }

    return results
  }, [category, equipment, searchQuery, all])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const currentPage = Math.min(page, Math.max(totalPages, 1))
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  // Reset page when filters change
  React.useEffect(() => setPage(1), [category, equipment, searchQuery])

  // Category counts
  const catCounts = React.useMemo(() => {
    const m: Record<string, number> = { todos: all.length }
    for (const c of CATEGORIES) {
      if (c.key === 'todos') continue
      m[c.key] = all.filter(e => e.muscleGroup.toLowerCase() === c.key || e.category === c.key).length
    }
    return m
  }, [all])

  return (
    <div className="min-h-screen bg-surface-app w-full overflow-x-hidden">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-coral-500/10 border border-coral-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-coral-500" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary tracking-tight">Librería de Ejercicios</h1>
            <p className="text-xs text-text-muted font-medium">{all.length} ejercicios con GIF animado</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar ejercicios..."
            className="w-full min-h-11 pl-10 pr-10 py-2.5 bg-surface-hover border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted outline-none transition-[background-color,color,border-color,box-shadow] duration-150 ease-out focus:border-coral-500/40 focus:ring-1 focus:ring-coral-500/30 motion-reduce:transition-opacity"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted outline-none transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out hover:bg-surface-card hover:text-text-secondary active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-coral-500/40 motion-reduce:transition-opacity motion-reduce:active:scale-100"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter toggle + results count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-muted font-medium">{filtered.length} ejercicio{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="exercise-filters"
            className="flex min-h-11 items-center gap-1.5 rounded-lg border border-border-default bg-surface-hover px-3 text-xs font-bold text-text-muted outline-none transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out hover:border-border-default/80 hover:text-text-secondary active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-coral-500/40 motion-reduce:transition-opacity motion-reduce:active:scale-100"
          >
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            Filtros
            {(category !== 'todos' || equipment !== 'todos') && <span className="w-1.5 h-1.5 rounded-full bg-coral-500" />}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div id="exercise-filters" className="space-y-3 p-4 bg-surface-card border border-border-default rounded-xl">
            <div>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-2">Categoría</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => setCategory(c.key)}
                    className={cn(
                      'min-h-11 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-opacity motion-reduce:active:scale-100 border',
                      category === c.key
                        ? 'bg-coral-500/10 text-coral-500 border-coral-500/30'
                        : 'bg-surface-hover text-text-muted border-border-default hover:border-border-default/80'
                    )}>
                    {c.label} ({catCounts[c.key] || 0})
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-2">Equipamiento</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setEquipment('todos')}
                  className={cn('min-h-11 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-opacity motion-reduce:active:scale-100 border',
                    equipment === 'todos' ? 'bg-coral-500/10 text-coral-500 border-coral-500/30'
                    : 'bg-surface-hover text-text-muted border-border-default hover:border-border-default/80')}>
                  Todos
                </button>
                {EQUIPMENT_OPTIONS.map(eq => (
                  <button key={eq} onClick={() => setEquipment(eq)}
                    className={cn('min-h-11 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-opacity motion-reduce:active:scale-100 border',
                      equipment === eq ? 'bg-coral-500/10 text-coral-500 border-coral-500/30'
                      : 'bg-surface-hover text-text-muted border-border-default hover:border-border-default/80')}>
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((exercise, i) => (
            <ExerciseCard key={exercise.id} exercise={exercise} index={i} />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-sm font-bold text-text-secondary">No se encontraron ejercicios</p>
            <p className="text-xs text-text-muted mt-1">Prueba con otros filtros o términos de búsqueda</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Página anterior"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-default bg-surface-card text-text-muted outline-none transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out hover:text-text-secondary active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-coral-500/40 disabled:pointer-events-none disabled:opacity-30 motion-reduce:transition-opacity motion-reduce:active:scale-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4))
              const p = start + i
              if (p > totalPages) return null
              return (
                    <button key={p} onClick={() => setPage(p)}
                  aria-current={p === currentPage ? 'page' : undefined}
                  className={cn('flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xs font-bold transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-opacity motion-reduce:active:scale-100 cursor-pointer',
                    p === currentPage
                      ? 'bg-coral-500 text-white shadow-button'
                      : 'bg-surface-card border border-border-default text-text-muted hover:text-text-secondary')}>
                  {p}
                </button>
              )
            })}

            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Página siguiente"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border-default bg-surface-card text-text-muted outline-none transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out hover:text-text-secondary active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-coral-500/40 disabled:pointer-events-none disabled:opacity-30 motion-reduce:transition-opacity motion-reduce:active:scale-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
