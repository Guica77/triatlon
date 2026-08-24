'use client'

import * as React from 'react'
import { Clock, CheckCircle2, Circle, Waves, Bike, Footprints, Activity, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface TodayWorkoutHeroProps {
  workout?: any | null
}

/* The hero session styled as a race timing slip: a discipline left-rail,
   big condensed numerals, and a flat status chip. No glows. */
const SPORT_CONFIG: Record<string, { icon: any; color: string; rail: string; label: string }> = {
  natacion: { icon: Waves, color: 'text-swim', rail: 'bg-swim', label: 'Natación' },
  ciclismo: { icon: Bike, color: 'text-bike', rail: 'bg-bike', label: 'Ciclismo' },
  carrera: { icon: Footprints, color: 'text-run', rail: 'bg-run', label: 'Carrera' },
  brick: { icon: Activity, color: 'text-warning', rail: 'bg-warning', label: 'Brick' },
  fuerza: { icon: Dumbbell, color: 'text-accent', rail: 'bg-accent', label: 'Fuerza' },
}

export function TodayWorkoutHero({ workout }: TodayWorkoutHeroProps) {
  const session = workout?.training_sessions
  const sport = session?.sport_type || workout?.sport_type || 'descanso'
  const cfg = SPORT_CONFIG[sport] || { icon: Activity, color: 'text-text-muted', rail: 'bg-border-default', label: sport }

  const durationMin = session?.duration_min || session?.duration_minutes || 0
  const isCompleted = workout?.status === 'completed'
  const Icon = cfg.icon

  // Nothing scheduled today
  if (!workout && !session) {
    return (
      <div className="bg-surface-card rounded-2xl border border-border-default p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-surface-hover flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-text-muted" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-text-primary leading-none">Día de descanso</p>
            <p className="mt-1 text-sm text-text-muted">No hay entrenamiento programado. Prioriza descanso, movilidad y recuperación.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-default bg-surface-card">
      {/* Discipline left-rail */}
      <span className={cn('absolute left-0 top-0 bottom-0 w-1', cfg.rail)} aria-hidden="true" />

      <div className="relative pl-5 sm:pl-6 p-5 space-y-4">
        {/* Top row: icon + label + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-surface-hover border border-border-subtle flex items-center justify-center shrink-0">
              <Icon className={cn('w-5 h-5', cfg.color)} />
            </div>
            <div className="min-w-0">
              <p className={cn('font-display text-xs font-semibold', cfg.color)}>
                Sesión de hoy · {cfg.label}
              </p>
              <h2 className="font-display text-xl font-bold tracking-tight text-text-primary leading-tight truncate">
                {session?.name || 'Entrenamiento'}
              </h2>
            </div>
          </div>

          {isCompleted ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bike/10 text-bike text-xs font-bold border border-bike/30 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Completado
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning/10 text-warning text-xs font-bold border border-warning/30 shrink-0">
              <Circle className="w-3 h-3" /> Pendiente
            </span>
          )}
        </div>

        {/* Split readouts — big condensed numerals */}
        <div className="flex items-end gap-8 sm:gap-10 border-t border-border-subtle pt-4">
          {durationMin > 0 && (
            <div>
              <p className={cn('font-display text-5xl font-black leading-none tracking-tight', cfg.color)}>{durationMin}</p>
              <p className="mt-1 text-xs font-medium text-text-muted">minutos</p>
            </div>
          )}
          {workout?.target_distance && (
            <div>
              <p className="font-display text-5xl font-black leading-none tracking-tight text-text-primary">{workout.target_distance}</p>
              <p className="mt-1 text-xs font-medium text-text-muted">kilómetros</p>
            </div>
          )}
          {workout?.actual_tss ? (
            <div>
              <p className="font-display text-5xl font-black leading-none tracking-tight text-text-primary">{workout.actual_tss}</p>
              <p className="mt-1 text-xs font-medium text-text-muted">TSS</p>
            </div>
          ) : workout?.target_tss ? (
            <div>
              <p className="font-display text-5xl font-black leading-none tracking-tight text-text-primary">{workout.target_tss}</p>
              <p className="mt-1 text-xs font-medium text-text-muted">TSS objetivo</p>
            </div>
          ) : null}
          {durationMin > 0 && (
            <div className="ml-auto hidden items-center gap-1.5 text-xs text-text-muted sm:flex">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{durationMin}:00</span>
            </div>
          )}
        </div>

        {/* Description */}
        {session?.description && (
          <p className="max-w-2xl text-sm leading-relaxed text-text-secondary line-clamp-3">{session.description}</p>
        )}
        {workout?.id && <Link href={`/dashboard/workout/${workout.id}`} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-coral-500 px-5 text-sm font-bold text-bg-deep transition-colors hover:bg-coral-400">{isCompleted ? 'Consultar entrenamiento' : 'Abrir entrenamiento'}</Link>}
      </div>
    </div>
  )
}
