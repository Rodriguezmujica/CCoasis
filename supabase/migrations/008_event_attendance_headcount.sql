-- =============================================================================
-- Centro Cristiano Oasis · Migración 008: Conteo y Métricas de Asistencia General
-- =============================================================================
-- Objetivo:
-- 1. Crear la tabla public.church_event_headcount para registrar el conteo
--    rápido congregacional por culto/evento (sin pasar lista individual):
--    - event_id (uuid not null references public.church_events(id) on delete cascade unique)
--    - adults_count (integer >= 0 default 0)
--    - children_count (integer >= 0 default 0)
--    - visitors_count (integer >= 0 default 0)
--    - total_count (integer generated always as adults_count + children_count + visitors_count stored)
--    - notes (text)
--    - recorded_by (uuid references auth.users(id))
-- 2. Trigger para actualizar el campo updated_at automáticamente.
-- 3. Habilitar RLS en public.church_event_headcount:
--    - SELECT: para roles 'admin' y 'tesorero'.
--    - INSERT, UPDATE, DELETE: para roles 'admin' y 'tesorero'.
-- 4. GRANTs explícitos para authenticated y service_role.
-- =============================================================================

-- 1. CREACIÓN DE LA TABLA church_event_headcount
CREATE TABLE IF NOT EXISTS public.church_event_headcount (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.church_events(id) ON DELETE CASCADE,
  adults_count integer NOT NULL DEFAULT 0,
  children_count integer NOT NULL DEFAULT 0,
  visitors_count integer NOT NULL DEFAULT 0,
  total_count integer GENERATED ALWAYS AS (adults_count + children_count + visitors_count) STORED,
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_church_event_headcount_event_id UNIQUE (event_id),
  CONSTRAINT chk_church_event_headcount_adults CHECK (adults_count >= 0),
  CONSTRAINT chk_church_event_headcount_children CHECK (children_count >= 0),
  CONSTRAINT chk_church_event_headcount_visitors CHECK (visitors_count >= 0)
);

-- 2. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_church_event_headcount_event_id
  ON public.church_event_headcount(event_id);

CREATE INDEX IF NOT EXISTS idx_church_event_headcount_created_at
  ON public.church_event_headcount(created_at);

-- 3. TRIGGER PARA updated_at AUTOMÁTICO
DROP TRIGGER IF EXISTS trg_church_event_headcount_updated_at ON public.church_event_headcount;
CREATE TRIGGER trg_church_event_headcount_updated_at
  BEFORE UPDATE ON public.church_event_headcount
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.church_event_headcount ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURIDAD (Idempotente)
-- SELECT: Roles admin y tesorero
DROP POLICY IF EXISTS "headcount_select_admin_tesorero" ON public.church_event_headcount;
CREATE POLICY "headcount_select_admin_tesorero"
  ON public.church_event_headcount
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.has_role('tesorero'));

-- INSERT: Roles admin y tesorero
DROP POLICY IF EXISTS "headcount_insert_admin_tesorero" ON public.church_event_headcount;
CREATE POLICY "headcount_insert_admin_tesorero"
  ON public.church_event_headcount
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.has_role('tesorero'));

-- UPDATE: Roles admin y tesorero
DROP POLICY IF EXISTS "headcount_update_admin_tesorero" ON public.church_event_headcount;
CREATE POLICY "headcount_update_admin_tesorero"
  ON public.church_event_headcount
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.has_role('tesorero'))
  WITH CHECK (public.is_admin() OR public.has_role('tesorero'));

-- DELETE: Roles admin y tesorero
DROP POLICY IF EXISTS "headcount_delete_admin_tesorero" ON public.church_event_headcount;
CREATE POLICY "headcount_delete_admin_tesorero"
  ON public.church_event_headcount
  FOR DELETE
  TO authenticated
  USING (public.is_admin() OR public.has_role('tesorero'));

-- 6. PERMISOS DE LA API (GRANTs explícitos)
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_event_headcount TO authenticated;
GRANT ALL ON public.church_event_headcount TO service_role;
