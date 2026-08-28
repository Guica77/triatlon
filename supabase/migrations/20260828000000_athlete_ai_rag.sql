-- Migración SQL: contexto RAG híbrido por atleta
--
-- La información reciente y exacta continúa viviendo en las tablas de entrenamiento.
-- Estas tablas guardan únicamente memorias confirmadas, conocimiento curado y el
-- ciclo de vida auditable de recomendaciones. La IA no aplica cambios de plan.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- 1. Memorias explícitas y revisables de cada atleta
CREATE TABLE IF NOT EXISTS public.athlete_ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'constraint', 'injury', 'training', 'goal', 'feedback', 'other')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  sport_type TEXT,
  source TEXT NOT NULL DEFAULT 'athlete_confirmed',
  confidence NUMERIC(4, 3) NOT NULL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  active BOOLEAN NOT NULL DEFAULT true,
  review_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  embedding extensions.vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Conocimiento deportivo curado, separado de los datos privados del atleta
CREATE TABLE IF NOT EXISTS public.ai_knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 240),
  category TEXT NOT NULL,
  sport_type TEXT,
  source TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.ai_knowledge_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  embedding extensions.vector(768),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(document_id, chunk_index)
);

-- 3. Recomendaciones propuestas y su resultado, sin mutación implícita del plan
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('training', 'recovery', 'nutrition', 'periodization', 'other')),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 240),
  explanation TEXT NOT NULL CHECK (char_length(explanation) BETWEEN 1 AND 4000),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected', 'applied', 'expired')),
  proposed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_recommendation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES public.ai_recommendations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('proposed', 'accepted', 'rejected', 'applied', 'expired', 'reviewed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_recommendation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL UNIQUE REFERENCES public.ai_recommendations(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (char_length(outcome) BETWEEN 1 AND 2000),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 4000),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 4. Índices relacionales y vectoriales
CREATE INDEX IF NOT EXISTS idx_athlete_ai_memories_athlete_active
  ON public.athlete_ai_memories(athlete_id, active, expires_at);
CREATE INDEX IF NOT EXISTS idx_athlete_ai_memories_sport
  ON public.athlete_ai_memories(athlete_id, sport_type);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_documents_active
  ON public.ai_knowledge_documents(active, sport_type);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_chunks_document
  ON public.ai_knowledge_chunks(document_id, active);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_athlete_status
  ON public.ai_recommendations(athlete_id, status, proposed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_events_recommendation
  ON public.ai_recommendation_events(recommendation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_athlete_ai_memories_embedding
  ON public.athlete_ai_memories USING hnsw (embedding extensions.vector_cosine_ops)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_chunks_embedding
  ON public.ai_knowledge_chunks USING hnsw (embedding extensions.vector_cosine_ops)
  WHERE embedding IS NOT NULL;

-- 5. Búsqueda semántica. SECURITY INVOKER conserva RLS del usuario autenticado.
CREATE OR REPLACE FUNCTION public.match_athlete_ai_memories(
  query_embedding extensions.vector(768),
  match_athlete_id UUID,
  match_sport_type TEXT DEFAULT NULL,
  match_threshold REAL DEFAULT 0.65,
  match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  athlete_id UUID,
  memory_type TEXT,
  content TEXT,
  sport_type TEXT,
  source TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ,
  similarity REAL
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT
    m.id,
    m.athlete_id,
    m.memory_type,
    m.content,
    m.sport_type,
    m.source,
    m.confidence,
    m.created_at,
    (1 - (m.embedding <=> query_embedding))::REAL AS similarity
  FROM public.athlete_ai_memories AS m
  WHERE m.athlete_id = match_athlete_id
    AND m.active = true
    AND (m.expires_at IS NULL OR m.expires_at > timezone('utc'::text, now()))
    AND (match_sport_type IS NULL OR m.sport_type IS NULL OR m.sport_type = match_sport_type)
    AND m.embedding IS NOT NULL
    AND (1 - (m.embedding <=> query_embedding)) >= LEAST(GREATEST(match_threshold, 0), 1)
  ORDER BY m.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 20);
$$;

CREATE OR REPLACE FUNCTION public.match_ai_knowledge_chunks(
  query_embedding extensions.vector(768),
  match_sport_type TEXT DEFAULT NULL,
  match_threshold REAL DEFAULT 0.65,
  match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  title TEXT,
  category TEXT,
  sport_type TEXT,
  source TEXT,
  content TEXT,
  similarity REAL
)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT
    c.id,
    c.document_id,
    d.title,
    d.category,
    d.sport_type,
    d.source,
    c.content,
    (1 - (c.embedding <=> query_embedding))::REAL AS similarity
  FROM public.ai_knowledge_chunks AS c
  JOIN public.ai_knowledge_documents AS d ON d.id = c.document_id
  WHERE c.active = true
    AND d.active = true
    AND (match_sport_type IS NULL OR d.sport_type IS NULL OR d.sport_type = match_sport_type)
    AND c.embedding IS NOT NULL
    AND (1 - (c.embedding <=> query_embedding)) >= LEAST(GREATEST(match_threshold, 0), 1)
  ORDER BY c.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 20);
$$;

-- 6. RLS: los datos privados siempre se filtran por atleta y relación activa.
ALTER TABLE public.athlete_ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes read their AI memories" ON public.athlete_ai_memories
  FOR SELECT USING (auth.uid() = athlete_id);
CREATE POLICY "Coaches read active athletes AI memories" ON public.athlete_ai_memories
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid() AND ca.athlete_id = athlete_ai_memories.athlete_id AND ca.status = 'active'
  ));
CREATE POLICY "Athletes create their AI memories" ON public.athlete_ai_memories
  FOR INSERT WITH CHECK (auth.uid() = athlete_id AND source IN ('athlete_confirmed', 'coach_confirmed'));
CREATE POLICY "Athletes update their AI memories" ON public.athlete_ai_memories
  FOR UPDATE USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Anyone reads active AI knowledge documents" ON public.ai_knowledge_documents
  FOR SELECT USING (active = true);
CREATE POLICY "Anyone reads active AI knowledge chunks" ON public.ai_knowledge_chunks
  FOR SELECT USING (active = true AND EXISTS (
    SELECT 1 FROM public.ai_knowledge_documents d WHERE d.id = ai_knowledge_chunks.document_id AND d.active = true
  ));

CREATE POLICY "Athletes read their AI recommendations" ON public.ai_recommendations
  FOR SELECT USING (auth.uid() = athlete_id);
CREATE POLICY "Coaches read active athletes AI recommendations" ON public.ai_recommendations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid() AND ca.athlete_id = ai_recommendations.athlete_id AND ca.status = 'active'
  ));
CREATE POLICY "Athletes decide their AI recommendations" ON public.ai_recommendations
  FOR UPDATE USING (auth.uid() = athlete_id)
  WITH CHECK (auth.uid() = athlete_id AND status IN ('accepted', 'rejected'));

CREATE POLICY "Users read recommendation events they can access" ON public.ai_recommendation_events
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.ai_recommendations r
    WHERE r.id = ai_recommendation_events.recommendation_id
      AND (r.athlete_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.coach_athletes ca
        WHERE ca.coach_id = auth.uid() AND ca.athlete_id = r.athlete_id AND ca.status = 'active'
      ))
  ));

CREATE POLICY "Users read recommendation results they can access" ON public.ai_recommendation_results
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.ai_recommendations r
    WHERE r.id = ai_recommendation_results.recommendation_id
      AND (r.athlete_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.coach_athletes ca
        WHERE ca.coach_id = auth.uid() AND ca.athlete_id = r.athlete_id AND ca.status = 'active'
      ))
  ));

-- Escritura administrativa de conocimiento y eventos queda fuera del cliente.
REVOKE ALL ON FUNCTION public.match_athlete_ai_memories(extensions.vector(768), UUID, TEXT, REAL, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_ai_knowledge_chunks(extensions.vector(768), TEXT, REAL, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_athlete_ai_memories(extensions.vector(768), UUID, TEXT, REAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_ai_knowledge_chunks(extensions.vector(768), TEXT, REAL, INTEGER) TO authenticated;
