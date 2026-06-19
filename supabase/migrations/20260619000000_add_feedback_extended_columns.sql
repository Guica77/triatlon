-- Agregar columnas de dolor muscular localizado y adherencia de intensidad a la tabla workout_feedback
ALTER TABLE public.workout_feedback ADD COLUMN IF NOT EXISTS pain_localized BOOLEAN DEFAULT false;
ALTER TABLE public.workout_feedback ADD COLUMN IF NOT EXISTS intensity_adherence TEXT;
ALTER TABLE public.user_workouts ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;
