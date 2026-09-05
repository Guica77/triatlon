-- Persist the presentation fields needed by the app and queue Strava events so
-- the webhook can acknowledge delivery before doing slower API/AI work.

ALTER TABLE public.universal_telemetry
  ADD COLUMN IF NOT EXISTS activity_name TEXT,
  ADD COLUMN IF NOT EXISTS activity_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS elapsed_time_min INTEGER,
  ADD COLUMN IF NOT EXISTS average_speed_mps NUMERIC,
  ADD COLUMN IF NOT EXISTS summary_polyline TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS universal_telemetry_user_started_idx
  ON public.universal_telemetry (user_id, activity_started_at DESC);

CREATE TABLE IF NOT EXISTS public.strava_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type TEXT NOT NULL,
  aspect_type TEXT NOT NULL,
  object_id BIGINT NOT NULL,
  owner_id BIGINT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (object_type, aspect_type, object_id, owner_id)
);

CREATE INDEX IF NOT EXISTS strava_webhook_events_pending_idx
  ON public.strava_webhook_events (status, next_attempt_at, received_at);

ALTER TABLE public.strava_webhook_events ENABLE ROW LEVEL SECURITY;
-- No client policy by design: only the service-role webhook/cron can access it.
