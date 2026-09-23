ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS health_data_consent_at TIMESTAMPTZ;
