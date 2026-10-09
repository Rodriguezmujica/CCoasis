import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabase';
import { ChurchEvent, ChurchEventFormData } from '../types/events';
import { logAuditEvent } from './useAuditLogs';

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DAYS_NAMES_ES = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

/** Formatea una fecha ISO a hora local en formato HH:mm (Europe/Madrid) */
export function formatEventTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Formatea una fecha ISO a texto legible ej: "Domingo, 12 de Octubre" */
export function formatEventFriendlyDate(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const dayName = DAYS_NAMES_ES[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTH_NAMES_ES[d.getMonth()];
  return `${dayName}, ${dayNum} de ${monthName}`;
}

/** Formatea una fecha ISO a "YYYY-MM-DD" local */
export function toLocalDateString(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Calcula la diferencia amigable para el próximo evento (ej: "Hoy a las 18:00", "Mañana", "En 3 días") */
export function getFriendlyRelativeTime(targetIso: string): string {
  if (!targetIso) return '';
  const target = new Date(targetIso);
  const now = new Date();
  
  // Normalizar fechas sin hora para comparar días
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  
  const diffMs = targetDateOnly.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const timeFormatted = formatEventTime(targetIso);

  if (diffDays === 0) {
    if (target.getTime() < now.getTime()) {
      return `Hoy (en curso)`;
    }
    return `Hoy a las ${timeFormatted}`;
  }
  if (diffDays === 1) {
    return `Mañana a las ${timeFormatted}`;
  }
  if (diffDays === 2) {
    return `Pasado mañana a las ${timeFormatted}`;
  }
  if (diffDays > 2 && diffDays <= 7) {
    return `Este ${DAYS_NAMES_ES[target.getDay()]} a las ${timeFormatted} (en ${diffDays} días)`;
  }
  if (diffDays > 7) {
    return `En ${diffDays} días (${formatEventFriendlyDate(targetIso)})`;
  }
  return `Actividad pasada`;
}

function parseEventsError(error: any): string {
  const msg: string = error?.message || error?.details || String(error);

  if (msg.includes('row-level security') || msg.includes('violates row-level security')) {
    return 'No tienes permisos de administrador para realizar esta modificación en el calendario o la política RLS debe actualizarse.';
  }
  if (msg.includes('chk_church_event_type')) {
    return 'El tipo de evento seleccionado no es válido.';
  }
  if (msg.includes('chk_church_event_dates')) {
    return 'La fecha de fin no puede ser anterior a la fecha de inicio.';
  }
  if (msg.includes('JWT') || msg.includes('auth')) {
    return 'Tu sesión ha expirado o no es válida. Por favor, vuelve a iniciar sesión.';
  }
  return msg || 'Ocurrió un error inesperado al gestionar el evento.';
}

export function useEvents(selectedYear: number, selectedMonth: number) {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [upcomingEvent, setUpcomingEvent] = useState<ChurchEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar eventos del mes y el próximo evento más cercano
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Rango del mes seleccionado
      const startOfMonth = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

      // Traer eventos del mes activo
      const { data: monthData, error: monthError } = await supabase
        .from('church_events')
        .select('*')
        .is('deleted_at', null)
        .gte('start_time', startOfMonth.toISOString())
        .lte('start_time', endOfMonth.toISOString())
        .order('start_time', { ascending: true });

      if (monthError) throw monthError;
      setEvents((monthData as ChurchEvent[]) || []);

      // 2. Traer el próximo evento más cercano (desde ahora en adelante)
      const nowIso = new Date().toISOString();
      const { data: nextData, error: nextError } = await supabase
        .from('church_events')
        .select('*')
        .is('deleted_at', null)
        .gte('start_time', nowIso)
        .order('start_time', { ascending: true })
        .limit(1);

      if (nextError) throw nextError;
      if (nextData && nextData.length > 0) {
        setUpcomingEvent(nextData[0] as ChurchEvent);
      } else {
        setUpcomingEvent(null);
      }
    } catch (err: any) {
      console.error('Error al cargar eventos:', err);
      setError(parseEventsError(err));
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Crear nuevo evento (Solo Admin)
  const createEvent = async (formData: ChurchEventFormData): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      // Construir start_time ISO
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time_val}:00`);
      if (isNaN(startDateTime.getTime())) {
        throw new Error('La fecha y hora de inicio no son válidas.');
      }

      let endDateTime: Date | null = null;
      if (formData.end_date && formData.end_time_val) {
        endDateTime = new Date(`${formData.end_date}T${formData.end_time_val}:00`);
        if (isNaN(endDateTime.getTime())) {
          throw new Error('La fecha y hora de finalización no son válidas.');
        }
        if (endDateTime < startDateTime) {
          throw new Error('La hora de finalización no puede ser anterior al inicio.');
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from('church_events')
        .insert({
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          event_type: formData.event_type,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime ? endDateTime.toISOString() : null,
          location: formData.location?.trim() || null,
          created_by: user?.id || null,
        });

      if (insertError) throw insertError;
      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error('Error al crear evento:', err);
      setError(parseEventsError(err));
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Editar evento existente (Solo Admin)
  const updateEvent = async (id: string, formData: ChurchEventFormData): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time_val}:00`);
      if (isNaN(startDateTime.getTime())) {
        throw new Error('La fecha y hora de inicio no son válidas.');
      }

      let endDateTime: Date | null = null;
      if (formData.end_date && formData.end_time_val) {
        endDateTime = new Date(`${formData.end_date}T${formData.end_time_val}:00`);
        if (isNaN(endDateTime.getTime())) {
          throw new Error('La fecha y hora de finalización no son válidas.');
        }
        if (endDateTime < startDateTime) {
          throw new Error('La hora de finalización no puede ser anterior al inicio.');
        }
      }

      const { error: updateError } = await supabase
        .from('church_events')
        .update({
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          event_type: formData.event_type,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime ? endDateTime.toISOString() : null,
          location: formData.location?.trim() || null,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error('Error al actualizar evento:', err);
      setError(parseEventsError(err));
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar o archivar evento (Solo Admin)
  const deleteEvent = async (id: string): Promise<boolean> => {
    setActionLoading(true);
    setError(null);
    try {
      const eventToDelete = events.find((e) => e.id === id);

      // 1. Intentar archivado seguro (soft-delete con deleted_at = now())
      const { error: softDeleteError } = await supabase
        .from('church_events')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (!softDeleteError) {
        logAuditEvent('DELETE', 'church_events', id, {
          title: eventToDelete?.title,
          event_type: eventToDelete?.event_type,
          start_time: eventToDelete?.start_time,
          mode: 'soft-delete',
        });
        await fetchEvents();
        return true;
      }

      // 2. Si el soft-delete falla (ej. por restricción RLS en SELECT sobre filas con deleted_at),
      // intentar eliminación directa DELETE permitida para el rol admin
      console.warn('Soft-delete no completado, intentando eliminación directa (DELETE):', softDeleteError);
      const { error: hardDeleteError } = await supabase
        .from('church_events')
        .delete()
        .eq('id', id);

      if (hardDeleteError) {
        throw softDeleteError || hardDeleteError;
      }

      logAuditEvent('DELETE', 'church_events', id, {
        title: eventToDelete?.title,
        event_type: eventToDelete?.event_type,
        start_time: eventToDelete?.start_time,
        mode: 'hard-delete',
      });

      await fetchEvents();
      return true;
    } catch (err: any) {
      console.error('Error al archivar/eliminar evento:', err);
      setError(parseEventsError(err));
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Agrupación de eventos por fecha 'YYYY-MM-DD' para renderizado ordenado
  const eventsByDate = useMemo(() => {
    const map: Record<string, ChurchEvent[]> = {};
    events.forEach((ev) => {
      const dateKey = toLocalDateString(ev.start_time);
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(ev);
    });
    return map;
  }, [events]);

  return {
    events,
    upcomingEvent,
    eventsByDate,
    loading,
    actionLoading,
    error,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    clearError: () => setError(null),
  };
}
