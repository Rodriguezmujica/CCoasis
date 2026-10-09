-- =============================================================================
-- Centro Cristiano Oasis · Migración 006: Módulo Calendario y Eventos Eclesiales
-- =============================================================================
-- Objetivo:
-- 1. Crear la tabla church_events para cultos, vigilias, oración, jóvenes, 
--    actividades pro-fondos (ventas, verbenas) y eventos especiales.
-- 2. Habilitar RLS con:
--    - SELECT: para todos los usuarios autenticados (admin, tesorero, maestro, alumno)
--      donde deleted_at IS NULL (soporte soft-delete).
--    - INSERT, UPDATE, DELETE: exclusivamente para el rol admin usando public.is_admin().
-- 3. Trigger para actualizar el campo updated_at automáticamente.
-- 4. GRANTs explícitos para authenticated y service_role.
-- =============================================================================

-- 1. CREACIÓN DE LA TABLA church_events
CREATE TABLE IF NOT EXISTS public.church_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  location text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_church_event_type 
    CHECK (event_type IN ('culto', 'oracion', 'jovenes', 'especial', 'venta_verbena', 'otro')),
  CONSTRAINT chk_church_event_dates 
    CHECK (end_time IS NULL OR end_time >= start_time)
);

-- 2. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_church_events_start_time 
  ON public.church_events(start_time) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_church_events_type 
  ON public.church_events(event_type) 
  WHERE deleted_at IS NULL;

-- 3. TRIGGER PARA updated_at AUTOMÁTICO
DROP TRIGGER IF EXISTS trg_set_updated_at ON public.church_events;
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON public.church_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.church_events ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURIDAD (Idempotente)
DROP POLICY IF EXISTS "church_events_select_authenticated" ON public.church_events;
CREATE POLICY "church_events_select_authenticated"
  ON public.church_events
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "church_events_insert_admin" ON public.church_events;
CREATE POLICY "church_events_insert_admin"
  ON public.church_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "church_events_update_admin" ON public.church_events;
CREATE POLICY "church_events_update_admin"
  ON public.church_events
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "church_events_delete_admin" ON public.church_events;
CREATE POLICY "church_events_delete_admin"
  ON public.church_events
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 6. PERMISOS DE LA API (GRANTs explícitos)
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_events TO authenticated;
GRANT ALL ON public.church_events TO service_role;
