-- Migración SQL: Agregar horas semanales por disciplina a la tabla profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS swim_weekly_hours INTEGER DEFAULT 2;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bike_weekly_hours INTEGER DEFAULT 4;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS run_weekly_hours INTEGER DEFAULT 3;
