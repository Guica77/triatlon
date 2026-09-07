BEGIN;
CREATE TABLE public.chat_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
ALTER TABLE public.chat_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_blocks FROM anon;
GRANT SELECT, INSERT, DELETE ON public.chat_blocks TO authenticated;
GRANT ALL ON public.chat_blocks TO service_role;
CREATE POLICY own_blocks ON public.chat_blocks FOR ALL TO authenticated
  USING (blocker_id = (SELECT auth.uid())) WITH CHECK (blocker_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.chat_is_blocked(a uuid,b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IN (a,b) AND EXISTS (SELECT 1 FROM public.chat_blocks WHERE (blocker_id=a AND blocked_id=b) OR (blocker_id=b AND blocked_id=a));
$$;
REVOKE ALL ON FUNCTION public.chat_is_blocked(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chat_is_blocked(uuid,uuid) TO authenticated;

-- A restrictive policy also applies when older permissive policies remain.
CREATE POLICY safe_direct_messages ON public.chat_messages AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (sender_id = (SELECT auth.uid()) AND length(btrim(message)) BETWEEN 1 AND 4000
    AND NOT public.chat_is_blocked(sender_id,receiver_id)
    AND EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.status='active'
      AND ((ca.coach_id=sender_id AND ca.athlete_id=receiver_id) OR (ca.coach_id=receiver_id AND ca.athlete_id=sender_id))));

CREATE TABLE IF NOT EXISTS public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.coach_groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.group_messages TO authenticated;
GRANT ALL ON public.group_messages TO service_role;
REVOKE ALL ON public.group_messages FROM anon;
CREATE OR REPLACE FUNCTION public.is_chat_group_member(target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.coach_groups WHERE id=target AND coach_id=auth.uid())
    OR EXISTS (SELECT 1 FROM public.coach_athletes WHERE group_id=target AND athlete_id=auth.uid() AND status='active');
$$;
REVOKE ALL ON FUNCTION public.is_chat_group_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_chat_group_member(uuid) TO authenticated;
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='group_messages'
  LOOP EXECUTE format('DROP POLICY %I ON public.group_messages',p.policyname); END LOOP;
END $$;
CREATE POLICY group_message_read ON public.group_messages FOR SELECT TO authenticated
  USING (public.is_chat_group_member(group_id) AND NOT public.chat_is_blocked(auth.uid(),sender_id));
CREATE POLICY group_message_insert ON public.group_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id=auth.uid() AND public.is_chat_group_member(group_id) AND length(btrim(message)) BETWEEN 1 AND 4000);
CREATE INDEX IF NOT EXISTS group_messages_history ON public.group_messages(group_id,created_at,id);

CREATE TABLE public.chat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL, message_kind text NOT NULL CHECK(message_kind IN ('direct','group')),
  reason text NOT NULL CHECK(length(reason) BETWEEN 5 AND 1000),
  status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewed')),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(reporter_id,message_id,message_kind)
);
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_reports FROM anon,authenticated;
GRANT SELECT ON public.chat_reports TO authenticated;
GRANT ALL ON public.chat_reports TO service_role;
CREATE POLICY own_reports ON public.chat_reports FOR SELECT TO authenticated USING(reporter_id=auth.uid());
COMMIT;
