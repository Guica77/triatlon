-- Add feedback columns to user_workouts
ALTER TABLE public.user_workouts ADD COLUMN IF NOT EXISTS rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10);
ALTER TABLE public.user_workouts ADD COLUMN IF NOT EXISTS coach_notes TEXT;
