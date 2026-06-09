-- Migración SQL: Parche de Seguridad de Base de Datos y Supabase

-- 1. Habilitar la transmisión en Tiempo Real para el Chat
-- Esto soluciona la falla silenciosa por la que el Realtime de Supabase
-- no estaba escuchando los eventos INSERT de chat_messages.
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 2. Asegurar la columna seller_id en marketplace_items para P2P Nativo
-- Si se migró desde el diseño de scraper, no tendría seller_id.
ALTER TABLE public.marketplace_items
ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Habilitar RLS en marketplace_items
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (RLS) para Marketplace

-- Lectura Pública: Cualquiera puede ver los anuncios del marketplace
CREATE POLICY "Cualquiera puede leer anuncios de marketplace"
ON public.marketplace_items FOR SELECT
USING (true);

-- Inserción Autenticada: Usuarios registrados pueden publicar anuncios
CREATE POLICY "Usuarios autenticados pueden insertar anuncios"
ON public.marketplace_items FOR INSERT
WITH CHECK (auth.uid() = seller_id OR auth.role() = 'service_role');

-- Modificación Privada: Sólo el dueño del anuncio puede editarlo
CREATE POLICY "Usuarios pueden actualizar sus propios anuncios"
ON public.marketplace_items FOR UPDATE
USING (auth.uid() = seller_id OR auth.role() = 'service_role')
WITH CHECK (auth.uid() = seller_id OR auth.role() = 'service_role');

-- Eliminación Privada: Sólo el dueño puede borrarlo
CREATE POLICY "Usuarios pueden borrar sus propios anuncios"
ON public.marketplace_items FOR DELETE
USING (auth.uid() = seller_id OR auth.role() = 'service_role');

-- Crear un índice en seller_id para optimizar consultas del panel personal
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller_id ON public.marketplace_items(seller_id);
