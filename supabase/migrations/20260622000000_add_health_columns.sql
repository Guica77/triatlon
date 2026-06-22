-- Migration: Add weight and daily steps to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_weight NUMERIC DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_steps INTEGER DEFAULT NULL;
