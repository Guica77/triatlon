-- Cierre del canal de embeddings: la generación y persistencia se ejecutan solo
-- desde tareas server-side con la service role. El cliente autenticado no recibe
-- permisos para enviar ni modificar vectores.

DROP FUNCTION IF EXISTS public.set_athlete_ai_memory_embedding(UUID, extensions.vector(768));

CREATE OR REPLACE FUNCTION public.set_athlete_ai_memory_embedding_internal(
  p_memory_id UUID,
  p_embedding extensions.vector(768)
)
RETURNS SETOF public.athlete_ai_memories
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  memory_row public.athlete_ai_memories;
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Operación reservada al servidor';
  END IF;

  IF p_embedding IS NULL THEN
    RAISE EXCEPTION 'El embedding no puede ser nulo';
  END IF;

  SELECT * INTO memory_row
  FROM public.athlete_ai_memories
  WHERE id = p_memory_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Memoria no encontrada';
  END IF;
  IF memory_row.active OR memory_row.source NOT IN ('athlete_proposed', 'coach_proposed') THEN
    RAISE EXCEPTION 'La memoria no está pendiente de indexación';
  END IF;

  UPDATE public.athlete_ai_memories
  SET embedding = p_embedding,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_memory_id
  RETURNING * INTO memory_row;

  RETURN NEXT memory_row;
END;
$$;

REVOKE ALL ON FUNCTION public.set_athlete_ai_memory_embedding_internal(UUID, extensions.vector(768))
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_athlete_ai_memory_embedding_internal(UUID, extensions.vector(768))
TO service_role;
