-- =============================================================================
-- 003 · Permitir a los alumnos consultar datos básicos de sus maestros
-- =============================================================================

-- Helper SECURITY DEFINER para obtener los person_id de los maestros de los ciclos
-- en los que el alumno autenticado está actualmente inscrito.
CREATE OR REPLACE FUNCTION public.my_teachers_person_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT c.teacher_id
  FROM public.cycles c
  JOIN public.enrollments e ON e.cycle_id = c.id
  WHERE e.person_id = public.get_my_person_id();
$$;

REVOKE EXECUTE ON FUNCTION public.my_teachers_person_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_teachers_person_ids() TO authenticated;

-- Política RLS en persons para permitir a los alumnos leer datos de sus maestros
DROP POLICY IF EXISTS "persons_student_read_teachers" ON public.persons;
CREATE POLICY "persons_student_read_teachers"
  ON public.persons FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    id IN (SELECT public.my_teachers_person_ids())
  );
