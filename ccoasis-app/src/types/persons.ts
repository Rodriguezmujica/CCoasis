import { AppRole } from './auth';

export type PersonStatus = 'activo' | 'inactivo' | 'visita' | 'transferido' | 'fallecido';

export const PERSON_STATUS_OPTIONS: { value: PersonStatus; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'visita', label: 'Visita' },
  { value: 'transferido', label: 'Transferido' },
  { value: 'fallecido', label: 'Fallecido' },
];

export const PERSON_STATUS_COLORS: Record<PersonStatus, string> = {
  activo: 'bg-emerald-100 text-emerald-950 border border-emerald-600',
  inactivo: 'bg-slate-100 text-slate-800 border border-slate-400',
  visita: 'bg-amber-100 text-amber-950 border border-amber-600',
  transferido: 'bg-blue-100 text-blue-950 border border-blue-600',
  fallecido: 'bg-rose-100 text-rose-950 border border-rose-600',
};

export interface Person {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  baptism_date: string | null;
  address: string | null;
  status: PersonStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PersonFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  baptism_date: string;
  address: string;
  status: PersonStatus;
  notes: string;
}

export const EMPTY_PERSON_FORM: PersonFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  birth_date: '',
  baptism_date: '',
  address: '',
  status: 'visita',
  notes: '',
};

export interface PersonUserLink {
  user_id: string | null;
  roles: AppRole[];
}

export const ALL_ROLES: AppRole[] = ['admin', 'tesorero', 'maestro', 'alumno'];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  tesorero: 'Tesorero',
  maestro: 'Maestro',
  alumno: 'Miembro / Alumno',
};
