-- =============================================================================
-- Centro Cristiano Oasis · Migración 009: Avisos y Anuncios Generales (Tablón Parroquial)
-- =============================================================================
-- Objetivo:
-- 1. Crear la tabla public.announcements para comunicados oficiales:
--    - id (uuid primary key default gen_random_uuid())
--    - title (text not null)
--    - message (text not null)
--    - priority (text not null default 'normal' check (priority in ('normal', 'importante', 'urgente')))
--    - is_active (boolean not null default true)
--    - expires_at (timestamptz)
--    - created_by (uuid references auth.users(id) on delete set null)
--    - created_at (timestamptz not null default now())
--    - updated_at (timestamptz not null default now())
--    - deleted_at (timestamptz)
-- 2. Trigger para actualizar el campo updated_at automáticamente con public.set_updated_at().
-- 3. Habilitar Row Level Security (RLS) en public.announcements.
-- 4. Políticas de seguridad idempotentes:
--    - SELECT para 'authenticated':
--      * Usuarios normales: deleted_at IS NULL AND is_active = true AND (expires_at IS NULL OR expires_at > now())
--      * Administradores (public.is_admin()): deleted_at IS NULL (todos los no eliminados).
--    - INSERT, UPDATE, DELETE: exclusivo para administradores con public.is_admin().
-- 5. GRANTs necesarios para 'authenticated' y 'service_role'.
-- =============================================================================

-- 1. CREACIÓN DE LA TABLA announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT chk_announcements_priority
    CHECK (priority IN ('normal', 'importante', 'urgente'))
);

-- 2. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_announcements_active_priority
  ON public.announcements(is_active, priority)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_announcements_created_at
  ON public.announcements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_expires_at
  ON public.announcements(expires_at)
  WHERE expires_at IS NOT NULL;

-- 3. TRIGGER PARA updated_at AUTOMÁTICO
DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE SEGURIDAD (Idempotente)

-- SELECT: Lectura para todos los usuarios autenticados según vigencia (o todos los no eliminados si es admin)
DROP POLICY IF EXISTS "announcements_select_authenticated" ON public.announcements;
CREATE POLICY "announcements_select_authenticated"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.is_admin()
      OR (
        is_active = true
        AND (expires_at IS NULL OR expires_at > now())
      )
    )
  );

-- INSERT: Solo rol admin
DROP POLICY IF EXISTS "announcements_insert_admin" ON public.announcements;
CREATE POLICY "announcements_insert_admin"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Solo rol admin
DROP POLICY IF EXISTS "announcements_update_admin" ON public.announcements;
CREATE POLICY "announcements_update_admin"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Solo rol admin
DROP POLICY IF EXISTS "announcements_delete_admin" ON public.announcements;
CREATE POLICY "announcements_delete_admin"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 6. PERMISOS DE LA API (GRANTs explícitos)
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
