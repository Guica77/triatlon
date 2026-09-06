import * as React from 'react'
import { Waves, Bike, Footprints } from 'lucide-react'
import { cn } from '@/lib/utils'

/* The Start Line — the athlete dashboard's signature.
   Three lanes (SWIM · BIKE · RUN) whose fills encode this week's planned
   volume per discipline, with the completed volume overlaid in full color. */

export type StartLaneSport = 'natacion' | 'ciclismo' | 'carrera'

export interface StartLane {
  sport: StartLaneSport
  /** Planned minutes this week */
  minutes: number
  /** Minutes of completed sessions this week */
  completedMinutes: number
  sessions: number
  completedSessions: number
}

interface StartLineProps {
  lanes: StartLane[]
  weekLabel: string
}

const LANE_META: Record<
  StartLaneSport,
  { label: string; color: string; track: string; fill: string; icon: React.ComponentType<{ className?: string }> }
> = {
  natacion: { label: 'Natación', color: 'text-swim', track: 'bg-swim/15', fill: 'bg-swim', icon: Waves },
  ciclismo: { label: 'Ciclismo', color: 'text-bike', track: 'bg-bike/15', fill: 'bg-bike', icon: Bike },
  carrera: { label: 'Carrera', color: 'text-run', track: 'bg-run/15', fill: 'bg-run', icon: Footprints },
}

function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h <= 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function StartLine({ lanes, weekLabel }: StartLineProps) {
  const totalSessions = lanes.reduce((acc, l) => acc + l.sessions, 0)
  const totalDone = lanes.reduce((acc, l) => acc + l.completedSessions, 0)
  const maxMinutes = Math.max(1, ...lanes.map((l) => l.minutes))

  const hasPlannedSessions = totalSessions > 0

  return (
    <section
      aria-label="Volumen de entrenamiento de la semana"
      className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-5"
    >
      {/* Header row */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 items-center gap-[3px]" aria-hidden="true">
            <span className="h-3 w-1.5 rounded-full bg-swim" />
            <span className="h-3 w-1.5 rounded-full bg-bike" />
            <span className="h-3 w-1.5 rounded-full bg-run" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Semana en pista</p>
            <h2 className="mt-1 font-display text-lg font-bold leading-none tracking-tight text-text-primary">La línea de salida</h2>
            <p className="mt-1 truncate text-[11px] font-medium text-text-muted">{weekLabel}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-bold leading-none text-text-primary">{totalDone}/{totalSessions}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">sesiones</p>
        </div>
      </div>

      {/* Lanes */}
      <div className="space-y-4">
        {lanes.map((lane) => {
          const meta = LANE_META[lane.sport]
          const Icon = meta.icon
          const planned = maxMinutes > 0 ? (lane.minutes / maxMinutes) * 100 : 0
          const done = maxMinutes > 0 ? (lane.completedMinutes / maxMinutes) * 100 : 0
          const isFull = lane.minutes > 0 && lane.completedMinutes >= lane.minutes
          const laneLabel = `${meta.label}: ${lane.completedMinutes} de ${lane.minutes} minutos completados`

          return (
            <div key={lane.sport} className="grid grid-cols-[5.25rem_minmax(0,1fr)_4rem] items-center gap-3">
              <div className={cn('flex min-w-0 items-center gap-1.5', meta.color)}>
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate font-display text-xs font-bold uppercase tracking-widest">{meta.label}</span>
              </div>

              <div
                className="relative h-2 overflow-hidden rounded-full bg-surface-hover"
                role="progressbar"
                aria-label={laneLabel}
                aria-valuemin={0}
                aria-valuemax={lane.minutes || 1}
                aria-valuenow={Math.min(lane.completedMinutes, lane.minutes || 1)}
              >
                {/* planned volume */}
                <div
                  className={cn('absolute inset-y-0 left-0 rounded-full opacity-40', meta.fill)}
                  style={{ width: `${planned}%` }}
                />
                {/* completed volume */}
                <div
                  className={cn('absolute inset-y-0 left-0 rounded-full', meta.fill)}
                  style={{ width: `${Math.min(done, 100)}%` }}
                />
                {isFull && (
                  <span className="absolute right-1 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-surface-card" aria-hidden="true" />
                )}
              </div>

              <div className="min-w-0 text-right">
                <span className={cn('font-mono text-[11px] font-medium', lane.minutes > 0 ? 'text-text-primary' : 'text-text-muted')}>
                  {lane.minutes > 0 ? fmtMinutes(lane.minutes) : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {!hasPlannedSessions && (
        <p className="mt-5 border-t border-border-subtle pt-3 text-xs text-text-muted">
          Todavía no hay sesiones planificadas para esta semana.
        </p>
      )}
    </section>
  )
}
