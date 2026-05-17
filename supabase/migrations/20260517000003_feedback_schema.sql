-- Migración SQL: Portal de Entrenadores y Recogida de Feedback Integrado

-- 1. Añadir relación opcional de coach_id en perfiles si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Tabla para el feedback diario del atleta tras cada sesión
CREATE TABLE IF NOT EXISTS workout_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES user_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rpe_score INTEGER NOT NULL CHECK (rpe_score >= 1 AND rpe_score <= 10),
  feeling TEXT NOT NULL CHECK (feeling IN ('excelente', 'buena', 'fatigado', 'lesionado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla para sugerencias y evaluaciones de entrenadores profesionales
CREATE TABLE IF NOT EXISTS coach_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('platform_improvement', 'plan_adjustment', 'athlete_review')),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Activar Row Level Security (RLS)
ALTER TABLE workout_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_feedback ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Seguridad para workout_feedback
CREATE POLICY "Atletas gestionan su propio feedback" ON workout_feedback
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Entrenadores leen feedback de sus py-atletas" ON workout_feedback
FOR SELECT USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = workout_feedback.user_id AND coach_id = auth.uid()
));

-- 6. Políticas de Seguridad para coach_feedback
CREATE POLICY "Entrenadores gestionan sus sugerencias" ON coach_feedback
FOR ALL USING (auth.uid() = coach_id);
