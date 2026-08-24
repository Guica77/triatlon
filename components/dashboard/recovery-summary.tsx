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
      className="block bg-surface-card rounded-2xl border border-border-default p-4 transition-colors hover:border-border-default/80 group"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-bike/15 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-bike" />
          </div>
          <div><span className="font-display text-base font-semibold tracking-tight text-text-primary">Cómo estás hoy</span><p className="text-xs text-text-secondary">Recuperación y preparación</p></div>
        </div>
        <span className="flex min-h-11 items-center gap-0.5 text-xs font-semibold text-text-muted transition-colors group-hover:text-text-secondary">
          Ver detalle <ChevronRight className="w-3 h-3" />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* Readiness */}
        <div className={cn('rounded-lg p-2.5 text-center border', rc.bg, 'border-transparent')}>
          <p className={cn('font-display text-2xl font-black leading-none', rc.text)}>{readiness || '--'}</p>
          <p className="mt-1 text-xs font-semibold text-text-muted">Readiness</p>
        </div>

        {/* HRV */}
        <div className="bg-surface-hover border border-border-subtle rounded-lg p-2.5 text-center">
          <p className="font-display text-2xl font-black leading-none text-swim">{hrv ?? '--'}</p>
          <p className="mt-1 text-xs font-semibold text-text-muted">HRV</p>
        </div>

        {/* Sleep */}
        <div className="bg-surface-hover border border-border-subtle rounded-lg p-2.5 text-center">
          <p className="font-display text-2xl font-black leading-none text-text-primary">{sleepHours ?? '--'}h</p>
          <p className="mt-1 text-xs font-semibold text-text-muted">Sueño</p>
        </div>

        {/* Fatigue */}
        <div className="bg-surface-hover border border-border-subtle rounded-lg p-2.5 text-center">
          <p className="font-display text-2xl font-black leading-none text-warning">{fatigue ?? '--'}</p>
          <p className="mt-1 text-xs font-semibold text-text-muted">Fatiga</p>
        </div>
      </div>
      <div className={`mt-3 rounded-xl border p-3 text-sm leading-relaxed ${!hasData ? 'border-border-default bg-surface-hover text-text-secondary' : readiness >= 70 ? 'border-bike/20 bg-bike/5 text-text-primary' : readiness >= 50 ? 'border-warning/20 bg-warning/5 text-text-primary' : 'border-run/20 bg-run/5 text-text-primary'}`}>
        {recommendation}
      </div>
    </Link>
  )
}
