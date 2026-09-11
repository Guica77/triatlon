'use client'

import * as React from 'react'
import { Heart, Moon, Activity, Brain, AlertTriangle, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'
import { RecoveryAnalysis, RecoveryFactor } from '@/lib/recovery-analysis'
import { cn } from '@/lib/utils'

interface RecoveryDashboardProps {
  analysis: RecoveryAnalysis
}

export function RecoveryDashboard({ analysis }: RecoveryDashboardProps) {
  const { factors, recommendations, overtrainingRisk, readinessForHighIntensity, suggestedToday, weeklyTrend } = analysis

  const TrendIcon = weeklyTrend === 'improving' ? TrendingUp : weeklyTrend === 'declining' ? TrendingDown : Minus
  const trendColor = weeklyTrend === 'improving' ? 'text-emerald-600' : weeklyTrend === 'declining' ? 'text-red-600' : 'text-text-muted'

  return (
    <section aria-labelledby="recovery-heading">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 id="recovery-heading" className="text-base font-semibold text-text-primary">Recuperación</h2>
          <p className="mt-0.5 text-sm text-text-secondary">Contexto para la sesión de hoy</p>
        </div>
        <div className={cn('flex items-center gap-1.5 text-sm font-medium', trendColor)}>
          <TrendIcon className="h-4 w-4" aria-hidden="true" />
          {weeklyTrend === 'improving' ? 'Mejorando' : weeklyTrend === 'declining' ? 'Empeorando' : 'Estable'}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card">
        <div className="flex items-start gap-3 px-5 py-4">
          <Heart className="mt-0.5 h-5 w-5 shrink-0 text-bike" aria-hidden="true" />
          <div>
            <p className="text-base font-semibold text-text-primary">{suggestedToday.label}</p>
            <p className="mt-1 text-sm leading-6 text-text-secondary">{suggestedToday.description}</p>
          </div>
        </div>
        {readinessForHighIntensity && (
          <div className="border-t border-border-subtle px-5 py-3 text-sm font-medium text-bike">
            Preparado para una sesión de intensidad alta
          </div>
        )}
        <div className="border-t border-border-subtle">
        {factors.map((factor, i) => (
          <FactorBar key={i} factor={factor} />
        ))}
        </div>

        {overtrainingRisk > 30 && (
          <div className={cn(
          'border-t px-5 py-3 text-sm',
          overtrainingRisk >= 60
            ? 'text-danger'
            : 'text-warning'
        )}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn('w-4 h-4', overtrainingRisk >= 60 ? 'text-danger' : 'text-warning')} />
            <span className="font-medium">
              Riesgo de sobreentrenamiento: {overtrainingRisk}%
            </span>
          </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="border-t border-border-subtle px-5 py-4">
          <p className="text-sm font-medium text-text-primary">Para hoy</p>
          <ul className="mt-2 space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-5 text-text-secondary">
                <span className="mt-0.5 shrink-0">•</span>
                {rec}
              </li>
            ))}
          </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function FactorBar({ factor }: { factor: RecoveryFactor }) {
  const iconMap: Record<string, React.ReactNode> = {
    'HRV': <Activity className="w-3 h-3" />,
    'Sueño': <Moon className="w-3 h-3" />,
    'Readiness': <Brain className="w-3 h-3" />,
    'Fatiga': <Zap className="w-3 h-3" />,
    'FC Reposo': <Heart className="w-3 h-3" />,
  }

  return (
    <div className="flex items-center gap-3 border-b border-border-subtle px-5 py-3 last:border-b-0">
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover',
        factor.status === 'good' ? 'text-bike' : factor.status === 'warning' ? 'text-warning' : 'text-danger'
      )}>
        {iconMap[factor.name] || <Activity className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{factor.name}</p>
        <p className="truncate text-xs text-text-muted">{factor.detail}</p>
      </div>
      <span className={cn('text-sm font-semibold tabular-nums', factor.status === 'good' ? 'text-bike' : factor.status === 'warning' ? 'text-warning' : 'text-danger')}>
        {factor.score}
      </span>
    </div>
  )
}
