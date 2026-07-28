/**
 * Performance Prediction System — Triatlon Pro
 *
 * Predice rendimiento futuro basado en:
 * - PMC actual (CTL/ATL/TSB)
 * - Tendencia de entrenamiento
 * - Histórico de rendimiento
 * - Adherencia al plan
 */

export interface PredictionInput {
  currentCtl: number
  currentAtl: number
  currentTsb: number
  weeklyTssHistory: number[] // últimos 12 semanas
  adherenceRate: number // 0-100%
  raceType: 'sprint' | 'olimpico' | 'half-im' | 'full-im'
  currentFitness: number // 1-10 auto-eval
}

export interface Prediction {
 CTL4weeks: number
  CTL8weeks: number
  CTL12weeks: number
  TSBatRace: number
  fitnessGain: number
  confidence: number // 0-100%
  raceTimeEstimate: string
  summary: string
  risks: string[]
  opportunities: string[]
}

// ============================================================
// Race Time Estimations (based on CTL and fitness level)
// ============================================================

const BASE_TIMES: Record<string, { swim: number; bike: number; run: number }> = {
  sprint: { swim: 1500, bike: 2400, run: 1500 }, // seconds
  olimpico: { swim: 2400, bike: 6000, run: 3000 },
  'half-im': { swim: 3600, bike: 14400, run: 6600 },
  'full-im': { swim: 6600, bike: 28800, run: 14400 },
}

// CTL impact on time (higher CTL = faster)
const CTL_IMPACT: Record<string, number> = {
  sprint: 0.003, // seconds reduction per CTL point
  olimpico: 0.005,
  'half-im': 0.008,
  'full-im': 0.012,
}

export function predictPerformance(input: PredictionInput): Prediction {
  const { currentCtl, currentAtl, currentTsb, weeklyTssHistory, adherenceRate, raceType } = input

  // Predict CTL progression
  const avgWeeklyTss = weeklyTssHistory.length > 0
    ? weeklyTssHistory.reduce((a, b) => a + b, 0) / weeklyTssHistory.length
    : 200

  const ctlGainPerWeek = avgWeeklyTss * (1 - Math.exp(-1 / 42)) // EWMA constant
  const CTL4weeks = Math.round(currentCtl + ctlGainPerWeek * 4 * (adherenceRate / 100))
  const CTL8weeks = Math.round(currentCtl + ctlGainPerWeek * 8 * (adherenceRate / 100))
  const CTL12weeks = Math.round(currentCtl + ctlGainPerWeek * 12 * (adherenceRate / 100))

  // Predict TSB at race (assuming taper)
  const taperWeeks = 2
  const TSBatRace = Math.round((CTL12weeks * 0.9) - (currentAtl * 0.5))

  // Calculate fitness gain
  const fitnessGain = CTL12weeks - currentCtl

  // Calculate confidence
  const confidence = calculateConfidence(input)

  // Estimate race time
  const raceTimeEstimate = estimateRaceTime(raceType, CTL12weeks, input.currentFitness)

  // Identify risks and opportunities
  const risks = identifyRisks(input, CTL12weeks, TSBatRace)
  const opportunities = identifyOpportunities(input, CTL12weeks)

  return {
    CTL4weeks,
    CTL8weeks,
    CTL12weeks,
    TSBatRace,
    fitnessGain,
    confidence,
    raceTimeEstimate,
    summary: generateSummary(input, CTL12weeks, TSBatRace, raceTimeEstimate),
    risks,
    opportunities,
  }
}

function calculateConfidence(input: PredictionInput): number {
  let confidence = 50

  // Adherence impact
  confidence += (input.adherenceRate - 50) * 0.4

  // TSB impact (optimal is around 0 to +10)
  if (input.currentTsb >= -5 && input.currentTsb <= 15) confidence += 10
  else if (input.currentTsb < -20) confidence -= 15

  // TSS trend stability
  if (input.weeklyTssHistory.length >= 4) {
    const variance = calculateVariance(input.weeklyTssHistory.slice(-4))
    if (variance < 500) confidence += 10 // Stable training
    else if (variance > 2000) confidence -= 10 // Volatile
  }

  return Math.max(20, Math.min(95, Math.round(confidence)))
}

function calculateVariance(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length
}

function estimateRaceTime(raceType: string, ctl: number, fitness: number): string {
  const base = BASE_TIMES[raceType]
  if (!base) return 'No estimable'

  const impact = CTL_IMPACT[raceType] || 0.005
  const fitnessMultiplier = 1 - (fitness - 5) * 0.02 // +/-2% per fitness level

  const totalBase = base.swim + base.bike + base.run
  const totalSeconds = Math.round(totalBase * fitnessMultiplier - ctl * impact * totalBase * 0.001)

  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)

  if (h > 0) return `${h}h ${m}min`
  return `${m} minutos`
}

function identifyRisks(input: PredictionInput, predictedCtl: number, tsb: number): string[] {
  const risks: string[] = []

  if (input.adherenceRate < 70) risks.push('Baja adherencia al plan — la predicción menos confiable')
  if (input.currentTsb < -15) risks.push('TSB muy negativo — posible sobreentrenamiento actual')
  if (predictedCtl > 100) risks.push('CTL muy alto — riesgo de lesión por sobre carga')
  if (input.currentAtl > input.currentCtl * 1.3) risks.push('ATL muy superior a CTL — fatiga acumulada')
  if (input.weeklyTssHistory.length < 4) risks.push('Pocas semanas de datos — predicción poco fiable')

  return risks
}

function identifyOpportunities(input: PredictionInput, predictedCtl: number): string[] {
  const opps: string[] = []

  if (input.adherenceRate >= 85) opps.push('Excelente adherencia — la predicción es muy confiable')
  if (input.currentTsb >= 0 && input.currentTsb <= 10) opps.push('TSB óptimo — buena forma actual')
  if (predictedCtl > input.currentCtl * 1.1) opps.push('Ganancia de fitness significativa esperada')
  if (input.currentFitness >= 7) opps.push('Alto nivel de fitness — considera objetivos ambiciosos')

  return opps
}

function generateSummary(input: PredictionInput, ctl: number, tsb: number, raceTime: string): string {
  return `Con tu CTL actual de ${input.currentCtl} y una adherencia del ${input.adherenceRate}%, ` +
    `se estima que tu CTL en 12 semanas será ~${ctl}. ` +
    `Tiempo estimado de carrera: ${raceTime}. ` +
    `TSB en carrera: ${tsb > 0 ? '+' : ''}${tsb} (${tsb > 10 ? 'excelente forma' : tsb > 0 ? 'buena forma' : tsb > -10 ? 'aceptable' : 'necesita más descanso'}).`
}