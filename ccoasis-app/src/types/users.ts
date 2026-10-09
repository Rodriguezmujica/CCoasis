import { AppRole } from './auth';
import { PersonStatus } from './persons';

export interface AppUser {
  userId: string;
  personId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  roles: AppRole[];
  status?: PersonStatus | null;
  phone?: string | null;
  createdAt?: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  roles: AppRole[];
  person_id?: string | null;
}

export interface CreateUserResponse {
  success: boolean;
  user_id?: string;
  person_id?: string;
  email?: string;
  roles?: AppRole[];
  message?: string;
  error?: string;
}

export const ROLE_BADGE_STYLES: Record<AppRole, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  tesorero: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  maestro: 'bg-blue-100 text-blue-700 border-blue-200',
  alumno: 'bg-amber-100 text-amber-800 border-amber-200',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Acceso total y configuración de roles.',
  tesorero: 'Administración de finanzas (ofrendas y gastos).',
  maestro: 'Gestión de clases, asistencias y evaluaciones.',
  alumno: 'Acceso a sus cursos, tareas y calificaciones (Portal de Miembros).',
};
