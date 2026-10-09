import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { Course, CourseFormData } from '../types/courses';

/** Traduce errores de Supabase / Postgres a mensajes legibles en español */
export function parseCourseError(error: any): string {
  const msg: string = error?.message || error?.details || String(error);

  if (msg.includes('row-level security') || msg.includes('violates row-level security')) {
    return 'No tienes permisos de administrador para realizar esta operación.';
  }
  if (msg.includes('foreign key constraint') || msg.includes('violates foreign key')) {
    return 'No se puede modificar o eliminar porque existen registros vinculados a este curso.';
  }
  if (msg.includes('duplicate key')) {
    return 'Ya existe un registro con estos datos.';
  }
  return `Error: ${msg}`;
}

interface UseCoursesReturn {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  refresh: () => Promise<void>;
  createCourse: (data: CourseFormData) => Promise<{ ok: boolean; error?: string }>;
  updateCourse: (id: string, data: CourseFormData) => Promise<{ ok: boolean; error?: string }>;
  softDeleteCourse: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

export function useCourses(): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .is('deleted_at', null)
        .order('title', { ascending: true });

      if (searchQuery.trim()) {
        const term = `%${searchQuery.trim()}%`;
        query = query.or(`title.ilike.${term},description.ilike.${term}`);
      }

      const { data, error: fetchErr } = await query;

      if (!mountedRef.current) return;
      if (fetchErr) {
        setError(parseCourseError(fetchErr));
        setCourses([]);
      } else {
        setCourses((data as Course[]) || []);
      }
    } catch (err) {
      if (mountedRef.current) setError(parseCourseError(err));
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const createCourse = async (data: CourseFormData): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error: insertErr } = await supabase.from('courses').insert({
        title: data.title.trim(),
        description: data.description.trim() || null,
        passing_grade: data.passing_grade,
        min_attendance_pct: data.min_attendance_pct,
      });

      if (insertErr) {
        return { ok: false, error: parseCourseError(insertErr) };
      }

      await fetchCourses();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseCourseError(err) };
    }
  };

  const updateCourse = async (
    id: string,
    data: CourseFormData
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error: updateErr } = await supabase
        .from('courses')
        .update({
          title: data.title.trim(),
          description: data.description.trim() || null,
          passing_grade: data.passing_grade,
          min_attendance_pct: data.min_attendance_pct,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateErr) {
        return { ok: false, error: parseCourseError(updateErr) };
      }

      await fetchCourses();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseCourseError(err) };
    }
  };

  const softDeleteCourse = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      // Regla de oro: Soft-delete actualizando deleted_at. NUNCA DELETE físico.
      const { error: delErr } = await supabase
        .from('courses')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (delErr) {
        return { ok: false, error: parseCourseError(delErr) };
      }

      await fetchCourses();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseCourseError(err) };
    }
  };

  return {
    courses,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refresh: fetchCourses,
    createCourse,
    updateCourse,
    softDeleteCourse,
  };
}
