import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import {
  CycleWithDetails,
  CycleFormData,
  CycleStatus,
  TeacherOption,
} from '../types/courses';

/** Traduce errores de Supabase / Postgres a mensajes legibles en español */
export function parseCycleError(error: any): string {
  const msg: string = error?.message || error?.details || String(error);

  if (msg.includes('chk_cycle_dates')) {
    return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
  }
  if (msg.includes('Operación rechazada: El ciclo correspondiente está cerrado')) {
    return 'El ciclo está cerrado y no admite modificaciones en sus registros asociados.';
  }
  if (msg.includes('row-level security') || msg.includes('violates row-level security')) {
    return 'No tienes permisos de administrador para realizar esta operación.';
  }
  if (msg.includes('foreign key constraint') || msg.includes('violates foreign key')) {
    return 'No se puede modificar o eliminar porque existen dependencias activas (alumnos inscritos, sesiones o tareas).';
  }
  return `Error: ${msg}`;
}

interface UseCyclesReturn {
  cycles: CycleWithDetails[];
  teachers: TeacherOption[];
  isLoading: boolean;
  isLoadingTeachers: boolean;
  error: string | null;
  statusFilter: CycleStatus | 'todos';
  setStatusFilter: (status: CycleStatus | 'todos') => void;
  courseFilter: string | 'todos';
  setCourseFilter: (courseId: string | 'todos') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  refresh: () => Promise<void>;
  createCycle: (data: CycleFormData) => Promise<{ ok: boolean; error?: string }>;
  updateCycle: (id: string, data: CycleFormData) => Promise<{ ok: boolean; error?: string }>;
  updateCycleStatus: (id: string, status: CycleStatus) => Promise<{ ok: boolean; error?: string }>;
  softDeleteCycle: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

export function useCycles(): UseCyclesReturn {
  const [cycles, setCycles] = useState<CycleWithDetails[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CycleStatus | 'todos'>('todos');
  const [courseFilter, setCourseFilter] = useState<string | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cargar lista de maestros (personas activas o con datos)
  const fetchTeachers = useCallback(async () => {
    setIsLoadingTeachers(true);
    try {
      // Cargamos personas no eliminadas para asignar como maestro
      const { data, error: err } = await supabase
        .from('persons')
        .select('id, first_name, last_name, email, status')
        .is('deleted_at', null)
        .in('status', ['activo', 'visita'])
        .order('first_name', { ascending: true });

      if (!mountedRef.current) return;
      if (!err && data) {
        setTeachers(data as TeacherOption[]);
      }
    } catch {
      // Silenciar error en carga de opciones secundarias
    } finally {
      if (mountedRef.current) setIsLoadingTeachers(false);
    }
  }, []);

  const fetchCycles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('cycles')
        .select(`
          id,
          course_id,
          teacher_id,
          name,
          start_date,
          end_date,
          status,
          created_at,
          updated_at,
          deleted_at,
          course:courses ( id, title ),
          teacher:persons!cycles_teacher_id_fkey ( id, first_name, last_name, email, status ),
          enrollments ( id )
        `)
        .is('deleted_at', null)
        .order('start_date', { ascending: false });

      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }

      if (courseFilter !== 'todos') {
        query = query.eq('course_id', courseFilter);
      }

      if (searchQuery.trim()) {
        const term = `%${searchQuery.trim()}%`;
        query = query.ilike('name', term);
      }

      const { data, error: fetchErr } = await query;

      if (!mountedRef.current) return;
      if (fetchErr) {
        setError(parseCycleError(fetchErr));
        setCycles([]);
      } else {
        const mapped = (data || []).map((row: any) => ({
          ...row,
          course: Array.isArray(row.course) ? row.course[0] : row.course,
          teacher: Array.isArray(row.teacher) ? row.teacher[0] : row.teacher,
          enrollments_count: Array.isArray(row.enrollments) ? row.enrollments.length : 0,
        })) as CycleWithDetails[];
        setCycles(mapped);
      }
    } catch (err) {
      if (mountedRef.current) setError(parseCycleError(err));
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [statusFilter, courseFilter, searchQuery]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  const createCycle = async (data: CycleFormData): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error: insertErr } = await supabase.from('cycles').insert({
        course_id: data.course_id,
        teacher_id: data.teacher_id,
        name: data.name.trim(),
        start_date: data.start_date,
        end_date: data.end_date ? data.end_date : null,
        status: data.status,
      });

      if (insertErr) {
        return { ok: false, error: parseCycleError(insertErr) };
      }

      await fetchCycles();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseCycleError(err) };
    }
  };

  const updateCycle = async (
    id: string,
    data: CycleFormData
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error: updateErr } = await supabase
        .from('cycles')
        .update({
          course_id: data.course_id,
          teacher_id: data.teacher_id,
          name: data.name.trim(),
          start_date: data.start_date,
          end_date: data.end_date ? data.end_date : null,
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateErr) {
        return { ok: false, error: parseCycleError(updateErr) };
      }

      await fetchCycles();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseCycleError(err) };
    }
  };

  const updateCycleStatus = async (
    id: string,
    status: CycleStatus
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error: updateErr } = await supabase
        .from('cycles')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateErr) {
        return { ok: false, error: parseCycleError(updateErr) };
      }

      await fetchCycles();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseCycleError(err) };
    }
  };

  const softDeleteCycle = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      // Regla de oro: Soft-delete actualizando deleted_at. NUNCA DELETE físico.
      const { error: delErr } = await supabase
        .from('cycles')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (delErr) {
        return { ok: false, error: parseCycleError(delErr) };
      }

      await fetchCycles();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseCycleError(err) };
    }
  };

  return {
    cycles,
    teachers,
    isLoading,
    isLoadingTeachers,
    error,
    statusFilter,
    setStatusFilter,
    courseFilter,
    setCourseFilter,
    searchQuery,
    setSearchQuery,
    refresh: fetchCycles,
    createCycle,
    updateCycle,
    updateCycleStatus,
    softDeleteCycle,
  };
}
