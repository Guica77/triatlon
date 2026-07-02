-- 1. Añadir lesiones previas al perfil del atleta
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS previous_injuries TEXT;

-- 2. Añadir cumplimiento nutricional a las biometrías diarias
ALTER TABLE public.user_biometrics
ADD COLUMN IF NOT EXISTS nutrition_adherence INTEGER CHECK (nutrition_adherence >= 1 AND nutrition_adherence <= 10);

-- 3. Añadir RPE (Rate of Perceived Exertion) y Sensaciones al entrenamiento
ALTER TABLE public.user_workouts
ADD COLUMN IF NOT EXISTS rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
ADD COLUMN IF NOT EXISTS feelings TEXT;
