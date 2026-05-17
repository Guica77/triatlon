-- Añadir columna para la modalidad deportiva (Multisport) al perfil del usuario
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS target_race_modality TEXT DEFAULT 'triatlon';
