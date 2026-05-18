-- Migración SQL: Tabla dedicada para gestionar múltiples dispositivos y sensores conectados en Onboarding y Ajustes

CREATE TABLE IF NOT EXISTS user_connected_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'garmin', 'strava', 'apple_health', 'coros', 'wahoo', 'suunto', 'polar', 'oura', 'whoop'
  access_token TEXT,
  refresh_token TEXT,
  external_device_id TEXT,
  priority_order INTEGER DEFAULT 1, -- 1 para GPS principal, 2 para respaldo
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_connected_devices_user_id ON user_connected_devices(user_id);
