-- Repair production drift in marketplace_items. Keep active marketplace
-- listings public, but require authentication and ownership for every write.
BEGIN;

ALTER TABLE public.marketplace_items
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede leer anuncios de marketplace" ON public.marketplace_items;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar anuncios" ON public.marketplace_items;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios anuncios" ON public.marketplace_items;
DROP POLICY IF EXISTS "Usuarios pueden borrar sus propios anuncios" ON public.marketplace_items;
DROP POLICY IF EXISTS marketplace_public_read ON public.marketplace_items;
DROP POLICY IF EXISTS marketplace_owner_insert ON public.marketplace_items;
DROP POLICY IF EXISTS marketplace_owner_update ON public.marketplace_items;
DROP POLICY IF EXISTS marketplace_owner_delete ON public.marketplace_items;

CREATE POLICY marketplace_public_read
  ON public.marketplace_items FOR SELECT TO anon, authenticated
  USING (is_active IS TRUE OR (SELECT auth.uid()) = seller_id);

CREATE POLICY marketplace_owner_insert
  ON public.marketplace_items FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND seller_id = (SELECT auth.uid()));

CREATE POLICY marketplace_owner_update
  ON public.marketplace_items FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND seller_id = (SELECT auth.uid()))
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND seller_id = (SELECT auth.uid()));

CREATE POLICY marketplace_owner_delete
  ON public.marketplace_items FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND seller_id = (SELECT auth.uid()));

-- marketplace_items is intentionally readable, never anonymously writable.
REVOKE ALL ON public.marketplace_items FROM anon, authenticated;
GRANT SELECT ON public.marketplace_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_items TO authenticated;

COMMIT;
