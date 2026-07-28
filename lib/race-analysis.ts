/**
 * Race Analysis System — Triatlon Pro
 *
 * Analiza carreras importadas de Strava/Garmin con:
 * - Splits por segmento (Swim, T1, Bike, T2, Run)
 * - Comparación con objetivos
 * - IA de análisis post-carrera
 * - Métricas de rendimiento
 */

export interface RaceSegment {
  name: string
  type: 'swim' | 'bike' | 'run' | 'transition'
  duration: number // seconds
  distance?: number // meters
  avgPace?: number // seconds per km
  avgPower?: number // watts
  avgHR?: number // bpm
  elevationGain?: number // meters
}

export interface RaceData {
  id: string
  name: string
  date: string
  type: 'sprint' | 'olimpico' | 'half-im' | 'full-im' | 'custom'
  totalDuration: number // seconds
  segments: RaceSegment[]
  tss?: number
  notes?: string
  goalTime?: number // seconds
  placement?: number
  totalParticipants?: number
}

export interface RaceAnalysis {
  race: RaceData
  overallRating: number // 1-10
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  segmentAnalysis: SegmentAnalysis[]
  vsGoal: {
    diff: number // seconds
    percentage: number
    achieved: boolean
  }
}

export interface SegmentAnalysis {
  segment: RaceSegment
  rating: number // 1-10
  comment: string
  improvement?: string
}

// ============================================================
// Race Type Configurations
// ============================================================

export const RACE_TYPES: Record<string, { name: string; distances: string;典型时间: string }> = {
  sprint: {
    name: 'Sprint',
    distances: '750m swim, 20km bike, 5km run',
    典型时间: '1:00 - 1:30',
  },
  olimpico: {
    name: 'Olímpico',
    distances: '1.5km swim, 40km bike, 10km run',
    典型时间: '2:00 - 3:00',
  },
  'half-im': {
    name: 'Half Ironman (70.3)',
    distances: '1.9km swim, 90km bike, 21.1km run',
    典型时间: '4:30 - 6:00',
  },
  'full-im': {
    name: 'Ironman',
    distances: '3.8km swim, 180km bike, 42.2km run',
    典型时间: '9:00 - 17:00',
  },
  custom: {
    name: 'Otra distancia',
    distances: 'Personalizado',
    典型时间: 'Variable',
  },
}

// ============================================================
// Analysis Functions
// ============================================================

export function analyzeRace(race: RaceData): RaceAnalysis {
  const segmentAnalysis = race.segments.map(segment => analyzeSegment(segment, race))
  const overallRating = calculateOverallRating(segmentAnalysis, race)
  const strengths = segmentAnalysis.filter(s => s.rating >= 7).map(s => s.segment.name)
  const weaknesses = segmentAnalysis.filter(s => s.rating < 6).map(s => s.segment.name)
  const recommendations = generateRecommendations(segmentAnalysis, race)
  const vsGoal = race.goalTime
    ? { diff: race.totalDuration - race.goalTime, percentage: Math.round(((race.totalDuration - race.goalTime) / race.goalTime) * 100), achieved: race.totalDuration <= race.goalTime }
    : { diff: 0, percentage: 0, achieved: false }

  return { race, overallRating, strengths, weaknesses, recommendations, segmentAnalysis, vsGoal }
}

function analyzeSegment(segment: RaceSegment, race: RaceData): SegmentAnalysis {
  let rating = 5
  let comment = ''
  let improvement = ''

  if (segment.type === 'swim') {
    if (segment.avgPace && segment.avgPace < 120) { rating = 8; comment = 'Natación muy sólida. Ritmo eficiente.' }
    else if (segment.avgPace && segment.avgPace < 150) { rating = 7; comment = 'Natación buena. Ritmo competitivo.' }
    else if (segment.avgPace && segment.avgPace < 180) { rating = 5; comment = 'Natación aceptable. Hay margen de mejora.' }
    else { rating = 3; comment = 'Natación débil. Considera técnica de brazada.' }
    improvement = 'Practica drills de catch-up y respiración bilateral.'
  } else if (segment.type === 'bike') {
    if (segment.avgPower && segment.avgPower > 200) { rating = 8; comment = 'Ciclismo fuerte. Buena gestión de energía.' }
    else if (segment.avgPower && segment.avgPower > 150) { rating = 6; comment = 'Ciclismo correcto. Podría ser más constante.' }
    else { rating = 4; comment = 'Ciclismo mejorable. Trabaja Sweet Spot.' }
    improvement = 'Incluye intervalos Sweet Spot y subidas largas.'
  } else if (segment.type === 'run') {
    if (segment.avgPace && segment.avgPace < 240) { rating = 8; comment = 'Carrera fuerte. Zancada eficiente.' }
    else if (segment.avgPace && segment.avgPace < 300) { rating = 6; comment = 'Carrera aceptable. Mantén ritmo constante.' }
    else { rating = 4; comment = 'Carrera mejorable. Trabaja tempo runs.' }
    improvement = 'Incluye carreras largas semanales y strides.'
  } else if (segment.type === 'transition') {
    const durationMin = segment.duration / 60
    if (durationMin < 2) { rating = 9; comment = 'Transición veloz. Excelente.' }
    else if (durationMin < 4) { rating = 7; comment = 'Transición correcta.' }
    else { rating = 4; comment = 'Transición lenta. Practica el cambio.' }
    improvement = 'Practica transiciones T1 y T2 con simulacros.'
  }

  return { segment, rating, comment, improvement }
}

function calculateOverallRating(segmentAnalysis: SegmentAnalysis[], race: RaceData): number {
  const avg = segmentAnalysis.reduce((sum, s) => sum + s.rating, 0) / segmentAnalysis.length
  return Math.round(avg * 10) / 10
}

function generateRecommendations(segmentAnalysis: SegmentAnalysis[], race: RaceData): string[] {
  const recs: string[] = []

  const weakSegments = segmentAnalysis.filter(s => s.rating < 6)
  if (weakSegments.length > 0) {
    recs.push(`Enfócate en mejorar: ${weakSegments.map(s => s.segment.name).join(', ')}`)
  }

  if (race.type === 'full-im' || race.type === 'half-im') {
    recs.push('Para distancias largas, prioriza la nutrición intra-carrera')
    recs.push('Practica Brick sessions (bike + run) para simular la transición')
  }

  const bikeSegment = race.segments.find(s => s.type === 'bike')
  if (bikeSegment && bikeSegment.avgPower && bikeSegment.avgPower < 180) {
    recs.push('Mejora tu FTP con intervalos Sweet Spot y VO2max')
  }

  const runSegment = race.segments.find(s => s.type === 'run')
  if (runSegment && runSegment.avgPace && runSegment.avgPace > 270) {
    recs.push('Incluye carreras largas semanales y tempo runs')
  }

  return recs
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60)
  const s = secondsPerKm % 60
  return `${m}:${String(s).padStart(2, '0')}/km`
}