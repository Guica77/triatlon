'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { BadgeCheck, getEarnedCount } from '@/lib/badges'
import { cn } from '@/lib/utils'

interface BadgesGridProps {
  badges: BadgeCheck[]
}

export function BadgesGrid({ badges }: BadgesGridProps) {
  const [expanded, setExpanded] = React.useState(false)
  const earnedCount = getEarnedCount(badges)
  const totalCount = badges.length
  const earned = badges.filter(b => b.earned)
  const locked = badges.filter(b => !b.earned)

  const displayBadges = expanded ? badges : earned.slice(0, 6)

  return (
    <div className="bg-surface-card border border-border-subtle rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <Award className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Logros</h3>
            <p className="text-[10px] text-text-secondary font-medium">
              {earnedCount} de {totalCount} desbloqueados
            </p>
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="#374151" strokeWidth="4" />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#e56a00"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(earnedCount / totalCount) * 125.66} 125.66`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black text-text-primary">{earnedCount}</span>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <AnimatePresence>
          {displayBadges.map((item, i) => (
            <motion.div
              key={item.badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                item.earned
                  ? item.badge.bgColor
                  : 'bg-surface-hover/50 border-border-subtle/50 opacity-50'
              )}
              title={item.earned ? `${item.badge.name}: ${item.badge.description}` : item.badge.name}
            >
              {/* Badge icon */}
              <div className="text-2xl">{item.badge.icon}</div>

              {/* Name */}
              <p className={cn(
                'text-[10px] font-bold text-center leading-tight',
                item.earned ? 'text-text-primary' : 'text-text-muted'
              )}>
                {item.badge.name}
              </p>

              {/* Lock indicator */}
              {!item.earned && (
                <div className="absolute top-1.5 right-1.5">
                  <Lock className="w-3 h-3 text-text-muted" />
                </div>
              )}

              {/* Progress bar for locked badges */}
              {!item.earned && item.progress !== undefined && item.progress > 0 && (
                <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-text-secondary rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Toggle */}
      {badges.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Ver todos ({totalCount})
            </>
          )}
        </button>
      )}

      {/* Empty state */}
      {earnedCount === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-text-secondary font-medium">
            ¡Empieza a entrenar para desbloquear tus primeros logros!
          </p>
        </div>
      )}
    </div>
  )
}
