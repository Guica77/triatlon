'use client'

import * as React from 'react'
import { Play, Lightbulb, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { ExternalExercise } from '@/lib/exercise-loader'
import { cn } from '@/lib/utils'

interface ExerciseCardProps {
  exercise: ExternalExercise
  index?: number
}

const catColors: Record<string, string> = {
  chest: 'border-l-coral-500',
  back: 'border-l-swim',
  shoulders: 'border-l-bike',
  'upper arms': 'border-l-run',
  'upper legs': 'border-l-swim',
  'lower legs': 'border-l-bike',
  waist: 'border-l-run',
  cardio: 'border-l-bike',
  neck: 'border-l-coral-500',
}

export function ExerciseCard({ exercise, index = 0 }: ExerciseCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [showGif, setShowGif] = React.useState(false)
  const [gifError, setGifError] = React.useState(false)
  const [imgLoaded, setImgLoaded] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)

  // Lazy load via IntersectionObserver
  React.useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect() } },
      { rootMargin: '200px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const borderColor = catColors[exercise.muscleGroup.toLowerCase()] || 'border-l-border-default'

  return (
    <div
      ref={cardRef}
      className={cn(
        'bg-surface-card rounded-xl shadow-card overflow-hidden transition-shadow hover:shadow-card-hover',
        'border-l-4', borderColor
      )}
    >
      {/* Thumbnail / GIF */}
      {isVisible ? (
        <div className="aspect-video w-full bg-surface-hover relative overflow-hidden">
          {showGif && !gifError ? (
            <img
              src={exercise.gifUrl}
              alt={exercise.name}
              className="w-full h-full object-contain"
              onError={() => setGifError(true)}
              loading="lazy"
            />
          ) : (
            <>
              <img
                src={exercise.thumbnailUrl}
                alt={exercise.name}
                className={cn('w-full h-full object-cover transition-opacity duration-300', imgLoaded ? 'opacity-100' : 'opacity-0')}
                onLoad={() => setImgLoaded(true)}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                loading="lazy"
              />
              {!imgLoaded && <div className="absolute inset-0 bg-surface-hover animate-pulse" />}
              <button
                onClick={() => setShowGif(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-coral-500/90 flex items-center justify-center shadow-button group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </div>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="aspect-video w-full bg-surface-hover animate-pulse" />
      )}

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-text-primary truncate">{exercise.name}</h3>
            <p className="text-[10px] text-text-muted font-medium mt-0.5">{exercise.muscleGroup} · {exercise.equipment}</p>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border border-border-default text-text-muted shrink-0">{exercise.category}</span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{exercise.instructions}</p>

        <div className="flex gap-2">
          <button onClick={() => setShowGif(!showGif)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-coral-500/10 text-coral-500 hover:bg-coral-500/20 transition-colors cursor-pointer">
            <Play className="w-3 h-3" />{showGif ? 'Ocultar' : 'Ver Ejercicio'}
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-surface-hover text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
            <Lightbulb className="w-3 h-3" />{expanded ? 'Menos' : 'Más'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {expanded && (
          <div className="space-y-2 pt-1">
            <div className="p-3 rounded-lg bg-surface-hover border border-border-subtle">
              <p className="text-[9px] font-bold text-coral-500 uppercase tracking-wider mb-1.5">🛠️ Ejecución</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">{exercise.instructions}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-hover border border-border-subtle">
              <p className="text-[9px] font-bold text-bike uppercase tracking-wider mb-1.5">🎯 Objetivo</p>
              <p className="text-[11px] text-text-primary font-medium">{exercise.target}</p>
            </div>
            {exercise.secondaryMuscles && (
              <div className="p-3 rounded-lg bg-surface-hover border border-border-subtle">
                <p className="text-[9px] font-bold text-swim uppercase tracking-wider mb-1.5">🔗 Secundarios</p>
                <p className="text-[11px] text-text-secondary">{exercise.secondaryMuscles}</p>
              </div>
            )}
          </div>
        )}

        {/* Attribution */}
        {exercise.attribution && (
          <div className="pt-2 border-t border-border-subtle/50">
            <a href={exercise.attribution.replace(/.*https?:\/\//, 'https://')} target="_blank" rel="noopener noreferrer"
              className="text-[8px] text-text-muted hover:text-text-secondary flex items-center gap-1 transition-colors">
              <ExternalLink className="w-2 h-2" />
              {exercise.attribution}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
