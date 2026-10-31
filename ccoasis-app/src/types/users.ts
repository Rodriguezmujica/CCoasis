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

export interface UpdateUserPasswordPayload {
  user_id: string;
  password: string;
}

export const ROLE_BADGE_STYLES: Record<AppRole, string> = {
  admin: 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]',
  tesorero: 'bg-emerald-100 text-emerald-950 border-emerald-600',
  maestro: 'bg-magenta-100 text-magenta-950 border-magenta-600',
  alumno: 'bg-slate-100 text-slate-800 border-slate-400',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Acceso total y configuración de roles.',
  tesorero: 'Administración de finanzas (ofrendas y gastos).',
  maestro: 'Gestión de clases, asistencias y evaluaciones.',
  alumno: 'Acceso a sus cursos, tareas y calificaciones (Portal de Miembros).',
};
