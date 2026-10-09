import { User, Session } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'tesorero' | 'maestro' | 'alumno';

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}
