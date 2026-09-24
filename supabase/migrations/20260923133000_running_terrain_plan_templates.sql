-- Safe, conservative base templates for running goals not previously covered
-- by the live catalog. These are general foundations, not medical advice or
-- a substitute for a race-specific coach plan.
WITH event_types(code, distance, duration_weeks, long_run_cap, terrain_note) AS (
  VALUES
    ('5k', '5K', 10, 75, 'terreno llano'),
    ('10k', '10K', 10, 90, 'terreno llano'),
    ('half', 'Media Maratón', 12, 110, 'terreno llano'),
    ('marathon', 'Maratón', 16, 135, 'terreno llano'),
    ('road_ultra', 'Ultra en asfalto', 16, 155, 'terreno estable'),
    ('trail', 'Trail', 12, 135, 'senderos sencillos y desnivel controlado'),
    ('ultra_trail', 'Ultra Trail', 16, 175, 'senderos sencillos y desnivel controlado')
), athlete_levels(level, easy_base, long_base, strength_min) AS (
  VALUES
    ('principiante', 25, 35, 20),
    ('intermedio', 35, 50, 25),
    ('avanzado', 40, 60, 30)
)
INSERT INTO public.training_plans (id, name, distance, duration_weeks, level, description)
SELECT
  'run_' || event_types.code || '_' || athlete_levels.level,
  'Plan base ' || event_types.distance || ' · ' || event_types.duration_weeks || ' semanas (' || initcap(athlete_levels.level) || ')',
  event_types.distance,
  event_types.duration_weeks,
  athlete_levels.level,
  'Plan base de carrera con progresión prudente, una sesión controlada de calidad, fuerza y recuperación. Para Trail se incorpora técnica en terreno sencillo. En objetivos Ultra, confirma el volumen y el desnivel específico con un entrenador. Reduce o detén la sesión si aparece dolor.'
FROM event_types
CROSS JOIN athlete_levels
ON CONFLICT (id) DO NOTHING;

WITH event_types(code, distance, duration_weeks, long_run_cap, terrain_note) AS (
  VALUES
    ('5k', '5K', 10, 75, 'terreno llano'),
    ('10k', '10K', 10, 90, 'terreno llano'),
    ('half', 'Media Maratón', 12, 110, 'terreno llano'),
    ('marathon', 'Maratón', 16, 135, 'terreno llano'),
    ('road_ultra', 'Ultra en asfalto', 16, 155, 'terreno estable'),
    ('trail', 'Trail', 12, 135, 'senderos sencillos y desnivel controlado'),
    ('ultra_trail', 'Ultra Trail', 16, 175, 'senderos sencillos y desnivel controlado')
), athlete_levels(level, easy_base, long_base, strength_min) AS (
  VALUES
    ('principiante', 25, 35, 20),
    ('intermedio', 35, 50, 25),
    ('avanzado', 40, 60, 30)
), plans AS (
  SELECT
    'run_' || event_types.code || '_' || athlete_levels.level AS plan_id,
    event_types.code,
    event_types.duration_weeks,
    event_types.long_run_cap,
    event_types.terrain_note,
    athlete_levels.level,
    athlete_levels.easy_base,
    athlete_levels.long_base,
    athlete_levels.strength_min
  FROM event_types CROSS JOIN athlete_levels
), scheduled AS (
  SELECT plans.*, week.week_number, slot.slot_number, slot.day_name, slot.sport_type
  FROM plans
  CROSS JOIN LATERAL generate_series(1, plans.duration_weeks) AS week(week_number)
  CROSS JOIN (VALUES
    (1, 'Martes', 'carrera'),
    (2, 'Jueves', 'carrera'),
    (3, 'Sábado', 'fuerza'),
    (4, 'Domingo', 'carrera')
  ) AS slot(slot_number, day_name, sport_type)
), durations AS (
  SELECT scheduled.*,
    CASE slot_number
      WHEN 1 THEN LEAST(60, easy_base + 5 * ((week_number - 1) / 4))
      WHEN 2 THEN LEAST(60, easy_base + 10 + 5 * ((week_number - 1) / 4))
      WHEN 3 THEN strength_min + CASE WHEN level = 'avanzado' THEN 5 ELSE 0 END
      ELSE LEAST(long_run_cap, long_base + CASE WHEN level = 'avanzado' THEN 10 ELSE 0 END + 10 * ((week_number - 1) / 2))
    END AS planned_minutes
  FROM scheduled
)
INSERT INTO public.training_sessions (
  id, plan_id, week_number, day_name, sport_type, duration_min, description
)
SELECT
  md5(plan_id || ':' || week_number::text || ':' || slot_number::text)::uuid,
  plan_id,
  week_number,
  day_name,
  sport_type,
  CASE WHEN week_number % 4 = 0 AND slot_number <> 3
    THEN GREATEST(20, round(planned_minutes * 0.7)::integer)
    ELSE planned_minutes
  END,
  CASE slot_number
    WHEN 1 THEN 'Rodaje fácil por ' || terrain_note || '. Esfuerzo cómodo (RPE 3–4/10); termina con sensación de poder continuar.'
    WHEN 2 THEN CASE
      WHEN week_number = (SELECT duration_weeks FROM plans WHERE plans.plan_id = durations.plan_id)
        THEN 'Semana de descarga: carrera muy cómoda, sin series ni esfuerzo intenso. RPE 2–3/10.'
      WHEN code IN ('trail', 'ultra_trail')
        THEN 'Calentamiento suave y técnica de subida/bajada en pendientes seguras; repeticiones cortas controladas (RPE máximo 6/10), recuperando al trote o caminando. Evita descensos agresivos.'
      ELSE 'Calentamiento suave, bloques cortos a ritmo controlado (RPE máximo 6/10) y vuelta a la calma. Recupera completamente; no es una sesión a tope.'
    END
    WHEN 3 THEN 'Fuerza general y movilidad sin dolor: sentadilla a silla, puente de glúteo, elevación de gemelos y equilibrio. Técnica controlada; para si aparece dolor.'
    ELSE CASE
      WHEN week_number = (SELECT duration_weeks FROM plans WHERE plans.plan_id = durations.plan_id)
        THEN 'Tirada fácil de descarga por ' || terrain_note || '. Mantén el esfuerzo muy cómodo y prioriza llegar descansado.'
      WHEN code IN ('trail', 'ultra_trail')
        THEN 'Tirada fácil por ' || terrain_note || '. Camina las subidas pronunciadas, practica hidratación habitual y evita aumentar el desnivel de golpe.'
      ELSE 'Tirada fácil por ' || terrain_note || '. Mantén RPE 3–4/10, hidrátate y evita acelerar al final.'
    END
  END
FROM durations
ON CONFLICT (id) DO NOTHING;
