-- Migración SQL: Inteligencia de Actividad ("analizar → felicitar → reajustar")
--
-- Estrategia:
-- 1. user_workouts guarda qué se hizo de verdad (actual_discipline), el mensaje AI
--    (felicitación honesta) y la propuesta de reajuste (JSONB, acción + texto).
-- 2. universal_telemetry admite actividades "extra" (pádel, caminata…) que llegan
--    sin una sesión planificada: workout_id pasa a ser NULLable.
-- 3. universal_telemetry registra la etiqueta (sport_label), el resultado de la
--    clasificación (outcome_kind) y un comentario AI (ai_comment).

-- 1. user_workouts
ALTER TABLE user_workouts ADD COLUMN IF NOT EXISTS actual_discipline TEXT;
ALTER TABLE user_workouts ADD COLUMN IF NOT EXISTS ai_feedback TEXT;
ALTER TABLE user_workouts ADD COLUMN IF NOT EXISTS refocus_proposal JSONB;
ALTER TABLE user_workouts ADD COLUMN IF NOT EXISTS refocus_applied BOOLEAN DEFAULT false;

-- 2. Actividades extra sin sesión planificada (constraint relajado a propósito).
ALTER TABLE universal_telemetry ALTER COLUMN workout_id DROP NOT NULL;

-- 3. universal_telemetry
ALTER TABLE universal_telemetry ADD COLUMN IF NOT EXISTS sport_label TEXT;
ALTER TABLE universal_telemetry ADD COLUMN IF NOT EXISTS outcome_kind TEXT;
ALTER TABLE universal_telemetry ADD COLUMN IF NOT EXISTS ai_comment TEXT;