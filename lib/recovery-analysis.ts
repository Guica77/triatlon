/**
 * Recovery Analysis System — Triatlon Pro
 *
 * Analiza la recuperación del atleta basado en:
 * - HRV (Heart Rate Variability)
 * - Calidad del sueño
 * - Readiness score
 * - Fatiga reportada
 * - Tendencia de CTL/ATL/TSB
 * - Niveles de estrés
 */

export interface RecoveryData {
  date: string
  hrv: number | null
  sleepHours: number | null
  sleepScore: number | null
  readinessScore: number | null
  fatigueRating: number | null // 1-5
  stressLevel: number | null // 1-5
  rhr: number | null // resting heart rate
  weight: number | null
}

export interface RecoveryAnalysis {
  overallScore: number // 0-100
  status: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical'
  statusLabel: string
  statusColor: string
  factors: RecoveryFactor[]
  recommendations: string[]
  overtrainingRisk: number // 0-100
  readinessForHighIntensity: boolean
  suggestedToday: RecoverySuggestion
  weeklyTrend: 'improving' | 'stable' | 'declining'
}

export interface RecoveryFactor {
  name: string
  score: number // 0-100
  weight: number // importance weight
  status: 'good' | 'warning' | 'poor'
  detail: string
}

export interface RecoverySuggestion {
  type: 'rest' | 'easy' | 'moderate' | 'hard'
  label: string
  description: string
  icon: string
}

// ============================================================
// Analysis Functions
// ============================================================

export function analyzeRecovery(
  current: RecoveryData,
  previous: RecoveryData[] // últimos 7 días
): RecoveryAnalysis {
  const factors = calculateFactors(current, previous)
  const overallScore = calculateOverallScore(factors)
  const status = getStatus(overallScore)
  const recommendations = generateRecoveryRecommendations(factors, current)
  const overtrainingRisk = calculateOvertrainingRisk(current, previous)
  const readinessForHighIntensity = overallScore >= 65 && current.fatigueRating !== null && current.fatigueRating <= 2
  const suggestedToday = getSuggestion(overallScore, current)
  const weeklyTrend = getWeeklyTrend(previous)

  return {
    overallScore,
    status: status.status,
    statusLabel: status.label,
    statusColor: status.color,
    factors,
    recommendations,
    overtrainingRisk,
    readinessForHighIntensity,
    suggestedToday,
    weeklyTrend,
  }
}

function calculateFactors(current: RecoveryData, previous: RecoveryData[]): RecoveryFactor[] {
  const factors: RecoveryFactor[] = []

  // HRV Factor
  if (current.hrv !== null) {
    const avgHrv = previous.filter(p => p.hrv !== null).reduce((sum, p) => sum + (p.hrv || 0), 0) / Math.max(1, previous.filter(p => p.hrv !== null).length)
    const hrvScore = current.hrv >= avgHrv * 1.1 ? 90 :
      current.hrv >= avgHrv ? 75 :
        current.hrv >= avgHrv * 0.85 ? 55 :
          current.hrv >= avgHrv * 0.7 ? 35 : 15

    factors.push({
      name: 'HRV',
      score: hrvScore,
      weight: 0.25,
      status: hrvScore >= 70 ? 'good' : hrvScore >= 50 ? 'warning' : 'poor',
      detail: current.hrv >= avgHrv
        ? `HRV ${Math.round(current.hrv)}ms — por encima de tu media (${Math.round(avgHrv)}ms)`
        : `HRV ${Math.round(current.hrv)}ms — por debajo de tu media (${Math.round(avgHrv)}ms)`,
    })
  }

  // Sleep Factor
  if (current.sleepHours !== null) {
    const sleepScore = current.sleepHours >= 8 ? 90 :
      current.sleepHours >= 7 ? 75 :
        current.sleepHours >= 6 ? 50 :
          current.sleepHours >= 5 ? 30 : 10

    factors.push({
      name: 'Sueño',
      score: sleepScore,
      weight: 0.2,
      status: sleepScore >= 70 ? 'good' : sleepScore >= 50 ? 'warning' : 'poor',
      detail: `${current.sleepHours}h de sueño${current.sleepScore ? ` (calidad: ${current.sleepScore}%)` : ''}`,
    })
  }

  // Readiness Factor
  if (current.readinessScore !== null) {
    const readinessScore = current.readinessScore
    factors.push({
      name: 'Readiness',
      score: readinessScore,
      weight: 0.25,
      status: readinessScore >= 70 ? 'good' : readinessScore >= 50 ? 'warning' : 'poor',
      detail: `Readiness: ${readinessScore}% — ${readinessScore >= 80 ? 'listo para entrenar fuerte' : readinessScore >= 60 ? 'moderación recomendada' : 'mejor descansar'}`,
    })
  }

  // Fatigue Factor
  if (current.fatigueRating !== null) {
    const fatigueScore = (5 - current.fatigueRating) * 20 // invert: 1=bueno, 5=malo
    factors.push({
      name: 'Fatiga',
      score: fatigueScore,
      weight: 0.15,
      status: fatigueScore >= 60 ? 'good' : fatigueScore >= 40 ? 'warning' : 'poor',
      detail: `Fatiga: ${current.fatigueRating}/5 — ${current.fatigueRating <= 2 ? 'poca fatiga' : current.fatigueRating <= 3 ? 'fatiga moderada' : 'alta fatiga'}`,
    })
  }

  // RHR Factor
  if (current.rhr !== null && previous.length > 0) {
    const avgRhr = previous.filter(p => p.rhr !== null).reduce((sum, p) => sum + (p.rhr || 0), 0) / Math.max(1, previous.filter(p => p.rhr !== null).length)
    const rhrScore = current.rhr <= avgRhr * 0.95 ? 85 :
      current.rhr <= avgRhr ? 70 :
        current.rhr <= avgRhr * 1.05 ? 50 : 30

    factors.push({
      name: 'FC Reposo',
      score: rhrScore,
      weight: 0.15,
      status: rhrScore >= 70 ? 'good' : rhrScore >= 50 ? 'warning' : 'poor',
      detail: `FC reposo: ${current.rhr} ppm (media: ${Math.round(avgRhr)} ppm)`,
    })
  }

  return factors
}

function calculateOverallScore(factors: RecoveryFactor[]): number {
  if (factors.length === 0) return 50 // default
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0)
  return Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0) / totalWeight)
}

function getStatus(score: number) {
  if (score >= 80) return { status: 'excellent' as const, label: 'Excelente', color: 'text-emerald-400' }
  if (score >= 65) return { status: 'good' as const, label: 'Buena', color: 'text-green-400' }
  if (score >= 45) return { status: 'moderate' as const, label: 'Moderada', color: 'text-amber-400' }
  if (score >= 25) return { status: 'poor' as const, label: 'Baja', color: 'text-orange-400' }
  return { status: 'critical' as const, label: 'Crítica', color: 'text-red-400' }
}

function generateRecoveryRecommendations(factors: RecoveryFactor[], current: RecoveryData): string[] {
  const recs: string[] = []

  const poorFactors = factors.filter(f => f.status === 'poor')
  const warningFactors = factors.filter(f => f.status === 'warning')

  if (poorFactors.length > 0) {
    recs.push(`Atención: ${poorFactors.map(f => f.name).join(', ')} en nivel bajo`)
  }

  if (current.sleepHours !== null && current.sleepHours < 7) {
    recs.push('Prioriza dormir7-8 horas esta noche')
  }

  if (current.hrv !== null && current.hrv < 50) {
    recs.push('HRV bajo — evita entrenamiento de alta intensidad hoy')
  }

  if (current.fatigueRating !== null && current.fatigueRating >= 4) {
    recs.push('Alta fatiga reportada — considera una sesión de recuperación activa')
  }

  if (warningFactors.length >= 2) {
    recs.push('Múltiples factores en alerta — sesiones suaves recomendadas')
  }

  if (recs.length === 0) {
    recs.push('¡Tu recuperación está óptima! Aprovecha para entrenar fuerte')
  }

  return recs
}

function calculateOvertrainingRisk(current: RecoveryData, previous: RecoveryData[]): number {
  let risk = 0

  if (current.hrv !== null && current.hrv < 40) risk += 25
  if (current.fatigueRating !== null && current.fatigueRating >= 4) risk += 25
  if (current.readinessScore !== null && current.readinessScore < 40) risk += 20
  if (current.sleepHours !== null && current.sleepHours < 5) risk += 15
  if (current.stressLevel !== null && current.stressLevel >= 4) risk += 15

  // Check declining trend
  if (previous.length >= 3) {
    const recentHrv = previous.slice(-3).filter(p => p.hrv !== null).map(p => p.hrv || 0)
    if (recentHrv.length >= 2 && recentHrv[recentHrv.length - 1] < recentHrv[0] * 0.85) {
      risk += 15 // HRV declining
    }
  }

  return Math.min(100, risk)
}

function getSuggestion(score: number, current: RecoveryData): RecoverySuggestion {
  if (score >= 80) {
    return { type: 'hard', label: 'Entreno Fuerte', description: 'Recuperación excelente — ideal para sesiones de alta intensidad', icon: '🔥' }
  }
  if (score >= 65) {
    return { type: 'moderate', label: 'Entreno Moderado', description: 'Buena recuperación — puedes entrenar con normalidad', icon: '💪' }
  }
  if (score >= 45) {
    return { type: 'easy', label: 'Entreno Suave', description: 'Recuperación moderada — sesiones ligeras y técnica', icon: '🚶' }
  }
  return { type: 'rest', label: 'Descanso', description: 'Recuperación baja — prioriza descanso y sueño', icon: '😴' }
}

function getWeeklyTrend(previous: RecoveryData[]): 'improving' | 'stable' | 'declining' {
  if (previous.length < 3) return 'stable'

  const recent = previous.slice(-3).filter(p => p.hrv !== null).map(p => p.hrv || 0)
  const older = previous.slice(-7, -3).filter(p => p.hrv !== null).map(p => p.hrv || 0)

  if (recent.length < 2 || older.length < 2) return 'stable'

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length

  if (recentAvg > olderAvg * 1.05) return 'improving'
  if (recentAvg < olderAvg * 0.95) return 'declining'
  return 'stable'
}

export function formatRecoveryScore(score: number): string {
  if (score >= 80) return 'Excelente'
  if (score >= 65) return 'Buena'
  if (score >= 45) return 'Moderada'
  if (score >= 25) return 'Baja'
  return 'Crítica'
}