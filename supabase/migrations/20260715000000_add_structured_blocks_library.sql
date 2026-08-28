-- Migration: Add structured_blocks to coach_workout_library
ALTER TABLE coach_workout_library ADD structured_blocks jsonb;
