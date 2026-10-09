import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../context/AuthContext';
import {
  ClassMaterial,
  Assignment,
  AssignmentSubmission,
  ClassSession,
  AttendanceRecord,
  Evaluation,
  GradeRecord,
  CycleAcademicSummary,
} from '../types/classroom';
import { CycleStatus } from '../types/courses';
import { parseClassroomError } from './useClassroom';

const SIGNED_URL_EXPIRY = 3600; // 1 hora de validez para enlaces de descarga

export interface StudentCycleInfo {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  status: CycleStatus;
  course: {
    id: string;
    title: string;
    description: string | null;
    passing_grade: number;
    min_attendance_pct: number;
  } | null;
  teacher: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
}

export function useStudentClassroom(cycleId: string) {
  const { user } = useAuth();

  const [cycle, setCycle] = useState<StudentCycleInfo | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);

  const [materials, setMaterials] = useState<ClassMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [academicSummary, setAcademicSummary] = useState<CycleAcademicSummary | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchClassroomData = useCallback(async () => {
    if (!cycleId || !user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Obtener la persona asociada al usuario
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
        setError('Tu usuario no está vinculado a una ficha de alumno en la congregación.');
        setIsLoading(false);
        return;
      }

      setPersonId(personData.id);

      // 2. Verificar inscripción del alumno en este ciclo
      const { data: enrollmentData, error: enrollErr } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('cycle_id', cycleId)
        .eq('person_id', personData.id)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (enrollErr) {
        setError(parseClassroomError(enrollErr));
        setIsLoading(false);
        return;
      }

      if (!enrollmentData) {
        setError('No estás inscrito en este ciclo académico.');
        setIsLoading(false);
        return;
      }

      setEnrollmentId(enrollmentData.id);
      setEnrollmentStatus(enrollmentData.status);

      // 3. Obtener información del ciclo, curso y maestro
      const { data: cycleData, error: cycleErr } = await supabase
        .from('cycles')
        .select(`
          id,
          name,
          start_date,
          end_date,
          status,
          course:courses ( id, title, description, passing_grade, min_attendance_pct ),
          teacher:persons!cycles_teacher_id_fkey ( id, first_name, last_name, email )
        `)
        .eq('id', cycleId)
        .is('deleted_at', null)
        .single();

      if (!mountedRef.current) return;

      if (cycleErr) {
        setError(parseClassroomError(cycleErr));
        setIsLoading(false);
        return;
      }

      setCycle(cycleData as unknown as StudentCycleInfo);

      // 4. Cargar en paralelo: materiales, tareas, sesiones, evaluaciones y resumen
      const [
        materialsRes,
        assignmentsRes,
        submissionsRes,
        sessionsRes,
        attendanceRes,
        evaluationsRes,
        gradesRes,
        summaryRes,
      ] = await Promise.all([
        supabase
          .from('class_materials')
          .select('*')
          .eq('cycle_id', cycleId)
          .order('created_at', { ascending: false }),
        supabase
          .from('assignments')
          .select('*')
          .eq('cycle_id', cycleId)
          .order('due_date', { ascending: true, nullsFirst: false }),
        supabase
          .from('assignment_submissions')
          .select('*')
          .eq('enrollment_id', enrollmentData.id),
        supabase
          .from('sessions')
          .select('*')
          .eq('cycle_id', cycleId)
          .order('session_date', { ascending: true }),
        supabase
          .from('attendance')
          .select('*')
          .eq('person_id', personData.id),
        supabase
          .from('evaluations')
          .select('*')
          .eq('cycle_id', cycleId)
          .order('due_date', { ascending: true, nullsFirst: false }),
        supabase
          .from('grades')
          .select('*')
          .eq('enrollment_id', enrollmentData.id),
        supabase
          .from('v_cycle_grades_summary')
          .select('*')
          .eq('enrollment_id', enrollmentData.id)
          .maybeSingle(),
      ]);

      if (!mountedRef.current) return;

      if (materialsRes.error) console.error('Error materiales:', materialsRes.error);
      if (assignmentsRes.error) console.error('Error tareas:', assignmentsRes.error);
      if (submissionsRes.error) console.error('Error entregas:', submissionsRes.error);
      if (sessionsRes.error) console.error('Error sesiones:', sessionsRes.error);
      if (attendanceRes.error) console.error('Error asistencia:', attendanceRes.error);
      if (evaluationsRes.error) console.error('Error evaluaciones:', evaluationsRes.error);
      if (gradesRes.error) console.error('Error notas:', gradesRes.error);

      setMaterials((materialsRes.data || []) as ClassMaterial[]);
      setAssignments((assignmentsRes.data || []) as Assignment[]);
      setSubmissions((submissionsRes.data || []) as AssignmentSubmission[]);
      setSessions((sessionsRes.data || []) as ClassSession[]);
      setAttendance((attendanceRes.data || []) as AttendanceRecord[]);
      setEvaluations((evaluationsRes.data || []) as Evaluation[]);
      setGrades((gradesRes.data || []) as GradeRecord[]);
      setAcademicSummary((summaryRes.data as CycleAcademicSummary) || null);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(parseClassroomError(err));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [cycleId, user?.id]);

  useEffect(() => {
    fetchClassroomData();
  }, [fetchClassroomData]);

  /**
   * Generar URL firmada para descargar archivos del bucket 'materials' o 'assignments'
   */
  const getSignedUrl = async (
    bucket: 'materials' | 'assignments',
    filePath: string
  ): Promise<{ url: string | null; error?: string }> => {
    try {
      const { data, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

      if (signErr || !data?.signedUrl) {
        return {
          url: null,
          error: `No se pudo generar el enlace de descarga: ${signErr?.message || 'Error desconocido'}`,
        };
      }
      return { url: data.signedUrl };
    } catch (err: any) {
      return { url: null, error: err?.message || 'Error al generar el enlace de descarga' };
    }
  };

  /**
   * Entregar o actualizar una tarea (lado alumno)
   * Regla RLS y storage:
   *  Bucket: 'assignments'
   *  Ruta: <auth_user_id>/<assignment_id>/<nombre_archivo>
   *  Nunca se envía `grade` ni `feedback` (solo lectura del maestro).
   */
  const submitAssignment = async (
    assignmentId: string,
    params: {
      comments?: string;
      file?: File | null;
      existingFileUrl?: string | null;
    }
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!enrollmentId || !user?.id) {
      return { ok: false, error: 'No se encontró la inscripción activa del alumno.' };
    }

    try {
      let finalFileUrl: string | null = params.existingFileUrl || null;

      // Si se adjunta un nuevo archivo, subir al bucket 'assignments'
      if (params.file) {
        const sanitizedName = params.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${user.id}/${assignmentId}/${Date.now()}_${sanitizedName}`;

        const { error: uploadErr } = await supabase.storage
          .from('assignments')
          .upload(filePath, params.file, { upsert: false });

        if (uploadErr) {
          return {
            ok: false,
            error: `Error al subir el archivo al almacenamiento: ${uploadErr.message}`,
          };
        }

        finalFileUrl = filePath;
      }

      // Comprobar si ya existe una entrega previa
      const existing = submissions.find((s) => s.assignment_id === assignmentId);

      if (existing && !existing.id.startsWith('pending_')) {
        // Actualizar entrega existente (solo comentarios y file_url)
        const { error: updErr } = await supabase
          .from('assignment_submissions')
          .update({
            comments: params.comments?.trim() || null,
            file_url: finalFileUrl,
            submitted_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updErr) {
          return { ok: false, error: parseClassroomError(updErr) };
        }
      } else {
        // Insertar nueva entrega
        const { error: insErr } = await supabase
          .from('assignment_submissions')
          .insert({
            assignment_id: assignmentId,
            enrollment_id: enrollmentId,
            comments: params.comments?.trim() || null,
            file_url: finalFileUrl,
            submitted_at: new Date().toISOString(),
          });

        if (insErr) {
          return { ok: false, error: parseClassroomError(insErr) };
        }
      }

      // Refrescar entregas
      const { data: updatedSubmissions } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('enrollment_id', enrollmentId);

      if (mountedRef.current && updatedSubmissions) {
        setSubmissions(updatedSubmissions as AssignmentSubmission[]);
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  return {
    cycle,
    enrollmentId,
    enrollmentStatus,
    personId,
    materials,
    assignments,
    submissions,
    sessions,
    attendance,
    evaluations,
    grades,
    academicSummary,
    isLoading,
    error,
    refresh: fetchClassroomData,
    getSignedUrl,
    submitAssignment,
  };
}
