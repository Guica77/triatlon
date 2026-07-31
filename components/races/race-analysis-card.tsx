'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Target, TrendingUp, TrendingDown, Clock, Zap, Check, AlertTriangle } from 'lucide-react'
import { RaceAnalysis, formatDuration, formatPace, RACE_TYPES } from '@/lib/race-analysis'
import { cn } from '@/lib/utils'

interface RaceAnalysisCardProps {
  analysis: RaceAnalysis
}

export function RaceAnalysisCard({ analysis }: RaceAnalysisCardProps) {
  const { race, overallRating, strengths, weaknesses, recommendations, segmentAnalysis, vsGoal } = analysis

  return (
    <div className="bg-surface-card/80 border border-border-subtle rounded-2xl overflow-hidden">
      {/* Header with race info */}
      <div className="p-5 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-warning/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">{race.name}</h3>
              <p className="text-[10px] text-text-secondary font-medium">
                {RACE_TYPES[race.type]?.name || race.type} • {race.date}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-text-primary">{formatDuration(race.totalDuration)}</p>
            {race.placement && (
              <p className="text-[10px] text-text-secondary font-medium">
                Puesto {race.placement}/{race.totalParticipants}
              </p>
            )}
          </div>
        </div>

        {/* Overall Rating */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-text-secondary font-medium">Calificación General</span>
              <span className="text-text-primary font-bold">{overallRating}/10</span>
            </div>
            <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallRating * 10}%` }}
                transition={{ duration: 0.8 }}
                className={cn(
                  'h-full rounded-full',
                  overallRating >= 7 ? 'bg-bike' :
                    overallRating >= 5 ? 'bg-warning' : 'bg-danger'
                )}
              />
            </div>
          </div>
          {race.goalTime && (
            <div className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-bold border',
              vsGoal.achieved
                ? 'bg-bike/10 text-bike border-bike/20'
                : 'bg-danger/10 text-danger border-danger/20'
            )}>
              {vsGoal.achieved ? '✓ Objetivo cumplido' : `${Math.abs(vsGoal.percentage)}% sobre objetivo`}
            </div>
          )}
        </div>
      </div>

      {/* Segment Analysis */}
      <div className="p-5 space-y-3">
        <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Análisis por Segmento</h4>
        {segmentAnalysis.map((seg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover/50 border border-border-default"
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              seg.rating >= 7 ? 'bg-bike/10 text-bike' :
                seg.rating >= 5 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
            )}>
              <span className="text-xs font-black">{seg.rating}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-text-primary">{seg.segment.name}</p>
                <span className="text-[10px] text-text-secondary">{formatDuration(seg.segment.duration)}</span>
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">{seg.comment}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Strengths & Weaknesses */}
      <div className="p-5 border-t border-border-subtle grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold text-bike uppercase tracking-wider mb-2">✓ Fortalezas</p>
          {strengths.length > 0 ? (
            <ul className="space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="text-[11px] text-text-muted flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-bike shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] text-text-secondary">Ninguna detectada</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold text-warning uppercase tracking-wider mb-2">⚠ A Mejorar</p>
          {weaknesses.length > 0 ? (
            <ul className="space-y-1">
              {weaknesses.map((w, i) => (
                <li key={i} className="text-[11px] text-text-muted flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] text-text-secondary">Todo sólido</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="p-5 border-t border-border-subtle">
          <p className="text-[10px] font-bold text-swim uppercase tracking-wider mb-2">💡 Recomendaciones</p>
          <ul className="space-y-1.5">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-[11px] text-text-muted flex items-start gap-2">
                <span className="text-swim shrink-0">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}