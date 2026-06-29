-- Añadir columna para almacenar toda la información en crudo de Garmin
ALTER TABLE user_biometrics
ADD COLUMN IF NOT EXISTS raw_garmin_data JSONB;
