import { 
  EnrollmentStatus, 
  ClassSession, 
  AttendanceRecord, 
  Evaluation, 
  GradeRecord, 
  Assignment, 
  AssignmentSubmission, 
  ClassMaterial,
  CycleAcademicSummary
} from './classroom';
import { CycleStatus } from './courses';

export interface StudentCycleSummary {
  enrollment_id: string;
  cycle_id: string;
  status: EnrollmentStatus;
  created_at: string;
  cycle: {
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
      email?: string | null;
    } | null;
  };
  academicSummary: CycleAcademicSummary | null;
}

export interface StudentCycleDetail {
  cycle: {
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
      email?: string | null;
    } | null;
  };
  enrollment: {
    id: string;
    status: EnrollmentStatus;
    person_id: string;
  };
  materials: ClassMaterial[];
  assignments: Assignment[];
  mySubmissions: AssignmentSubmission[];
  sessions: ClassSession[];
  myAttendance: AttendanceRecord[];
  evaluations: Evaluation[];
  myGrades: GradeRecord[];
  mySummary: CycleAcademicSummary | null;
}
