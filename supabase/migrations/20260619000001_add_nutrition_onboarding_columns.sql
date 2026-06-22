-- Migration: Add nutrition onboarding columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allergies _text DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disliked_ingredients _text DEFAULT NULL;
