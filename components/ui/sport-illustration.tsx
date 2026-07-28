'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SportIllustrationProps {
  sport: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animated?: boolean
}

const sizeMap = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
}

// Professional SVG illustrations for each sport
const illustrations: Record<string, React.FC<{ className?: string }>> = {
  natacion: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" className={className}>
      {/* Water waves */}
      <path d="M10 80 Q30 70 50 80 Q70 90 90 80 Q110 70 120 80" stroke="#00a2e8" strokeWidth="2" fill="none" opacity="0.3">
        <animate attributeName="d" dur="3s" repeatCount="indefinite" values="M10 80 Q30 70 50 80 Q70 90 90 80 Q110 70 120 80;M10 80 Q30 90 50 80 Q70 70 90 80 Q110 90 120 80;M10 80 Q30 70 50 80 Q70 90 90 80 Q110 70 120 80" />
      </path>
      <path d="M0 90 Q20 80 40 90 Q60 100 80 90 Q100 80 120 90" stroke="#00a2e8" strokeWidth="1.5" fill="none" opacity="0.2">
        <animate attributeName="d" dur="4s" repeatCount="indefinite" values="M0 90 Q20 80 40 90 Q60 100 80 90 Q100 80 120 90;M0 90 Q20 100 40 90 Q60 80 80 90 Q100 100 120 90;M0 90 Q20 80 40 90 Q60 100 80 90 Q100 80 120 90" />
      </path>
      {/* Swimmer body */}
      <circle cx="45" cy="55" r="8" fill="#00a2e8" />
      <path d="M53 55 L80 48 Q85 46 82 52 L53 58" fill="#00a2e8" opacity="0.9" />
      {/* Arms */}
      <path d="M40 50 Q30 35 25 45" stroke="#00a2e8" strokeWidth="3" strokeLinecap="round" fill="none">
        <animate attributeName="d" dur="1.5s" repeatCount="indefinite" values="M40 50 Q30 35 25 45;M40 50 Q35 30 30 38;M40 50 Q30 35 25 45" />
      </path>
      {/* Splash */}
      <circle cx="25" cy="42" r="2" fill="#00a2e8" opacity="0.4" />
      <circle cx="20" cy="38" r="1.5" fill="#00a2e8" opacity="0.3" />
    </svg>
  ),

  ciclismo: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" className={className}>
      {/* Back wheel */}
      <circle cx="35" cy="80" r="20" stroke="#2ecc71" strokeWidth="3" fill="none" />
      <circle cx="35" cy="80" r="2" fill="#2ecc71" />
      {/* Front wheel */}
      <circle cx="85" cy="80" r="20" stroke="#2ecc71" strokeWidth="3" fill="none" />
      <circle cx="85" cy="80" r="2" fill="#2ecc71" />
      {/* Frame */}
      <path d="M35 80 L55 50 L85 80 L55 50 L70 50 L85 80" stroke="#2ecc71" strokeWidth="3" strokeLinejoin="round" fill="none" />
      <path d="M35 80 L55 80" stroke="#2ecc71" strokeWidth="2" fill="none" />
      {/* Handlebars */}
      <path d="M70 50 L75 42 L80 42" stroke="#2ecc71" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Seat */}
      <path d="M50 48 L60 48" stroke="#2ecc71" strokeWidth="3" strokeLinecap="round" />
      {/* Rider */}
      <circle cx="55" cy="35" r="6" fill="#2ecc71" />
      <path d="M55 41 L55 50" stroke="#2ecc71" strokeWidth="2" />
      {/* Motion lines */}
      <path d="M15 75 L5 75" stroke="#2ecc71" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <path d="M15 80 L3 80" stroke="#2ecc71" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <path d="M15 85 L7 85" stroke="#2ecc71" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
    </svg>
  ),

  carrera: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" className={className}>
      {/* Ground */}
      <path d="M10 100 L110 100" stroke="#e74c3c" strokeWidth="2" opacity="0.3" />
      {/* Runner body */}
      <circle cx="55" cy="30" r="8" fill="#e74c3c" />
      {/* Torso */}
      <path d="M55 38 L50 65" stroke="#e74c3c" strokeWidth="3" strokeLinecap="round" />
      {/* Front leg */}
      <path d="M50 65 L35 85 L30 98" stroke="#e74c3c" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Back leg */}
      <path d="M50 65 L65 82 L75 95" stroke="#e74c3c" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Arms */}
      <path d="M52 45 L35 55" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M52 45 L68 38" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round" />
      {/* Motion lines */}
      <path d="M85 40 L100 38" stroke="#e74c3c" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <path d="M82 50 L98 49" stroke="#e74c3c" strokeWidth="1.5" opacity="0.25" strokeLinecap="round" />
      <path d="M80 60 L95 60" stroke="#e74c3c" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
      {/* Speed effect */}
      <path d="M20 35 L10 33" stroke="#e74c3c" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
      <path d="M22 45 L12 44" stroke="#e74c3c" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
    </svg>
  ),

  brick: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" className={className}>
      {/* Lightning bolt effect */}
      <path d="M60 10 L50 50 L65 48 L55 90" stroke="#f39c12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M60 10 L50 50 L65 48 L55 90" stroke="#f39c12" strokeWidth="6" opacity="0.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Transition arrows */}
      <path d="M25 60 L40 60" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M80 60 L95 60" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      {/* Bike icon */}
      <circle cx="25" cy="65" r="8" stroke="#f39c12" strokeWidth="1.5" fill="none" opacity="0.6" />
      <circle cx="25" cy="65" r="1.5" fill="#f39c12" opacity="0.6" />
      {/* Run icon */}
      <circle cx="95" cy="58" r="3" fill="#f39c12" opacity="0.6" />
      <path d="M95 61 L92 72 L88 80 M95 61 L98 72 L102 80" stroke="#f39c12" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      {/* Energy particles */}
      <circle cx="40" cy="30" r="1.5" fill="#f39c12" opacity="0.4" />
      <circle cx="80" cy="25" r="1" fill="#f39c12" opacity="0.3" />
      <circle cx="35" cy="90" r="1" fill="#f39c12" opacity="0.3" />
    </svg>
  ),

  fuerza: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" className={className}>
      {/* Dumbbell */}
      <rect x="25" y="52" width="15" height="16" rx="3" fill="#9b59b6" />
      <rect x="80" y="52" width="15" height="16" rx="3" fill="#9b59b6" />
      <rect x="38" y="56" width="44" height="8" rx="2" fill="#9b59b6" opacity="0.8" />
      {/* Weight plates */}
      <rect x="18" y="48" width="10" height="24" rx="2" fill="#9b59b6" opacity="0.9" />
      <rect x="92" y="48" width="10" height="24" rx="2" fill="#9b59b6" opacity="0.9" />
      {/* Person lifting */}
      <circle cx="60" cy="25" r="7" fill="#9b59b6" />
      <path d="M60 32 L60 48" stroke="#9b59b6" strokeWidth="2.5" />
      {/* Arms up */}
      <path d="M55 38 L35 50" stroke="#9b59b6" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M65 38 L85 50" stroke="#9b59b6" strokeWidth="2.5" strokeLinecap="round" />
      {/* Strength effect */}
      <path d="M45 15 L50 10 L55 18" stroke="#9b59b6" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <path d="M65 15 L70 10 L75 18" stroke="#9b59b6" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
    </svg>
  ),

  descanso: ({ className }) => (
    <svg viewBox="0 0 120 120" fill="none" className={className}>
      {/* Moon */}
      <circle cx="60" cy="45" r="18" fill="#71717a" opacity="0.3" />
      <circle cx="68" cy="40" r="14" fill="#18181b" />
      {/* Stars */}
      <circle cx="30" cy="30" r="1.5" fill="#71717a" opacity="0.5" />
      <circle cx="85" cy="25" r="1" fill="#71717a" opacity="0.4" />
      <circle cx="40" cy="55" r="1" fill="#71717a" opacity="0.3" />
      <circle cx="80" cy="60" r="1.5" fill="#71717a" opacity="0.4" />
      {/* Cloud */}
      <ellipse cx="55" cy="75" rx="20" ry="8" fill="#71717a" opacity="0.15" />
      <ellipse cx="65" cy="72" rx="15" ry="6" fill="#71717a" opacity="0.1" />
      {/* Zzz */}
      <text x="75" y="85" fill="#71717a" fontSize="12" fontWeight="bold" opacity="0.4">z</text>
      <text x="82" y="78" fill="#71717a" fontSize="10" fontWeight="bold" opacity="0.3">z</text>
      <text x="88" y="72" fill="#71717a" fontSize="8" fontWeight="bold" opacity="0.2">z</text>
    </svg>
  ),
}

export function SportIllustration({ sport, size = 'md', className, animated = true }: SportIllustrationProps) {
  const sportLower = (sport || '').toLowerCase()
  const Illustration = illustrations[sportLower] || illustrations.descanso

  return (
    <div className={cn(sizeMap[size], 'relative', className)}>
      <Illustration className="w-full h-full" />
    </div>
  )
}