-- Migration: Add current times for realistic planning
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_finish_time TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_swim_time TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_bike_time TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_run_time TEXT DEFAULT NULL;
