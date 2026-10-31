-- =============================================================================
-- Centro Cristiano Oasis · Migración 016: Corrección de política SELECT en announcements
-- Permite que los administradores puedan consultar filas archivadas (deleted_at IS NOT NULL)
-- evitando errores de RLS al realizar soft-delete (archivar avisos).
-- =============================================================================

DROP POLICY IF EXISTS "announcements_select_authenticated" ON public.announcements;

CREATE POLICY "announcements_select_authenticated"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      deleted_at IS NULL
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
    )
  );
