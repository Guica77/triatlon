import {
  PLAN_RULESET_VERSION,
  type LoadIncreaseEvaluation,
  type MoveWorkoutIntent,
  type PlanAlternative,
  type PlanEvaluation,
  type PlanReason,
  type PlanSignals,
  type PlanWorkout,
  type WorkoutIntensity,
  type WorkoutSlot,
} from './types'

const DAY_MS = 86_400_000
const EDITABLE_DAYS = 56
const MAX_WEEKLY_GROWTH = 0.1

function isoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T12:00:00Z`)
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : parsed
}

function dayDifference(from: string, to: string) {
  const start = isoDate(from)
  const end = isoDate(to)
  return start && end ? Math.round((end.getTime() - start.getTime()) / DAY_MS) : null
}

function addDays(value: string, amount: number) {
  const date = isoDate(value)
  if (!date) return null
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function mondayFor(value: string) {
  const date = isoDate(value)
  if (!date) return null
  const weekday = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - weekday + 1)
  return date.toISOString().slice(0, 10)
}

function reason(code: PlanReason['code'], severity: PlanReason['severity'], message: string): PlanReason {
  return { code, severity, message }
}

function loadForWeek(workouts: PlanWorkout[], week: string, moved?: { id: string; date: string }) {
  return workouts.reduce((total, workout) => {
    if (workout.status === 'missed') return total
    const workoutDate = workout.id === moved?.id ? moved.date : workout.date
    if (mondayFor(workoutDate) !== week) return total
    return total + (workout.plannedTss ?? estimateTss(workout.durationMinutes, workout.intensity))
  }, 0)
}

function estimateTss(durationMinutes: number, intensity: WorkoutIntensity) {
  const factor = intensity === 'hard' ? 0.9 : intensity === 'moderate' ? 0.75 : 0.6
  return Math.round((Math.max(0, durationMinutes) / 60) * factor * factor * 100)
}

function workoutsOnDate(workouts: PlanWorkout[], date: string, ignoredID: string) {
  return workouts.filter((workout) => workout.id !== ignoredID && workout.date === date && workout.status !== 'missed')
}

function hasSlotConflict(workouts: PlanWorkout[], date: string, slot: WorkoutSlot, ignoredID: string) {
  return workoutsOnDate(workouts, date, ignoredID).some((workout) => workout.slot === slot)
}

function hardSessionTooClose(workouts: PlanWorkout[], workout: PlanWorkout, date: string) {
  if (workout.intensity !== 'hard') return false
  return workouts.some((candidate) => {
    if (candidate.id === workout.id || candidate.status === 'missed' || candidate.intensity !== 'hard') return false
    const distance = dayDifference(candidate.date, date)
    return distance !== null && Math.abs(distance) <= 1
  })
}

function mayScheduleDouble(workouts: PlanWorkout[], workout: PlanWorkout, date: string, signals: PlanSignals) {
  const sameDay = workoutsOnDate(workouts, date, workout.id)
  if (sameDay.length === 0) return true
  if (workout.isBrick && sameDay.some((candidate) => candidate.isBrick)) return true
  return signals.stableWeeks >= 3 &&
    (signals.adherence ?? 0) >= 85 &&
    (signals.averageReadiness ?? 0) >= 70 &&
    (signals.averageFatigue ?? Number.POSITIVE_INFINITY) <= 3 &&
    !signals.painReported && !signals.injured
}

function weeklyGrowthTooHigh(workouts: PlanWorkout[], workout: PlanWorkout, date: string, signals: PlanSignals) {
  const targetWeek = mondayFor(date)
  if (!targetWeek || !signals.priorWeeklyLoad || signals.priorWeeklyLoad <= 0) return false
  const targetLoad = loadForWeek(workouts, targetWeek, { id: workout.id, date })
  return targetLoad > signals.priorWeeklyLoad * (1 + MAX_WEEKLY_GROWTH)
}

function conflictsForDate(
  workouts: PlanWorkout[],
  workout: PlanWorkout,
  date: string,
  slot: WorkoutSlot,
  signals: PlanSignals,
) {
  const reasons: PlanReason[] = []
  if (hasSlotConflict(workouts, date, slot, workout.id)) {
    reasons.push(reason('slot_conflict', 'critical', 'Ya existe una sesión en esa franja.'))
  }
  if (!mayScheduleDouble(workouts, workout, date, signals)) {
    reasons.push(reason('double_session_not_ready', 'warning', 'La evidencia actual no permite añadir una segunda sesión ese día.'))
  }
  if (hardSessionTooClose(workouts, workout, date)) {
    reasons.push(reason('hard_sessions_too_close', 'warning', 'Quedarían dos sesiones exigentes en días consecutivos.'))
  }
  if (weeklyGrowthTooHigh(workouts, workout, date, signals)) {
    reasons.push(reason('weekly_load_growth', 'critical', 'La semana superaría el crecimiento conservador de carga del 10 %.'))
  }
  return reasons
}

export function findMoveAlternative(
  workouts: PlanWorkout[],
  workout: PlanWorkout,
  intent: MoveWorkoutIntent,
  signals: PlanSignals,
): PlanAlternative | null {
  const offsets = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7]
  const candidates = offsets.flatMap((offset) => {
    const date = addDays(intent.targetDate, offset)
    if (!date) return []
    const horizon = dayDifference(signals.today, date)
    if (horizon === null || horizon < 0 || horizon > EDITABLE_DAYS) return []
    const conflicts = conflictsForDate(workouts, workout, date, intent.targetSlot, signals)
    if (conflicts.length > 0) return []
    const sameWeekPenalty = mondayFor(date) === mondayFor(intent.targetDate) ? 0 : 20
    const sameDaySessions = workoutsOnDate(workouts, date, workout.id).length
    return [{
      date,
      slot: intent.targetSlot,
      score: 100 - Math.abs(offset) * 8 - sameWeekPenalty - sameDaySessions * 6,
      reasons: [reason('safe_change', 'info', 'Mantiene una distribución compatible con la recuperación y la carga semanal.')],
    }]
  })
  return candidates.sort((left, right) => right.score - left.score || left.date.localeCompare(right.date))[0] ?? null
}

export function evaluateMove(
  workouts: PlanWorkout[],
  intent: MoveWorkoutIntent,
  signals: PlanSignals,
): PlanEvaluation {
  const workout = workouts.find((candidate) => candidate.id === intent.workoutId)
  const blocked = (reasons: PlanReason[]): PlanEvaluation => ({
    decision: 'blocked', rulesetVersion: PLAN_RULESET_VERSION, reasons, alternative: null, requiresConfirmation: false,
  })

  if (!workout) return blocked([reason('invalid_date', 'critical', 'La sesión ya no está disponible en este plan.')])
  if (signals.authority === 'coach') {
    return {
      decision: 'coach_review', rulesetVersion: PLAN_RULESET_VERSION,
      reasons: [reason('coach_controls_plan', 'info', 'Tu entrenador tiene el control del plan y revisará esta solicitud.')],
      alternative: null, requiresConfirmation: true,
    }
  }
  if (workout.status === 'completed') {
    return blocked([reason('completed_workout', 'critical', 'Una sesión completada no se puede reprogramar.')])
  }

  const date = isoDate(intent.targetDate)
  if (!date) return blocked([reason('invalid_date', 'critical', 'La fecha seleccionada no es válida.')])
  const horizon = dayDifference(signals.today, intent.targetDate)
  if (horizon === null || horizon < 0 || horizon > EDITABLE_DAYS) {
    return blocked([reason('outside_editable_horizon', 'critical', 'Elige una fecha entre hoy y los próximos 56 días.')])
  }

  const conflicts = conflictsForDate(workouts, workout, intent.targetDate, intent.targetSlot, signals)
  if (conflicts.some((entry) => entry.code === 'weekly_load_growth')) return blocked(conflicts)
  if (conflicts.length > 0) {
    return {
      decision: 'recommendation', rulesetVersion: PLAN_RULESET_VERSION, reasons: conflicts,
      alternative: findMoveAlternative(workouts, workout, intent, signals), requiresConfirmation: true,
    }
  }
  return {
    decision: 'safe', rulesetVersion: PLAN_RULESET_VERSION,
    reasons: [reason('safe_change', 'info', 'El cambio mantiene una distribución segura del plan.')],
    alternative: null, requiresConfirmation: true,
  }
}

export function evaluateLoadIncrease(
  workout: PlanWorkout,
  targetDurationMinutes: number,
  signals: PlanSignals,
): LoadIncreaseEvaluation {
  const reasons: PlanReason[] = []
  if (signals.authority === 'coach') reasons.push(reason('coach_controls_plan', 'critical', 'Solo tu entrenador puede cambiar la carga de este plan.'))
  if (signals.painReported || signals.injured) reasons.push(reason('pain_or_injury', 'critical', 'No aumentaremos carga mientras exista una señal de dolor o lesión.'))
  if ((signals.averageReadiness ?? 0) < 70 || (signals.averageFatigue ?? Number.POSITIVE_INFINITY) > 3) {
    reasons.push(reason('recovery_too_low', 'critical', 'La recuperación actual no es suficiente para aumentar carga.'))
  }
  if (signals.stableWeeks < 3 || (signals.adherence ?? 0) < 85 || signals.priorWeeklyLoad === null) {
    reasons.push(reason('insufficient_evidence', 'warning', 'Necesitamos más semanas estables y datos completos antes de aumentar carga.'))
  }
  const maximumDuration = Math.floor(workout.durationMinutes * 1.1)
  if (targetDurationMinutes <= workout.durationMinutes || targetDurationMinutes > maximumDuration) {
    reasons.push(reason('weekly_load_growth', 'critical', 'El aumento debe ser positivo y no superar el 10 % en esta progresión.'))
  }
  return {
    eligible: reasons.length === 0,
    reasons,
    suggestedDurationMinutes: reasons.length === 0 ? targetDurationMinutes : null,
    requiresConfirmation: true,
  }
}
