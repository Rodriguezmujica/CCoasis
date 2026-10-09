import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../context/AuthContext';
import { EventHeadcount, HeadcountFormData, HeadcountMonthSummary } from '../types/headcount';
import { ChurchEvent } from '../types/events';

export const useHeadcount = (events: ChurchEvent[] = []) => {
  const { session, roles } = useAuth();
  const canAccessHeadcount = roles.includes('admin') || roles.includes('tesorero');

  const [headcountsByEvent, setHeadcountsByEvent] = useState<Record<string, EventHeadcount>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const eventIds = useMemo(() => events.map((e) => e.id), [events]);

  const fetchHeadcounts = useCallback(async () => {
    if (!canAccessHeadcount || eventIds.length === 0) {
      setHeadcountsByEvent({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('church_event_headcount')
        .select('*')
        .in('event_id', eventIds);

      if (fetchErr) {
        throw fetchErr;
      }

      const map: Record<string, EventHeadcount> = {};
      (data || []).forEach((item: EventHeadcount) => {
        map[item.event_id] = item;
      });

      setHeadcountsByEvent(map);
    } catch (err: any) {
      console.error('Error al cargar conteos de asistencia:', err);
      setError(err?.message || 'No se pudieron cargar los registros de asistencia.');
    } finally {
      setLoading(false);
    }
  }, [canAccessHeadcount, eventIds]);

  useEffect(() => {
    fetchHeadcounts();
  }, [fetchHeadcounts]);

  // Guardar o actualizar conteo
  const upsertHeadcount = async (
    eventId: string,
    formData: HeadcountFormData
  ): Promise<boolean> => {
    if (!canAccessHeadcount) {
      setError('No tienes permisos para registrar asistencia.');
      return false;
    }

    setActionLoading(true);
    setError(null);

    try {
      const payload: {
        event_id: string;
        adults_count: number;
        children_count: number;
        visitors_count: number;
        notes: string | null;
        recorded_by: string | null;
      } = {
        event_id: eventId,
        adults_count: Math.max(0, Number(formData.adults_count) || 0),
        children_count: Math.max(0, Number(formData.children_count) || 0),
        visitors_count: Math.max(0, Number(formData.visitors_count) || 0),
        notes: formData.notes?.trim() ? formData.notes.trim() : null,
        recorded_by: session?.user?.id || null,
      };

      const { data, error: upsertErr } = await supabase
        .from('church_event_headcount')
        .upsert(payload, { onConflict: 'event_id' })
        .select()
        .single();

      if (upsertErr) {
        throw upsertErr;
      }

      if (data) {
        setHeadcountsByEvent((prev) => ({
          ...prev,
          [eventId]: data as EventHeadcount,
        }));
      }

      return true;
    } catch (err: any) {
      console.error('Error al guardar asistencia:', err);
      setError(err?.message || 'Error al guardar el conteo de asistencia.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar registro de conteo si fuese necesario
  const deleteHeadcount = async (eventId: string): Promise<boolean> => {
    if (!canAccessHeadcount) {
      setError('No tienes permisos para eliminar asistencia.');
      return false;
    }

    setActionLoading(true);
    setError(null);

    try {
      const { error: delErr } = await supabase
        .from('church_event_headcount')
        .delete()
        .eq('event_id', eventId);

      if (delErr) {
        throw delErr;
      }

      setHeadcountsByEvent((prev) => {
        const copy = { ...prev };
        delete copy[eventId];
        return copy;
      });

      return true;
    } catch (err: any) {
      console.error('Error al eliminar registro de asistencia:', err);
      setError(err?.message || 'Error al eliminar el registro de asistencia.');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Calcular métricas acumuladas del mes en base a los eventos pasados con conteo
  const monthSummary: HeadcountMonthSummary = useMemo(() => {
    const records = Object.values(headcountsByEvent);
    const totalEventsWithAttendance = records.length;

    let totalAdults = 0;
    let totalChildren = 0;
    let totalVisitors = 0;
    let totalAttendees = 0;

    let highestEvent: HeadcountMonthSummary['highestEvent'] = null;

    records.forEach((rec) => {
      totalAdults += rec.adults_count;
      totalChildren += rec.children_count;
      totalVisitors += rec.visitors_count;
      totalAttendees += rec.total_count;

      if (!highestEvent || rec.total_count > highestEvent.total) {
        const ev = events.find((e) => e.id === rec.event_id);
        highestEvent = {
          title: ev ? ev.title : 'Culto',
          date: ev ? ev.start_time : rec.created_at,
          total: rec.total_count,
        };
      }
    });

    const averageAttendance =
      totalEventsWithAttendance > 0 ? Math.round(totalAttendees / totalEventsWithAttendance) : 0;

    return {
      month: events.length > 0 ? new Date(events[0].start_time).getMonth() : new Date().getMonth(),
      year: events.length > 0 ? new Date(events[0].start_time).getFullYear() : new Date().getFullYear(),
      totalEventsWithAttendance,
      totalAttendees,
      averageAttendance,
      totalAdults,
      totalChildren,
      totalVisitors,
      highestEvent,
    };
  }, [headcountsByEvent, events]);

  return {
    canAccessHeadcount,
    headcountsByEvent,
    loading,
    actionLoading,
    error,
    clearError: () => setError(null),
    fetchHeadcounts,
    upsertHeadcount,
    deleteHeadcount,
    monthSummary,
  };
};
