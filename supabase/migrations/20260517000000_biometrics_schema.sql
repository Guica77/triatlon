-- Ampliar la tabla profiles con métricas de rendimiento del atleta
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ftp INTEGER DEFAULT 250,
ADD COLUMN IF NOT EXISTS swim_pace TEXT DEFAULT '1:45',
ADD COLUMN IF NOT EXISTS run_pace TEXT DEFAULT '4:30';

-- Crear la tabla user_biometrics para seguimiento diario
CREATE TABLE IF NOT EXISTS user_biometrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hrv INTEGER DEFAULT 65,
    rhr INTEGER DEFAULT 52,
    sleep_hours NUMERIC(4,1) DEFAULT 7.5,
    sleep_score INTEGER DEFAULT 85,
    weight NUMERIC(5,1) DEFAULT 72.0,
    fatigue_rating INTEGER DEFAULT 2, -- 1 (fresco) a 5 (agotado)
    stress_level INTEGER DEFAULT 2, -- 1 (calma) a 5 (estrés máximo)
    readiness_score INTEGER DEFAULT 85, -- 0 a 100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE user_biometrics ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para user_biometrics
CREATE POLICY "Users can view own biometrics" 
    ON user_biometrics FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biometrics" 
    ON user_biometrics FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biometrics" 
    ON user_biometrics FOR UPDATE 
    USING (auth.uid() = user_id);
