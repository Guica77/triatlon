-- Script para insertar un Plan de Entrenamiento de Élite (Doble Sesión Diaria, 1 Cool Off, 1 Relax)
-- Ejecuta esto en tu panel SQL de Supabase.

-- 1. Crear el Plan de Élite
INSERT INTO public.training_plans (id, name, description, distance, level, duration_weeks)
VALUES (
    'elite-ironman-plan-001',
    'Elite Ironman (Doble Sesión)',
    'Plan avanzado: 2 sesiones diarias (mañana/tarde), 1 día de descanso activo (cool off), 1 día de recuperación total (full relax).',
    'Ironman / Full',
    'avanzado',
    1
) ON CONFLICT (id) DO NOTHING;

-- 2. Insertar la estructura de la Semana 1
-- Lunes (Día 1): Doble Sesión
INSERT INTO public.training_sessions (plan_id, week_number, day_name, sport_type, duration_min, description)
VALUES ('elite-ironman-plan-001', 1, 'Lunes', 'natacion', 60, 'Series de Fuerza en Agua 10x100m. Ritmo Z3');

INSERT INTO public.training_sessions (plan_id, week_number, day_name, sport_type, duration_min, description)
VALUES ('elite-ironman-plan-001', 1, 'Lunes', 'fuerza', 45, 'Fuerza Máxima Tren Inferior (Sentadilla Búlgara). Z1');

-- Martes (Día 2): Doble Sesión
INSERT INTO public.training_sessions (plan_id, week_number, day_name, sport_type, duration_min, description)
VALUES ('elite-ironman-plan-001', 1, 'Martes', 'ciclismo', 90, 'Series Vo2Max en Rodillo (Pulsaciones altas). Z4/Z5');

INSERT INTO public.training_sessions (plan_id, week_number, day_name, sport_type, duration_min, description)
VALUES ('elite-ironman-plan-001', 1, 'Martes', 'carrera', 40, 'Carrera suave transición (Brick). Z2');

-- Miércoles (Día 3): Doble Sesión
INSERT INTO public.training_sessions (plan_id, week_number, day_name, sport_type, duration_min, description)
VALUES ('elite-ironman-plan-001', 1, 'Miércoles', 'natacion', 60, 'Natación continua aeróbica 2500m. Z2');

INSERT INTO public.training_sessions (plan_id, week_number, day_name, sport_type, duration_min, description)
VALUES ('elite-ironman-plan-001', 1, 'Miércoles', 'fuerza', 45, 'Fuerza Estabilizadora Core y Hombros. Z1');

-- Jueves (Día 4): Doble Sesión
INSERT INTO public.training_sessions (plan_id, week_number, day_name, sport_type, duration_min, description)
VALUES ('elite-ironman-plan-001', 1, 'Jueves', 'carrera', 75, 'Fartlek 10x(1min rápido, 1min lento). Z3/Z4');

INSERT INTO public.training_sessions (plan_id, week_number, day_name, sport_type, duration_min, description)
VALUES ('elite-ironman-plan-001', 1, 'Jueves', 'ciclismo', 60, 'Rodaje suave recuperador. Z1/Z2');

-- Viernes (Día 5): Cool Off (Descanso Activo)
INSERT INTO public.training_sessions (plan_id, week_number, day_name, sport_type, duration_min, description)
VALUES ('elite-ironman-plan-001', 1, 'Viernes', 'natacion', 30, 'Natación Suave (Cool Off / Técnica). Z1');

-- Sábado (Día 6): Doble Sesión (Tirada Larga)
INSERT INTO public.training_sessions (plan_id, week_number, day_name, sport_type, duration_min, description)
VALUES ('elite-ironman-plan-001', 1, 'Sábado', 'ciclismo', 180, 'Tirada Larga (Endurance). Z2');

INSERT INTO public.training_sessions (plan_id, week_number, day_name, sport_type, duration_min, description)
VALUES ('elite-ironman-plan-001', 1, 'Sábado', 'carrera', 30, 'Transición rápida post-bici. Z3');

-- Domingo (Día 7): Full Relax (Día Libre)
-- (No se insertan sesiones, lo que automáticamente genera un día libre sin entrenamientos en la App)
