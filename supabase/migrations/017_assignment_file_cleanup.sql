-- 017: Limpieza de archivos de tareas y anulación de entregas por el alumno.
-- Idempotente. Ejecutar en el SQL Editor de Supabase.

-- 1) El alumno puede borrar SU entrega solo si aún no está calificada ni comentada por el maestro.
DROP POLICY IF EXISTS "submissions_student_delete_ungraded" ON public.assignment_submissions;
CREATE POLICY "submissions_student_delete_ungraded"
  ON public.assignment_submissions FOR DELETE TO authenticated
  USING (
    enrollment_id IN (SELECT public.my_enrollment_ids())
    AND grade IS NULL
    AND feedback IS NULL
  );

-- 2) Maestro del ciclo (o admin) puede borrar del bucket 'assignments' los archivos
--    de las tareas de sus ciclos. Ruta: <auth_user_id>/<assignment_id>/<archivo>.
--    Se conserva la regla anterior (el dueño de la carpeta o admin).
DROP POLICY IF EXISTS "storage_assignments_delete" ON storage.objects;
CREATE POLICY "storage_assignments_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'assignments' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
      OR (storage.foldername(name))[2] IN (
        SELECT a.id::text FROM public.assignments a
        WHERE a.cycle_id IN (SELECT public.my_teaching_cycle_ids())
      )
    )
  );
