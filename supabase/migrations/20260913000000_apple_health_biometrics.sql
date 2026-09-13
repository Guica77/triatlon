ALTER TABLE public.user_biometrics
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;

ALTER TABLE public.user_biometrics
  DROP CONSTRAINT IF EXISTS user_biometrics_source_check;

ALTER TABLE public.user_biometrics
  ADD CONSTRAINT user_biometrics_source_check
  CHECK (source IS NULL OR source IN ('apple_health', 'manual', 'garmin'));
