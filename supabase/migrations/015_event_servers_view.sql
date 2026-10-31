-- =============================================================================
-- 015 · Vista segura con SOLO nombre y apellido de las personas asignadas a turnos
-- =============================================================================
CREATE OR REPLACE VIEW public.v_event_servers
WITH (security_invoker = false) AS
SELECT p.id, p.first_name, p.last_name
FROM public.persons p
WHERE p.deleted_at IS NULL
  AND p.id IN (SELECT person_id FROM public.church_event_assignments);

REVOKE ALL ON public.v_event_servers FROM PUBLIC, anon;
GRANT SELECT ON public.v_event_servers TO authenticated, service_role;

DROP POLICY IF EXISTS "persons_authenticated_read_assigned_servers" ON public.persons;
