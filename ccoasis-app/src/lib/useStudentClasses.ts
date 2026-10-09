import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../context/AuthContext';
import { StudentCycleSummary } from '../types/student';
import { CycleAcademicSummary } from '../types/classroom';
import { parseClassroomError } from './useClassroom';

export function useStudentClasses() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<StudentCycleSummary[]>([]);
  const [personName, setPersonName] = useState<string | null>(null);
  const [isLinkedPerson, setIsLinkedPerson] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchEnrolledCycles = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Obtener person_id vinculado al usuario actual
      const { data: personData, error: personErr } = await supabase
        .from('persons')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (personErr) {
        setError(parseClassroomError(personErr));
        setIsLoading(false);
        return;
      }

      if (!personData) {
        setIsLinkedPerson(false);
        setCycles([]);
        setIsLoading(false);
        return;
      }

      setIsLinkedPerson(true);
      setPersonName(`${personData.first_name} ${personData.last_name}`);

      // 2. Obtener inscripciones del alumno junto con los datos del ciclo, curso y maestro
      const { data: enrollmentsData, error: enrollErr } = await supabase
        .from('enrollments')
        .select(`
          id,
          cycle_id,
          status,
          created_at,
          cycle:cycles (
            id,
            name,
            start_date,
            end_date,
            status,
            course:courses (
              id,
              title,
              description,
              passing_grade,
              min_attendance_pct
            ),
            teacher:persons!cycles_teacher_id_fkey (
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('person_id', personData.id)
        .order('created_at', { ascending: false });

      if (!mountedRef.current) return;

      if (enrollErr) {
        setError(parseClassroomError(enrollErr));
        setIsLoading(false);
        return;
      }

      // 3. Obtener el resumen de notas y asistencia de la vista de seguridad invoker
      const { data: summariesData } = await supabase
        .from('v_cycle_grades_summary')
        .select('*');

      if (!mountedRef.current) return;

      const summariesMap = new Map<string, CycleAcademicSummary>();
      if (summariesData) {
        for (const s of summariesData) {
          summariesMap.set(s.enrollment_id, s as CycleAcademicSummary);
        }
      }

      const formatted: StudentCycleSummary[] = (enrollmentsData || [])
        // Filtrar aquellos donde cycle exista y no esté eliminado
        .filter((item: any) => item.cycle != null)
        .map((item: any) => ({
          enrollment_id: item.id,
          cycle_id: item.cycle_id,
          status: item.status,
          created_at: item.created_at,
          cycle: item.cycle,
          academicSummary: summariesMap.get(item.id) || null,
        }));

      setCycles(formatted);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(parseClassroomError(err));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEnrolledCycles();
  }, [fetchEnrolledCycles]);

  return {
    cycles,
    personName,
    isLinkedPerson,
    isLoading,
    error,
    refresh: fetchEnrolledCycles,
  };
}
