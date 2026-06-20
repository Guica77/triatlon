-- Migration: Add nutrition onboarding columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disliked_ingredients TEXT[] DEFAULT NULL;
