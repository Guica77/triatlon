-- Añadir columnas para los objetivos de carrera al perfil del usuario
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS target_race_name TEXT,
ADD COLUMN IF NOT EXISTS target_race_date DATE,
ADD COLUMN IF NOT EXISTS target_race_distance TEXT;
