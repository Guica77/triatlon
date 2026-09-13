-- Biblioteca privada de conocimiento. Solo se admiten recursos de preparación
-- para triatlón; los documentos personales nunca pasan a otros atletas.
CREATE TABLE IF NOT EXISTS public.triathlon_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'athlete', 'team', 'public')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('document', 'video', 'link')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 240),
  category TEXT NOT NULL CHECK (category IN ('natacion', 'ciclismo', 'carrera', 'fuerza', 'recuperacion', 'nutricion', 'material', 'competicion', 'planificacion')),
  sport_type TEXT,
  source_url TEXT CHECK (source_url IS NULL OR source_url ~* '^https?://'),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 20 AND 12000),
  embedding extensions.vector(768),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CHECK ((visibility IN ('athlete', 'team')) = (athlete_id IS NOT NULL) OR visibility IN ('private', 'public'))
);

CREATE INDEX IF NOT EXISTS idx_triathlon_resources_visibility ON public.triathlon_resources (athlete_id, visibility, active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_triathlon_resources_owner ON public.triathlon_resources (owner_id, active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_triathlon_resources_embedding ON public.triathlon_resources USING hnsw (embedding extensions.vector_cosine_ops) WHERE embedding IS NOT NULL;

ALTER TABLE public.triathlon_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their triathlon resources" ON public.triathlon_resources
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id AND visibility <> 'public');

CREATE POLICY "Athletes read resources explicitly shared with them" ON public.triathlon_resources
  FOR SELECT USING (active = true AND athlete_id = auth.uid() AND visibility = 'athlete');

CREATE POLICY "Active roster reads team resources" ON public.triathlon_resources
  FOR SELECT USING (active = true AND visibility = 'team' AND EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = triathlon_resources.owner_id
      AND ca.athlete_id = auth.uid()
      AND ca.status = 'active'
  ));

CREATE POLICY "Authenticated users read curated public resources" ON public.triathlon_resources
  FOR SELECT USING (active = true AND visibility = 'public');

-- The function preserves the same visibility rules while ranking only
-- resources available to the authenticated requester.
CREATE OR REPLACE FUNCTION public.match_triathlon_resource_chunks(
  query_embedding extensions.vector(768),
  match_athlete_id UUID,
  match_threshold REAL DEFAULT 0.5,
  match_count INTEGER DEFAULT 4
)
RETURNS TABLE (id UUID, document_id UUID, title TEXT, category TEXT, sport_type TEXT, source TEXT, content TEXT, similarity REAL)
LANGUAGE SQL STABLE SECURITY INVOKER SET search_path = public, extensions AS $$
  SELECT r.id, r.id AS document_id, r.title, r.category, r.sport_type,
    COALESCE(r.source_url, 'Biblioteca privada') AS source, r.content,
    (1 - (r.embedding <=> query_embedding))::REAL AS similarity
  FROM public.triathlon_resources r
  WHERE r.active = true AND r.embedding IS NOT NULL
    AND (1 - (r.embedding <=> query_embedding)) >= LEAST(GREATEST(match_threshold, 0), 1)
    AND (
      r.owner_id = auth.uid()
      OR (r.visibility = 'athlete' AND r.athlete_id = match_athlete_id AND auth.uid() = match_athlete_id)
      OR (r.visibility = 'team' AND r.athlete_id = match_athlete_id AND EXISTS (
        SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = r.owner_id AND ca.athlete_id = match_athlete_id AND ca.status = 'active'
      ))
      OR r.visibility = 'public'
    )
  ORDER BY r.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 8);
$$;

CREATE TRIGGER triathlon_resources_updated_at BEFORE UPDATE ON public.triathlon_resources
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
