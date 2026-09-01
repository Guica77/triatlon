-- Endurecimiento append-only del ciclo RAG por atleta.
-- Las tablas privadas se leen con RLS y sus escrituras pasan por RPCs
-- SECURITY DEFINER con autenticación, relación activa y transiciones acotadas.

CREATE OR REPLACE FUNCTION public.is_authorized_ai_actor(target_athlete_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role TEXT;
BEGIN
  IF auth.uid() IS NULL OR target_athlete_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT p.role
    INTO actor_role
  FROM public.profiles AS p
  WHERE p.id = auth.uid();

  IF actor_role = 'athlete' THEN
    RETURN auth.uid() = target_athlete_id;
  END IF;

  IF actor_role = 'coach' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.coach_athletes AS ca
      WHERE ca.coach_id = auth.uid()
        AND ca.athlete_id = target_athlete_id
        AND ca.status = 'active'
    );
  END IF;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_authorized_ai_athlete(target_athlete_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = target_athlete_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = auth.uid()
        AND p.role = 'athlete'
    );
$$;

REVOKE ALL ON FUNCTION public.is_authorized_ai_actor(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_authorized_ai_athlete(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_authorized_ai_actor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authorized_ai_athlete(UUID) TO authenticated;

-- Sustituir las policies de lectura para que todas compartan la misma
-- comprobación server-side y nunca acepten relaciones pending.
DROP POLICY IF EXISTS "Athletes read their AI memories" ON public.athlete_ai_memories;
DROP POLICY IF EXISTS "Coaches read active athletes AI memories" ON public.athlete_ai_memories;
CREATE POLICY "Authorized users read AI memories" ON public.athlete_ai_memories
  FOR SELECT TO authenticated
  USING (public.is_authorized_ai_actor(athlete_id));

DROP POLICY IF EXISTS "Athletes create their AI memories" ON public.athlete_ai_memories;
DROP POLICY IF EXISTS "Athletes update their AI memories" ON public.athlete_ai_memories;
CREATE POLICY "No direct AI memory writes" ON public.athlete_ai_memories
  FOR INSERT TO authenticated
  WITH CHECK (FALSE);
CREATE POLICY "No direct AI memory updates" ON public.athlete_ai_memories
  FOR UPDATE TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);
CREATE POLICY "No direct AI memory deletes" ON public.athlete_ai_memories
  FOR DELETE TO authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "Athletes read their AI recommendations" ON public.ai_recommendations;
DROP POLICY IF EXISTS "Coaches read active athletes AI recommendations" ON public.ai_recommendations;
CREATE POLICY "Authorized users read AI recommendations" ON public.ai_recommendations
  FOR SELECT TO authenticated
  USING (public.is_authorized_ai_actor(athlete_id));
DROP POLICY IF EXISTS "Athletes decide their AI recommendations" ON public.ai_recommendations;
CREATE POLICY "No direct AI recommendation updates" ON public.ai_recommendations
  FOR UPDATE TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);
CREATE POLICY "No direct AI recommendation inserts" ON public.ai_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (FALSE);
CREATE POLICY "No direct AI recommendation deletes" ON public.ai_recommendations
  FOR DELETE TO authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "Users read recommendation events they can access" ON public.ai_recommendation_events;
CREATE POLICY "Authorized users read recommendation events" ON public.ai_recommendation_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.ai_recommendations AS r
    WHERE r.id = ai_recommendation_events.recommendation_id
      AND public.is_authorized_ai_actor(r.athlete_id)
  ));
CREATE POLICY "No direct recommendation event inserts" ON public.ai_recommendation_events
  FOR INSERT TO authenticated
  WITH CHECK (FALSE);
CREATE POLICY "No direct recommendation event updates" ON public.ai_recommendation_events
  FOR UPDATE TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);
CREATE POLICY "No direct recommendation event deletes" ON public.ai_recommendation_events
  FOR DELETE TO authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "Users read recommendation results they can access" ON public.ai_recommendation_results;
CREATE POLICY "Authorized users read recommendation results" ON public.ai_recommendation_results
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.ai_recommendations AS r
    WHERE r.id = ai_recommendation_results.recommendation_id
      AND public.is_authorized_ai_actor(r.athlete_id)
  ));
CREATE POLICY "No direct recommendation result inserts" ON public.ai_recommendation_results
  FOR INSERT TO authenticated
  WITH CHECK (FALSE);
CREATE POLICY "No direct recommendation result updates" ON public.ai_recommendation_results
  FOR UPDATE TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);
CREATE POLICY "No direct recommendation result deletes" ON public.ai_recommendation_results
  FOR DELETE TO authenticated
  USING (FALSE);

DROP POLICY IF EXISTS "Anyone reads active AI knowledge documents" ON public.ai_knowledge_documents;
CREATE POLICY "Authenticated users read active AI knowledge documents" ON public.ai_knowledge_documents
  FOR SELECT TO authenticated
  USING (active = TRUE);
DROP POLICY IF EXISTS "Anyone reads active AI knowledge chunks" ON public.ai_knowledge_chunks;
CREATE POLICY "Authenticated users read active AI knowledge chunks" ON public.ai_knowledge_chunks
  FOR SELECT TO authenticated
  USING (active = TRUE AND EXISTS (
    SELECT 1
    FROM public.ai_knowledge_documents AS d
    WHERE d.id = ai_knowledge_chunks.document_id
      AND d.active = TRUE
  ));

-- El cliente autenticado conserva únicamente lectura. Los RPCs SECURITY DEFINER
-- son la única vía de escritura para los flujos de usuario.
REVOKE ALL ON TABLE
  public.athlete_ai_memories,
  public.ai_knowledge_documents,
  public.ai_knowledge_chunks,
  public.ai_recommendations,
  public.ai_recommendation_events,
  public.ai_recommendation_results
FROM anon, authenticated;

GRANT SELECT ON TABLE
  public.athlete_ai_memories,
  public.ai_knowledge_documents,
  public.ai_knowledge_chunks,
  public.ai_recommendations,
  public.ai_recommendation_events,
  public.ai_recommendation_results
TO authenticated;

-- 1. Memorias: propuesta explícita, inicialmente inactiva.
-- Los campos de revisión, expiración y embedding quedan fuera del contrato
-- público; solo los flujos server-side pueden establecerlos después.
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

REVOKE ALL ON FUNCTION public.propose_athlete_ai_memory(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.propose_athlete_ai_memory(UUID, TEXT, TEXT, TEXT) TO authenticated;


CREATE OR REPLACE FUNCTION public.confirm_athlete_ai_memory(p_memory_id UUID)
RETURNS SETOF public.athlete_ai_memories
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  memory_row public.athlete_ai_memories;
  actor_role TEXT;
  confirmed_source TEXT;
BEGIN
  SELECT * INTO memory_row
  FROM public.athlete_ai_memories
  WHERE id = p_memory_id
  FOR UPDATE;

  IF NOT FOUND OR NOT public.is_authorized_ai_actor(memory_row.athlete_id) THEN
    RAISE EXCEPTION 'Memoria no encontrada o no autorizada';
  END IF;

  IF memory_row.active THEN
    RETURN NEXT memory_row;
    RETURN;
  END IF;
  IF memory_row.source NOT IN ('athlete_proposed', 'coach_proposed') THEN
    RAISE EXCEPTION 'La memoria no está pendiente de confirmación';
  END IF;

  SELECT p.role INTO actor_role
  FROM public.profiles AS p
  WHERE p.id = auth.uid();
  confirmed_source := CASE WHEN actor_role = 'coach' THEN 'coach_confirmed' ELSE 'athlete_confirmed' END;

  UPDATE public.athlete_ai_memories
  SET active = TRUE,
      source = confirmed_source,
      confidence = 0.8,
      review_at = NULL,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_memory_id
  RETURNING * INTO memory_row;

  RETURN NEXT memory_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_athlete_ai_memory(p_memory_id UUID)
RETURNS SETOF public.athlete_ai_memories
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  memory_row public.athlete_ai_memories;
BEGIN
  SELECT * INTO memory_row
  FROM public.athlete_ai_memories
  WHERE id = p_memory_id
  FOR UPDATE;

  IF NOT FOUND OR NOT public.is_authorized_ai_actor(memory_row.athlete_id) THEN
    RAISE EXCEPTION 'Memoria no encontrada o no autorizada';
  END IF;

  IF memory_row.active THEN
    UPDATE public.athlete_ai_memories
    SET active = FALSE,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_memory_id
    RETURNING * INTO memory_row;
  END IF;

  RETURN NEXT memory_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_athlete_ai_memory(p_memory_id UUID)
RETURNS SETOF public.athlete_ai_memories
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  memory_row public.athlete_ai_memories;
BEGIN
  SELECT * INTO memory_row
  FROM public.athlete_ai_memories
  WHERE id = p_memory_id
  FOR UPDATE;

  IF NOT FOUND OR NOT public.is_authorized_ai_actor(memory_row.athlete_id) THEN
    RAISE EXCEPTION 'Memoria no encontrada o no autorizada';
  END IF;

  UPDATE public.athlete_ai_memories
  SET active = FALSE,
      review_at = COALESCE(review_at, timezone('utc'::text, now())),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_memory_id
  RETURNING * INTO memory_row;

  RETURN NEXT memory_row;
END;
$$;

-- 2. Recomendaciones: todas las transiciones generan un evento en la misma
-- transacción. Ninguna función modifica user_workouts ni training_sessions.
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

  INSERT INTO public.ai_recommendations (
    athlete_id, created_by, recommendation_type, title, explanation, payload, status
  ) VALUES (
    p_athlete_id, auth.uid(), p_recommendation_type, btrim(p_title), btrim(p_explanation),
    COALESCE(p_payload, '{}'::jsonb), 'proposed'
  )
  RETURNING * INTO recommendation_row;

  INSERT INTO public.ai_recommendation_events (recommendation_id, actor_id, event_type, metadata)
  VALUES (recommendation_row.id, auth.uid(), 'proposed', '{}'::jsonb);

  RETURN NEXT recommendation_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_ai_recommendation(
  p_recommendation_id UUID,
  p_decision TEXT
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
  SELECT * INTO recommendation_row
  FROM public.ai_recommendations
  WHERE id = p_recommendation_id
  FOR UPDATE;

  IF NOT FOUND OR NOT public.is_authorized_ai_athlete(recommendation_row.athlete_id) THEN
    RAISE EXCEPTION 'Recomendación no encontrada o no autorizada';
  END IF;
  IF p_decision NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Decisión no válida';
  END IF;
  IF recommendation_row.status = p_decision THEN
    RETURN NEXT recommendation_row;
    RETURN;
  END IF;
  IF recommendation_row.status <> 'proposed' THEN
    RAISE EXCEPTION 'La recomendación ya tiene una decisión';
  END IF;

  UPDATE public.ai_recommendations
  SET status = p_decision,
      decided_at = timezone('utc'::text, now()),
      decided_by = auth.uid(),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_recommendation_id
  RETURNING * INTO recommendation_row;

  INSERT INTO public.ai_recommendation_events (recommendation_id, actor_id, event_type, metadata)
  VALUES (recommendation_row.id, auth.uid(), p_decision, '{}'::jsonb);

  RETURN NEXT recommendation_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_ai_recommendation(
  p_recommendation_id UUID
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
  SELECT * INTO recommendation_row
  FROM public.ai_recommendations
  WHERE id = p_recommendation_id
  FOR UPDATE;

  IF NOT FOUND OR NOT public.is_authorized_ai_actor(recommendation_row.athlete_id) THEN
    RAISE EXCEPTION 'Recomendación no encontrada o no autorizada';
  END IF;
  IF recommendation_row.status = 'applied' THEN
    RETURN NEXT recommendation_row;
    RETURN;
  END IF;
  IF recommendation_row.status <> 'accepted' THEN
    RAISE EXCEPTION 'Solo se puede aplicar una recomendación aceptada';
  END IF;

  UPDATE public.ai_recommendations
  SET status = 'applied',
      applied_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_recommendation_id
  RETURNING * INTO recommendation_row;

  INSERT INTO public.ai_recommendation_events (recommendation_id, actor_id, event_type, metadata)
  VALUES (recommendation_row.id, auth.uid(), 'applied', '{}'::jsonb);

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
  WHERE id = p_recommendation_id;

  IF NOT FOUND OR NOT public.is_authorized_ai_actor(recommendation_row.athlete_id) THEN
    RAISE EXCEPTION 'Recomendación no encontrada o no autorizada';
  END IF;
  IF recommendation_row.status <> 'applied' THEN
    RAISE EXCEPTION 'El resultado solo puede registrarse después de aplicar la recomendación';
  END IF;
  IF p_outcome IS NULL OR char_length(btrim(p_outcome)) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'El resultado no es válido';
  END IF;
  IF p_notes IS NOT NULL AND char_length(p_notes) > 4000 THEN
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
REVOKE ALL ON FUNCTION public.confirm_athlete_ai_memory(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deactivate_athlete_ai_memory(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_athlete_ai_memory(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.propose_ai_recommendation(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decide_ai_recommendation(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_ai_recommendation(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_ai_recommendation_result(UUID, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.propose_athlete_ai_memory(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_athlete_ai_memory(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_athlete_ai_memory(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_athlete_ai_memory(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.propose_ai_recommendation(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_ai_recommendation(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_ai_recommendation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_ai_recommendation_result(UUID, TEXT, TEXT) TO authenticated;
