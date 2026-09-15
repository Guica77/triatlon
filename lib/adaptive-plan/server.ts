import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { derivePlanSignals, normalizePlanWorkout, planVersion, type BiometricRow, type FeedbackRow, type WorkoutRow } from './normalize'
import { presentMoveEvaluation } from './presentation'
import { evaluateMove } from './rules'
import type { MoveWorkoutIntent, PlanIntent } from './types'

type ProposalRecord = {
  id: string
  decision: string
  status: string
  intent: PlanIntent
  proposed_intent: PlanIntent
  evaluation: Record<string, unknown>
  expires_at: string
}

type ProposalAdmin = {
  from(table: 'plan_adjustment_proposals'): {
    insert(value: Record<string, unknown>): {
      select(columns: string): { single(): Promise<{ data: ProposalRecord | null; error: { code?: string; message: string } | null }> }
    }
    select(columns: string): {
      eq(column: string, value: string): {
        eq(column: string, value: string): { maybeSingle(): Promise<{ data: ProposalRecord | null; error: { message: string } | null }> }
      }
    }
  }
}

export type PreviewPlanResult =
  | { data: { proposalId: string; decision: string; evaluation: ReturnType<typeof evaluateMove>; presentation: ReturnType<typeof presentMoveEvaluation>; proposedIntent: MoveWorkoutIntent; expiresAt: string } }
  | { error: string; status: number }

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10)
}

function shiftedDay(date: Date, amount: number) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + amount)
  return isoDay(copy)
}

function validUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function previewPlanMove(input: {
  userId: string
  intent: MoveWorkoutIntent
  idempotencyKey: string
  now?: Date
}): Promise<PreviewPlanResult> {
  if (!validUUID(input.idempotencyKey)) return { error: 'Identificador de solicitud no válido.', status: 400 }
  const now = input.now ?? new Date()
  const today = isoDay(now)
  const start = shiftedDay(now, -28)
  const end = shiftedDay(now, 56)
  const supabase = await createClient()

  const [{ data: profile, error: profileError }, { data: workoutRows, error: workoutsError }, { data: versionRow, error: versionError }] = await Promise.all([
    supabase.from('profiles').select('coach_id').eq('id', input.userId).maybeSingle(),
    supabase.from('user_workouts')
      .select('id,scheduled_date,scheduled_slot,status,actual_tss,updated_at,training_sessions(sport_type,duration_min,description,structured_blocks)')
      .eq('user_id', input.userId).gte('scheduled_date', start).lte('scheduled_date', end),
    supabase.from('user_workouts').select('updated_at').eq('user_id', input.userId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (profileError || workoutsError || versionError || !profile) return { error: 'No se ha podido analizar el plan.', status: 503 }

  const rows = (workoutRows ?? []) as unknown as WorkoutRow[]
  const workouts = rows.map(normalizePlanWorkout)
  const target = workouts.find((workout) => workout.id === input.intent.workoutId)
  if (!target) return { error: 'No se ha encontrado el entrenamiento.', status: 404 }

  let biometrics: BiometricRow[] = []
  let feedback: FeedbackRow[] = []
  const hasCoach = Boolean(profile.coach_id)
  if (!hasCoach) {
    const [{ data: biometricRows, error: biometricsError }, { data: feedbackRows, error: feedbackError }] = await Promise.all([
      supabase.from('user_biometrics').select('readiness_score,fatigue_rating').eq('user_id', input.userId).gte('date', start).lte('date', today),
      supabase.from('workout_feedback').select('pain_localized,feeling').eq('user_id', input.userId).gte('created_at', `${start}T00:00:00Z`),
    ])
    if (biometricsError || feedbackError) return { error: 'No se han podido comprobar tus señales de recuperación.', status: 503 }
    biometrics = (biometricRows ?? []) as BiometricRow[]
    feedback = (feedbackRows ?? []) as FeedbackRow[]
  }

  const signals = derivePlanSignals({ today, hasCoach, workouts, biometrics, feedback })
  const evaluation = evaluateMove(workouts, input.intent, signals)
  const proposedIntent: MoveWorkoutIntent = evaluation.decision === 'recommendation' && evaluation.alternative
    ? { ...input.intent, targetDate: evaluation.alternative.date, targetSlot: evaluation.alternative.slot }
    : input.intent
  const presentation = presentMoveEvaluation(evaluation, target.date, input.intent)
  const version = versionRow?.updated_at ?? planVersion(rows)
  if (!version) return { error: 'El plan no tiene una versión válida.', status: 409 }

  const expiresAt = new Date(now.getTime() + 15 * 60_000).toISOString()
  const admin = createAdminClient() as unknown as ProposalAdmin
  const insert = await admin.from('plan_adjustment_proposals').insert({
    athlete_id: input.userId,
    requested_by: input.userId,
    workout_id: target.id,
    decision: evaluation.decision,
    intent: input.intent,
    proposed_intent: proposedIntent,
    evaluation: { ...evaluation, ...presentation },
    ruleset_version: evaluation.rulesetVersion,
    plan_version: version,
    idempotency_key: input.idempotencyKey,
    expires_at: expiresAt,
  }).select('id,decision,status,intent,proposed_intent,evaluation,expires_at').single()

  let proposal = insert.data
  if (insert.error?.code === '23505') {
    const existing = await admin.from('plan_adjustment_proposals')
      .select('id,decision,status,intent,proposed_intent,evaluation,expires_at')
      .eq('requested_by', input.userId).eq('idempotency_key', input.idempotencyKey).maybeSingle()
    proposal = existing.data
  } else if (insert.error) {
    return { error: 'No se ha podido preparar el cambio.', status: 503 }
  }
  if (!proposal) return { error: 'No se ha podido preparar el cambio.', status: 503 }

  return {
    data: {
      proposalId: proposal.id,
      decision: proposal.decision,
      evaluation,
      presentation,
      proposedIntent,
      expiresAt: proposal.expires_at,
    },
  }
}
