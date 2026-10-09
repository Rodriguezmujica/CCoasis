export interface Course {
  id: string;
  title: string;
  description: string | null;
  passing_grade: number;
  min_attendance_pct: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CourseFormData {
  title: string;
  description: string;
  passing_grade: number;
  min_attendance_pct: number;
}

export const EMPTY_COURSE_FORM: CourseFormData = {
  title: '',
  description: '',
  passing_grade: 70,
  min_attendance_pct: 75,
};

// cycle_status ENUM en Postgres: ('planificado', 'en_curso', 'cerrado', 'archivado')
// Opciones visibles en la gestión del ciclo:
export type CycleStatus = 'planificado' | 'en_curso' | 'cerrado' | 'archivado';

export const CYCLE_STATUS_OPTIONS: { value: CycleStatus; label: string }[] = [
  { value: 'planificado', label: 'Planificado' },
  { value: 'en_curso', label: 'En curso / Activo' },
  { value: 'cerrado', label: 'Cerrado' },
  { value: 'archivado', label: 'Archivado' },
];

export const CYCLE_STATUS_COLORS: Record<CycleStatus, string> = {
  planificado: 'bg-amber-100 text-amber-800 border-amber-200',
  en_curso: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cerrado: 'bg-slate-200 text-slate-700 border-slate-300',
  archivado: 'bg-rose-100 text-rose-700 border-rose-200',
};

export interface Cycle {
  id: string;
  course_id: string;
  teacher_id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  status: CycleStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Cycle con datos del curso y maestro mediante JOIN de Supabase */
export interface CycleWithDetails extends Cycle {
  course?: {
    id: string;
    title: string;
  } | null;
  teacher?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    status: string;
  } | null;
  enrollments_count?: number;
}

export interface CycleFormData {
  course_id: string;
  teacher_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
}

export const EMPTY_CYCLE_FORM: CycleFormData = {
  course_id: '',
  teacher_id: '',
  name: '',
  start_date: '',
  end_date: '',
  status: 'planificado',
};

/** Representación compacta de un maestro/persona para el selector */
export interface TeacherOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  status: string;
}
