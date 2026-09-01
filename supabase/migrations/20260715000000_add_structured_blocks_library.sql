-- Migration: Add structured_blocks to coach_workout_library
ALTER TABLE public.coach_workout_library ADD COLUMN IF NOT EXISTS structured_blocks jsonb;
