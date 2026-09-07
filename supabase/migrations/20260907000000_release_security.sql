-- Apply after testing against a backup of the target schema.
BEGIN;

-- RLS policies are permissive by default. Replace, rather than add to, the
-- broad legacy policies on these tables.
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('profiles', 'coach_athletes', 'training_sessions')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename); END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.is_active_coach_for(target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coach_athletes ca JOIN public.profiles p ON p.id = ca.coach_id
    WHERE ca.coach_id = (SELECT auth.uid()) AND ca.athlete_id = target
      AND ca.status = 'active' AND p.role = 'coach'
  );
$$;
REVOKE ALL ON FUNCTION public.is_active_coach_for(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_coach_for(uuid) TO authenticated, service_role;

CREATE POLICY profile_read ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_active_coach_for(id));
CREATE POLICY profile_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()) AND role IN ('athlete', 'coach')
    AND coalesce(subscription_status, 'free') = 'free' AND coach_id IS NULL
    AND garmin_auth_tokens IS NULL AND strava_auth_tokens IS NULL
    AND NOT coalesce(garmin_connected,false) AND NOT coalesce(strava_connected,false)
    AND external_athlete_id IS NULL);
CREATE POLICY profile_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_active_coach_for(id))
  WITH CHECK (id = (SELECT auth.uid()) OR public.is_active_coach_for(id));

-- Preserve existing valid Strava sessions in the server-only token columns.
INSERT INTO public.user_connected_devices(user_id, provider, access_token, refresh_token, expires_at, scopes)
SELECT id, 'strava', strava_auth_tokens->>'access_token', strava_auth_tokens->>'refresh_token',
  to_timestamp((strava_auth_tokens->>'expires_at')::double precision / 1000), ARRAY['activity:read_all','read']
FROM public.profiles
WHERE strava_auth_tokens->>'access_token' IS NOT NULL
  AND strava_auth_tokens->>'refresh_token' IS NOT NULL
  AND coalesce(strava_auth_tokens->>'expires_at','') ~ '^[0-9]+([.][0-9]+)?$'
ON CONFLICT (user_id, provider) DO NOTHING;

-- Password-based Garmin ingestion is retired. Existing imported activities stay.
UPDATE public.profiles SET garmin_auth_tokens = NULL, strava_auth_tokens = NULL, garmin_connected = false;
DELETE FROM public.user_connected_devices WHERE provider <> 'strava';
REVOKE ALL ON public.user_connected_devices FROM anon, authenticated;
GRANT SELECT(id, user_id, provider, expires_at, scopes, created_at, updated_at)
  ON public.user_connected_devices TO authenticated;
GRANT ALL ON public.user_connected_devices TO service_role;

-- Protect privileged fields even when a client bypasses the application's UI.
CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'UPDATE' AND (
      NEW.id IS DISTINCT FROM OLD.id OR NEW.role IS DISTINCT FROM OLD.role
      OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
      OR NEW.coach_id IS DISTINCT FROM OLD.coach_id
      OR NEW.garmin_auth_tokens IS DISTINCT FROM OLD.garmin_auth_tokens
      OR NEW.strava_auth_tokens IS DISTINCT FROM OLD.strava_auth_tokens
      OR NEW.garmin_connected IS DISTINCT FROM OLD.garmin_connected
      OR NEW.strava_connected IS DISTINCT FROM OLD.strava_connected
      OR NEW.external_athlete_id IS DISTINCT FROM OLD.external_athlete_id
    ) THEN RAISE EXCEPTION 'Protected profile fields' USING ERRCODE = '42501'; END IF;
    IF TG_OP = 'UPDATE' AND OLD.id <> auth.uid() AND
      (to_jsonb(NEW) - ARRAY['updated_at','active_plan_id','current_ftp','max_hr','current_swim_pace','current_run_pace'])
      IS DISTINCT FROM
      (to_jsonb(OLD) - ARRAY['updated_at','active_plan_id','current_ftp','max_hr','current_swim_pace','current_run_pace'])
    THEN RAISE EXCEPTION 'Coach cannot edit this profile field' USING ERRCODE = '42501'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_profile_security_fields BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security_fields();

CREATE POLICY relationship_read ON public.coach_athletes FOR SELECT TO authenticated
  USING (coach_id = (SELECT auth.uid()) OR athlete_id = (SELECT auth.uid()));
-- Relationships are created only by the explicit athlete acceptance RPC.
CREATE POLICY relationship_delete ON public.coach_athletes FOR DELETE TO authenticated
  USING (coach_id = (SELECT auth.uid()) OR athlete_id = (SELECT auth.uid()));
CREATE POLICY relationship_group_update ON public.coach_athletes FOR UPDATE TO authenticated
  USING (coach_id = (SELECT auth.uid())) WITH CHECK (coach_id = (SELECT auth.uid()));
CREATE OR REPLACE FUNCTION public.protect_relationship()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND
    (NEW.coach_id IS DISTINCT FROM OLD.coach_id OR NEW.athlete_id IS DISTINCT FROM OLD.athlete_id
      OR NEW.status IS DISTINCT FROM OLD.status OR NEW.id IS DISTINCT FROM OLD.id)
  THEN RAISE EXCEPTION 'Protected relationship' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER protect_relationship BEFORE UPDATE ON public.coach_athletes
  FOR EACH ROW EXECUTE FUNCTION public.protect_relationship();

-- Minimal lookup: never expose profile secrets just to display an invitation.
CREATE OR REPLACE FUNCTION public.lookup_coach_invite(invite text)
RETURNS TABLE(id uuid, first_name text, last_name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.id, p.first_name, p.last_name FROM public.profiles p
  WHERE p.role = 'coach' AND length(invite) BETWEEN 4 AND 64
    AND (p.id::text = invite OR p.invite_code = upper(invite)) LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.lookup_coach_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_coach_invite(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.accept_coach_invite(invite text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE coach uuid; athlete uuid := auth.uid();
BEGIN
  IF athlete IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = athlete AND role = 'athlete')
    THEN RAISE EXCEPTION 'Athlete authentication required' USING ERRCODE = '42501'; END IF;
  SELECT id INTO coach FROM public.lookup_coach_invite(invite);
  IF coach IS NULL OR coach = athlete THEN RAISE EXCEPTION 'Invalid invitation'; END IF;
  INSERT INTO public.coach_athletes(coach_id, athlete_id, status) VALUES (coach, athlete, 'active')
    ON CONFLICT (coach_id, athlete_id) DO UPDATE SET status = 'active';
  UPDATE public.profiles SET coach_id = coach WHERE id = athlete;
END $$;
REVOKE ALL ON FUNCTION public.accept_coach_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_coach_invite(text) TO authenticated;

-- A legacy profile coach_id must never keep access alive after unlinking.
CREATE OR REPLACE FUNCTION public.clear_removed_coach()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.profiles SET coach_id = NULL WHERE id = OLD.athlete_id AND coach_id = OLD.coach_id;
  RETURN OLD;
END $$;
CREATE TRIGGER clear_removed_coach AFTER DELETE ON public.coach_athletes
  FOR EACH ROW EXECUTE FUNCTION public.clear_removed_coach();

DROP POLICY IF EXISTS "Coaches can view their athletes' biometrics" ON public.user_biometrics;
CREATE POLICY coach_biometrics_read ON public.user_biometrics FOR SELECT TO authenticated
  USING (public.is_active_coach_for(user_id));
DROP POLICY IF EXISTS "Coaches can view their athletes' workouts" ON public.user_workouts;
DROP POLICY IF EXISTS "Coaches can insert workouts for their athletes" ON public.user_workouts;
DROP POLICY IF EXISTS "Coaches can update workouts for their athletes" ON public.user_workouts;
DROP POLICY IF EXISTS "Coaches can delete workouts for their athletes" ON public.user_workouts;
CREATE POLICY coach_workouts ON public.user_workouts FOR ALL TO authenticated
  USING (public.is_active_coach_for(user_id)) WITH CHECK (public.is_active_coach_for(user_id));

-- Existing sessions have unknown ownership: keep them readable but immutable.
ALTER TABLE public.training_sessions ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.training_sessions ALTER COLUMN created_by SET DEFAULT auth.uid();
CREATE POLICY sessions_read ON public.training_sessions FOR SELECT TO authenticated USING (created_by IS NULL OR created_by = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.user_workouts w WHERE w.session_id = training_sessions.id));
CREATE POLICY sessions_insert ON public.training_sessions FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));
CREATE POLICY sessions_update ON public.training_sessions FOR UPDATE TO authenticated
  USING (created_by = (SELECT auth.uid())) WITH CHECK (created_by = (SELECT auth.uid()));
CREATE POLICY sessions_delete ON public.training_sessions FOR DELETE TO authenticated
  USING (created_by = (SELECT auth.uid()) AND NOT EXISTS (
    SELECT 1 FROM public.user_workouts w WHERE w.session_id = training_sessions.id));

CREATE OR REPLACE FUNCTION public.protect_shared_session()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_workouts w WHERE w.session_id = OLD.id
      AND (TG_OP = 'DELETE' OR (w.user_id <> auth.uid() AND NOT public.is_active_coach_for(w.user_id)))
  ) THEN RAISE EXCEPTION 'Shared session cannot be changed or deleted' USING ERRCODE = '42501'; END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER protect_shared_session BEFORE DELETE ON public.training_sessions
  FOR EACH ROW EXECUTE FUNCTION public.protect_shared_session();

CREATE OR REPLACE FUNCTION public.customize_coach_workout(
  athlete uuid, workout uuid, expected_session uuid, sport text, duration integer, details text, blocks jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE source_session uuid; new_session uuid;
BEGIN
  IF NOT public.is_active_coach_for(athlete) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
  IF sport NOT IN ('natacion','ciclismo','carrera','fuerza','brick','descanso') OR duration NOT BETWEEN 1 AND 1440
    OR details IS NULL OR length(details) > 16000 OR jsonb_typeof(blocks) <> 'array' OR jsonb_array_length(blocks) > 100
  THEN RAISE EXCEPTION 'Invalid workout'; END IF;
  SELECT session_id INTO source_session FROM public.user_workouts WHERE id = workout AND user_id = athlete FOR UPDATE;
  IF source_session IS NULL OR source_session <> expected_session THEN RAISE EXCEPTION 'Workout changed. Reload before editing'; END IF;
  INSERT INTO public.training_sessions(plan_id,week_number,day_name,sport_type,duration_min,description,structured_blocks,created_by)
    SELECT plan_id,week_number,day_name,sport,duration,details,blocks,auth.uid()
    FROM public.training_sessions WHERE id = source_session RETURNING id INTO new_session;
  UPDATE public.user_workouts SET session_id = new_session WHERE id = workout AND user_id = athlete;
  RETURN new_session;
END $$;
REVOKE ALL ON FUNCTION public.customize_coach_workout(uuid,uuid,uuid,text,integer,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customize_coach_workout(uuid,uuid,uuid,text,integer,text,jsonb) TO authenticated;

-- OAuth nonce consumed atomically, scoped to the authenticated user and expiry.
CREATE TABLE public.oauth_challenges (
  state_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  return_path text NOT NULL, expires_at timestamptz NOT NULL
);
ALTER TABLE public.oauth_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.oauth_challenges FROM anon, authenticated;
GRANT ALL ON public.oauth_challenges TO service_role;

CREATE TABLE public.ai_consents (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  version text NOT NULL, granted boolean NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_consents FROM anon, authenticated;
GRANT SELECT ON public.ai_consents TO authenticated;
GRANT ALL ON public.ai_consents TO service_role;
CREATE POLICY own_ai_consent ON public.ai_consents FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE TABLE public.ai_request_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL, requests integer NOT NULL
);
ALTER TABLE public.ai_request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_request_limits FROM anon, authenticated;
GRANT ALL ON public.ai_request_limits TO service_role;
CREATE OR REPLACE FUNCTION public.take_ai_request_slot(target uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE count_now integer;
BEGIN
  INSERT INTO public.ai_request_limits VALUES (target, now(), 1)
  ON CONFLICT (user_id) DO UPDATE SET
    requests = CASE WHEN ai_request_limits.window_start < now() - interval '1 hour' THEN 1 ELSE ai_request_limits.requests + 1 END,
    window_start = CASE WHEN ai_request_limits.window_start < now() - interval '1 hour' THEN now() ELSE ai_request_limits.window_start END
  RETURNING requests INTO count_now;
  RETURN count_now <= 30;
END $$;
REVOKE ALL ON FUNCTION public.take_ai_request_slot(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.take_ai_request_slot(uuid) TO service_role;

CREATE TABLE public.apple_revocation_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted text NOT NULL, iv text NOT NULL, tag text NOT NULL,
  token_type text NOT NULL CHECK (token_type IN ('access_token','refresh_token'))
);
ALTER TABLE public.apple_revocation_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.apple_revocation_tokens FROM anon, authenticated;
GRANT ALL ON public.apple_revocation_tokens TO service_role;

COMMIT;
