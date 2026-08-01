'use client'

import * as React from 'react'
import { Clock, CheckCircle2, Circle, Waves, Bike, Footprints, Activity, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TodayWorkoutHeroProps {
  workout?: any | null
}

const SPORT_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  natacion: { icon: Waves, color: 'text-swim', bg: 'bg-swim/15', border: 'border-swim/20', label: 'Natación' },
  ciclismo: { icon: Bike, color: 'text-bike', bg: 'bg-bike/15', border: 'border-bike/20', label: 'Ciclismo' },
  carrera: { icon: Footprints, color: 'text-run', bg: 'bg-run/15', border: 'border-run/20', label: 'Carrera' },
  brick: { icon: Activity, color: 'text-warning', bg: 'bg-warning/15', border: 'border-warning/20', label: 'Brick' },
  fuerza: { icon: Dumbbell, color: 'text-coral-500', bg: 'bg-coral-500/15', border: 'border-coral-500/20', label: 'Fuerza' },
}

export function TodayWorkoutHero({ workout }: TodayWorkoutHeroProps) {
  const session = workout?.training_sessions
  const sport = session?.sport_type || workout?.sport_type || 'descanso'
  const cfg = SPORT_CONFIG[sport] || SPORT_CONFIG.descanso || { icon: Activity, color: 'text-text-muted', bg: 'bg-surface-hover', border: 'border-border-default', label: sport }

  const durationMin = session?.duration_min || session?.duration_minutes || 0
  const isCompleted = workout?.status === 'completed'
  const Icon = cfg.icon

  // Nothing scheduled today
  if (!workout && !session) {
    return (
      <div className="bg-surface-card rounded-2xl border border-border-default shadow-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-surface-hover flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">Día de descanso</p>
            <p className="text-[11px] text-text-muted">No hay entrenamiento programado para hoy</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border shadow-card bg-surface-card', cfg.border)}>
      {/* Discipline glow */}
      <div className={cn('absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl', cfg.bg)} />

      <div className="relative p-5 space-y-4">
        {/* Top row: icon + label + status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', cfg.bg, cfg.border, 'border')}>
              <Icon className={cn('w-5 h-5', cfg.color)} />
            </div>
            <div>
              <p className={cn('text-[10px] font-black uppercase tracking-widest', cfg.color)}>
                Sesión de hoy · {cfg.label}
              </p>
              <p className="text-lg font-extrabold text-text-primary tracking-tight">
                {session?.name || 'Entrenamiento'}
              </p>
            </div>
          </div>

          {isCompleted ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-bike/15 text-bike text-[10px] font-bold border border-bike/20 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Completado
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/15 text-warning text-[10px] font-bold border border-warning/20 shrink-0">
              <Circle className="w-3 h-3" /> Pendiente
            </span>
          )}
        </div>

        {/* Duration big number */}
        <div className="flex items-center gap-6">
          {durationMin > 0 && (
            <div>
              <p className={cn('text-4xl font-black tracking-tight', cfg.color)}>{durationMin}</p>
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">minutos</p>
            </div>
          )}
          {workout?.target_distance && (
            <div>
              <p className="text-4xl font-black tracking-tight text-text-primary">{workout.target_distance}</p>
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">km</p>
            </div>
          )}
          {workout?.actual_tss ? (
            <div>
              <p className="text-4xl font-black tracking-tight text-text-primary">{workout.actual_tss}</p>
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">TSS</p>
            </div>
          ) : workout?.target_tss ? (
            <div>
              <p className="text-4xl font-black tracking-tight text-text-primary">{workout.target_tss}</p>
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">TSS objetivo</p>
            </div>
          ) : null}
        </div>

        {/* Description */}
        {session?.description && (
          <p className="text-xs text-text-secondary leading-relaxed">
            {session.description}
          </p>
        )}
      </div>
    </div>
  )
}
