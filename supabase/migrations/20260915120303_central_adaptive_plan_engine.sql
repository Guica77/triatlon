BEGIN;

CREATE TABLE public.plan_adjustment_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES public.user_workouts(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('safe', 'recommendation', 'blocked', 'coach_review')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'confirmed', 'rejected', 'expired', 'reverted')),
  intent jsonb NOT NULL CHECK (jsonb_typeof(intent) = 'object'),
  proposed_intent jsonb NOT NULL CHECK (jsonb_typeof(proposed_intent) = 'object'),
  evaluation jsonb NOT NULL CHECK (jsonb_typeof(evaluation) = 'object'),
  ruleset_version text NOT NULL CHECK (length(ruleset_version) BETWEEN 1 AND 64),
  plan_version timestamptz NOT NULL,
  idempotency_key uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requested_by, idempotency_key)
);

CREATE TABLE public.plan_adjustment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.plan_adjustment_proposals(id) ON DELETE RESTRICT,
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  workout_id uuid NOT NULL REFERENCES public.user_workouts(id) ON DELETE CASCADE,
  before_state jsonb NOT NULL CHECK (jsonb_typeof(before_state) = 'object'),
  after_state jsonb NOT NULL CHECK (jsonb_typeof(after_state) = 'object'),
  reverted_at timestamptz,
  reverted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX plan_adjustment_proposals_athlete_status_idx
  ON public.plan_adjustment_proposals (athlete_id, status, created_at DESC);
CREATE INDEX plan_adjustment_proposals_expires_idx
  ON public.plan_adjustment_proposals (expires_at) WHERE status IN ('draft', 'pending');
CREATE INDEX plan_adjustment_events_athlete_created_idx
  ON public.plan_adjustment_events (athlete_id, created_at DESC);

ALTER TABLE public.plan_adjustment_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_adjustment_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.plan_adjustment_proposals FROM anon, authenticated;
REVOKE ALL ON public.plan_adjustment_events FROM anon, authenticated;
GRANT SELECT ON public.plan_adjustment_proposals TO authenticated;
GRANT SELECT ON public.plan_adjustment_events TO authenticated;
GRANT ALL ON public.plan_adjustment_proposals TO service_role;
GRANT ALL ON public.plan_adjustment_events TO service_role;

CREATE POLICY plan_proposal_read ON public.plan_adjustment_proposals
  FOR SELECT TO authenticated
  USING (
    athlete_id = (SELECT auth.uid())
    OR requested_by = (SELECT auth.uid())
    OR public.is_active_coach_for(athlete_id)
  );

CREATE POLICY plan_event_read ON public.plan_adjustment_events
  FOR SELECT TO authenticated
  USING (
    athlete_id = (SELECT auth.uid())
    OR public.is_active_coach_for(athlete_id)
  );

CREATE OR REPLACE FUNCTION public.confirm_plan_adjustment(proposal uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  pending public.plan_adjustment_proposals%ROWTYPE;
  target public.user_workouts%ROWTYPE;
  current_plan_version timestamptz;
  active_coach uuid;
  target_date date;
  target_slot text;
  before_value jsonb;
  after_value jsonb;
  event_id uuid;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO pending
  FROM public.plan_adjustment_proposals
  WHERE id = proposal
  FOR UPDATE;

  IF pending.id IS NULL OR pending.status NOT IN ('draft', 'pending') THEN
    RAISE EXCEPTION 'Proposal is no longer available' USING ERRCODE = 'P0001';
  END IF;
  IF pending.expires_at <= now() THEN
    RAISE EXCEPTION 'Proposal expired' USING ERRCODE = 'P0001';
  END IF;
  IF pending.decision = 'blocked' THEN
    RAISE EXCEPTION 'Blocked proposals cannot be confirmed' USING ERRCODE = '42501';
  END IF;

  SELECT profile.coach_id INTO active_coach
  FROM public.profiles profile
  WHERE profile.id = pending.athlete_id
    AND profile.coach_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.athlete_id = profile.id
        AND ca.coach_id = profile.coach_id
        AND ca.status = 'active'
    );

  IF active_coach IS NULL THEN
    IF actor <> pending.athlete_id OR pending.decision = 'coach_review' OR pending.status <> 'draft' THEN
      RAISE EXCEPTION 'Not authorized to confirm proposal' USING ERRCODE = '42501';
    END IF;
  ELSIF actor <> active_coach OR pending.decision <> 'coach_review' OR pending.status <> 'pending' THEN
    RAISE EXCEPTION 'Coach approval required' USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM public.user_workouts
  WHERE user_id = pending.athlete_id
  FOR UPDATE;

  SELECT max(updated_at) INTO current_plan_version
  FROM public.user_workouts
  WHERE user_id = pending.athlete_id;

  IF current_plan_version IS DISTINCT FROM pending.plan_version THEN
    RAISE EXCEPTION 'Plan changed. Recalculate proposal' USING ERRCODE = '40001';
  END IF;

  SELECT * INTO target
  FROM public.user_workouts
  WHERE id = pending.workout_id AND user_id = pending.athlete_id
  FOR UPDATE;

  IF target.id IS NULL OR target.status <> 'pending' THEN
    RAISE EXCEPTION 'Workout is no longer editable' USING ERRCODE = 'P0001';
  END IF;
  IF pending.proposed_intent->>'kind' <> 'move'
    OR coalesce(pending.proposed_intent->>'targetDate', '') !~ '^\d{4}-\d{2}-\d{2}$'
    OR pending.proposed_intent->>'targetSlot' NOT IN ('morning', 'evening', 'flexible')
  THEN
    RAISE EXCEPTION 'Invalid proposal intent' USING ERRCODE = '22023';
  END IF;

  target_date := (pending.proposed_intent->>'targetDate')::date;
  target_slot := pending.proposed_intent->>'targetSlot';
  IF target_date < current_date OR target_date > current_date + 56 THEN
    RAISE EXCEPTION 'Target date outside editable horizon' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_workouts existing
    WHERE existing.user_id = pending.athlete_id
      AND existing.id <> target.id
      AND existing.scheduled_date = target_date
      AND existing.scheduled_slot = target_slot
      AND existing.status <> 'missed'
  ) THEN
    RAISE EXCEPTION 'Target slot is occupied' USING ERRCODE = '23505';
  END IF;

  before_value := jsonb_build_object(
    'date', target.scheduled_date,
    'slot', target.scheduled_slot,
    'status', target.status,
    'adjustmentReason', target.adjustment_reason
  );

  UPDATE public.user_workouts
  SET scheduled_date = target_date,
      scheduled_slot = target_slot,
      adjustment_reason = coalesce(pending.evaluation->>'summary', 'Cambio confirmado desde el Plan')
  WHERE id = target.id
  RETURNING jsonb_build_object(
    'date', scheduled_date,
    'slot', scheduled_slot,
    'status', status,
    'adjustmentReason', adjustment_reason
  ) INTO after_value;

  INSERT INTO public.plan_adjustment_events (
    proposal_id, athlete_id, actor_id, workout_id, before_state, after_state
  ) VALUES (
    pending.id, pending.athlete_id, actor, pending.workout_id, before_value, after_value
  ) RETURNING id INTO event_id;

  UPDATE public.plan_adjustment_proposals
  SET status = 'confirmed', resolved_by = actor, resolved_at = now()
  WHERE id = pending.id;

  RETURN jsonb_build_object(
    'proposalId', pending.id,
    'athleteId', pending.athlete_id,
    'workoutId', pending.workout_id,
    'eventId', event_id,
    'workout', after_value,
    'confirmedAt', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_plan_adjustment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_plan_adjustment(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_plan_adjustment_request(proposal uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  draft public.plan_adjustment_proposals%ROWTYPE;
  coach uuid;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO draft FROM public.plan_adjustment_proposals WHERE id = proposal FOR UPDATE;
  IF draft.id IS NULL OR draft.athlete_id <> actor OR draft.requested_by <> actor
    OR draft.decision <> 'coach_review' OR draft.status <> 'draft' OR draft.expires_at <= now()
  THEN
    RAISE EXCEPTION 'Request is no longer available' USING ERRCODE = '42501';
  END IF;
  SELECT profile.coach_id INTO coach
  FROM public.profiles profile
  WHERE profile.id = actor AND profile.coach_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.athlete_id = actor AND ca.coach_id = profile.coach_id AND ca.status = 'active'
    );
  IF coach IS NULL THEN
    RAISE EXCEPTION 'Active coach required' USING ERRCODE = '42501';
  END IF;
  UPDATE public.plan_adjustment_proposals
  SET status = 'pending'
  WHERE id = draft.id;
  RETURN jsonb_build_object('proposalId', draft.id, 'status', 'pending', 'coachId', coach);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_plan_adjustment_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_plan_adjustment_request(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_plan_adjustment_request(proposal uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  pending public.plan_adjustment_proposals%ROWTYPE;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO pending FROM public.plan_adjustment_proposals WHERE id = proposal FOR UPDATE;
  IF pending.id IS NULL OR pending.status <> 'pending' OR pending.decision <> 'coach_review'
    OR NOT public.is_active_coach_for(pending.athlete_id)
  THEN
    RAISE EXCEPTION 'Request is no longer available' USING ERRCODE = '42501';
  END IF;
  UPDATE public.plan_adjustment_proposals
  SET status = 'rejected', resolved_by = actor, resolved_at = now()
  WHERE id = pending.id;
  RETURN jsonb_build_object('proposalId', pending.id, 'athleteId', pending.athlete_id, 'status', 'rejected');
END;
$$;

REVOKE ALL ON FUNCTION public.reject_plan_adjustment_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_plan_adjustment_request(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.undo_plan_adjustment(event uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  original public.plan_adjustment_events%ROWTYPE;
  workout public.user_workouts%ROWTYPE;
  active_coach uuid;
  restored_value jsonb;
  inverse_event uuid;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO original
  FROM public.plan_adjustment_events
  WHERE id = event
  FOR UPDATE;
  IF original.id IS NULL OR original.reverted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Change can no longer be undone' USING ERRCODE = 'P0001';
  END IF;

  SELECT profile.coach_id INTO active_coach
  FROM public.profiles profile
  WHERE profile.id = original.athlete_id
    AND profile.coach_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.coach_athletes ca
      WHERE ca.athlete_id = profile.id
        AND ca.coach_id = profile.coach_id
        AND ca.status = 'active'
    );
  IF (active_coach IS NULL AND actor <> original.athlete_id)
    OR (active_coach IS NOT NULL AND actor <> active_coach)
  THEN
    RAISE EXCEPTION 'Not authorized to undo this change' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO workout
  FROM public.user_workouts
  WHERE id = original.workout_id AND user_id = original.athlete_id
  FOR UPDATE;
  IF workout.id IS NULL OR workout.status::text <> original.after_state->>'status'
    OR workout.scheduled_date::text <> original.after_state->>'date'
    OR workout.scheduled_slot IS DISTINCT FROM original.after_state->>'slot'
  THEN
    RAISE EXCEPTION 'The workout changed again and cannot be safely undone' USING ERRCODE = '40001';
  END IF;

  UPDATE public.user_workouts
  SET scheduled_date = (original.before_state->>'date')::date,
      scheduled_slot = original.before_state->>'slot',
      adjustment_reason = nullif(original.before_state->>'adjustmentReason', '')
  WHERE id = workout.id
  RETURNING jsonb_build_object(
    'date', scheduled_date,
    'slot', scheduled_slot,
    'status', status,
    'adjustmentReason', adjustment_reason
  ) INTO restored_value;

  INSERT INTO public.plan_adjustment_events (
    proposal_id, athlete_id, actor_id, workout_id, before_state, after_state
  ) VALUES (
    original.proposal_id, original.athlete_id, actor, original.workout_id,
    original.after_state, original.before_state
  ) RETURNING id INTO inverse_event;

  UPDATE public.plan_adjustment_events
  SET reverted_at = now(), reverted_by = actor
  WHERE id = original.id;

  UPDATE public.plan_adjustment_proposals
  SET status = 'reverted', resolved_by = actor, resolved_at = now()
  WHERE id = original.proposal_id;

  RETURN jsonb_build_object(
    'eventId', original.id,
    'inverseEventId', inverse_event,
    'workoutId', original.workout_id,
    'workout', restored_value,
    'revertedAt', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.undo_plan_adjustment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.undo_plan_adjustment(uuid) TO authenticated;

COMMIT;
