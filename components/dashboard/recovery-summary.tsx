'use client'

import * as React from 'react'
import { Heart, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RecoverySummaryProps {
  readinessScore?: number | null
  hrv?: number | null
  sleepHours?: number | null
  fatigue?: number | null
}

function scoreColor(v: number): { text: string; bg: string } {
  if (v >= 70) return { text: 'text-bike', bg: 'bg-bike/15' }
  if (v >= 50) return { text: 'text-warning', bg: 'bg-warning/15' }
  return { text: 'text-run', bg: 'bg-run/15' }
}

export function RecoverySummary({ readinessScore, hrv, sleepHours, fatigue }: RecoverySummaryProps) {
  const readiness = readinessScore ?? 0
  const rc = scoreColor(readiness)
  const hasData = readinessScore !== null && readinessScore !== undefined
  const recommendation = !hasData
    ? 'Completa el check-in o sincroniza tu dispositivo para recibir una recomendación.'
    : readiness >= 70
      ? 'Buena recuperación. Puedes seguir el entrenamiento previsto.'
      : readiness >= 50
        ? 'Recuperación moderada. Prioriza la técnica y evita forzar si empeoran las sensaciones.'
        : 'Recuperación baja. Reduce intensidad y consulta los detalles antes de entrenar.'

  return (
    <Link
      href="/recuperacion"
      className="group block rounded-2xl border border-border-default bg-surface-card p-4 transition-[border-color,box-shadow,background-color] duration-150 ease-out hover:border-border-default/80 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app sm:p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-bike/20 bg-bike/15">
            <Heart className="h-4 w-4 text-bike" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="font-display text-base font-semibold tracking-tight text-text-primary">Cómo estás hoy</span>
            <p className="mt-0.5 truncate text-xs text-text-secondary">Recuperación y preparación</p>
          </div>
        </div>
        <span className="flex min-h-11 shrink-0 items-center gap-0.5 text-xs font-semibold text-text-muted transition-colors group-hover:text-text-secondary">
          Ver detalle <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Readiness is the primary signal; the remaining cells provide context. */}
        <div
          className={cn('col-span-2 rounded-xl border p-3 text-left sm:col-span-1 sm:text-center', rc.bg, 'border-transparent')}
          aria-label={hasData ? `Readiness ${readiness} sobre 100` : 'Readiness sin datos'}
        >
          <div className="flex items-end justify-between gap-2 sm:block">
            <p className={cn('font-display text-4xl font-black leading-none tracking-tight tabular-nums', rc.text)}>{readiness || '--'}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted sm:mt-1">Readiness</p>
          </div>
          {!hasData && <p className="mt-1.5 text-[11px] leading-snug text-text-secondary">Sin check-in</p>}
        </div>

        {/* HRV */}
        <div className="rounded-xl border border-border-subtle bg-surface-hover p-2.5 text-center" aria-label={`HRV: ${hrv ?? 'sin datos'}`}>
          <p className="font-display text-2xl font-black leading-none tabular-nums text-swim">{hrv ?? '--'}</p>
          <p className="mt-1 text-xs font-semibold text-text-muted">HRV</p>
        </div>

        {/* Sleep */}
        <div className="rounded-xl border border-border-subtle bg-surface-hover p-2.5 text-center" aria-label={`Sueño: ${sleepHours !== null && sleepHours !== undefined ? `${sleepHours} horas` : 'sin datos'}`}>
          <p className="font-display text-2xl font-black leading-none tabular-nums text-text-primary">{sleepHours !== null && sleepHours !== undefined ? `${sleepHours}h` : '--'}</p>
          <p className="mt-1 text-xs font-semibold text-text-muted">Sueño</p>
        </div>

        {/* Fatigue */}
        <div className="rounded-xl border border-border-subtle bg-surface-hover p-2.5 text-center" aria-label={`Fatiga: ${fatigue ?? 'sin datos'}`}>
          <p className="font-display text-2xl font-black leading-none tabular-nums text-warning">{fatigue ?? '--'}</p>
          <p className="mt-1 text-xs font-semibold text-text-muted">Fatiga</p>
        </div>
      </div>
      <div className={cn(
        'mt-3 rounded-xl border p-3 text-sm leading-relaxed',
        !hasData
          ? 'border-border-default bg-surface-hover text-text-secondary'
          : readiness >= 70
            ? 'border-bike/20 bg-bike/5 text-text-primary'
            : readiness >= 50
              ? 'border-warning/20 bg-warning/5 text-text-primary'
              : 'border-run/20 bg-run/5 text-text-primary',
      )}>
        {recommendation}
      </div>
    </Link>
  )
}
