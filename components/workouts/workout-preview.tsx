'use client'

import { ChevronDown, Clock3, Dumbbell, Flame, HeartPulse, Repeat2, RotateCcw, Wind } from 'lucide-react'
import {
  formatWorkoutTarget,
  getWorkoutBlockMinutes,
  getWorkoutDuration,
  WorkoutBlock,
  workoutBlockLabels,
} from '@/lib/workout-structure'

const icons = {
  warmup: Flame,
  active: HeartPulse,
  recovery: RotateCcw,
  cooldown: Wind,
  interval: Repeat2,
}

const accents = {
  warmup: 'border-l-warning',
  active: 'border-l-coral-500',
  recovery: 'border-l-bike',
  cooldown: 'border-l-swim',
  interval: 'border-l-purple-400',
}

export function WorkoutPreview({
  title,
  sportType,
  blocks,
  durationMin,
  description,
  compact = false,
}: {
  title: string
  sportType: string
  blocks: WorkoutBlock[]
  durationMin?: number
  description?: string
  compact?: boolean
}) {
  const calculatedDuration = getWorkoutDuration(blocks)
  const totalDuration = calculatedDuration || durationMin || 0

  return (
    <section aria-label="Vista del entrenamiento" className="space-y-4">
      <div className="rounded-2xl border border-border-default bg-surface-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold capitalize text-swim">{sportType || 'Entrenamiento'}</p>
            <h2 className="mt-1 text-xl font-bold leading-tight text-text-primary sm:text-2xl">{title || 'Entrenamiento sin título'}</h2>
          </div>
          <div className="shrink-0 rounded-xl border border-border-default bg-surface-elevated px-3 py-2 text-right">
            <p className="font-mono text-lg font-bold tabular-nums text-text-primary">{totalDuration} min</p>
            <p className="text-xs text-text-secondary">duración</p>
          </div>
        </div>

        {blocks.length > 0 && (
          <div className="mt-5 flex h-12 items-end gap-1 rounded-xl border border-border-subtle bg-bg-app p-2" aria-label="Perfil de intensidad">
            {blocks.map((block) => {
              const zone = block.type === 'interval' ? block.workZone || 4 : block.zone || 1
              const width = `${Math.max(8, (getWorkoutBlockMinutes(block) / Math.max(1, calculatedDuration)) * 100)}%`
              return <span key={block.id} className="rounded-sm bg-coral-500/80" style={{ height: `${20 + zone * 14}%`, width }} />
            })}
          </div>
        )}
      </div>

      {blocks.length > 0 ? (
        <ol className="space-y-3">
          {blocks.map((block, index) => {
            const Icon = icons[block.type]
            return (
              <li key={block.id} className={`rounded-xl border border-border-default border-l-4 ${accents[block.type]} bg-surface-card p-4`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-default bg-surface-elevated">
                    <Icon className="h-5 w-5 text-text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-text-secondary">Bloque {index + 1}</p>
                        <h3 className="text-base font-bold text-text-primary">{workoutBlockLabels[block.type]}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                        <Clock3 className="h-4 w-4 text-text-muted" aria-hidden="true" />
                        {block.type === 'interval'
                          ? `${block.repeats || 1} repeticiones`
                          : formatWorkoutTarget(block.targetType, block.duration, block.distance)}
                      </div>
                    </div>

                    {block.type === 'interval' ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-text-primary">
                          <strong>Trabajo:</strong> {formatWorkoutTarget(block.workTargetType, block.workDuration, block.workDistance)} · Z{block.workZone || 4}
                        </p>
                        <p className="rounded-lg bg-bike/10 px-3 py-2 text-sm text-text-primary">
                          <strong>Recuperación:</strong> {formatWorkoutTarget(block.restTargetType, block.restDuration, block.restDistance)} · Z{block.restZone || 1}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-text-secondary">Objetivo de intensidad: <strong className="text-text-primary">Zona {block.zone || 1}</strong></p>
                    )}

                    {block.notes && (
                      <details className="group mt-3">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-text-secondary">
                          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                          Indicaciones del entrenador
                        </summary>
                        <p className="pb-1 text-sm leading-relaxed text-text-secondary">{block.notes}</p>
                      </details>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        !compact && (
          <div className="rounded-xl border border-dashed border-border-default bg-surface-card p-5">
            <div className="flex items-center gap-3">
              <Dumbbell className="h-5 w-5 text-text-muted" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-text-secondary">{description || 'El entrenador todavía no ha añadido bloques estructurados.'}</p>
            </div>
          </div>
        )
      )}
    </section>
  )
}
