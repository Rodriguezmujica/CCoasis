-- =============================================================================
-- 002 · Vincular una persona con un usuario por correo (solo admin)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.link_person_to_user(p_person_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden vincular usuarios.';
  END IF;

  SELECT id INTO v_uid FROM auth.users
  WHERE lower(email) = lower(trim(p_email));

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No existe ningún usuario con ese correo.';
  END IF;

  UPDATE public.persons
  SET user_id = v_uid
  WHERE id = p_person_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La persona no existe.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.link_person_to_user(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_person_to_user(uuid, text) TO authenticated;
