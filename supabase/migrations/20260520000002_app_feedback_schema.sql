-- Migración SQL: Estructura de Datos para Recogida de Feedback de la App (NPS)

-- 1. Añadir la columna feedback_history en profiles para llevar el control de encuestas enviadas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS feedback_history JSONB DEFAULT '[]'::jsonb;

-- 2. Tabla para almacenar las encuestas de feedback completadas
CREATE TABLE IF NOT EXISTS public.app_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  days_used INTEGER NOT NULL, -- Hito de días (ej. 7, 21)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- Calificación de 1 a 5
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Activar Row Level Security (RLS)
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de seguridad RLS
CREATE POLICY "Usuarios pueden insertar su propio feedback de app" ON public.app_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden ver su propio feedback de app" ON public.app_feedback
  FOR SELECT USING (auth.uid() = user_id);
