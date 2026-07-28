/**
 * Badges System — Gamification for Triatlon Pro
 *
 * Each badge has:
 * - id: unique identifier
 * - name: display name in Spanish
 * - description: what the badge means
 * - icon: emoji
 * - color: tailwind classes
 * - condition: function that checks if the athlete qualifies
 */

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  bgColor: string
}

export interface BadgeCheck {
  badge: Badge
  earned: boolean
  progress?: number // 0-100
  earnedAt?: string
}

// ============================================================
// Badge Definitions
// ============================================================

export const ALL_BADGES: Badge[] = [
  // Constancia
  {
    id: 'first-session',
    name: 'Primera Sesión',
    description: 'Completa tu primer entrenamiento',
    icon: '🎯',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    id: 'week-streak-3',
    name: 'Constante',
    description: '3 semanas seguidas cumpliendo el plan',
    icon: '🔥',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    id: 'week-streak-7',
    name: 'Inquebrantable',
    description: '7 semanas seguidas cumpliendo el plan',
    icon: '💎',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    id: 'week-streak-12',
    name: 'Leyenda',
    description: '12 semanas seguidas cumpliendo el plan',
    icon: '👑',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
  },
  // Volumen
  {
    id: 'tss-1000',
    name: 'Guerrero del TSS',
    description: 'Acumula 1,000 TSS en total',
    icon: '⚔️',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/20',
  },
  {
    id: 'tss-5000',
    name: 'Máquina de Entrenamiento',
    description: 'Acumula 5,000 TSS en total',
    icon: '🏋️',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'tss-10000',
    name: 'Ultra Resistente',
    description: 'Acumula 10,000 TSS en total',
    icon: '🚀',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
  // Disciplina
  {
    id: 'all-three',
    name: 'Triatleta Completo',
    description: 'Completa natación, ciclismo y carrera en una semana',
    icon: '🏊🚴🏃',
    color: 'text-cyan-400',
    bgColor: 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
  },
  {
    id: 'brick-master',
    name: 'Brick Master',
    description: 'Completa 10 sesiones brick (bike+run)',
    icon: '⚡',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20',
  },
  // Rendimiento
  {
    id: 'fitness-peak',
    name: 'Punto Máximo',
    description: 'Alcanza un CTL superior a 80',
    icon: '📈',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/20',
  },
  {
    id: 'hrv-champion',
    name: 'Recuperación Activa',
    description: 'Mantén HRV > 70 durante 7 días seguidos',
    icon: '💚',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
  },
  // Social
  {
    id: 'first-coach',
    name: 'Bajo Supervisión',
    description: 'Te vinculas con un entrenador',
    icon: '🤝',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    id: 'onboarding-done',
    name: 'Listo para Entrenar',
    description: 'Completa el onboarding con tus datos',
    icon: '✅',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
  },
]

// ============================================================
// Badge Evaluation
// ============================================================

interface AthleteStats {
  totalWorkoutsCompleted: number
  totalTss: number
  consecutiveWeeksCompliant: number
  currentCtl: number
  currentHrv: number
  hasCoach: boolean
  onboardingDone: boolean
  hasAllThreeSports: boolean
  brickSessionsCount: number
  recentHrvDays: number // days with HRV > 70 in last 7
}

export function evaluateBadges(stats: AthleteStats): BadgeCheck[] {
  return ALL_BADGES.map(badge => {
    let earned = false
    let progress = 0

    switch (badge.id) {
      case 'first-session':
        earned = stats.totalWorkoutsCompleted >= 1
        progress = Math.min(100, stats.totalWorkoutsCompleted * 100)
        break
      case 'week-streak-3':
        earned = stats.consecutiveWeeksCompliant >= 3
        progress = Math.min(100, Math.round((stats.consecutiveWeeksCompliant / 3) * 100))
        break
      case 'week-streak-7':
        earned = stats.consecutiveWeeksCompliant >= 7
        progress = Math.min(100, Math.round((stats.consecutiveWeeksCompliant / 7) * 100))
        break
      case 'week-streak-12':
        earned = stats.consecutiveWeeksCompliant >= 12
        progress = Math.min(100, Math.round((stats.consecutiveWeeksCompliant / 12) * 100))
        break
      case 'tss-1000':
        earned = stats.totalTss >= 1000
        progress = Math.min(100, Math.round((stats.totalTss / 1000) * 100))
        break
      case 'tss-5000':
        earned = stats.totalTss >= 5000
        progress = Math.min(100, Math.round((stats.totalTss / 5000) * 100))
        break
      case 'tss-10000':
        earned = stats.totalTss >= 10000
        progress = Math.min(100, Math.round((stats.totalTss / 10000) * 100))
        break
      case 'all-three':
        earned = stats.hasAllThreeSports
        progress = stats.hasAllThreeSports ? 100 : 0
        break
      case 'brick-master':
        earned = stats.brickSessionsCount >= 10
        progress = Math.min(100, stats.brickSessionsCount * 10)
        break
      case 'fitness-peak':
        earned = stats.currentCtl >= 80
        progress = Math.min(100, Math.round((stats.currentCtl / 80) * 100))
        break
      case 'hrv-champion':
        earned = stats.recentHrvDays >= 7
        progress = Math.min(100, stats.recentHrvDays * 14)
        break
      case 'first-coach':
        earned = stats.hasCoach
        progress = stats.hasCoach ? 100 : 0
        break
      case 'onboarding-done':
        earned = stats.onboardingDone
        progress = stats.onboardingDone ? 100 : 0
        break
    }

    return { badge, earned, progress }
  })
}

export function getEarnedCount(checks: BadgeCheck[]): number {
  return checks.filter(c => c.earned).length
}