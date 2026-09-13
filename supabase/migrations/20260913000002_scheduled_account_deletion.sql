-- Account deletion is a 30-day, user-cancellable request. The actual purge is
-- performed only by the protected server-side daily cron.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled_for
  ON public.profiles (deletion_scheduled_for)
  WHERE deletion_scheduled_for IS NOT NULL;
