-- Migración SQL: Ingesta de Telemetría Universal ("Garmin y Todos") y Recálculo Dinámico

-- 1. Añadir flags de reajuste automático y TSS real a user_workouts
ALTER TABLE user_workouts ADD COLUMN IF NOT EXISTS auto_adjusted BOOLEAN DEFAULT false;
ALTER TABLE user_workouts ADD COLUMN IF NOT EXISTS actual_tss NUMERIC;

-- 2. Tabla maestra para la normalización de telemetría omni-ecosistema
CREATE TABLE IF NOT EXISTS universal_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES user_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_provider TEXT NOT NULL CHECK (source_provider IN ('garmin', 'strava', 'apple_health', 'polar', 'suunto', 'coros', 'wahoo')),
  external_activity_id TEXT NOT NULL,
  
  -- Métricas de Tiempo y Distancia ("Minutos corridos")
  actual_duration_min NUMERIC NOT NULL,
  moving_time_min NUMERIC,
  actual_distance_km NUMERIC NOT NULL,
  elevation_gain_m NUMERIC DEFAULT 0,

  -- Métricas Fisiológicas y Biomecánicas
  actual_tss NUMERIC NOT NULL,
  avg_hr NUMERIC,
  max_hr NUMERIC,
  hr_zones_summary JSONB, -- Tiempo en segundos pasado en Z1, Z2, Z3, Z4, Z5
  avg_power NUMERIC,
  normalized_power NUMERIC,
  avg_cadence NUMERIC, -- SPM (zancadas) o RPM (pedaleo)
  training_effect_aerobic NUMERIC,
  training_effect_anaerobic NUMERIC,

  raw_payload JSONB NOT NULL, -- Respaldo del archivo FIT/JSON original completo
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_external_activity UNIQUE (source_provider, external_activity_id)
);

-- 3. Activar Row Level Security (RLS)
ALTER TABLE universal_telemetry ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad
CREATE POLICY "Atletas leen su propia telemetría" ON universal_telemetry
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Entrenadores leen telemetría de sus py-atletas" ON universal_telemetry
FOR SELECT USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = universal_telemetry.user_id AND coach_id = auth.uid()
));
