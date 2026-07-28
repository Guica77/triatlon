/**
 * AI Periodization System — Triatlon Pro
 *
 * Genera planes de entrenamiento periodizados basados en:
 * - PMC actual (CTL/ATL/TSB)
 * - Objetivos del atleta
 * - Tipo de carrera
 * - Nivel de experiencia
 * - Disponibilidad semanal
 */

export interface PeriodizationInput {
  currentCtl: number
  currentAtl: number
  currentTsb: number
  raceType: 'sprint' | 'olimpico' | 'half-im' | 'full-im'
  weeksToRace: number
  level: 'principiante' | 'intermedio' | 'avanzado'
  weeklyHours: number
  strengths: string[] // 'swim', 'bike', 'run'
  weaknesses: string[]
}

export interface TrainingWeek {
  week: number
  phase: string
  tssTarget: number
  sessions: TrainingSession[]
  focus: string
  notes: string
}

export interface TrainingSession {
  sport: string
  day: string
  duration: number // minutes
  type: string
  description: string
  intensity: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'
  tss: number
}

export interface PeriodizationPlan {
  weeks: TrainingWeek[]
  totalTss: number
  peakTss: number
  taperReduction: number
  summary: string
}

// ============================================================
// Training Phases
// ============================================================

const PHASES = {
  base: { name: 'Base', focus: 'Resistencia aeróbica, técnica, volumen creciente' },
  build: { name: 'Build', focus: 'Intensidad, potencia, umbral lactato' },
  peak: { name: 'Peak', focus: 'Pico de forma, simulación de carrera' },
  taper: { name: 'Taper', focus: 'Reducir carga, mantener intensidad, recuperación' },
  race: { name: 'Carrera', focus: 'Máximo rendimiento, frescura' },
}

// ============================================================
// Plan Generator
// ============================================================

export function generatePeriodizationPlan(input: PeriodizationInput): PeriodizationPlan {
  const { weeksToRace, currentCtl, raceType, level, weeklyHours, weaknesses } = input

  // Determine phase distribution
  const phaseDistribution = getPhaseDistribution(weeksToRace, raceType)

  // Calculate TSS targets per phase
  const baseTss = calculateBaseTss(currentCtl, weeklyHours, level)
  const buildTss = Math.round(baseTss * 1.2)
  const peakTss = Math.round(baseTss * 1.3)
  const taperTss = Math.round(baseTss * 0.5)

  const weeks: TrainingWeek[] = []
  let currentWeek = 1

  // Generate Base Phase
  for (let i = 0; i < phaseDistribution.base; i++) {
    weeks.push(generateWeek(currentWeek, 'base', baseTss, input, i))
    currentWeek++
  }

  // Generate Build Phase
  for (let i = 0; i < phaseDistribution.build; i++) {
    weeks.push(generateWeek(currentWeek, 'build', buildTss, input, i))
    currentWeek++
  }

  // Generate Peak Phase
  for (let i = 0; i < phaseDistribution.peak; i++) {
    weeks.push(generateWeek(currentWeek, 'peak', peakTss, input, i))
    currentWeek++
  }

  // Generate Taper Phase
  for (let i = 0; i < phaseDistribution.taper; i++) {
    weeks.push(generateWeek(currentWeek, 'taper', taperTss, input, i))
    currentWeek++
  }

  const totalTss = weeks.reduce((sum, w) => sum + w.tssTarget, 0)

  return {
    weeks,
    totalTss,
    peakTss,
    taperReduction: Math.round((1 - taperTss / peakTss) * 100),
    summary: generatePlanSummary(weeks, input),
  }
}

function getPhaseDistribution(weeksToRace: number, raceType: string) {
  if (weeksToRace <= 4) return { base: 0, build: 2, peak: 1, taper: 1 }
  if (weeksToRace <= 8) return { base: 2, build: 3, peak: 2, taper: 1 }
  if (weeksToRace <= 12) return { base: 4, build: 4, peak: 2, taper: 2 }
  if (weeksToRace <= 16) return { base: 6, build: 5, peak: 3, taper: 2 }
  return { base: 8, build: 6, peak: 4, taper: 2 }
}

function calculateBaseTss(currentCtl: number, weeklyHours: number, level: string): number {
  const hourMultiplier = level === 'principiante' ? 50 : level === 'intermedio' ? 65 : 80
  const targetTss = weeklyHours * hourMultiplier
  // Progressively increase from current CTL
  return Math.max(targetTss, Math.round(currentCtl * 7 * 1.05))
}

function generateWeek(weekNum: number, phase: string, targetTss: number, input: PeriodizationInput, phaseIndex: number): TrainingWeek {
  const phaseConfig = PHASES[phase as keyof typeof PHASES]
  const sessions: TrainingSession[] = []

  // Generate sessions based on phase and weaknesses
  if (phase === 'base') {
    sessions.push(
      { sport: 'ciclismo', day: 'Lunes', duration: 60, type: 'Rodaje Z2', description: 'Ciclismo suave a ritmo conversacional', intensity: 'Z2', tss: 40 },
      { sport: 'natacion', day: 'Martes', duration: 45, type: 'Técnica', description: 'Drills de técnica + nado continuo', intensity: 'Z2', tss: 30 },
      { sport: 'carrera', day: 'Miércoles', duration: 40, type: 'Carrera fácil', description: 'Carrera suave, enfoca en cadencia', intensity: 'Z1', tss: 25 },
      { sport: 'ciclismo', day: 'Jueves', duration: 75, type: 'Rodaje medio', description: 'Ciclismo con inclinaciones suaves', intensity: 'Z2', tss: 55 },
      { sport: 'natacion', day: 'Viernes', duration: 45, type: 'Nado continuo', description: 'Nado continuo a ritmo constante', intensity: 'Z2', tss: 30 },
      { sport: 'carrera', day: 'Sábado', duration: 90, type: 'Carrera larga', description: 'Carrera larga y suave', intensity: 'Z2', tss: 60 },
      { sport: 'fuerza', day: 'Domingo', duration: 30, type: 'Fuerza', description: 'Fuerza general: sentadillas, plancha, puente', intensity: 'Z1', tss: 20 },
    )
  } else if (phase === 'build') {
    sessions.push(
      { sport: 'ciclismo', day: 'Lunes', duration: 75, type: 'Sweet Spot', description: '2x20min a 88-93% FTP', intensity: 'Z3', tss: 70 },
      { sport: 'natacion', day: 'Martes', duration: 50, type: 'Intervalos', description: '10x100m a ritmo CSS', intensity: 'Z3', tss: 40 },
      { sport: 'carrera', day: 'Miércoles', duration: 50, type: 'Tempo', description: '30min a ritmo tempo', intensity: 'Z3', tss: 45 },
      { sport: 'ciclismo', day: 'Jueves', duration: 90, type: 'Larga distancia', description: 'Ciclismo largo con subidas', intensity: 'Z2', tss: 75 },
      { sport: 'brick', day: 'Viernes', duration: 60, type: 'Brick', description: '30min bici + 20min carrera', intensity: 'Z3', tss: 55 },
      { sport: 'carrera', day: 'Sábado', duration: 100, type: 'Carrera larga', description: 'Carrera larga con ritmo constante', intensity: 'Z2', tss: 70 },
      { sport: 'fuerza', day: 'Domingo', duration: 30, type: 'Fuerza', description: 'Fuerza específica: sentadilla, peso muerto', intensity: 'Z1', tss: 20 },
    )
  } else if (phase === 'peak') {
    sessions.push(
      { sport: 'ciclismo', day: 'Lunes', duration: 75, type: 'VO2max', description: '4x4min a 110% FTP', intensity: 'Z5', tss: 80 },
      { sport: 'natacion', day: 'Martes', duration: 50, type: 'Velocidad', description: '8x50m sprint + technique', intensity: 'Z4', tss: 45 },
      { sport: 'carrera', day: 'Miércoles', duration: 50, type: 'Intervalos', description: '6x800m a 5K pace', intensity: 'Z4', tss: 55 },
      { sport: 'ciclismo', day: 'Jueves', duration: 100, type: 'Simulación', description: 'Simulación de carrera: ritmo constante', intensity: 'Z3', tss: 85 },
      { sport: 'brick', day: 'Viernes', duration: 75, type: 'Brick largo', description: '45min bici fuerte + 20min carrera', intensity: 'Z4', tss: 70 },
      { sport: 'carrera', day: 'Sábado', duration: 60, type: 'Carrera moderada', description: 'Carrera moderada con strides', intensity: 'Z2', tss: 45 },
      { sport: 'descanso', day: 'Domingo', duration: 0, type: 'Descanso', description: 'Recuperación activa o descanso completo', intensity: 'Z1', tss: 0 },
    )
  } else if (phase === 'taper') {
    sessions.push(
      { sport: 'ciclismo', day: 'Lunes', duration: 45, type: 'Rodaje suave', description: 'Ciclismo suave con some intensidad', intensity: 'Z2', tss: 30 },
      { sport: 'natacion', day: 'Martes', duration: 30, type: 'Técnica', description: 'Nado técnico, corto y preciso', intensity: 'Z2', tss: 20 },
      { sport: 'carrera', day: 'Miércoles', duration: 30, type: 'Carrera fácil', description: 'Carrera suave con strides cortos', intensity: 'Z1', tss: 15 },
      { sport: 'ciclismo', day: 'Jueves', duration: 40, type: 'Activación', description: 'Ciclismo corto con some pickups', intensity: 'Z2', tss: 25 },
      { sport: 'natacion', day: 'Viernes', duration: 20, type: 'Activación', description: 'Nado corto para mantener sensaciones', intensity: 'Z1', tss: 10 },
      { sport: 'descanso', day: 'Sábado', duration: 0, type: 'Descanso', description: 'Descanso completo, preparación mental', intensity: 'Z1', tss: 0 },
      { sport: 'descanso', day: 'Domingo', duration: 0, type: 'Carrera', description: 'DÍA DE CARRERA', intensity: 'Z1', tss: 0 },
    )
  }

  return {
    week: weekNum,
    phase: phaseConfig.name,
    tssTarget: targetTss,
    sessions,
    focus: phaseConfig.focus,
    notes: generateWeekNotes(phase, weekNum, input),
  }
}

function generateWeekNotes(phase: string, weekNum: number, input: PeriodizationInput): string {
  if (phase === 'base') return 'Semana de construcción de base. Prioriza volumen y técnica.'
  if (phase === 'build') return 'Semana de intensidad. Trabaja umbral y potencia.'
  if (phase === 'peak') return 'Pico de carga. Simula las demandas de la carrera.'
  if (phase === 'taper') return 'Reducción progresiva. Mantén sensaciones, no fuerces.'
  return ''
}

function generatePlanSummary(weeks: TrainingWeek[], input: PeriodizationInput): string {
  const totalTss = weeks.reduce((sum, w) => sum + w.tssTarget, 0)
  const avgWeeklyTss = Math.round(totalTss / weeks.length)

  return `Plan de ${weeks.length} semanas para ${RACE_TYPES[input.raceType]?.name || input.raceType}. ` +
    `CTL actual: ${input.currentCtl} → Objetivo: ~${Math.round(input.currentCtl * 1.3)}. ` +
    `TSS promedio semanal: ${avgWeeklyTss}. ` +
    `Enfocándose en: ${input.weaknesses.length > 0 ? input.weaknesses.join(', ') : 'mejora general'}.`
}

const RACE_TYPES: Record<string, { name: string }> = {
  sprint: { name: 'Sprint' },
  olimpico: { name: 'Olímpico' },
  'half-im': { name: 'Half Ironman' },
  'full-im': { name: 'Ironman' },
}