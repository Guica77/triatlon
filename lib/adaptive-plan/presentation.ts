import type { MoveWorkoutIntent, PlanEvaluation } from './types'

export type PlanChangePresentation = {
  title: string
  summary: string
  improvement: string
  watchOut: string
  primaryAction: string | null
}

export function presentMoveEvaluation(
  evaluation: PlanEvaluation,
  originalDate: string,
  proposed: MoveWorkoutIntent,
): PlanChangePresentation {
  if (evaluation.decision === 'coach_review') {
    return {
      title: 'Enviar al entrenador',
      summary: `Solicitas mover la sesión del ${originalDate} al ${proposed.targetDate}.`,
      improvement: 'Tu entrenador podrá valorar el cambio dentro del plan completo.',
      watchOut: 'La sesión no cambiará hasta que tu entrenador la apruebe.',
      primaryAction: 'Enviar solicitud',
    }
  }
  if (evaluation.decision === 'blocked') {
    return {
      title: 'Este cambio no es seguro',
      summary: evaluation.reasons[0]?.message ?? 'El cambio no se puede aplicar.',
      improvement: 'Mantener el plan evita una progresión o una distribución de carga inadecuada.',
      watchOut: 'Elige otra fecha o conserva la sesión actual.',
      primaryAction: null,
    }
  }
  if (evaluation.decision === 'recommendation' && evaluation.alternative) {
    return {
      title: 'Hay una opción mejor',
      summary: `En lugar del ${proposed.targetDate}, recomendamos el ${evaluation.alternative.date}.`,
      improvement: evaluation.alternative.reasons[0]?.message ?? 'La alternativa distribuye mejor la recuperación.',
      watchOut: evaluation.reasons.map((entry) => entry.message).join(' '),
      primaryAction: `Usar el ${evaluation.alternative.date}`,
    }
  }
  return {
    title: 'Cambio compatible',
    summary: `La sesión se moverá del ${originalDate} al ${proposed.targetDate}.`,
    improvement: 'La distribución del plan se mantiene dentro de las reglas de carga y recuperación.',
    watchOut: 'Comprueba tu disponibilidad antes de confirmar.',
    primaryAction: 'Confirmar cambio',
  }
}
