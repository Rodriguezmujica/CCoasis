import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { Assignment, SubmissionWithPerson } from '../types/classroom';
import { EnrollmentWithPerson } from '../types/classroom';
import { parseClassroomError } from './useClassroom';

const SIGNED_URL_EXPIRY = 3600;

export function useAssignments(cycleId: string, isCycleClosed: boolean) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cargar tareas del ciclo
  const fetchAssignments = useCallback(async () => {
    if (!cycleId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('assignments')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (!mountedRef.current) return;
      if (err) {
        setError(parseClassroomError(err));
      } else {
        const list = (data || []) as Assignment[];
        setAssignments(list);
        // Auto-seleccionar primera si no hay selección válida
        setSelectedAssignmentId((prev) => {
          if (prev && list.some((a) => a.id === prev)) return prev;
          return list.length > 0 ? list[0].id : null;
        });
      }
    } catch (err) {
      if (mountedRef.current) setError(parseClassroomError(err));
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  /**
   * Cargar entregas de una tarea específica.
   * Para cada entrega, también trae los datos del alumno (via enrollment → person).
   * Además, para los alumnos inscritos SIN entrega, crea registros "vacíos"
   * para mostrar el estado "pendiente".
   */
  const fetchSubmissionsForAssignment = useCallback(
    async (assignmentId: string, enrollments: EnrollmentWithPerson[]) => {
      if (!assignmentId) {
        setSubmissions([]);
        return;
      }
      setIsLoadingSubmissions(true);
      try {
        const { data, error: err } = await supabase
          .from('assignment_submissions')
          .select(`
            id,
            assignment_id,
            enrollment_id,
            file_url,
            comments,
            feedback,
            submitted_at,
            grade
          `)
          .eq('assignment_id', assignmentId);

        if (!mountedRef.current) return;
        if (err) {
          console.error('Error al cargar entregas:', err);
          setSubmissions([]);
          return;
        }

        const submittedMap = new Map<string, any>(
          (data || []).map((s: any) => [s.enrollment_id, s])
        );

        // Para las entregas existentes, necesitamos saber el user_id del alumno
        // (para construir la URL firmada). Lo obtenemos desde el enrollment→person→user_id.
        const enriched: SubmissionWithPerson[] = enrollments.map((enr) => {
          const sub = submittedMap.get(enr.id);
          // Obtener user_id del alumno: está en person.user_id si existe
          // La consulta de enrollments no trae user_id de person, así que lo buscamos
          const personWithUser = enr.person as any;
          const userId = personWithUser?.user_id ?? null;

          if (sub) {
            return {
              ...sub,
              person: {
                id: enr.person.id,
                first_name: enr.person.first_name,
                last_name: enr.person.last_name,
                email: enr.person.email,
              },
              user_id: userId,
            } as SubmissionWithPerson;
          } else {
            // Alumno sin entrega → registro virtual
            return {
              id: `pending_${enr.id}`,
              assignment_id: assignmentId,
              enrollment_id: enr.id,
              file_url: null,
              comments: null,
              feedback: null,
              submitted_at: '',
              grade: null,
              person: {
                id: enr.person.id,
                first_name: enr.person.first_name,
                last_name: enr.person.last_name,
                email: enr.person.email,
              },
              user_id: userId,
            } as SubmissionWithPerson;
          }
        });

        setSubmissions(enriched);
      } catch {
        if (mountedRef.current) setSubmissions([]);
      } finally {
        if (mountedRef.current) setIsLoadingSubmissions(false);
      }
    },
    []
  );

  // Crear tarea
  const createAssignment = async (data: {
    title: string;
    instructions?: string;
    due_date?: string | null;
  }): Promise<{ ok: boolean; error?: string }> => {
    if (isCycleClosed) {
      return { ok: false, error: 'El ciclo está cerrado y no admite nuevas tareas.' };
    }
    try {
      const { error: insErr } = await supabase.from('assignments').insert({
        cycle_id: cycleId,
        title: data.title.trim(),
        instructions: data.instructions?.trim() || null,
        due_date: data.due_date || null,
      });
      if (insErr) return { ok: false, error: parseClassroomError(insErr) };
      await fetchAssignments();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  // Editar tarea
  const updateAssignment = async (
    assignmentId: string,
    data: { title: string; instructions?: string; due_date?: string | null }
  ): Promise<{ ok: boolean; error?: string }> => {
    if (isCycleClosed) {
      return { ok: false, error: 'El ciclo está cerrado y no permite editar tareas.' };
    }
    try {
      const { error: updErr } = await supabase
        .from('assignments')
        .update({
          title: data.title.trim(),
          instructions: data.instructions?.trim() || null,
          due_date: data.due_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);
      if (updErr) return { ok: false, error: parseClassroomError(updErr) };
      await fetchAssignments();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  /**
   * Guardar calificación y feedback del maestro en una entrega existente.
   * Si la entrega no existe aún (alumno sin entrega), la crea con grade y feedback.
   */
  const gradeSubmission = async (
    submissionId: string,
    enrollmentId: string,
    assignmentId: string,
    grade: number | null,
    feedback: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const isPending = submissionId.startsWith('pending_');

      if (isPending) {
        // El maestro califica sin que el alumno haya entregado: INSERT con grade/feedback
        const { error: insErr } = await supabase.from('assignment_submissions').insert({
          assignment_id: assignmentId,
          enrollment_id: enrollmentId,
          feedback: feedback.trim() || null,
          grade: grade,
          submitted_at: new Date().toISOString(),
        });
        if (insErr) return { ok: false, error: parseClassroomError(insErr) };
      } else {
        const { error: updErr } = await supabase
          .from('assignment_submissions')
          .update({
            feedback: feedback.trim() || null,
            grade: grade,
          })
          .eq('id', submissionId);
        if (updErr) return { ok: false, error: parseClassroomError(updErr) };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  /**
   * Obtener URL firmada para un archivo en el bucket 'assignments'.
   * La ruta sigue la convención: <auth_user_id>/<assignment_id>/<file>.
   */
  const getSignedSubmissionUrl = async (
    filePath: string
  ): Promise<{ url: string | null; error?: string }> => {
    try {
      const { data, error: signErr } = await supabase.storage
        .from('assignments')
        .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

      if (signErr || !data?.signedUrl) {
        return {
          url: null,
          error: `No se pudo generar el enlace de descarga: ${signErr?.message}`,
        };
      }
      return { url: data.signedUrl };
    } catch (err: any) {
      return { url: null, error: err?.message || 'Error al generar el enlace' };
    }
  };

  return {
    assignments,
    selectedAssignmentId,
    setSelectedAssignmentId,
    submissions,
    isLoading,
    isLoadingSubmissions,
    error,
    fetchAssignments,
    fetchSubmissionsForAssignment,
    createAssignment,
    updateAssignment,
    gradeSubmission,
    getSignedSubmissionUrl,
  };
}
