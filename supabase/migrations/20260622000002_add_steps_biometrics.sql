-- Add daily_steps column to user_biometrics
ALTER TABLE public.user_biometrics
  ADD COLUMN IF NOT EXISTS daily_steps integer DEFAULT 0;
