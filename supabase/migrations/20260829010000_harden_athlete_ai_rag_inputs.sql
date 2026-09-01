-- Endurecimiento adicional del contrato RAG.
-- Los embeddings se generan en servidor y no forman parte de la propuesta pública.
-- Las recomendaciones solo aceptan payloads JSON objeto acotados.

-- La firma pública segura ya se creó en la migración de endurecimiento anterior.
-- No se elimina ninguna firma histórica aquí: esta migración solo reaplica
-- validaciones de entrada para instalaciones que ya ejecutaron esa migración.

CREATE OR REPLACE FUNCTION public.propose_athlete_ai_memory(
  p_athlete_id UUID,
  p_memory_type TEXT,
  p_content TEXT,
  p_sport_type TEXT DEFAULT NULL
)
RETURNS SETOF public.athlete_ai_memories
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  actor_role TEXT;
  memory_source TEXT;
BEGIN
  IF NOT public.is_authorized_ai_actor(p_athlete_id) THEN
    RAISE EXCEPTION 'No autorizado para este atleta';
  END IF;

  IF p_memory_type NOT IN ('preference', 'constraint', 'injury', 'training', 'goal', 'feedback', 'other') THEN
    RAISE EXCEPTION 'Tipo de memoria no válido';
  END IF;
  IF p_content IS NULL OR char_length(btrim(p_content)) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'El contenido de la memoria no es válido';
  END IF;
  IF p_sport_type IS NOT NULL AND p_sport_type !~ '^[a-zA-Z0-9_-]{1,32}$' THEN
    RAISE EXCEPTION 'El deporte no es válido';
  END IF;

  SELECT p.role INTO actor_role
  FROM public.profiles AS p
  WHERE p.id = auth.uid();
  memory_source := CASE WHEN actor_role = 'coach' THEN 'coach_proposed' ELSE 'athlete_proposed' END;

  RETURN QUERY
  INSERT INTO public.athlete_ai_memories (
    athlete_id, memory_type, content, sport_type, source, confidence, active
  ) VALUES (
    p_athlete_id, p_memory_type, btrim(p_content), NULLIF(lower(btrim(p_sport_type)), ''),
    memory_source, 0.5, FALSE
  )
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.propose_ai_recommendation(
  p_athlete_id UUID,
  p_recommendation_type TEXT,
  p_title TEXT,
  p_explanation TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF public.ai_recommendations
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recommendation_row public.ai_recommendations;
BEGIN
  IF NOT public.is_authorized_ai_actor(p_athlete_id) THEN
    RAISE EXCEPTION 'No autorizado para este atleta';
  END IF;
  IF p_recommendation_type NOT IN ('training', 'recovery', 'nutrition', 'periodization', 'other') THEN
    RAISE EXCEPTION 'Tipo de recomendación no válido';
  END IF;
  IF p_title IS NULL OR char_length(btrim(p_title)) NOT BETWEEN 1 AND 240 THEN
    RAISE EXCEPTION 'El título de la recomendación no es válido';
  END IF;
  IF p_explanation IS NULL OR char_length(btrim(p_explanation)) NOT BETWEEN 1 AND 4000 THEN
    RAISE EXCEPTION 'La explicación de la recomendación no es válida';
  END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' OR octet_length(p_payload::text) > 8000 THEN
    RAISE EXCEPTION 'El payload de la recomendación no es válido';
  END IF;

  INSERT INTO public.ai_recommendations (
    athlete_id, created_by, recommendation_type, title, explanation, payload, status
  ) VALUES (
    p_athlete_id, auth.uid(), p_recommendation_type, btrim(p_title), btrim(p_explanation),
    p_payload, 'proposed'
  )
  RETURNING * INTO recommendation_row;

  INSERT INTO public.ai_recommendation_events (recommendation_id, actor_id, event_type, metadata)
  VALUES (recommendation_row.id, auth.uid(), 'proposed', '{}'::jsonb);

  RETURN NEXT recommendation_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_ai_recommendation_result(
  p_recommendation_id UUID,
  p_outcome TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS SETOF public.ai_recommendation_results
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recommendation_row public.ai_recommendations;
  result_row public.ai_recommendation_results;
BEGIN
  SELECT * INTO recommendation_row
  FROM public.ai_recommendations
  WHERE id = p_recommendation_id
  FOR UPDATE;

  IF NOT FOUND OR NOT public.is_authorized_ai_actor(recommendation_row.athlete_id) THEN
    RAISE EXCEPTION 'Recomendación no encontrada o no autorizada';
  END IF;
  IF recommendation_row.status <> 'applied' THEN
    RAISE EXCEPTION 'El resultado solo puede registrarse después de aplicar la recomendación';
  END IF;
  IF p_outcome IS NULL OR char_length(btrim(p_outcome)) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'El resultado no es válido';
  END IF;
  IF p_notes IS NOT NULL AND char_length(btrim(p_notes)) > 4000 THEN
    RAISE EXCEPTION 'Las notas del resultado son demasiado largas';
  END IF;

  SELECT * INTO result_row
  FROM public.ai_recommendation_results
  WHERE recommendation_id = p_recommendation_id
  FOR UPDATE;

  IF FOUND THEN
    IF result_row.outcome = btrim(p_outcome)
       AND result_row.notes IS NOT DISTINCT FROM NULLIF(btrim(p_notes), '') THEN
      RETURN NEXT result_row;
      RETURN;
    END IF;
    RAISE EXCEPTION 'La recomendación ya tiene un resultado diferente';
  END IF;

  INSERT INTO public.ai_recommendation_results (
    id, recommendation_id, outcome, notes, created_by
  ) VALUES (
    recommendation_row.id, recommendation_row.id, btrim(p_outcome), NULLIF(btrim(p_notes), ''), auth.uid()
  )
  RETURNING * INTO result_row;

  INSERT INTO public.ai_recommendation_events (recommendation_id, actor_id, event_type, metadata)
  VALUES (recommendation_row.id, auth.uid(), 'reviewed', '{}'::jsonb);

  RETURN NEXT result_row;
END;
$$;

REVOKE ALL ON FUNCTION public.propose_athlete_ai_memory(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.propose_ai_recommendation(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_ai_recommendation_result(UUID, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.propose_athlete_ai_memory(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.propose_ai_recommendation(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_ai_recommendation_result(UUID, TEXT, TEXT) TO authenticated;
