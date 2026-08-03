'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, Circle, Moon, Clock, Flame } from 'lucide-react'
import { SportIllustration } from '@/components/ui/sport-illustration'
import { cn } from '@/lib/utils'

interface WorkoutVisualCardProps {
  sportType: string
  durationMin: number
  status: string
  description?: string
  tss?: number
  intensity?: string
  index?: number
}

const sportCard: Record<string, string> = {
  natacion: 'border-l-swim bg-swim/5',
  ciclismo: 'border-l-bike bg-bike/5',
  carrera: 'border-l-run bg-run/5',
  brick: 'border-l-warning bg-warning/5',
  fuerza: 'border-l-accent bg-accent/5',
  descanso: 'border-l-border-default bg-surface-card',
}

const sportNames: Record<string, string> = {
  natacion: 'Natación',
  ciclismo: 'Ciclismo',
  carrera: 'Carrera',
  brick: 'Brick',
  fuerza: 'Fuerza',
  descanso: 'Descanso',
}

export function WorkoutVisualCard({
  sportType,
  durationMin,
  status,
  description,
  tss,
  intensity,
  index = 0,
}: WorkoutVisualCardProps) {
  const sport = (sportType || '').toLowerCase()
  const isCompleted = status === 'completed'
  const isDescanso = sport === 'descanso'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border-default border-l-4 transition-colors',
        sportCard[sport] || sportCard.descanso
      )}
    >
      <div className="p-4 flex gap-4">
        {/* Illustration */}
        <div className="shrink-0">
          <SportIllustration sport={sport} size="sm" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-text-primary truncate">
              {sportNames[sport] || sportType}
            </h4>
            {intensity && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-surface-hover text-text-secondary border border-border-subtle">
                {intensity}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-text-secondary font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {durationMin} min
            </span>
            {tss && (
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {tss} TSS
              </span>
            )}
          </div>

          {description && (
            <p className="text-[11px] text-text-muted mt-2 line-clamp-2 leading-relaxed">
              {description.substring(0, 120)}{description.length > 120 ? '...' : ''}
            </p>
          )}
        </div>

        {/* Status indicator */}
        <div className="shrink-0 self-start">
          {isCompleted ? (
            <div className="w-7 h-7 rounded-full bg-bike/15 border border-bike/30 flex items-center justify-center">
              <Check className="w-4 h-4 text-bike" />
            </div>
          ) : isDescanso ? (
            <div className="w-7 h-7 rounded-full bg-surface-hover border border-border-subtle flex items-center justify-center">
              <Moon className="w-3.5 h-3.5 text-text-muted" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-surface-hover border border-border-subtle flex items-center justify-center">
              <Circle className="w-3.5 h-3.5 text-text-muted" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
