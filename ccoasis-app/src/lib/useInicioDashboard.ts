import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../context/AuthContext';
import { ChurchEventRoleType } from '../types/assignments';

// ============================================================================
// Tipos de datos para el Dashboard de Inicio
// ============================================================================

export interface MyShiftItem {
  id: string;
  roleType: ChurchEventRoleType;
  notes: string | null;
  event: {
    id: string;
    title: string;
    startTime: string;
    endTime: string | null;
    eventType: string;
    location: string | null;
  };
}

export interface StudentNextClassItem {
  id: string;
  sessionDate: string;
  topic: string;
  description: string | null;
  cycleId: string;
  cycleName: string;
  courseTitle: string;
}

export interface StudentPendingAssignmentItem {
  id: string;
  title: string;
  instructions: string | null;
  dueDate: string | null;
  cycleId: string;
  cycleName: string;
  courseTitle: string;
}

export interface StudentGradeItem {
  id: string;
  score: number;
  maxScore: number;
  notes: string | null;
  createdAt: string;
  evaluationTitle: string;
  cycleId: string;
  cycleName: string;
  courseTitle: string;
}

// ============================================================================
// Utilidades de formato de fechas en español (Europe/Madrid)
// ============================================================================

/** Formatea una fecha de sesión "YYYY-MM-DD" a formato legible ej: "Miércoles, 12 de noviembre" */
export function formatSessionDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return dateStr;

  const formatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Formatea una fecha límite de tarea ISO a texto legible */
export function formatDueDate(isoStr: string | null): string {
  if (!isoStr) return 'Sin fecha límite';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return 'Fecha no válida';

  const dayFormatted = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  return dayFormatted;
}

/** Formatea fecha de calificación ISO a texto corto */
export function formatGradeDate(isoStr: string): string {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Obtiene la fecha actual en formato "YYYY-MM-DD" local (Europe/Madrid) */
export function getTodayDateString(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';

  return `${year}-${month}-${day}`;
}

/** Parser de errores amigable en español */
function parseDashboardError(err: any, fallbackMessage: string): string {
  if (!navigator.onLine) {
    return 'Sin conexión a internet. Por favor, verifica tu red e inténtalo de nuevo.';
  }
  const msg: string = err?.message || err?.details || String(err || '');
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
  }
  if (msg.includes('JWT') || msg.includes('auth')) {
    return 'Tu sesión ha expirado o no es válida. Por favor, inicia sesión de nuevo.';
  }
  if (msg.includes('row-level security') || msg.includes('violates row-level security')) {
    return 'No tienes permisos suficientes para consultar estos datos.';
  }
  return fallbackMessage;
}

// ============================================================================
// Hook: Resolución de la persona vinculada (get_my_person_id)
// ============================================================================

export function useLinkedPerson() {
  const { user } = useAuth();
  const [personId, setPersonId] = useState<string | null>(null);
  const [personName, setPersonName] = useState<string | null>(null);
  const [isPersonLinked, setIsPersonLinked] = useState<boolean | null>(null);
  const [isLoadingPerson, setIsLoadingPerson] = useState<boolean>(true);

  const resolvePerson = useCallback(async () => {
    if (!user?.id) {
      setPersonId(null);
      setPersonName(null);
      setIsPersonLinked(false);
      setIsLoadingPerson(false);
      return;
    }

    setIsLoadingPerson(true);
    try {
      // 1. Intentar primero con la función RPC get_my_person_id()
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_my_person_id');
      let resolvedId: string | null = (rpcData as string) || null;

      // 2. Si rpcData es nulo o falló, consultar directamente en persons
      if (!resolvedId && !rpcErr) {
        const { data: personData } = await supabase
          .from('persons')
          .select('id, first_name, last_name')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .maybeSingle();

        if (personData) {
          resolvedId = personData.id;
          setPersonName(`${personData.first_name} ${personData.last_name || ''}`.trim());
        }
      } else if (resolvedId) {
        const { data: personData } = await supabase
          .from('persons')
          .select('first_name, last_name')
          .eq('id', resolvedId)
          .maybeSingle();

        if (personData) {
          setPersonName(`${personData.first_name} ${personData.last_name || ''}`.trim());
        }
      }

      if (resolvedId) {
        setPersonId(resolvedId);
        setIsPersonLinked(true);
      } else {
        setPersonId(null);
        setPersonName(null);
        setIsPersonLinked(false);
      }
    } catch (err) {
      console.warn('Nota al resolver ficha vinculada en dashboard:', err);
      setPersonId(null);
      setIsPersonLinked(false);
    } finally {
      setIsLoadingPerson(false);
    }
  }, [user?.id]);

  useEffect(() => {
    resolvePerson();
  }, [resolvePerson]);

  return {
    personId,
    personName,
    isPersonLinked,
    isLoadingPerson,
    refetchPerson: resolvePerson,
  };
}

// ============================================================================
// Hook: Mis turnos (church_event_assignments de la persona vinculada)
// ============================================================================

export function useMyShifts(personId: string | null, isPersonLinked: boolean | null) {
  const [shifts, setShifts] = useState<MyShiftItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchShifts = useCallback(async () => {
    if (isPersonLinked === false) {
      setShifts([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!personId) {
      // Aún no ha terminado de resolver la persona
      if (isPersonLinked === null) return;
      setShifts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nowIso = new Date().toISOString();

      const { data, error: queryErr } = await supabase
        .from('church_event_assignments')
        .select(`
          id,
          role_type,
          notes,
          event:church_events!inner (
            id,
            title,
            start_time,
            end_time,
            event_type,
            location,
            deleted_at
          )
        `)
        .eq('person_id', personId)
        .is('event.deleted_at', null)
        .gte('event.start_time', nowIso)
        .order('start_time', { referencedTable: 'church_events', ascending: true })
        .limit(3);

      if (!mountedRef.current) return;

      if (queryErr) throw queryErr;

      const formatted: MyShiftItem[] = (data || [])
        .map((row: any) => {
          const ev = Array.isArray(row.event) ? row.event[0] : row.event;
          if (!ev) return null;
          return {
            id: row.id,
            roleType: row.role_type as ChurchEventRoleType,
            notes: row.notes,
            event: {
              id: ev.id,
              title: ev.title,
              startTime: ev.start_time,
              endTime: ev.end_time,
              eventType: ev.event_type,
              location: ev.location,
            },
          };
        })
        .filter((item): item is MyShiftItem => Boolean(item))
        .sort(
          (a, b) =>
            new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime()
        );

      setShifts(formatted);
    } catch (err: any) {
      console.error('Error al cargar turnos del usuario:', err);
      if (mountedRef.current) {
        setError(
          parseDashboardError(
            err,
            'No se pudieron cargar tus turnos asignados. Por favor, reintenta.'
          )
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [personId, isPersonLinked]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  return {
    shifts,
    isLoading,
    error,
    refetch: fetchShifts,
  };
}

// ============================================================================
// Hook: Próxima clase del alumno (sessions de ciclos activos inscritos)
// ============================================================================

export function useStudentNextClass(
  personId: string | null,
  isPersonLinked: boolean | null,
  isAlumno: boolean
) {
  const [nextClass, setNextClass] = useState<StudentNextClassItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchNextClass = useCallback(async () => {
    if (!isAlumno || isPersonLinked === false) {
      setNextClass(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!personId) {
      if (isPersonLinked === null) return;
      setNextClass(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const todayStr = getTodayDateString();

      const { data, error: queryErr } = await supabase
        .from('sessions')
        .select(`
          id,
          session_date,
          topic,
          description,
          cycle:cycles!inner (
            id,
            name,
            status,
            deleted_at,
            course:courses!inner (
              id,
              title,
              deleted_at
            ),
            enrollments!inner (
              id,
              person_id,
              status
            )
          )
        `)
        .eq('cycle.enrollments.person_id', personId)
        .eq('cycle.enrollments.status', 'inscrito')
        .is('cycle.deleted_at', null)
        .is('cycle.course.deleted_at', null)
        .neq('cycle.status', 'cerrado')
        .neq('cycle.status', 'archivado')
        .gte('session_date', todayStr)
        .order('session_date', { ascending: true })
        .limit(1);

      if (!mountedRef.current) return;

      if (queryErr) throw queryErr;

      if (data && data.length > 0) {
        const row = data[0] as any;
        const cy = Array.isArray(row.cycle) ? row.cycle[0] : row.cycle;
        const co = cy ? (Array.isArray(cy.course) ? cy.course[0] : cy.course) : null;

        setNextClass({
          id: row.id,
          sessionDate: row.session_date,
          topic: row.topic,
          description: row.description,
          cycleId: cy?.id || '',
          cycleName: cy?.name || '',
          courseTitle: co?.title || 'Curso',
        });
      } else {
        setNextClass(null);
      }
    } catch (err: any) {
      console.error('Error al cargar próxima clase del alumno:', err);
      if (mountedRef.current) {
        setError(
          parseDashboardError(
            err,
            'No se pudo cargar la próxima clase programada. Por favor, reintenta.'
          )
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [personId, isPersonLinked, isAlumno]);

  useEffect(() => {
    fetchNextClass();
  }, [fetchNextClass]);

  return {
    nextClass,
    isLoading,
    error,
    refetch: fetchNextClass,
  };
}

// ============================================================================
// Hook: Tareas pendientes del alumno (assignments sin submission propia)
// ============================================================================

export function useStudentPendingAssignments(
  personId: string | null,
  isPersonLinked: boolean | null,
  isAlumno: boolean
) {
  const [assignments, setAssignments] = useState<StudentPendingAssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchPendingAssignments = useCallback(async () => {
    if (!isAlumno || isPersonLinked === false) {
      setAssignments([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!personId) {
      if (isPersonLinked === null) return;
      setAssignments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryErr } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          instructions,
          due_date,
          cycle:cycles!inner (
            id,
            name,
            status,
            deleted_at,
            course:courses!inner (
              id,
              title,
              deleted_at
            ),
            enrollments!inner (
              id,
              person_id,
              status
            )
          ),
          submissions:assignment_submissions (
            id,
            enrollment_id
          )
        `)
        .eq('cycle.enrollments.person_id', personId)
        .eq('cycle.enrollments.status', 'inscrito')
        .is('cycle.deleted_at', null)
        .is('cycle.course.deleted_at', null)
        .neq('cycle.status', 'cerrado')
        .neq('cycle.status', 'archivado')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (!mountedRef.current) return;

      if (queryErr) throw queryErr;

      // Filtrar únicamente aquellas tareas sin ninguna entrega del alumno
      const pendingList: StudentPendingAssignmentItem[] = (data || [])
        .filter((row: any) => {
          const subs = Array.isArray(row.submissions) ? row.submissions : [];
          return subs.length === 0;
        })
        .slice(0, 3)
        .map((row: any) => {
          const cy = Array.isArray(row.cycle) ? row.cycle[0] : row.cycle;
          const co = cy ? (Array.isArray(cy.course) ? cy.course[0] : cy.course) : null;
          return {
            id: row.id,
            title: row.title,
            instructions: row.instructions,
            dueDate: row.due_date,
            cycleId: cy?.id || '',
            cycleName: cy?.name || '',
            courseTitle: co?.title || 'Curso',
          };
        });

      setAssignments(pendingList);
    } catch (err: any) {
      console.error('Error al cargar tareas pendientes:', err);
      if (mountedRef.current) {
        setError(
          parseDashboardError(
            err,
            'No se pudieron cargar tus tareas pendientes. Por favor, reintenta.'
          )
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [personId, isPersonLinked, isAlumno]);

  useEffect(() => {
    fetchPendingAssignments();
  }, [fetchPendingAssignments]);

  return {
    assignments,
    isLoading,
    error,
    refetch: fetchPendingAssignments,
  };
}

// ============================================================================
// Hook: Últimas notas del alumno (grades ordenadas por fecha reciente)
// ============================================================================

export function useStudentRecentGrades(
  personId: string | null,
  isPersonLinked: boolean | null,
  isAlumno: boolean
) {
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchRecentGrades = useCallback(async () => {
    if (!isAlumno || isPersonLinked === false) {
      setGrades([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!personId) {
      if (isPersonLinked === null) return;
      setGrades([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryErr } = await supabase
        .from('grades')
        .select(`
          id,
          score,
          notes,
          created_at,
          enrollment:enrollments!inner (
            id,
            person_id
          ),
          evaluation:evaluations!inner (
            id,
            title,
            max_score,
            cycle:cycles!inner (
              id,
              name,
              course:courses!inner (
                id,
                title
              )
            )
          )
        `)
        .eq('enrollment.person_id', personId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!mountedRef.current) return;

      if (queryErr) throw queryErr;

      const formatted: StudentGradeItem[] = (data || []).map((row: any) => {
        const ev = Array.isArray(row.evaluation) ? row.evaluation[0] : row.evaluation;
        const cy = ev ? (Array.isArray(ev.cycle) ? ev.cycle[0] : ev.cycle) : null;
        const co = cy ? (Array.isArray(cy.course) ? cy.course[0] : cy.course) : null;

        return {
          id: row.id,
          score: Number(row.score),
          maxScore: Number(ev?.max_score ?? 100),
          notes: row.notes,
          createdAt: row.created_at,
          evaluationTitle: ev?.title || 'Evaluación',
          cycleId: cy?.id || '',
          cycleName: cy?.name || '',
          courseTitle: co?.title || 'Curso',
        };
      });

      setGrades(formatted);
    } catch (err: any) {
      console.error('Error al cargar notas recientes del alumno:', err);
      if (mountedRef.current) {
        setError(
          parseDashboardError(
            err,
            'No se pudieron cargar tus calificaciones recientes. Por favor, reintenta.'
          )
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [personId, isPersonLinked, isAlumno]);

  useEffect(() => {
    fetchRecentGrades();
  }, [fetchRecentGrades]);

  return {
    grades,
    isLoading,
    error,
    refetch: fetchRecentGrades,
  };
}

// ============================================================================
// Hook unificado para uso en InicioView
// ============================================================================

export function useInicioDashboard(options?: { isAlumno?: boolean }) {
  const isAlumno = Boolean(options?.isAlumno);
  const { personId, personName, isPersonLinked, isLoadingPerson, refetchPerson } =
    useLinkedPerson();

  const shiftsState = useMyShifts(personId, isPersonLinked);
  const nextClassState = useStudentNextClass(personId, isPersonLinked, isAlumno);
  const pendingAssignmentsState = useStudentPendingAssignments(
    personId,
    isPersonLinked,
    isAlumno
  );
  const recentGradesState = useStudentRecentGrades(personId, isPersonLinked, isAlumno);

  return {
    personId,
    personName,
    isPersonLinked,
    isLoadingPerson,
    refetchPerson,
    shifts: shiftsState,
    nextClass: nextClassState,
    pendingAssignments: pendingAssignmentsState,
    recentGrades: recentGradesState,
  };
}
