import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { Person, PersonFormData, PersonStatus, PersonUserLink } from '../types/persons';
import { AppRole } from '../types/auth';
import { logAuditEvent } from './useAuditLogs';

/** Parse Supabase / Postgres errors into readable Spanish messages */
function parseSupabaseError(error: any): string {
  const msg: string = error?.message || error?.details || String(error);

  // Unique constraint on email
  if (msg.includes('idx_persons_email_unique') || msg.includes('duplicate key') && msg.includes('email')) {
    return 'Ya existe otra persona con ese correo electrónico.';
  }
  // Baptism date check
  if (msg.includes('chk_baptism_after_birth')) {
    return 'La fecha de bautismo no puede ser anterior a la de nacimiento.';
  }
  // RPC errors from link_person_to_user
  if (msg.includes('Solo los administradores pueden vincular')) {
    return msg;
  }
  if (msg.includes('No existe ningún usuario con ese correo')) {
    return msg;
  }
  if (msg.includes('La persona no existe')) {
    return msg;
  }
  // RLS denial
  if (msg.includes('new row violates row-level security')) {
    return 'No tienes permisos para realizar esta operación.';
  }
  // Generic
  return `Error: ${msg}`;
}

interface UsePersonsReturn {
  persons: Person[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: PersonStatus | 'todos';
  setStatusFilter: (s: PersonStatus | 'todos') => void;
  refresh: () => Promise<void>;
  createPerson: (data: PersonFormData) => Promise<{ ok: boolean; error?: string }>;
  updatePerson: (id: string, data: PersonFormData) => Promise<{ ok: boolean; error?: string }>;
  softDeletePerson: (id: string) => Promise<{ ok: boolean; error?: string }>;
  linkPersonToUser: (personId: string, email: string) => Promise<{ ok: boolean; error?: string }>;
  getPersonUserLink: (person: Person) => Promise<PersonUserLink>;
  addUserRole: (userId: string, role: AppRole) => Promise<{ ok: boolean; error?: string }>;
  removeUserRole: (userId: string, role: AppRole) => Promise<{ ok: boolean; error?: string }>;
}

export function usePersons(): UsePersonsReturn {
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PersonStatus | 'todos'>('todos');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchPersons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('persons')
        .select('*')
        .is('deleted_at', null)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery.trim()) {
        const term = `%${searchQuery.trim()}%`;
        query = query.or(`first_name.ilike.${term},last_name.ilike.${term}`);
      }

      const { data, error: fetchError } = await query;

      if (!mountedRef.current) return;
      if (fetchError) {
        setError(parseSupabaseError(fetchError));
        setPersons([]);
      } else {
        setPersons((data as Person[]) || []);
      }
    } catch (err) {
      if (mountedRef.current) setError(parseSupabaseError(err));
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  const createPerson = useCallback(async (data: PersonFormData): Promise<{ ok: boolean; error?: string }> => {
    try {
      const payload: Record<string, any> = {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        status: data.status,
      };
      if (data.email.trim()) payload.email = data.email.trim();
      if (data.phone.trim()) payload.phone = data.phone.trim();
      if (data.birth_date) payload.birth_date = data.birth_date;
      if (data.baptism_date) payload.baptism_date = data.baptism_date;
      if (data.address.trim()) payload.address = data.address.trim();
      if (data.notes.trim()) payload.notes = data.notes.trim();

      const { error } = await supabase.from('persons').insert(payload);
      if (error) return { ok: false, error: parseSupabaseError(error) };
      await fetchPersons();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseSupabaseError(err) };
    }
  }, [fetchPersons]);

  const updatePerson = useCallback(async (id: string, data: PersonFormData): Promise<{ ok: boolean; error?: string }> => {
    try {
      const payload: Record<string, any> = {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        status: data.status,
        email: data.email.trim() || null,
        phone: data.phone.trim() || null,
        birth_date: data.birth_date || null,
        baptism_date: data.baptism_date || null,
        address: data.address.trim() || null,
        notes: data.notes.trim() || null,
      };

      const { error } = await supabase.from('persons').update(payload).eq('id', id);
      if (error) return { ok: false, error: parseSupabaseError(error) };
      await fetchPersons();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseSupabaseError(err) };
    }
  }, [fetchPersons]);

  const softDeletePerson = useCallback(async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const personToDelete = persons.find((p) => p.id === id);
      const { error } = await supabase
        .from('persons')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) return { ok: false, error: parseSupabaseError(error) };

      // Registrar auditoría de archivado/eliminación de persona
      logAuditEvent('DELETE', 'persons', id, {
        first_name: personToDelete?.first_name,
        last_name: personToDelete?.last_name,
        email: personToDelete?.email,
        status: personToDelete?.status,
      });

      await fetchPersons();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseSupabaseError(err) };
    }
  }, [fetchPersons, persons]);

  const linkPersonToUser = useCallback(async (personId: string, email: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error } = await supabase.rpc('link_person_to_user', {
        p_person_id: personId,
        p_email: email,
      });
      if (error) return { ok: false, error: parseSupabaseError(error) };
      await fetchPersons();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseSupabaseError(err) };
    }
  }, [fetchPersons]);

  const getPersonUserLink = useCallback(async (person: Person): Promise<PersonUserLink> => {
    if (!person.user_id) return { user_id: null, roles: [] };
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', person.user_id);
      if (error) return { user_id: person.user_id, roles: [] };
      return {
        user_id: person.user_id,
        roles: (data || []).map((r) => r.role as AppRole),
      };
    } catch {
      return { user_id: person.user_id, roles: [] };
    }
  }, []);

  const addUserRole = useCallback(async (userId: string, role: AppRole): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) return { ok: false, error: parseSupabaseError(error) };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseSupabaseError(err) };
    }
  }, []);

  const removeUserRole = useCallback(async (userId: string, role: AppRole): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      if (error) return { ok: false, error: parseSupabaseError(error) };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: parseSupabaseError(err) };
    }
  }, []);

  return {
    persons,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    refresh: fetchPersons,
    createPerson,
    updatePerson,
    softDeletePerson,
    linkPersonToUser,
    getPersonUserLink,
    addUserRole,
    removeUserRole,
  };
}
