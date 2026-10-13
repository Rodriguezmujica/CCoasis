-- =============================================================================
-- 013 · Confirmación de asistencia a eventos (RSVP) por parte de cada miembro
-- Diferencia con church_event_headcount:
--   headcount = conteo real DESPUÉS del culto (solo admin/tesorero)
--   rsvps     = "yo confirmo que asistiré" ANTES del evento (cada usuario, lo suyo)
-- Requisito: el usuario debe tener su cuenta vinculada a una persona
-- (persons.user_id), porque la confirmación se guarda por persona.
-- Privacidad: cada usuario solo ve su propia confirmación; el admin ve la lista
-- completa; el resto solo puede ver el TOTAL mediante get_event_rsvp_summary().
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.church_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.church_events(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.persons(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'asistire',
  guests integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_rsvp_status CHECK (status IN ('asistire', 'quizas', 'no_asistire')),
  CONSTRAINT chk_rsvp_guests CHECK (guests >= 0 AND guests <= 10),
  CONSTRAINT uq_rsvp_event_person UNIQUE (event_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON public.church_event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_person_id ON public.church_event_rsvps(person_id);

DROP TRIGGER IF EXISTS trg_rsvps_updated_at ON public.church_event_rsvps;
CREATE TRIGGER trg_rsvps_updated_at
  BEFORE UPDATE ON public.church_event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Un usuario normal solo puede confirmar eventos futuros y no archivados
CREATE OR REPLACE FUNCTION public.check_rsvp_event_open()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_start timestamptz;
  v_deleted timestamptz;
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  SELECT start_time, deleted_at INTO v_start, v_deleted
  FROM public.church_events WHERE id = NEW.event_id;
  IF NOT FOUND OR v_deleted IS NOT NULL THEN
    RAISE EXCEPTION 'Este evento ya no está disponible.';
  END IF;
  IF v_start <= now() THEN
    RAISE EXCEPTION 'Este evento ya comenzó o ya pasó; no se puede cambiar la confirmación.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rsvps_event_open ON public.church_event_rsvps;
CREATE TRIGGER trg_rsvps_event_open
  BEFORE INSERT OR UPDATE ON public.church_event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.check_rsvp_event_open();

ALTER TABLE public.church_event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rsvps_select_own_or_admin" ON public.church_event_rsvps;
CREATE POLICY "rsvps_select_own_or_admin"
  ON public.church_event_rsvps FOR SELECT TO authenticated
  USING (person_id = public.get_my_person_id() OR public.is_admin());

DROP POLICY IF EXISTS "rsvps_insert_own_or_admin" ON public.church_event_rsvps;
CREATE POLICY "rsvps_insert_own_or_admin"
  ON public.church_event_rsvps FOR INSERT TO authenticated
  WITH CHECK (person_id = public.get_my_person_id() OR public.is_admin());

DROP POLICY IF EXISTS "rsvps_update_own_or_admin" ON public.church_event_rsvps;
CREATE POLICY "rsvps_update_own_or_admin"
  ON public.church_event_rsvps FOR UPDATE TO authenticated
  USING (person_id = public.get_my_person_id() OR public.is_admin())
  WITH CHECK (person_id = public.get_my_person_id() OR public.is_admin());

DROP POLICY IF EXISTS "rsvps_delete_own_or_admin" ON public.church_event_rsvps;
CREATE POLICY "rsvps_delete_own_or_admin"
  ON public.church_event_rsvps FOR DELETE TO authenticated
  USING (person_id = public.get_my_person_id() OR public.is_admin());

-- Total de confirmados de un evento, visible para cualquier usuario con sesión
-- (sin nombres): { confirmed: personas que dijeron "asistiré", guests: invitados }
CREATE OR REPLACE FUNCTION public.get_event_rsvp_summary(p_event_id uuid)
RETURNS TABLE (confirmed bigint, maybe bigint, guests bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'asistire'),
    COUNT(*) FILTER (WHERE status = 'quizas'),
    COALESCE(SUM(guests) FILTER (WHERE status IN ('asistire', 'quizas')), 0)
  FROM public.church_event_rsvps
  WHERE event_id = p_event_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_event_rsvp_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_event_rsvp_summary(uuid) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_event_rsvps TO authenticated;
