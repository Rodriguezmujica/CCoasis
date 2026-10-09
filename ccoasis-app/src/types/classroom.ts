// Tipos y constantes para la gestión del aula (Fase 2: Clases)

export type EnrollmentStatus = 'inscrito' | 'completado' | 'retirado';

export const ENROLLMENT_STATUS_OPTIONS: { value: EnrollmentStatus; label: string }[] = [
  { value: 'inscrito', label: 'Inscrito' },
  { value: 'completado', label: 'Completado' },
  { value: 'retirado', label: 'Retirado' },
];

export const ENROLLMENT_STATUS_COLORS: Record<EnrollmentStatus, string> = {
  inscrito: 'bg-blue-100 text-blue-800 border-blue-200',
  completado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  retirado: 'bg-slate-100 text-slate-700 border-slate-300',
};

export interface EnrollmentPerson {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
}

export interface EnrollmentWithPerson {
  id: string;
  cycle_id: string;
  person_id: string;
  status: EnrollmentStatus;
  created_at: string;
  updated_at: string;
  person: EnrollmentPerson;
}

export type AttendanceMark = 'presente' | 'ausente' | 'justificado';

export const ATTENDANCE_MARK_OPTIONS: { value: AttendanceMark; label: string }[] = [
  { value: 'presente', label: 'Presente' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'justificado', label: 'Justificado' },
];

export const ATTENDANCE_MARK_STYLES: Record<
  AttendanceMark,
  { active: string; inactive: string; badge: string }
> = {
  presente: {
    active: 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-bold',
    inactive: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  ausente: {
    active: 'bg-rose-600 text-white border-rose-700 shadow-sm font-bold',
    inactive: 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  justificado: {
    active: 'bg-amber-500 text-white border-amber-600 shadow-sm font-bold',
    inactive: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};

export interface ClassSession {
  id: string;
  cycle_id: string;
  session_date: string;
  topic: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  person_id: string;
  mark: AttendanceMark;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: string;
  cycle_id: string;
  title: string;
  description: string | null;
  max_score: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GradeRecord {
  id: string;
  evaluation_id: string;
  enrollment_id: string;
  score: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CycleAcademicSummary {
  enrollment_id: string;
  cycle_id: string;
  average_grade: number;
  attendance_percentage: number;
  passed: boolean;
}

export interface CandidatePerson {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: 'activo' | 'visita';
}

// ====================================================
// MATERIALES DIDÁCTICOS (class_materials)
// ====================================================

/** Tipo de material: archivo subido a Storage o enlace externo */
export type MaterialType = 'archivo' | 'enlace';

export interface ClassMaterial {
  id: string;
  cycle_id: string;
  session_id: string | null;
  title: string;
  description: string | null;
  /** Ruta en el bucket 'materials' (e.g. "<cycle_id>/<filename>") — null si es enlace */
  file_url: string | null;
  /** URL externa directa — null si es archivo */
  external_url: string | null;
  created_at: string;
}

// ====================================================
// TAREAS Y ENTREGAS (assignments / assignment_submissions)
// ====================================================

export interface Assignment {
  id: string;
  cycle_id: string;
  session_id: string | null;
  title: string;
  instructions: string | null;
  due_date: string | null; // timestamptz ISO string
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  enrollment_id: string;
  /** Ruta en el bucket 'assignments' (e.g. "<user_id>/<assignment_id>/<file>") */
  file_url: string | null;
  comments: string | null;
  feedback: string | null;
  submitted_at: string;
  grade: number | null;
}

/** Entrega enriquecida con datos del alumno (para vista del maestro) */
export interface SubmissionWithPerson extends AssignmentSubmission {
  person: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
  user_id: string | null; // auth.uid() del alumno (para construir la ruta del archivo)
}
