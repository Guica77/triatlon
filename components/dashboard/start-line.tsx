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

  return (
    <div className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center gap-[3px] shrink-0" aria-hidden="true">
            <span className="w-1.5 h-3 rounded-full bg-swim" />
            <span className="w-1.5 h-3 rounded-full bg-bike" />
            <span className="w-1.5 h-3 rounded-full bg-run" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-tight text-text-primary leading-none">La línea de salida</h2>
            <p className="text-[11px] text-text-muted font-medium mt-0.5 truncate">{weekLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-secondary shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-bike inline-block" aria-hidden="true" />
          <span>{totalDone}/{totalSessions} sesiones</span>
        </div>
      </div>

      {/* Lanes */}
      <div className="space-y-3.5">
        {lanes.map((lane) => {
          const meta = LANE_META[lane.sport]
          const Icon = meta.icon
          const planned = maxMinutes > 0 ? (lane.minutes / maxMinutes) * 100 : 0
          const done = maxMinutes > 0 ? (lane.completedMinutes / maxMinutes) * 100 : 0
          const isFull = lane.minutes > 0 && lane.completedMinutes >= lane.minutes

          return (
            <div key={lane.sport} className="flex items-center gap-3">
              <div className={cn('w-20 shrink-0 flex items-center gap-1.5', meta.color)}>
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="font-display text-xs font-bold uppercase tracking-widest">{meta.label}</span>
              </div>

              <div className="relative flex-1 h-2 rounded-full bg-surface-hover overflow-hidden">
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
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-surface-card" aria-hidden="true" />
                )}
              </div>

              <div className="w-16 shrink-0 text-right">
                <span className={cn('font-mono text-[11px] font-medium', lane.minutes > 0 ? 'text-text-primary' : 'text-text-muted')}>
                  {lane.minutes > 0 ? fmtMinutes(lane.minutes) : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
