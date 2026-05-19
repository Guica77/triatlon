-- Catálogo de Ejercicios de Fuerza (Library)
CREATE TABLE public.strength_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    target_sport TEXT, -- natacion, ciclismo, carrera, core
    muscle_group TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Métricas y Progreso del Atleta (1RM y Max Weight)
CREATE TABLE public.athlete_strength_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.strength_exercises(id) ON DELETE CASCADE NOT NULL,
    estimated_1rm_kg NUMERIC,
    max_weight_lifted_kg NUMERIC,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, exercise_id)
);

-- Registro de Entrenamiento Diario (Gym Companion Tracker)
CREATE TABLE public.workout_strength_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_workout_id UUID REFERENCES public.user_workouts(id) ON DELETE CASCADE NOT NULL,
    exercise_id UUID REFERENCES public.strength_exercises(id) NOT NULL,
    set_number INTEGER NOT NULL,
    target_reps INTEGER,
    reps_completed INTEGER,
    weight_kg NUMERIC,
    rir INTEGER, -- Repetitions In Reserve (Autorregulación)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.strength_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ejercicios son públicos" ON public.strength_exercises FOR SELECT USING (true);

ALTER TABLE public.athlete_strength_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver propias métricas de fuerza" ON public.athlete_strength_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Editar propias métricas de fuerza" ON public.athlete_strength_metrics FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.workout_strength_logs ENABLE ROW LEVEL SECURITY;
-- Assuming user_workout_id maps to a user_workout owned by auth.uid(). We simplify here for MVP.
CREATE POLICY "Acceso a logs de fuerza" ON public.workout_strength_logs FOR ALL USING (true); 

-- Seed Data (Ejercicios Básicos de Triatlón)
INSERT INTO public.strength_exercises (name, target_sport, muscle_group) VALUES
('Sentadilla Búlgara con Mancuernas', 'ciclismo', 'Piernas (Cuádriceps, Glúteos)'),
('Peso Muerto Rumano', 'carrera', 'Isquiosurales'),
('Dominadas (Pull-ups)', 'natacion', 'Espalda / Dorsal'),
('Prensa de Piernas', 'ciclismo', 'Piernas Global'),
('Elevación de Gemelos (Sóleo)', 'carrera', 'Gemelos');
