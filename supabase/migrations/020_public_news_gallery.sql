-- =============================================================================
-- 020_public_news_gallery.sql
-- Fase P7: varias fotos por recuerdo en "Vida en Oasis" (carrusel de hasta 5).
--
-- 1. Añade public.public_news.image_paths text[] (galería de rutas en public-media).
-- 2. Rellena las filas existentes desde image_path.
-- 3. Recrea public.v_public_news incluyendo image_paths (al final, sin romper columnas).
-- 4. Mantiene GRANT SELECT a anon, authenticated, service_role.
--
-- image_path se mantiene siempre sincronizado con image_paths[1] por compatibilidad.
-- Idempotente: se puede ejecutar varias veces sin error en el SQL Editor de Supabase.
-- =============================================================================

ALTER TABLE public.public_news
  ADD COLUMN IF NOT EXISTS image_paths text[] NOT NULL DEFAULT '{}';

UPDATE public.public_news
SET image_paths = ARRAY[image_path]
WHERE (image_paths IS NULL OR cardinality(image_paths) = 0)
  AND image_path IS NOT NULL
  AND image_path <> '';

-- EXCEPCIÓN DELIBERADA DE SEGURIDAD (security_invoker = false), igual que en 019.
CREATE OR REPLACE VIEW public.v_public_news
WITH (security_invoker = false) AS
SELECT
  n.id,
  n.title,
  n.category,
  n.event_date,
  n.summary,
  n.image_path,
  n.created_at,
  n.image_paths
FROM public.public_news n
WHERE n.deleted_at IS NULL
  AND n.is_published = true
  AND n.privacy_verified = true
ORDER BY n.event_date DESC, n.created_at DESC
LIMIT 6;

COMMENT ON VIEW public.v_public_news IS
  'Vista pública de "Vida en Oasis" (security_invoker = false deliberado). Expone hasta 6 momentos publicados, no archivados y con privacidad verificada, con galería image_paths.';

REVOKE ALL ON public.v_public_news FROM PUBLIC;
GRANT SELECT ON public.v_public_news TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Limpieza de Storage: el listado de archivos de 'public-media' pasa a ser solo
-- para administradores. Al ser el bucket public = true, las URLs publicas
-- (getPublicUrl) siguen cargando para anon sin exponer el listado completo.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "storage_public_media_select" ON storage.objects;
CREATE POLICY "storage_public_media_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'public-media' AND public.is_admin());
