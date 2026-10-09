export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ROLE_CHANGE'
  | 'ARCHIVE'
  | 'RESTORE';

export type AuditTargetTable =
  | 'expenses'
  | 'offerings'
  | 'persons'
  | 'user_roles'
  | 'church_events'
  | 'transaction_categories'
  | 'courses'
  | 'cycles';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: AuditAction | string;
  target_table: AuditTargetTable | string;
  target_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

export interface AuditLogFilter {
  action?: string | 'todos';
  target_table?: string | 'todos';
  search?: string;
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Modificación',
  DELETE: 'Eliminación',
  ROLE_CHANGE: 'Cambio de Rol',
  ARCHIVE: 'Archivado',
  RESTORE: 'Restauración',
};

export const AUDIT_TABLE_LABELS: Record<string, string> = {
  expenses: 'Gastos',
  offerings: 'Ofrendas',
  persons: 'Personas',
  user_roles: 'Roles de usuario',
  church_events: 'Eventos / Calendario',
  transaction_categories: 'Categorías finanzas',
  courses: 'Cursos',
  cycles: 'Ciclos',
};
