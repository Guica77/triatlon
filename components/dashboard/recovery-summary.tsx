'use client'

import * as React from 'react'
import { Heart, Activity, Moon, Zap, ChevronRight } from 'lucide-react'
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

  return (
    <Link
      href="/recuperacion"
      className="block bg-surface-card rounded-2xl border border-border-default shadow-card p-4 transition-colors hover:border-border-default/80 group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-bike/15 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-bike" />
          </div>
          <span className="text-xs font-bold text-text-primary">Recuperación</span>
        </div>
        <span className="flex items-center gap-0.5 text-[10px] text-text-muted group-hover:text-text-secondary transition-colors">
          Ver detalle <ChevronRight className="w-3 h-3" />
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {/* Readiness */}
        <div className={cn('rounded-xl p-2.5 text-center border', rc.bg, 'border-transparent')}>
          <p className={cn('text-xl font-black', rc.text)}>{readiness || '--'}</p>
          <p className="text-[8px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Readiness</p>
        </div>

        {/* HRV */}
        <div className="bg-surface-hover rounded-xl p-2.5 text-center">
          <p className="text-xl font-black text-swim">{hrv ?? '--'}</p>
          <p className="text-[8px] text-text-muted font-bold uppercase tracking-wider mt-0.5">HRV</p>
        </div>

        {/* Sleep */}
        <div className="bg-surface-hover rounded-xl p-2.5 text-center">
          <p className="text-xl font-black text-text-primary">{sleepHours ?? '--'}h</p>
          <p className="text-[8px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Sueño</p>
        </div>

        {/* Fatigue */}
        <div className="bg-surface-hover rounded-xl p-2.5 text-center">
          <p className="text-xl font-black text-warning">{fatigue ?? '--'}</p>
          <p className="text-[8px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Fatiga</p>
        </div>
      </div>
    </Link>
  )
}
