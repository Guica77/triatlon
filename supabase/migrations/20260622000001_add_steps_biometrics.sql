-- Add daily_steps column to user_biometrics
ALTER TABLE user_biometrics ADD COLUMN daily_steps integer DEFAULT 0;
