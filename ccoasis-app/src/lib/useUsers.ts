import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { AppUser, CreateUserPayload } from '../types/users';
import { AppRole } from '../types/auth';
import { Person } from '../types/persons';
import { logAuditEvent } from './useAuditLogs';

async function parseFunctionsError(error: any): Promise<string> {
  if (!error) return 'Error desconocido al procesar la solicitud.';

  // Extraer mensaje devuelto por la Edge Function si vino en el context
  if (error.context) {
    try {
      if (typeof error.context.json === 'function') {
        const body = await error.context.json();
        if (body?.error) return body.error;
      }
    } catch {
      try {
        if (typeof error.context.text === 'function') {
          const text = await error.context.text();
          if (text) return text;
        }
      } catch {
        // Ignorar fallo de lectura de context
      }
    }
  }

  const msg: string = error.message || String(error);

  if (
    msg.includes('Failed to send a request') ||
    msg.includes('Failed to fetch') ||
    msg.includes('Relay Error') ||
    msg.includes('NetworkError')
  ) {
    return 'No se pudo comunicar con la Edge Function "create-user". Asegúrate de que esté desplegada en tu proyecto de Supabase.';
  }

  if (msg.includes('404') || msg.includes('Function not found')) {
    return 'La Edge Function "create-user" no fue encontrada. Debe ser desplegada en Supabase con la CLI o el Dashboard.';
  }

  if (msg.includes('403') || msg.includes('Forbidden')) {
    return 'Acceso denegado: solo los administradores pueden crear usuarios.';
  }

  return msg;
}

interface UseUsersReturn {
  users: AppUser[];
  unlinkedPersons: Person[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createUser: (payload: CreateUserPayload) => Promise<{ ok: boolean; error?: string; message?: string }>;
  addUserRole: (userId: string, role: AppRole) => Promise<{ ok: boolean; error?: string }>;
  removeUserRole: (userId: string, role: AppRole) => Promise<{ ok: boolean; error?: string }>;
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [unlinkedPersons, setUnlinkedPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Obtener todas las personas no eliminadas
      const { data: personsData, error: personsError } = await supabase
        .from('persons')
        .select('*')
        .is('deleted_at', null)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (personsError) {
        throw new Error(`Error al cargar personas: ${personsError.message}`);
      }

      // 2. Obtener todos los roles asignados
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) {
        throw new Error(`Error al cargar roles: ${rolesError.message}`);
      }

      if (!mountedRef.current) return;

      // Agrupar roles por user_id
      const rolesMap = new Map<string, AppRole[]>();
      (rolesData || []).forEach((row) => {
        const existing = rolesMap.get(row.user_id) || [];
        if (!existing.includes(row.role as AppRole)) {
          existing.push(row.role as AppRole);
        }
        rolesMap.set(row.user_id, existing);
      });

      const allPersons = (personsData as Person[]) || [];

      // Personas sin usuario asignado (disponibles para vincular)
      const availablePersons = allPersons.filter((p) => !p.user_id);
      setUnlinkedPersons(availablePersons);

      // Personas que sí tienen usuario vinculado
      const linkedPersons = allPersons.filter((p) => Boolean(p.user_id));

      const processedUserIds = new Set<string>();
      const userList: AppUser[] = [];

      // Añadir usuarios que provienen de fichas en persons
      linkedPersons.forEach((p) => {
        if (!p.user_id) return;
        processedUserIds.add(p.user_id);
        userList.push({
          userId: p.user_id,
          personId: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email || 'Sin correo registrado',
          roles: rolesMap.get(p.user_id) || [],
          status: p.status,
          phone: p.phone,
          createdAt: p.created_at,
        });
      });

      // Incluir usuarios que tienen roles en user_roles pero no tienen ficha en persons
      rolesMap.forEach((roles, uId) => {
        if (!processedUserIds.has(uId)) {
          userList.push({
            userId: uId,
            personId: null,
            firstName: 'Usuario',
            lastName: 'del sistema',
            email: `ID: ${uId.slice(0, 8)}...`,
            roles,
            status: null,
            phone: null,
          });
        }
      });

      setUsers(userList);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message || 'Error al cargar la lista de usuarios.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = useCallback(
    async (payload: CreateUserPayload): Promise<{ ok: boolean; error?: string; message?: string }> => {
      try {
        const { data, error: invokeError } = await supabase.functions.invoke('create-user', {
          body: {
            email: payload.email.trim(),
            password: payload.password,
            first_name: payload.first_name.trim(),
            last_name: payload.last_name.trim(),
            roles: payload.roles,
            person_id: payload.person_id || null,
          },
        });

        if (invokeError) {
          const parsed = await parseFunctionsError(invokeError);
          return { ok: false, error: parsed };
        }

        if (data?.error) {
          return { ok: false, error: data.error };
        }

        await fetchUsers();
        return {
          ok: true,
          message: data?.message || 'Usuario creado correctamente.',
        };
      } catch (err: any) {
        const parsed = await parseFunctionsError(err);
        return { ok: false, error: parsed };
      }
    },
    [fetchUsers]
  );

  const addUserRole = useCallback(
    async (userId: string, role: AppRole): Promise<{ ok: boolean; error?: string }> => {
      try {
        const { error: insErr } = await supabase.from('user_roles').insert({
          user_id: userId,
          role,
        });

        if (insErr) {
          return { ok: false, error: `Error al agregar rol: ${insErr.message}` };
        }

        // Actualizar estado local
        setUsers((prev) =>
          prev.map((u) => {
            if (u.userId !== userId) return u;
            if (u.roles.includes(role)) return u;
            return { ...u, roles: [...u.roles, role] };
          })
        );

        // Registrar auditoría de asignación de rol
        logAuditEvent('ROLE_CHANGE', 'user_roles', userId, {
          action_type: 'ADD_ROLE',
          role,
          target_user_id: userId,
        });

        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Error al asignar rol.' };
      }
    },
    []
  );

  const removeUserRole = useCallback(
    async (userId: string, role: AppRole): Promise<{ ok: boolean; error?: string }> => {
      try {
        const { error: delErr } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (delErr) {
          return { ok: false, error: `Error al eliminar rol: ${delErr.message}` };
        }

        // Actualizar estado local
        setUsers((prev) =>
          prev.map((u) => {
            if (u.userId !== userId) return u;
            return { ...u, roles: u.roles.filter((r) => r !== role) };
          })
        );

        // Registrar auditoría de remoción de rol
        logAuditEvent('ROLE_CHANGE', 'user_roles', userId, {
          action_type: 'REMOVE_ROLE',
          role,
          target_user_id: userId,
        });

        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err?.message || 'Error al quitar rol.' };
      }
    },
    []
  );

  return {
    users,
    unlinkedPersons,
    isLoading,
    error,
    refresh: fetchUsers,
    createUser,
    addUserRole,
    removeUserRole,
  };
}
