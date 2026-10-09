import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import {
  EnrollmentWithPerson,
  EnrollmentStatus,
  CandidatePerson,
  ClassSession,
  AttendanceRecord,
  AttendanceMark,
  Evaluation,
  GradeRecord,
  CycleAcademicSummary,
} from '../types/classroom';
import { CycleStatus } from '../types/courses';

export interface CycleClassroomInfo {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  status: CycleStatus;
  course: {
    id: string;
    title: string;
    passing_grade: number;
    min_attendance_pct: number;
  } | null;
  teacher: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    status: string;
  } | null;
}

/** Traduce errores de Postgres y Supabase a mensajes comprensibles en español */
export function parseClassroomError(error: any): string {
  const msg: string = error?.message || error?.details || String(error);

  if (
    msg.includes('El ciclo correspondiente está cerrado') ||
    msg.includes('No se pueden modificar datos de un ciclo cerrado') ||
    msg.includes('trg_cycle_closed')
  ) {
    return 'Operación rechazada: El ciclo está cerrado y se encuentra en modo de solo lectura.';
  }
  if (msg.includes('Solo se puede inscribir a personas con estado activo o visita')) {
    return 'Solo se puede inscribir a personas con estado "Activo" o "Visita".';
  }
  if (msg.includes('La nota debe estar entre 0 y')) {
    return msg;
  }
  if (msg.includes('duplicate key') && msg.includes('enrollments')) {
    return 'Esta persona ya se encuentra inscrita en este ciclo.';
  }
  if (msg.includes('duplicate key') && msg.includes('attendance')) {
    return 'Ya existe registro de asistencia para este alumno en la sesión seleccionada.';
  }
  if (msg.includes('duplicate key') && msg.includes('grades')) {
    return 'Ya existe una calificación registrada para este alumno en esta evaluación.';
  }
  if (msg.includes('row-level security') || msg.includes('violates row-level security')) {
    return 'No tienes los permisos requeridos para realizar esta acción.';
  }
  if (msg.includes('foreign key constraint') || msg.includes('violates foreign key')) {
    return 'No se puede procesar la acción por dependencias asociadas a este registro.';
  }
  return `Error: ${msg}`;
}

export function useClassroom(cycleId: string) {
  const [cycle, setCycle] = useState<CycleClassroomInfo | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentWithPerson[]>([]);
  const [candidatePersons, setCandidatePersons] = useState<CandidatePerson[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionAttendance, setSessionAttendance] = useState<AttendanceRecord[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [evaluationGrades, setEvaluationGrades] = useState<GradeRecord[]>([]);
  const [academicSummary, setAcademicSummary] = useState<CycleAcademicSummary[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 1. Cargar información del ciclo
  const fetchCycleInfo = useCallback(async () => {
    if (!cycleId) return;
    try {
      const { data, error: err } = await supabase
        .from('cycles')
        .select(`
          id,
          name,
          start_date,
          end_date,
          status,
          course:courses ( id, title, passing_grade, min_attendance_pct ),
          teacher:persons!cycles_teacher_id_fkey ( id, first_name, last_name, email, status )
        `)
        .eq('id', cycleId)
        .is('deleted_at', null)
        .single();

      if (!mountedRef.current) return;
      if (err) {
        setError(parseClassroomError(err));
      } else if (data) {
        setCycle({
          id: data.id,
          name: data.name,
          start_date: data.start_date,
          end_date: data.end_date,
          status: data.status,
          course: Array.isArray(data.course) ? data.course[0] : data.course,
          teacher: Array.isArray(data.teacher) ? data.teacher[0] : data.teacher,
        });
      }
    } catch (err) {
      if (mountedRef.current) setError(parseClassroomError(err));
    }
  }, [cycleId]);

  // 2. Cargar inscripciones del ciclo
  const fetchEnrollments = useCallback(async () => {
    if (!cycleId) return;
    try {
      const { data, error: err } = await supabase
        .from('enrollments')
        .select(`
          id,
          cycle_id,
          person_id,
          status,
          created_at,
          updated_at,
          person:persons!enrollments_person_id_fkey ( id, first_name, last_name, email, phone, status )
        `)
        .eq('cycle_id', cycleId)
        .order('created_at', { ascending: true });

      if (!mountedRef.current) return;
      if (err) {
        setError(parseClassroomError(err));
      } else {
        const mapped = (data || []).map((row: any) => ({
          ...row,
          person: Array.isArray(row.person) ? row.person[0] : row.person,
        })) as EnrollmentWithPerson[];
        setEnrollments(mapped);
      }
    } catch (err) {
      if (mountedRef.current) setError(parseClassroomError(err));
    }
  }, [cycleId]);

  // 3. Cargar personas candidatas para inscribir (status activo o visita, no eliminadas y no inscritas aún)
  const fetchCandidatePersons = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('persons')
        .select('id, first_name, last_name, email, phone, status')
        .is('deleted_at', null)
        .in('status', ['activo', 'visita'])
        .order('first_name', { ascending: true });

      if (!mountedRef.current) return;
      if (!err && data) {
        setCandidatePersons(data as CandidatePerson[]);
      }
    } catch {
      // Ignore background candidate fetch error
    }
  }, []);

  // 4. Cargar sesiones
  const fetchSessions = useCallback(async () => {
    if (!cycleId) return;
    try {
      const { data, error: err } = await supabase
        .from('sessions')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('session_date', { ascending: false });

      if (!mountedRef.current) return;
      if (err) {
        setError(parseClassroomError(err));
      } else {
        const list = (data || []) as ClassSession[];
        setSessions(list);
        // Si no hay sesión seleccionada o la seleccionada ya no existe, autoseleccionar la primera
        setSelectedSessionId((prev) => {
          if (prev && list.some((s) => s.id === prev)) return prev;
          return list.length > 0 ? list[0].id : null;
        });
      }
    } catch (err) {
      if (mountedRef.current) setError(parseClassroomError(err));
    }
  }, [cycleId]);

  // 5. Cargar asistencia de la sesión seleccionada
  const fetchAttendanceForSession = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      setSessionAttendance([]);
      return;
    }
    setIsLoadingAttendance(true);
    try {
      const { data, error: err } = await supabase
        .from('attendance')
        .select('*')
        .eq('session_id', sessionId);

      if (!mountedRef.current) return;
      if (!err && data) {
        setSessionAttendance(data as AttendanceRecord[]);
      }
    } catch {
      // Ignorar error secundario
    } finally {
      if (mountedRef.current) setIsLoadingAttendance(false);
    }
  }, []);

  // 6. Cargar evaluaciones
  const fetchEvaluations = useCallback(async () => {
    if (!cycleId) return;
    try {
      const { data, error: err } = await supabase
        .from('evaluations')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('created_at', { ascending: true });

      if (!mountedRef.current) return;
      if (err) {
        setError(parseClassroomError(err));
      } else {
        const list = (data || []) as Evaluation[];
        setEvaluations(list);
        setSelectedEvaluationId((prev) => {
          if (prev && list.some((e) => e.id === prev)) return prev;
          return list.length > 0 ? list[0].id : null;
        });
      }
    } catch (err) {
      if (mountedRef.current) setError(parseClassroomError(err));
    }
  }, [cycleId]);

  // 7. Cargar notas de la evaluación seleccionada
  const fetchGradesForEvaluation = useCallback(async (evaluationId: string) => {
    if (!evaluationId) {
      setEvaluationGrades([]);
      return;
    }
    setIsLoadingGrades(true);
    try {
      const { data, error: err } = await supabase
        .from('grades')
        .select('*')
        .eq('evaluation_id', evaluationId);

      if (!mountedRef.current) return;
      if (!err && data) {
        setEvaluationGrades(data as GradeRecord[]);
      }
    } catch {
      // Ignorar error secundario
    } finally {
      if (mountedRef.current) setIsLoadingGrades(false);
    }
  }, []);

  // 8. Cargar resumen académico desde la vista v_cycle_grades_summary
  const fetchAcademicSummary = useCallback(async () => {
    if (!cycleId) return;
    try {
      const { data, error: err } = await supabase
        .from('v_cycle_grades_summary')
        .select('*')
        .eq('cycle_id', cycleId);

      if (!mountedRef.current) return;
      if (!err && data) {
        setAcademicSummary(data as CycleAcademicSummary[]);
      }
    } catch {
      // Ignorar error secundario
    }
  }, [cycleId]);

  // Carga inicial coordinada
  useEffect(() => {
    let isCancelled = false;
    const loadAll = async () => {
      setIsLoading(true);
      setError(null);
      await Promise.all([
        fetchCycleInfo(),
        fetchEnrollments(),
        fetchCandidatePersons(),
        fetchSessions(),
        fetchEvaluations(),
        fetchAcademicSummary(),
      ]);
      if (!isCancelled && mountedRef.current) {
        setIsLoading(false);
      }
    };
    loadAll();
    return () => {
      isCancelled = true;
    };
  }, [
    fetchCycleInfo,
    fetchEnrollments,
    fetchCandidatePersons,
    fetchSessions,
    fetchEvaluations,
    fetchAcademicSummary,
  ]);

  // Cargar asistencia al cambiar de sesión seleccionada
  useEffect(() => {
    if (selectedSessionId) {
      fetchAttendanceForSession(selectedSessionId);
    } else {
      setSessionAttendance([]);
    }
  }, [selectedSessionId, fetchAttendanceForSession]);

  // Cargar notas al cambiar de evaluación seleccionada
  useEffect(() => {
    if (selectedEvaluationId) {
      fetchGradesForEvaluation(selectedEvaluationId);
    } else {
      setEvaluationGrades([]);
    }
  }, [selectedEvaluationId, fetchGradesForEvaluation]);

  // ==========================================
  // ACCIONES / MUTACIONES
  // ==========================================

  // Inscribir una nueva persona
  const enrollPerson = async (
    personId: string,
    status: EnrollmentStatus = 'inscrito'
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      // Validar si la persona es activo o visita
      const candidate = candidatePersons.find((c) => c.id === personId);
      if (candidate && !['activo', 'visita'].includes(candidate.status)) {
        return {
          ok: false,
          error: 'Solo se puede inscribir a personas con estado activo o visita.',
        };
      }

      const { error: insErr } = await supabase.from('enrollments').insert({
        cycle_id: cycleId,
        person_id: personId,
        status,
      });

      if (insErr) {
        return { ok: false, error: parseClassroomError(insErr) };
      }

      await Promise.all([fetchEnrollments(), fetchAcademicSummary()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  // Cambiar estado de inscripción ('inscrito', 'completado', 'retirado')
  const updateEnrollmentStatus = async (
    enrollmentId: string,
    newStatus: EnrollmentStatus
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error: updErr } = await supabase
        .from('enrollments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId);

      if (updErr) {
        return { ok: false, error: parseClassroomError(updErr) };
      }

      await Promise.all([fetchEnrollments(), fetchAcademicSummary()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  // Crear sesión (bloqueado si el ciclo está cerrado)
  const createSession = async (data: {
    session_date: string;
    topic: string;
    description?: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    if (cycle?.status === 'cerrado') {
      return {
        ok: false,
        error: 'El ciclo está cerrado y no admite la creación de nuevas sesiones.',
      };
    }
    try {
      const { error: insErr } = await supabase.from('sessions').insert({
        cycle_id: cycleId,
        session_date: data.session_date,
        topic: data.topic.trim(),
        description: data.description?.trim() || null,
      });

      if (insErr) {
        return { ok: false, error: parseClassroomError(insErr) };
      }

      await Promise.all([fetchSessions(), fetchAcademicSummary()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  // Editar sesión (bloqueado si el ciclo está cerrado)
  const updateSession = async (
    sessionId: string,
    data: { session_date: string; topic: string; description?: string }
  ): Promise<{ ok: boolean; error?: string }> => {
    if (cycle?.status === 'cerrado') {
      return {
        ok: false,
        error: 'El ciclo está cerrado y no admite modificaciones en sus sesiones.',
      };
    }
    try {
      const { error: updErr } = await supabase
        .from('sessions')
        .update({
          session_date: data.session_date,
          topic: data.topic.trim(),
          description: data.description?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updErr) {
        return { ok: false, error: parseClassroomError(updErr) };
      }

      await Promise.all([fetchSessions(), fetchAcademicSummary()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  // Guardar asistencia (upsert en tabla attendance por sesión y persona)
  const saveAttendance = async (
    sessionId: string,
    records: { person_id: string; mark: AttendanceMark; notes?: string }[]
  ): Promise<{ ok: boolean; error?: string }> => {
    if (cycle?.status === 'cerrado') {
      return {
        ok: false,
        error: 'El ciclo está cerrado y no admite modificaciones de asistencia.',
      };
    }
    if (records.length === 0) return { ok: true };

    try {
      const payload = records.map((r) => ({
        session_id: sessionId,
        person_id: r.person_id,
        mark: r.mark,
        notes: r.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await supabase
        .from('attendance')
        .upsert(payload, { onConflict: 'session_id,person_id' });

      if (upsertErr) {
        return { ok: false, error: parseClassroomError(upsertErr) };
      }

      await Promise.all([
        fetchAttendanceForSession(sessionId),
        fetchAcademicSummary(),
      ]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  // Crear evaluación (bloqueado si el ciclo está cerrado)
  const createEvaluation = async (data: {
    title: string;
    description?: string;
    max_score: number;
    due_date?: string | null;
  }): Promise<{ ok: boolean; error?: string }> => {
    if (cycle?.status === 'cerrado') {
      return {
        ok: false,
        error: 'El ciclo está cerrado y no admite la creación de evaluaciones.',
      };
    }
    if (data.max_score <= 0) {
      return { ok: false, error: 'El puntaje máximo debe ser mayor que 0.' };
    }
    try {
      const { error: insErr } = await supabase.from('evaluations').insert({
        cycle_id: cycleId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        max_score: data.max_score,
        due_date: data.due_date || null,
      });

      if (insErr) {
        return { ok: false, error: parseClassroomError(insErr) };
      }

      await Promise.all([fetchEvaluations(), fetchAcademicSummary()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  // Editar evaluación (bloqueado si el ciclo está cerrado)
  const updateEvaluation = async (
    evalId: string,
    data: {
      title: string;
      description?: string;
      max_score: number;
      due_date?: string | null;
    }
  ): Promise<{ ok: boolean; error?: string }> => {
    if (cycle?.status === 'cerrado') {
      return {
        ok: false,
        error: 'El ciclo está cerrado y no admite modificaciones en evaluaciones.',
      };
    }
    if (data.max_score <= 0) {
      return { ok: false, error: 'El puntaje máximo debe ser mayor que 0.' };
    }
    try {
      const { error: updErr } = await supabase
        .from('evaluations')
        .update({
          title: data.title.trim(),
          description: data.description?.trim() || null,
          max_score: data.max_score,
          due_date: data.due_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', evalId);

      if (updErr) {
        return { ok: false, error: parseClassroomError(updErr) };
      }

      await Promise.all([fetchEvaluations(), fetchAcademicSummary()]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  // Guardar calificaciones (upsert en tabla grades por evaluation_id y enrollment_id)
  const saveGrades = async (
    evaluationId: string,
    gradesList: { enrollment_id: string; score: number; notes?: string }[]
  ): Promise<{ ok: boolean; error?: string }> => {
    if (cycle?.status === 'cerrado') {
      return {
        ok: false,
        error: 'El ciclo está cerrado y no admite la modificación de notas.',
      };
    }

    const currentEval = evaluations.find((e) => e.id === evaluationId);
    const maxScore = currentEval ? currentEval.max_score : 100;

    // Validación estricta de notas en cliente
    for (const g of gradesList) {
      if (g.score < 0 || g.score > maxScore) {
        return {
          ok: false,
          error: `La nota debe estar entre 0 y ${maxScore}.`,
        };
      }
    }

    if (gradesList.length === 0) return { ok: true };

    try {
      const payload = gradesList.map((g) => ({
        evaluation_id: evaluationId,
        enrollment_id: g.enrollment_id,
        score: g.score,
        notes: g.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await supabase
        .from('grades')
        .upsert(payload, { onConflict: 'evaluation_id,enrollment_id' });

      if (upsertErr) {
        return { ok: false, error: parseClassroomError(upsertErr) };
      }

      await Promise.all([
        fetchGradesForEvaluation(evaluationId),
        fetchAcademicSummary(),
      ]);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseClassroomError(err) };
    }
  };

  return {
    cycle,
    enrollments,
    candidatePersons,
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    sessionAttendance,
    evaluations,
    selectedEvaluationId,
    setSelectedEvaluationId,
    evaluationGrades,
    academicSummary,
    isLoading,
    isLoadingAttendance,
    isLoadingGrades,
    error,
    refreshAll: async () => {
      await Promise.all([
        fetchCycleInfo(),
        fetchEnrollments(),
        fetchCandidatePersons(),
        fetchSessions(),
        fetchEvaluations(),
        fetchAcademicSummary(),
      ]);
    },
    refreshSummary: fetchAcademicSummary,
    enrollPerson,
    updateEnrollmentStatus,
    createSession,
    updateSession,
    saveAttendance,
    createEvaluation,
    updateEvaluation,
    saveGrades,
  };
}
