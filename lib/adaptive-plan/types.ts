export const PLAN_RULESET_VERSION = '2026-09-15.1'

export type PlanAuthority = 'self' | 'coach'
export type PlanDecision = 'safe' | 'recommendation' | 'blocked' | 'coach_review'
export type WorkoutStatus = 'pending' | 'completed' | 'missed'
export type WorkoutSlot = 'morning' | 'evening' | 'flexible'
export type WorkoutIntensity = 'easy' | 'moderate' | 'hard' | 'unknown'

export type PlanWorkout = {
  id: string
  date: string
  slot: WorkoutSlot
  status: WorkoutStatus
  sport: string
  durationMinutes: number
  plannedTss: number | null
  intensity: WorkoutIntensity
  isBrick: boolean
}

export type PlanSignals = {
  today: string
  authority: PlanAuthority
  painReported: boolean
  injured: boolean
  averageReadiness: number | null
  averageFatigue: number | null
  adherence: number | null
  stableWeeks: number
  priorWeeklyLoad: number | null
}

export type MoveWorkoutIntent = {
  kind: 'move'
  workoutId: string
  targetDate: string
  targetSlot: WorkoutSlot
}

export type IncreaseLoadIntent = {
  kind: 'increase_load'
  workoutId: string
  targetDurationMinutes: number
}

export type PlanIntent = MoveWorkoutIntent | IncreaseLoadIntent

export type PlanReasonCode =
  | 'coach_controls_plan'
  | 'completed_workout'
  | 'invalid_date'
  | 'outside_editable_horizon'
  | 'slot_conflict'
  | 'double_session_not_ready'
  | 'hard_sessions_too_close'
  | 'weekly_load_growth'
  | 'pain_or_injury'
  | 'recovery_too_low'
  | 'insufficient_evidence'
  | 'safe_change'

export type PlanReason = {
  code: PlanReasonCode
  severity: 'info' | 'warning' | 'critical'
  message: string
}

export type PlanAlternative = {
  date: string
  slot: WorkoutSlot
  score: number
  reasons: PlanReason[]
}

export type PlanEvaluation = {
  decision: PlanDecision
  rulesetVersion: string
  reasons: PlanReason[]
  alternative: PlanAlternative | null
  requiresConfirmation: boolean
}

export type LoadIncreaseEvaluation = {
  eligible: boolean
  reasons: PlanReason[]
  suggestedDurationMinutes: number | null
  requiresConfirmation: true
}
