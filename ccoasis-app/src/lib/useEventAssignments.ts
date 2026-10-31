import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import {
  ChurchEventAssignment,
  ChurchEventAssignmentFormData,
  ChurchEventRoleType,
} from '../types/assignments';
import { Person } from '../types/persons';

/** Mapea errores de Supabase/PostgreSQL en mensajes amigables en español */
export function parseAssignmentError(error: any): string {
  const msg: string = error?.message || error?.details || String(error);

  if (
    msg.includes('uq_church_event_assignment_event_person_role') ||
    (msg.includes('duplicate key') && msg.includes('role_type'))
  ) {
    return 'Esta persona ya tiene asignado ese mismo rol en este evento.';
  }
  if (msg.includes('chk_church_event_assignment_role_type')) {
    return 'El rol eclesial seleccionado no es válido.';
  }
  if (msg.includes('row-level security') || msg.includes('violates row-level security')) {
    return 'No tienes permisos de administrador para modificar los turnos de este evento.';
  }
  if (msg.includes('foreign key') && msg.includes('person_id')) {
    return 'La persona seleccionada no existe o no es válida.';
  }
  if (msg.includes('foreign key') && msg.includes('event_id')) {
    return 'El evento seleccionado no existe o fue archivado.';
  }
  return msg || 'Ocurrió un error inesperado al gestionar los turnos.';
}

/** Consulta la vista segura v_event_servers para obtener nombre y apellido de los servidores */
async function fetchEventServersMap(
  personIds?: string[]
): Promise<Map<string, { id: string; first_name: string; last_name: string }>> {
  try {
    let query = supabase.from('v_event_servers').select('id, first_name, last_name');
    if (personIds && personIds.length > 0) {
      query = query.in('id', personIds);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('Nota al consultar vista segura v_event_servers:', error.message);
      return new Map();
    }
    return new Map((data || []).map((s: any) => [s.id, s]));
  } catch (err) {
    console.warn('Excepción al consultar v_event_servers:', err);
    return new Map();
  }
}

export function useEventAssignments(eventId: string | null) {
  const [assignments, setAssignments] = useState<ChurchEventAssignment[]>([]);
  const [activePersons, setActivePersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cargar asignaciones del evento con los datos de cada servidor desde v_event_servers
  const fetchAssignments = useCallback(async () => {
    if (!eventId) {
      setAssignments([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('church_event_assignments')
        .select(`
          id,
          event_id,
          person_id,
          role_type,
          notes,
          created_at,
          person:v_event_servers (
            id,
            first_name,
            last_name
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      let rows = data;

      if (fetchErr) {
        console.warn('Fallback a consulta directa de v_event_servers:', fetchErr.message);
        const { data: rawAssignments, error: rawErr } = await supabase
          .from('church_event_assignments')
          .select('id, event_id, person_id, role_type, notes, created_at')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true });

        if (rawErr) throw rawErr;

        const personIds = Array.from(
          new Set((rawAssignments || []).map((r: any) => r.person_id).filter(Boolean))
        ) as string[];
        const serversMap = await fetchEventServersMap(personIds);

        rows = (rawAssignments || []).map((r: any) => ({
          ...r,
          person: serversMap.get(r.person_id) || null,
        }));
      } else {
        const unmappedPersonIds = (rows || [])
          .filter((row: any) => !row.person && row.person_id)
          .map((row: any) => row.person_id) as string[];

        if (unmappedPersonIds.length > 0) {
          const fallbackMap = await fetchEventServersMap(unmappedPersonIds);
          rows = (rows || []).map((row: any) => {
            const rawPerson = Array.isArray(row.person) ? row.person[0] : row.person;
            return {
              ...row,
              person: rawPerson || fallbackMap.get(row.person_id) || null,
            };
          });
        }
      }

      if (!mountedRef.current) return;

      const formatted: ChurchEventAssignment[] = (rows || []).map((row: any) => ({
        id: row.id,
        event_id: row.event_id,
        person_id: row.person_id,
        role_type: row.role_type as ChurchEventRoleType,
        notes: row.notes,
        created_at: row.created_at,
        person: Array.isArray(row.person) ? row.person[0] : row.person,
      }));

      setAssignments(formatted);
    } catch (err: any) {
      console.error('Error al cargar turnos del evento:', err);
      if (mountedRef.current) {
        setError(parseAssignmentError(err));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [eventId]);

  // Cargar lista de personas activas o visitas de la congregación para el selector
  const fetchActivePersons = useCallback(async () => {
    try {
      const { data, error: personsErr } = await supabase
        .from('persons')
        .select('id, user_id, first_name, last_name, email, phone, birth_date, baptism_date, address, status, notes, created_at, updated_at, deleted_at')
        .is('deleted_at', null)
        .order('first_name', { ascending: true })
        .order('last_name', { ascending: true });

      if (personsErr) {
        // Si no es admin o no puede listar persons completas, no interrumpir el flujo
        console.warn('Nota sobre selector de personas:', personsErr.message);
        return;
      }

      if (mountedRef.current && data) {
        setActivePersons(data as Person[]);
      }
    } catch (err) {
      console.error('Error al cargar personas activas:', err);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Asignar un servidor a un rol
  const assignPerson = async (formData: ChurchEventAssignmentFormData): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const { error: insertErr } = await supabase
        .from('church_event_assignments')
        .insert({
          event_id: formData.event_id,
          person_id: formData.person_id,
          role_type: formData.role_type,
          notes: formData.notes?.trim() || null,
        });

      if (insertErr) throw insertErr;
      await fetchAssignments();
      return true;
    } catch (err: any) {
      console.error('Error al asignar servidor:', err);
      if (mountedRef.current) {
        setError(parseAssignmentError(err));
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setActionLoading(false);
      }
    }
  };

  // Desasignar / Quitar un servidor del turno
  const removeAssignment = async (assignmentId: string): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const { error: deleteErr } = await supabase
        .from('church_event_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteErr) throw deleteErr;
      await fetchAssignments();
      return true;
    } catch (err: any) {
      console.error('Error al eliminar asignación:', err);
      if (mountedRef.current) {
        setError(parseAssignmentError(err));
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setActionLoading(false);
      }
    }
  };

  return {
    assignments,
    activePersons,
    loading,
    actionLoading,
    error,
    refetch: fetchAssignments,
    fetchActivePersons,
    assignPerson,
    removeAssignment,
    clearError: () => setError(null),
  };
}

/** Hook opcional para cargar todas las asignaciones de una lista de eventos de una sola vez */
export function useBatchEventAssignments(eventIds: string[]) {
  const [assignmentsByEvent, setAssignmentsByEvent] = useState<Record<string, ChurchEventAssignment[]>>({});
  const [loading, setLoading] = useState<boolean>(false);

  const fetchBatch = useCallback(async () => {
    if (!eventIds || eventIds.length === 0) {
      setAssignmentsByEvent({});
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('church_event_assignments')
        .select(`
          id,
          event_id,
          person_id,
          role_type,
          notes,
          created_at,
          person:v_event_servers (
            id,
            first_name,
            last_name
          )
        `)
        .in('event_id', eventIds)
        .order('created_at', { ascending: true });

      let rows = data;

      if (error) {
        console.warn('Fallback batch a consulta directa de v_event_servers:', error.message);
        const { data: rawAssignments, error: rawErr } = await supabase
          .from('church_event_assignments')
          .select('id, event_id, person_id, role_type, notes, created_at')
          .in('event_id', eventIds)
          .order('created_at', { ascending: true });

        if (rawErr) throw rawErr;

        const personIds = Array.from(
          new Set((rawAssignments || []).map((r: any) => r.person_id).filter(Boolean))
        ) as string[];
        const serversMap = await fetchEventServersMap(personIds);

        rows = (rawAssignments || []).map((r: any) => ({
          ...r,
          person: serversMap.get(r.person_id) || null,
        }));
      } else {
        const unmappedPersonIds = (rows || [])
          .filter((row: any) => !row.person && row.person_id)
          .map((row: any) => row.person_id) as string[];

        if (unmappedPersonIds.length > 0) {
          const fallbackMap = await fetchEventServersMap(unmappedPersonIds);
          rows = (rows || []).map((row: any) => {
            const rawPerson = Array.isArray(row.person) ? row.person[0] : row.person;
            return {
              ...row,
              person: rawPerson || fallbackMap.get(row.person_id) || null,
            };
          });
        }
      }

      const map: Record<string, ChurchEventAssignment[]> = {};
      (rows || []).forEach((row: any) => {
        const item: ChurchEventAssignment = {
          id: row.id,
          event_id: row.event_id,
          person_id: row.person_id,
          role_type: row.role_type as ChurchEventRoleType,
          notes: row.notes,
          created_at: row.created_at,
          person: Array.isArray(row.person) ? row.person[0] : row.person,
        };
        if (!map[item.event_id]) {
          map[item.event_id] = [];
        }
        map[item.event_id].push(item);
      });

      setAssignmentsByEvent(map);
    } catch (err) {
      console.error('Error al cargar turnos por lote:', err);
    } finally {
      setLoading(false);
    }
  }, [eventIds.join(',')]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  return {
    assignmentsByEvent,
    loading,
    refetchBatch: fetchBatch,
  };
}
