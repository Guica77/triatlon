'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Play, Clock, Dumbbell, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { Exercise, SPORT_NAMES, LEVEL_NAMES } from '@/lib/exercises-db'
import { SportIllustration } from '@/components/ui/sport-illustration'
import { cn } from '@/lib/utils'

interface ExerciseCardProps {
  exercise: Exercise
  index?: number
}

const sportColors: Record<string, string> = {
  natacion: 'border-l-blue-500',
  ciclismo: 'border-l-emerald-500',
  carrera: 'border-l-red-500',
  fuerza: 'border-l-purple-500',
  movilidad: 'border-l-amber-500',
  brick: 'border-l-yellow-500',
}

const levelColors: Record<string, string> = {
  principiante: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  intermedio: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  avanzado: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function ExerciseCard({ exercise, index = 0 }: ExerciseCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [showVideo, setShowVideo] = React.useState(false)
  const [imgError, setImgError] = React.useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'bg-bg-card border border-border-default rounded-xl overflow-hidden transition-all hover:border-border-default/60',
        'border-l-4',
        sportColors[exercise.sport] || 'border-l-zinc-500'
      )}
    >
      {/* Video embed or thumbnail */}
      {showVideo && (
        <div className="aspect-video w-full">
          {exercise.externalGif ? (
            <div className="relative w-full h-full bg-zinc-800 flex items-center justify-center">
              {!imgError ? (
                <img
                  src={exercise.externalGif}
                  alt={exercise.name}
                  className="max-w-full max-h-full object-contain"
                  onError={() => setImgError(true)}
                />
              ) : exercise.externalImage ? (
                <img
                  src={exercise.externalImage}
                  alt={exercise.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <p className="text-xs text-text-muted">GIF no disponible</p>
              )}
            </div>
          ) : exercise.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${exercise.youtubeId}?autoplay=1&rel=0`}
              title={exercise.name}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
              <p className="text-xs text-text-muted">Vista previa no disponible</p>
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0">
            <SportIllustration sport={exercise.sport} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-white truncate">{exercise.name}</h3>
              <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0', levelColors[exercise.level])}>
                {LEVEL_NAMES[exercise.level]}
              </span>
            </div>
            <p className="text-[10px] text-text-muted font-medium">
              {SPORT_NAMES[exercise.sport]} • {exercise.muscleGroup}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-text-secondary leading-relaxed mb-3">
          {exercise.description}
        </p>

        {/* Quick info */}
        <div className="flex items-center gap-4 mb-3 text-[10px] text-text-muted font-medium">
          {exercise.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {exercise.duration}
            </span>
          )}
          {exercise.sets && (
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3" />
              {exercise.sets}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-sport-run/10 text-sport-run border border-sport-run/20 hover:bg-red-500/20 transition-colors"
          >
            <Play className="w-3 h-3" />
            {showVideo ? 'Ocultar Video' : 'Ver Video'}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-zinc-800 text-text-secondary border border-zinc-700 hover:text-text-primary transition-colors"
          >
            <Lightbulb className="w-3 h-3" />
            {expanded ? 'Ocultar' : 'Consejos'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expanded content */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 space-y-3"
          >
            {/* Coach tips */}
            <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2">💡 Consejos del Coach</p>
              <ul className="space-y-1.5">
                {exercise.coachTips.map((tip, i) => (
                  <li key={i} className="text-[11px] text-text-secondary flex items-start gap-2">
                    <span className="text-cyan-500 shrink-0">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Equipment */}
            <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">🎒 Equipamiento</p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.equipment.map((item, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-bg-hover text-[10px] text-text-primary font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}