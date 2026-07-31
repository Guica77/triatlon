'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, Flame } from 'lucide-react'
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

const sportColors: Record<string, string> = {
  natacion: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
  ciclismo: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
  carrera: 'from-red-500/20 to-red-600/5 border-red-500/20',
  brick: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
  fuerza: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
  descanso: 'from-zinc-500/20 to-zinc-600/5 border-zinc-500/20',
}

const sportNames: Record<string, string> = {
  natacion: 'Natación',
  ciclismo: 'Ciclismo',
  carrera: 'Carrera',
  brick: 'Brick',
  fuerza: 'Fuerza',
  descanso: 'Descanso',
}

const sportBorders: Record<string, string> = {
  natacion: 'border-l-blue-500',
  ciclismo: 'border-l-emerald-500',
  carrera: 'border-l-red-500',
  brick: 'border-l-amber-500',
  fuerza: 'border-l-purple-500',
  descanso: 'border-l-zinc-500',
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
        'relative overflow-hidden rounded-2xl border transition-all duration-200',
        'bg-gradient-to-br',
        sportColors[sport] || sportColors.descanso,
        'border-l-4',
        sportBorders[sport] || 'border-l-zinc-500',
        isCompleted && 'ring-1 ring-emerald-500/30'
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
            <h4 className="text-sm font-bold text-white truncate">
              {sportNames[sport] || sportType}
            </h4>
            {intensity && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-text-secondary">
                {intensity}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-medium">
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
            <p className="text-[11px] text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
              {description.substring(0, 120)}{description.length > 120 ? '...' : ''}
            </p>
          )}
        </div>

        {/* Status indicator */}
        <div className="shrink-0 self-start">
          {isCompleted ? (
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
          ) : isDescanso ? (
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <span className="text-xs">😴</span>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <span className="text-xs">○</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}