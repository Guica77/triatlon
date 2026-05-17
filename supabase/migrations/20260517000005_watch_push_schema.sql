-- Migración SQL para la gestión de credenciales OAuth y logs de sincronización de entrenamientos con relojes

-- 1. Tabla de Dispositivos/Cuentas Conectadas (OAuth Tokens)
CREATE TABLE IF NOT EXISTS user_connected_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('garmin', 'strava', 'apple_health', 'coros', 'suunto', 'wahoo')),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE user_connected_devices ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_connected_devices
CREATE POLICY "Atletas gestionan sus propias credenciales de dispositivos"
  ON user_connected_devices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 2. Tabla de Logs y Cola de Sincronización de Workouts (Resiliencia)
CREATE TABLE IF NOT EXISTS workout_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES user_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_workout_id TEXT, -- ID devuelto por Garmin Connect / Strava al crearlo exitosamente
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE workout_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para workout_sync_logs
CREATE POLICY "Atletas leen y gestionan sus propios logs de sincronizacion"
  ON workout_sync_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Entrenadores leen logs de sincronizacion de sus atletas"
  ON workout_sync_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = workout_sync_logs.user_id
      AND profiles.coach_id = auth.uid()
    )
  );
