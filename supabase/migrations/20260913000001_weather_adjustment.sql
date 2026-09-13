-- An athlete must explicitly accept weather guidance. The chosen adjustment stays
-- attached to the individual workout for coach review and later activity analysis.
ALTER TABLE public.user_workouts
  ADD COLUMN IF NOT EXISTS weather_adjustment JSONB;
