import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../context/AuthContext';
import { ChurchEvent } from '../types/events';
import {
  ChurchEventRSVP,
  RSVPFormData,
  EventRSVPSummary,
} from '../types/rsvps';

/** Mapea errores de Supabase/PostgreSQL de confirmaciones en mensajes legibles en español */
export function parseRSVPError(error: any): string {
  const msg: string = error?.message || error?.details || String(error);

  if (msg.includes('ya comenzó o ya pasó')) {
    return 'Este evento ya comenzó o ya pasó; no se puede confirmar o modificar la asistencia.';
  }
  if (msg.includes('ya no está disponible')) {
    return 'Este evento ya no está disponible o ha sido archivado.';
  }
  if (msg.includes('chk_rsvp_guests')) {
    return 'La cantidad de acompañantes o invitados debe estar entre 0 y 10.';
  }
  if (msg.includes('chk_rsvp_status')) {
    return 'El estado de confirmación seleccionado no es válido.';
  }
  if (msg.includes('row-level security') || msg.includes('violates row-level security')) {
    return 'No tienes permisos para registrar esta confirmación o tu cuenta no está vinculada a una ficha de miembro.';
  }
  if (msg.includes('JWT') || msg.includes('auth')) {
    return 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.';
  }
  return msg || 'Ocurrió un error inesperado al procesar la confirmación de asistencia.';
}

/** Determina si un evento es futuro respecto a la hora actual */
export function isEventFuture(startTimeIso: string): boolean {
  if (!startTimeIso) return false;
  return new Date(startTimeIso).getTime() > Date.now();
}

export function useEventRSVPs(events: ChurchEvent[]) {
  const { user } = useAuth();
  const [myPersonId, setMyPersonId] = useState<string | null>(null);
  const [personName, setPersonName] = useState<string | null>(null);
  const [isPersonLinked, setIsPersonLinked] = useState<boolean | null>(null);

  const [myRsvpsByEvent, setMyRsvpsByEvent] = useState<Record<string, ChurchEventRSVP>>({});
  const [summariesByEvent, setSummariesByEvent] = useState<Record<string, EventRSVPSummary>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 1. Resolver el person_id vinculado al usuario actual mediante get_my_person_id()
  useEffect(() => {
    if (!user?.id) {
      setMyPersonId(null);
      setPersonName(null);
      setIsPersonLinked(false);
      return;
    }

    let isSubscribed = true;

    const resolveMyPerson = async () => {
      try {
        // Intentar primero con la función RPC de Supabase get_my_person_id()
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_my_person_id');

        let resolvedId: string | null = (rpcData as string) || null;

        // Si rpcData es nulo o dio error, verificar directamente en la tabla persons
        if (!resolvedId && !rpcErr) {
          const { data: personData } = await supabase
            .from('persons')
            .select('id, first_name, last_name')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .maybeSingle();

          if (personData) {
            resolvedId = personData.id;
            if (isSubscribed) {
              setPersonName(`${personData.first_name} ${personData.last_name}`);
            }
          }
        } else if (resolvedId) {
          // Traer nombre de la persona para la UI amigable
          const { data: personData } = await supabase
            .from('persons')
            .select('first_name, last_name')
            .eq('id', resolvedId)
            .maybeSingle();

          if (personData && isSubscribed) {
            setPersonName(`${personData.first_name} ${personData.last_name}`);
          }
        }

        if (isSubscribed) {
          if (resolvedId) {
            setMyPersonId(resolvedId);
            setIsPersonLinked(true);
          } else {
            setMyPersonId(null);
            setPersonName(null);
            setIsPersonLinked(false);
          }
        }
      } catch (err) {
        console.error('Error al resolver ficha vinculada:', err);
        if (isSubscribed) {
          setMyPersonId(null);
          setIsPersonLinked(false);
        }
      }
    };

    resolveMyPerson();

    return () => {
      isSubscribed = false;
    };
  }, [user?.id]);

  // 2. Cargar resúmenes públicos de RSVP y confirmaciones individuales del usuario
  const fetchRSVPData = useCallback(async () => {
    if (events.length === 0) {
      setSummariesByEvent({});
      setMyRsvpsByEvent({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const eventIds = events.map((e) => e.id);

      // (a) Cargar resúmenes públicos de todos los eventos mediante get_event_rsvp_summary()
      const summaryPromises = eventIds.map(async (eventId) => {
        try {
          const { data, error: sumErr } = await supabase.rpc('get_event_rsvp_summary', {
            p_event_id: eventId,
          });

          if (sumErr) {
            console.warn(`Error al consultar get_event_rsvp_summary para evento ${eventId}:`, sumErr.message);
            return { eventId, summary: { confirmed: 0, maybe: 0, guests: 0 } };
          }

          const row = Array.isArray(data) ? data[0] : data;
          return {
            eventId,
            summary: {
              confirmed: Number(row?.confirmed ?? 0),
              maybe: Number(row?.maybe ?? 0),
              guests: Number(row?.guests ?? 0),
            },
          };
        } catch {
          return { eventId, summary: { confirmed: 0, maybe: 0, guests: 0 } };
        }
      });

      const summaryResults = await Promise.all(summaryPromises);
      const newSummaries: Record<string, EventRSVPSummary> = {};
      summaryResults.forEach(({ eventId, summary }) => {
        newSummaries[eventId] = summary;
      });

      // (b) Si hay un person_id resuelto, cargar las confirmaciones propias del usuario
      const newMyRsvps: Record<string, ChurchEventRSVP> = {};
      if (myPersonId) {
        const { data: ownData, error: ownErr } = await supabase
          .from('church_event_rsvps')
          .select('id, event_id, person_id, status, guests, created_at, updated_at')
          .eq('person_id', myPersonId)
          .in('event_id', eventIds);

        if (!ownErr && ownData) {
          ownData.forEach((row) => {
            newMyRsvps[row.event_id] = row as ChurchEventRSVP;
          });
        }
      }

      if (mountedRef.current) {
        setSummariesByEvent(newSummaries);
        setMyRsvpsByEvent(newMyRsvps);
      }
    } catch (err: any) {
      console.error('Error al cargar datos de RSVP:', err);
      if (mountedRef.current) {
        setError(parseRSVPError(err));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [events, myPersonId]);

  useEffect(() => {
    fetchRSVPData();
  }, [fetchRSVPData]);

  // 3. Confirmar o actualizar asistencia (upsert en church_event_rsvps)
  const upsertRSVP = async (
    eventId: string,
    formData: RSVPFormData
  ): Promise<boolean> => {
    if (!myPersonId) {
      setError('Tu cuenta aún no está vinculada a tu ficha; pídele al administrador que la vincule.');
      return false;
    }

    setActionLoading(true);
    setError(null);

    try {
      const sanitizedGuests =
        formData.status === 'no_asistire'
          ? 0
          : Math.min(10, Math.max(0, formData.guests || 0));

      const { data, error: upsertErr } = await supabase
        .from('church_event_rsvps')
        .upsert(
          {
            event_id: eventId,
            person_id: myPersonId,
            status: formData.status,
            guests: sanitizedGuests,
          },
          { onConflict: 'event_id,person_id' }
        )
        .select()
        .single();

      if (upsertErr) throw upsertErr;

      // Actualizar confirmación local del usuario
      if (data) {
        setMyRsvpsByEvent((prev) => ({
          ...prev,
          [eventId]: data as ChurchEventRSVP,
        }));
      }

      // Actualizar resumen público del evento
      const { data: sumData } = await supabase.rpc('get_event_rsvp_summary', {
        p_event_id: eventId,
      });
      const row = Array.isArray(sumData) ? sumData[0] : sumData;
      setSummariesByEvent((prev) => ({
        ...prev,
        [eventId]: {
          confirmed: Number(row?.confirmed ?? 0),
          maybe: Number(row?.maybe ?? 0),
          guests: Number(row?.guests ?? 0),
        },
      }));

      return true;
    } catch (err: any) {
      console.error('Error al guardar confirmación de asistencia:', err);
      const parsed = parseRSVPError(err);
      setError(parsed);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Cancelar o eliminar confirmación de asistencia
  const deleteRSVP = async (eventId: string): Promise<boolean> => {
    if (!myPersonId) {
      setError('Tu cuenta aún no está vinculada a tu ficha.');
      return false;
    }

    setActionLoading(true);
    setError(null);

    try {
      const { error: deleteErr } = await supabase
        .from('church_event_rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('person_id', myPersonId);

      if (deleteErr) throw deleteErr;

      // Quitar del mapa local del usuario
      setMyRsvpsByEvent((prev) => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });

      // Actualizar resumen público del evento
      const { data: sumData } = await supabase.rpc('get_event_rsvp_summary', {
        p_event_id: eventId,
      });
      const row = Array.isArray(sumData) ? sumData[0] : sumData;
      setSummariesByEvent((prev) => ({
        ...prev,
        [eventId]: {
          confirmed: Number(row?.confirmed ?? 0),
          maybe: Number(row?.maybe ?? 0),
          guests: Number(row?.guests ?? 0),
        },
      }));

      return true;
    } catch (err: any) {
      console.error('Error al eliminar confirmación de asistencia:', err);
      const parsed = parseRSVPError(err);
      setError(parsed);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    myPersonId,
    personName,
    isPersonLinked: isPersonLinked ?? false,
    myRsvpsByEvent,
    summariesByEvent,
    loading,
    actionLoading,
    error,
    upsertRSVP,
    deleteRSVP,
    refetch: fetchRSVPData,
    clearError: () => setError(null),
  };
}
