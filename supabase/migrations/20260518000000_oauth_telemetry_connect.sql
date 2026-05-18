-- Migración SQL: Columnas de conexión OAuth reales para Garmin y Strava en la tabla profiles

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS garmin_connected BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS strava_connected BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS external_athlete_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS garmin_auth_tokens JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS strava_auth_tokens JSONB;

-- Crear un índice para búsquedas rápidas por external_athlete_id cuando llegan webhooks en segundo plano
CREATE INDEX IF NOT EXISTS idx_profiles_external_athlete_id ON profiles(external_athlete_id);
