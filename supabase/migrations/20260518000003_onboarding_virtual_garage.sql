-- Migración SQL: Onboarding Híbrido, Garaje Virtual y AI Gear Match Loop

-- 1. Ampliación de la tabla profiles para calibración fisiológica y garaje virtual
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS target_finish_time TEXT, -- ej. '04:30:00' para Half Ironman
ADD COLUMN IF NOT EXISTS baseline_training_hours TEXT, -- ej. '4-6h', '7-10h', '12+h'
ADD COLUMN IF NOT EXISTS current_ftp NUMERIC, -- Vatios (FTP de ciclismo)
ADD COLUMN IF NOT EXISTS current_swim_pace TEXT, -- ej. '01:45' por 100m
ADD COLUMN IF NOT EXISTS current_run_pace TEXT, -- ej. '04:30' por km
ADD COLUMN IF NOT EXISTS virtual_garage TEXT[] DEFAULT '{}'; -- Inventario del atleta

-- 2. Ampliación de training_sessions para material requerido por entrenamiento
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS gear_needed TEXT[] DEFAULT '{}'; -- ej. ARRAY['Palas de Natación', 'Aletas de Natación']
