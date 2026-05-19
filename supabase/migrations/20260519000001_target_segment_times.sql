-- Migración SQL: Agregar tiempos objetivo por segmento a la tabla profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_swim_time TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_bike_time TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_run_time TEXT;
