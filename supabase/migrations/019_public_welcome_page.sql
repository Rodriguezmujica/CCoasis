-- =============================================================================
-- Centro Cristiano Oasis · Migración 019: Página Pública de Bienvenida y "Vida en Oasis"
-- =============================================================================
-- Objetivo:
-- 1. Añadir is_public a public.church_events y crear la vista segura public.v_public_events
--    (solo columnas no sensibles, eventos vigentes/futuros <= 60 días, LIMIT 10).
-- 2. Crear la tabla de fila única public.public_site_settings (RLS solo admin) y la vista
--    pública public.v_public_site_settings (sin updated_by).
-- 3. Crear la tabla public.public_news ("Vida en Oasis", RLS solo admin con soporte
--    de soft-delete y verificación obligatoria de privacidad) y la vista pública
--    public.v_public_news (máximo 6 recuerdos verificados y publicados).
-- 4. Crear el bucket público 'public-media' en Supabase Storage (5 MB, JPEG/PNG/WebP),
--    lectura pública y escritura exclusiva para admin.
-- 5. Aplicar permisos estrictos GRANT / REVOKE para que el rol 'anon' solo pueda
--    consultar las 3 vistas públicas y jamás las tablas base.
--
-- Idempotente: se puede ejecutar varias veces sin error en el SQL Editor de Supabase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) EVENTOS PÚBLICOS EN public.church_events Y VISTA public.v_public_events
-- -----------------------------------------------------------------------------

ALTER TABLE public.church_events
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_church_events_public_upcoming
  ON public.church_events (start_time ASC)
  WHERE is_public = true AND deleted_at IS NULL;

-- EXCEPCIÓN DELIBERADA DE SEGURIDAD (security_invoker = false):
-- Igual que en public.v_event_servers (015), esta vista se define con
-- security_invoker = false para permitir que visitantes sin sesión (rol anon)
-- y usuarios autenticados consulten ÚNICAMENTE las columnas públicas no sensibles
-- (id, title, event_type, start_time, end_time, location) de eventos marcados
-- expresamente como públicos, sin otorgar permiso SELECT sobre la tabla base
-- public.church_events ni exponer jamás description, created_by, turnos,
-- conteos de asistencia ni confirmaciones (RSVP).
CREATE OR REPLACE VIEW public.v_public_events
WITH (security_invoker = false) AS
SELECT
  e.id,
  e.title,
  e.event_type,
  e.start_time,
  e.end_time,
  e.location
FROM public.church_events e
WHERE e.is_public = true
  AND e.deleted_at IS NULL
  AND COALESCE(e.end_time, e.start_time) >= (now() - interval '2 hours')
  AND e.start_time <= (now() + interval '60 days')
ORDER BY e.start_time ASC
LIMIT 10;

COMMENT ON VIEW public.v_public_events IS
  'Vista pública de eventos (security_invoker = false deliberado). Expone solo id, title, event_type, start_time, end_time y location de eventos públicos vigentes/próximos (60 días, máx. 10).';

-- -----------------------------------------------------------------------------
-- B) CONFIGURACIÓN EDITABLE DE LA PÁGINA PÚBLICA (public.public_site_settings)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.public_site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  slogan text NOT NULL DEFAULT 'Oasis: un hogar de refugio',
  hero_title text NOT NULL DEFAULT 'Te esperamos este domingo',
  welcome_text text NOT NULL DEFAULT '',
  service_schedule text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  maps_url text NOT NULL DEFAULT '',
  whatsapp_url text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT '',
  youtube_url text NOT NULL DEFAULT '',
  live_stream_url text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Trigger de updated_at reutilizando public.set_updated_at() de 001_initial_schema.sql
DROP TRIGGER IF EXISTS trg_set_updated_at ON public.public_site_settings;
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON public.public_site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Fila única inicial por defecto
INSERT INTO public.public_site_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Activar RLS: solo admin puede leer, insertar y actualizar la tabla base; nadie puede borrar
ALTER TABLE public.public_site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_site_settings_select_admin" ON public.public_site_settings;
CREATE POLICY "public_site_settings_select_admin"
  ON public.public_site_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "public_site_settings_insert_admin" ON public.public_site_settings;
CREATE POLICY "public_site_settings_insert_admin"
  ON public.public_site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND id = 1);

DROP POLICY IF EXISTS "public_site_settings_update_admin" ON public.public_site_settings;
CREATE POLICY "public_site_settings_update_admin"
  ON public.public_site_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin() AND id = 1);

-- EXCEPCIÓN DELIBERADA DE SEGURIDAD (security_invoker = false):
-- Permite a visitantes anónimos y usuarios autenticados leer solo los datos
-- de presentación de la fila id = 1 sin exponer updated_by ni abrir la tabla base.
CREATE OR REPLACE VIEW public.v_public_site_settings
WITH (security_invoker = false) AS
SELECT
  s.id,
  s.slogan,
  s.hero_title,
  s.welcome_text,
  s.service_schedule,
  s.address,
  s.maps_url,
  s.whatsapp_url,
  s.contact_email,
  s.instagram_url,
  s.youtube_url,
  s.live_stream_url,
  s.updated_at
FROM public.public_site_settings s
WHERE s.id = 1;

COMMENT ON VIEW public.v_public_site_settings IS
  'Vista pública de configuración de portada (security_invoker = false deliberado). Expone solo campos de presentación de la fila única id = 1, sin updated_by.';

-- -----------------------------------------------------------------------------
-- C) SECCIÓN DE MOMENTOS Y RECUERDOS "VIDA EN OASIS" (public.public_news)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.public_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('Bautizos', 'Comunidad', 'Discipulado')),
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  summary text NOT NULL,
  image_path text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  privacy_verified boolean NOT NULL DEFAULT false CHECK (privacy_verified = true),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_public_news_published_date
  ON public.public_news (event_date DESC, created_at DESC)
  WHERE deleted_at IS NULL AND is_published = true AND privacy_verified = true;

-- Trigger de updated_at reutilizando public.set_updated_at()
DROP TRIGGER IF EXISTS trg_set_updated_at ON public.public_news;
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON public.public_news
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Activar RLS en public.public_news
ALTER TABLE public.public_news ENABLE ROW LEVEL SECURITY;

-- Regla crítica de soft-delete: la política SELECT para admin NO exige deleted_at IS NULL,
-- permitiendo que al archivar (UPDATE ... SET deleted_at = now() RETURNING *) no falle RLS.
DROP POLICY IF EXISTS "public_news_select_admin" ON public.public_news;
CREATE POLICY "public_news_select_admin"
  ON public.public_news
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "public_news_insert_admin" ON public.public_news;
CREATE POLICY "public_news_insert_admin"
  ON public.public_news
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "public_news_update_admin" ON public.public_news;
CREATE POLICY "public_news_update_admin"
  ON public.public_news
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- EXCEPCIÓN DELIBERADA DE SEGURIDAD (security_invoker = false):
-- Expone únicamente las columnas públicas de recuerdos verificados, publicados y no archivados
-- (sin created_by, updated_at ni deleted_at), máximo 6 tarjetas.
CREATE OR REPLACE VIEW public.v_public_news
WITH (security_invoker = false) AS
SELECT
  n.id,
  n.title,
  n.category,
  n.event_date,
  n.summary,
  n.image_path,
  n.created_at
FROM public.public_news n
WHERE n.deleted_at IS NULL
  AND n.is_published = true
  AND n.privacy_verified = true
ORDER BY n.event_date DESC, n.created_at DESC
LIMIT 6;

COMMENT ON VIEW public.v_public_news IS
  'Vista pública de "Vida en Oasis" (security_invoker = false deliberado). Expone hasta 6 momentos publicados, no archivados y con privacidad verificada.';

-- -----------------------------------------------------------------------------
-- D) BUCKET DE STORAGE 'public-media'
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-media',
  'public-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "storage_public_media_select" ON storage.objects;
CREATE POLICY "storage_public_media_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'public-media');

DROP POLICY IF EXISTS "storage_public_media_insert_admin" ON storage.objects;
CREATE POLICY "storage_public_media_insert_admin"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'public-media' AND public.is_admin());

DROP POLICY IF EXISTS "storage_public_media_update_admin" ON storage.objects;
CREATE POLICY "storage_public_media_update_admin"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'public-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'public-media' AND public.is_admin());

DROP POLICY IF EXISTS "storage_public_media_delete_admin" ON storage.objects;
CREATE POLICY "storage_public_media_delete_admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'public-media' AND public.is_admin());

-- -----------------------------------------------------------------------------
-- E) PERMISOS ESTRICTOS (GRANT / REVOKE)
-- -----------------------------------------------------------------------------

-- Asegurar que anon y authenticated puedan usar el esquema public (para consultar las vistas)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Tablas base: ningún acceso para anon ni public; solo SELECT, INSERT, UPDATE para authenticated (filtrado por RLS solo admin)
REVOKE ALL ON public.public_site_settings FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.public_site_settings TO authenticated;
GRANT ALL ON public.public_site_settings TO service_role;

REVOKE ALL ON public.public_news FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.public_news TO authenticated;
GRANT ALL ON public.public_news TO service_role;

-- Vistas públicas: revocar todo de PUBLIC y conceder únicamente SELECT a anon, authenticated y service_role
REVOKE ALL ON public.v_public_events FROM PUBLIC;
GRANT SELECT ON public.v_public_events TO anon, authenticated, service_role;

REVOKE ALL ON public.v_public_site_settings FROM PUBLIC;
GRANT SELECT ON public.v_public_site_settings TO anon, authenticated, service_role;

REVOKE ALL ON public.v_public_news FROM PUBLIC;
GRANT SELECT ON public.v_public_news TO anon, authenticated, service_role;
