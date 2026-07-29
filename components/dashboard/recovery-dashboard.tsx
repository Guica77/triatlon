'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Heart, Moon, Activity, Brain, AlertTriangle, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'
import { RecoveryAnalysis, RecoveryFactor } from '@/lib/recovery-analysis'
import { cn } from '@/lib/utils'

interface RecoveryDashboardProps {
  analysis: RecoveryAnalysis
}

export function RecoveryDashboard({ analysis }: RecoveryDashboardProps) {
  const { overallScore, status, statusLabel, statusColor, factors, recommendations, overtrainingRisk, readinessForHighIntensity, suggestedToday, weeklyTrend } = analysis

  const TrendIcon = weeklyTrend === 'improving' ? TrendingUp : weeklyTrend === 'declining' ? TrendingDown : Minus
  const trendColor = weeklyTrend === 'improving' ? 'text-emerald-400' : weeklyTrend === 'declining' ? 'text-red-400' : 'text-text-muted'

  return (
    <div className="bg-bg-card border border-border-default rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sport-bike/15 border border-sport-bike/15 flex items-center justify-center">
            <Heart className="w-4 h-4 text-sport-bike" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Estado de Recuperación</h3>
            <p className="text-[10px] text-text-muted font-medium">Análisis multifactores</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn('flex items-center gap-1 text-[10px] font-bold', trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {weeklyTrend === 'improving' ? 'Mejorando' : weeklyTrend === 'declining' ? 'Empeorando' : 'Estable'}
          </div>
        </div>
      </div>

      {/* Score ring */}
      <div className="flex items-center gap-6 mb-5">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="#27272a" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="35" fill="none"
              stroke={overallScore >= 70 ? '#22c55e' : overallScore >= 50 ? '#eab308' : '#ef4444'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(overallScore / 100) * 220} 220`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-text-primary">{overallScore}</span>
            <span className={cn('text-[9px] font-bold', statusColor)}>{statusLabel}</span>
          </div>
        </div>

        {/* Today's suggestion */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{suggestedToday.icon}</span>
            <span className="text-sm font-bold text-text-primary">{suggestedToday.label}</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">{suggestedToday.description}</p>
          {readinessForHighIntensity && (
            <div className="mt-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-sport-bike" />
              <span className="text-[10px] text-sport-bike font-bold">Listo para alta intensidad</span>
            </div>
          )}
        </div>
      </div>

      {/* Factors */}
      <div className="space-y-2 mb-4">
        {factors.map((factor, i) => (
          <FactorBar key={i} factor={factor} />
        ))}
      </div>

      {/* Overtraining risk */}
      {overtrainingRisk > 30 && (
        <div className={cn(
          'p-3 rounded-xl border mb-4',
          overtrainingRisk >= 60
            ? 'bg-danger/15 border-danger/15'
            : 'bg-warning/15 border-warning/15'
        )}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn('w-4 h-4', overtrainingRisk >= 60 ? 'text-danger' : 'text-warning')} />
            <span className={cn('text-xs font-bold', overtrainingRisk >= 60 ? 'text-danger' : 'text-warning')}>
              Riesgo de sobreentrenamiento: {overtrainingRisk}%
            </span>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Recomendaciones</p>
          <ul className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-[11px] text-text-muted flex items-start gap-2">
                <span className="text-text-secondary shrink-0">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
    <div className="flex items-center gap-3">
      <div className={cn(
        'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
        factor.status === 'good' ? 'bg-sport-bike/15 text-sport-bike' :
          factor.status === 'warning' ? 'bg-warning/15 text-warning' :
            'bg-danger/15 text-danger'
      )}>
        {iconMap[factor.name] || <Activity className="w-3 h-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-[10px] mb-0.5">
          <span className="text-text-muted font-medium">{factor.name}</span>
          <span className={cn('font-bold', factor.status === 'good' ? 'text-sport-bike' : factor.status === 'warning' ? 'text-warning' : 'text-danger')}>
            {factor.score}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-bg-hover rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${factor.score}%` }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={cn(
              'h-full rounded-full',
              factor.status === 'good' ? 'bg-emerald-500' :
                factor.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
            )}
          />
        </div>
        <p className="text-[9px] text-text-muted mt-0.5">{factor.detail}</p>
      </div>
    </div>
  )
}