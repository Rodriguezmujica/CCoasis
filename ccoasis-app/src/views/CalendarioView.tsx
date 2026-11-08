import React, { useState, useMemo } from 'react';
import {
  ChurchEvent,
  ChurchEventFormData,
  ChurchEventType,
  EVENT_TYPES_CONFIG,
} from '../types/events';
import {
  useEvents,
  MONTH_NAMES_ES,
  formatEventTime,
  formatEventFriendlyDate,
  toLocalDateString,
  getFriendlyRelativeTime,
} from '../lib/useEvents';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  CalendarDays,
  Info,
  Users,
  TrendingUp,
  UserCheck,
  Megaphone,
  CalendarCheck,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Check,
  Globe,
} from 'lucide-react';
import { useBatchEventAssignments } from '../lib/useEventAssignments';
import { EventAssignmentsModal, getRoleIcon } from '../components/calendario/EventAssignmentsModal';
import { CHURCH_ROLES_CONFIG } from '../types/assignments';
import { useHeadcount } from '../lib/useHeadcount';
import { EventHeadcountModal } from '../components/calendario/EventHeadcountModal';
import { HeadcountMetricsModal } from '../components/calendario/HeadcountMetricsModal';
import { useAnnouncements } from '../lib/useAnnouncements';
import { Announcement, AnnouncementFormData } from '../types/announcements';
import { AnnouncementsBanner } from '../components/announcements/AnnouncementsBanner';
import { AnnouncementModal } from '../components/announcements/AnnouncementModal';
import { AnnouncementsManagerModal } from '../components/announcements/AnnouncementsManagerModal';
import { useEventRSVPs, isEventFuture } from '../lib/useEventRSVPs';
import { EventRSVPModal } from '../components/calendario/EventRSVPModal';
import { EventRSVPListModal } from '../components/calendario/EventRSVPListModal';
import { CalendarGridView, formatDateKeyFriendly } from '../components/calendario/CalendarGridView';

export const CalendarioView: React.FC = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const isTesorero = roles.includes('tesorero');
  const canManageHeadcount = isAdmin || isTesorero;

  // Control de fecha seleccionada (año y mes)
  const today = new Date();
  const todayKey = toLocalDateString(today.toISOString());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  // Día específico seleccionado por el usuario con un clic (o null para selección automática inteligente)
  const [userSelectedDateKey, setUserSelectedDateKey] = useState<string | null>(null);

  // Hook de eventos
  const {
    events,
    upcomingEvent,
    eventsByDate,
    loading,
    actionLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    clearError,
  } = useEvents(selectedYear, selectedMonth);

  // Cargar asignaciones de todos los eventos visibles
  const eventIds = events.map((e) => e.id);
  const { assignmentsByEvent, refetchBatch } = useBatchEventAssignments(eventIds);

  // Hook de conteo de asistencia y métricas generales (Bloque 3)
  const {
    headcountsByEvent,
    actionLoading: headcountActionLoading,
    error: headcountError,
    upsertHeadcount,
    deleteHeadcount,
    monthSummary,
    clearError: clearHeadcountError,
  } = useHeadcount(events);

  // Hook de avisos y anuncios generales (Bloque 4)
  const {
    allAnnouncements,
    activeAnnouncements,
    actionLoading: announcementsActionLoading,
    createAnnouncement,
    updateAnnouncement,
    toggleActive: toggleAnnouncementActive,
    deleteAnnouncement,
  } = useAnnouncements();

  // Hook de confirmación de asistencia individual (RSVP)
  const {
    personName,
    isPersonLinked,
    myRsvpsByEvent,
    summariesByEvent,
    actionLoading: rsvpActionLoading,
    error: rsvpError,
    upsertRSVP,
    deleteRSVP,
    clearError: clearRsvpError,
  } = useEventRSVPs(events);

  // Estados de Modales de Avisos
  const [isAnnouncementFormOpen, setIsAnnouncementFormOpen] = useState<boolean>(false);
  const [isAnnouncementsManagerOpen, setIsAnnouncementsManagerOpen] = useState<boolean>(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const handleOpenCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setIsAnnouncementFormOpen(true);
  };

  const handleOpenEditAnnouncement = (a: Announcement) => {
    setEditingAnnouncement(a);
    setIsAnnouncementFormOpen(true);
  };

  const handleSaveAnnouncement = async (data: AnnouncementFormData) => {
    if (editingAnnouncement) {
      return await updateAnnouncement(editingAnnouncement.id, data);
    } else {
      return await createAnnouncement(data);
    }
  };

  // Estados de Modales
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<ChurchEvent | null>(null);
  const [assignmentsEvent, setAssignmentsEvent] = useState<ChurchEvent | null>(null);
  const [headcountEvent, setHeadcountEvent] = useState<ChurchEvent | null>(null);
  const [isMetricsOpen, setIsMetricsOpen] = useState<boolean>(false);
  const [rsvpModalEvent, setRsvpModalEvent] = useState<ChurchEvent | null>(null);
  const [rsvpListEvent, setRsvpListEvent] = useState<ChurchEvent | null>(null);

  // Estado del Formulario
  const [formData, setFormData] = useState<ChurchEventFormData>({
    title: '',
    description: '',
    event_type: 'culto',
    start_date: toLocalDateString(today.toISOString()),
    start_time_val: '18:00',
    end_date: '',
    end_time_val: '',
    location: '',
    is_public: false,
  });

  // Prefijo del mes seleccionado ('YYYY-MM')
  const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();

  // Navegación de mes anterior / siguiente
  const handlePrevMonth = () => {
    setUserSelectedDateKey(null);
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setUserSelectedDateKey(null);
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setUserSelectedDateKey(null);
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  // Selección inteligente por defecto:
  // - Si el usuario pulsó un día de este mes, se respeta.
  // - Si es el mes actual:
  //    * Si HOY tiene actividades, seleccionar HOY.
  //    * Si HOY no tiene actividades, seleccionar la PRÓXIMA fecha futura del mes con actividades.
  //    * Si no hay actividades futuras este mes, mostrar HOY (sin eventos pasados por defecto).
  // - Si es otro mes: seleccionar la primera fecha con actividades o el día 1.
  const activeDateKey = useMemo<string>(() => {
    if (userSelectedDateKey && userSelectedDateKey.startsWith(monthPrefix)) {
      return userSelectedDateKey;
    }

    const eventDatesInMonth = Object.keys(eventsByDate)
      .filter((d) => d.startsWith(monthPrefix))
      .sort();

    if (isCurrentMonth) {
      if (eventsByDate[todayKey] && eventsByDate[todayKey].length > 0) {
        return todayKey;
      }
      const futureDates = eventDatesInMonth.filter((d) => d >= todayKey);
      if (futureDates.length > 0) {
        return futureDates[0];
      }
      return todayKey;
    }

    if (eventDatesInMonth.length > 0) {
      return eventDatesInMonth[0];
    }
    return `${monthPrefix}-01`;
  }, [userSelectedDateKey, monthPrefix, isCurrentMonth, eventsByDate, todayKey]);

  const isTodayActive = activeDateKey === todayKey;
  const isFutureActive = activeDateKey > todayKey;
  const activeDayEvents = eventsByDate[activeDateKey] || [];

  // Abrir modal de creación
  const handleOpenCreate = () => {
    const defaultDate = activeDateKey || (isCurrentMonth ? todayKey : `${monthPrefix}-01`);

    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      event_type: 'culto',
      start_date: defaultDate,
      start_time_val: '18:00',
      end_date: '',
      end_time_val: '',
      location: 'Local Central - Salón Principal',
      is_public: false,
    });
    setIsFormOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEdit = (ev: ChurchEvent) => {
    const startDate = toLocalDateString(ev.start_time);
    const startTime = formatEventTime(ev.start_time);

    let endDate = '';
    let endTime = '';
    if (ev.end_time) {
      endDate = toLocalDateString(ev.end_time);
      endTime = formatEventTime(ev.end_time);
    }

    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      description: ev.description || '',
      event_type: ev.event_type,
      start_date: startDate,
      start_time_val: startTime,
      end_date: endDate,
      end_time_val: endTime,
      location: ev.location || '',
      is_public: Boolean(ev.is_public),
    });
    setIsFormOpen(true);
  };

  // Guardar formulario (crear o editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    let success = false;
    if (editingEvent) {
      success = await updateEvent(editingEvent.id, formData);
    } else {
      success = await createEvent(formData);
    }

    if (success) {
      setIsFormOpen(false);
      setEditingEvent(null);
    }
  };

  // Confirmar archivado (soft-delete)
  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    const success = await deleteEvent(deletingEvent.id);
    if (success) {
      setDeletingEvent(null);
    }
  };


  return (
    <div className="p-4 md:py-6 md:px-8 space-y-4">
      {/* Encabezado Principal: en una sola fila limpia en escritorio */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-[12px] bg-[#0e7c86] text-white flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[25px] leading-[1.2] font-extrabold oasis-text-gradient">
              Calendario Eclesial
            </h1>
            <p className="text-sm text-[#4a4f57] truncate">
              Cultos, reuniones de oración, eventos y actividades de la congregación
            </p>
          </div>
        </div>

        {/* Botones de Acción compactos en una sola fila sin partirse */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
          {canManageHeadcount && (
            <button
              onClick={() => setIsMetricsOpen(true)}
              className="min-h-[44px] px-[18px] rounded-[10px] bg-white border border-[#767b83] hover:bg-[#ebedef] text-[#1a1a1a] text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
              title="Ver resumen y métricas de asistencias del mes"
            >
              <TrendingUp className="w-5 h-5 text-[#0e7c86] flex-shrink-0" />
              <span>Resumen de Asistencia</span>
              {monthSummary.totalEventsWithAttendance > 0 && (
                <span className="ml-0.5 px-2 py-0.5 bg-[#d9f7f8] text-[#0a5961] rounded-full text-xs font-bold">
                  {monthSummary.averageAttendance} prom.
                </span>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsAnnouncementsManagerOpen(true)}
              className="min-h-[44px] px-[18px] rounded-[10px] bg-white border border-[#767b83] hover:bg-[#ebedef] text-[#1a1a1a] text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
              title="Administrar anuncios especiales"
            >
              <Megaphone className="w-5 h-5 text-[#0e7c86] flex-shrink-0" />
              <span>Anuncios</span>
              {activeAnnouncements.length > 0 && (
                <span className="px-2 py-0.5 bg-[#d9f7f8] text-[#0a5961] rounded-full text-xs font-bold">
                  {activeAnnouncements.length}
                </span>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="min-h-[44px] px-[18px] rounded-[10px] bg-[#0e7c86] hover:bg-[#0a5961] text-white text-base font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
            >
              <Plus className="w-5 h-5 flex-shrink-0" />
              <span>Nueva actividad</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de Anuncios Especiales (Bloque 4) */}
      <AnnouncementsBanner
        announcements={activeAnnouncements}
        isAdmin={isAdmin}
        onOpenCreate={handleOpenCreateAnnouncement}
        onOpenManager={() => setIsAnnouncementsManagerOpen(true)}
        onOpenEdit={handleOpenEditAnnouncement}
      />

      {/* Tarjeta de Próxima Actividad congregacional (fondo #0a5961 sólido como en la maqueta) */}
      {upcomingEvent && (
        <section
          aria-label="Próxima actividad congregacional"
          className="on-magenta bg-[#0a5961] text-white rounded-[12px] p-5 grid gap-2.5"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold bg-white/[0.18] rounded-full px-3 py-1 w-fit">
            Próxima actividad congregacional · {getFriendlyRelativeTime(upcomingEvent.start_time)}
          </span>

          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[22px] font-bold text-white leading-snug">
              {upcomingEvent.title}
            </h2>
            <span className="text-xs font-semibold bg-white/[0.18] rounded-full px-2.5 py-1">
              {EVENT_TYPES_CONFIG[upcomingEvent.event_type]?.label || upcomingEvent.event_type}
            </span>
            {upcomingEvent.is_public === true && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#23d5da] text-[#1a1a1a] rounded-full px-2.5 py-1"
                title="Evento visible en la página pública de bienvenida"
              >
                <Globe className="w-3.5 h-3.5 text-[#1a1a1a] flex-shrink-0" aria-hidden="true" />
                <span>Público</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-sm text-white">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-5 h-5 text-white flex-shrink-0" />
              <span>{formatEventFriendlyDate(upcomingEvent.start_time)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-white flex-shrink-0" />
              <span>
                {formatEventTime(upcomingEvent.start_time)}
                {upcomingEvent.end_time && ` - ${formatEventTime(upcomingEvent.end_time)}`}
              </span>
            </span>
            {upcomingEvent.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-5 h-5 text-white flex-shrink-0" />
                <span>{upcomingEvent.location}</span>
              </span>
            )}
          </div>

          {upcomingEvent.description && (
            <p className="text-sm text-white/95 max-w-3xl">{upcomingEvent.description}</p>
          )}

          {/* Fila de confirmación de asistencia (RSVP) */}
          {(() => {
            const sum = summariesByEvent[upcomingEvent.id];
            const myRsvp = myRsvpsByEvent[upcomingEvent.id];
            const isFuture = isEventFuture(upcomingEvent.start_time);
            return (
              <div className="flex flex-wrap items-center gap-2">
                {sum && (sum.confirmed > 0 || sum.maybe > 0) ? (
                  <span className="text-xs font-semibold bg-white/[0.18] rounded-full px-2.5 py-1">
                    {sum.confirmed} {sum.confirmed === 1 ? 'confirmado' : 'confirmados'}
                    {sum.guests > 0
                      ? ` (${sum.guests} ${sum.guests === 1 ? 'invitado' : 'invitados'})`
                      : ''}
                  </span>
                ) : (
                  <span className="text-xs font-semibold bg-white/[0.18] rounded-full px-2.5 py-1">
                    Sin confirmaciones aún
                  </span>
                )}

                {isFuture &&
                  (myRsvp ? (
                    <button
                      type="button"
                      onClick={() => setRsvpModalEvent(upcomingEvent)}
                      className="min-h-[44px] px-[18px] rounded-[10px] bg-white text-[#0a5961] hover:bg-[#d9f7f8] text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                      title="Modificar tu confirmación"
                    >
                      <Check className="w-5 h-5 text-[#0a5961]" />
                      <span>
                        {myRsvp.status === 'asistire'
                          ? `Asistirás${myRsvp.guests > 0 ? ` (+${myRsvp.guests})` : ''}`
                          : myRsvp.status === 'quizas'
                          ? `Quizás${myRsvp.guests > 0 ? ` (+${myRsvp.guests})` : ''}`
                          : 'No asistirás'}{' '}
                        · Modificar
                      </span>
                    </button>
                  ) : isPersonLinked ? (
                    <button
                      type="button"
                      onClick={() => setRsvpModalEvent(upcomingEvent)}
                      className="min-h-[44px] px-[18px] rounded-[10px] bg-white text-[#0a5961] hover:bg-[#d9f7f8] text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                    >
                      <Check className="w-5 h-5 text-[#0a5961]" />
                      <span>Confirmar asistencia</span>
                    </button>
                  ) : (
                    <span
                      className="text-xs font-semibold bg-white/[0.18] rounded-full px-2.5 py-1"
                      title="Tu cuenta aún no está vinculada a tu ficha; pídele al administrador que la vincule"
                    >
                      Cuenta sin vincular para confirmar
                    </span>
                  ))}
              </div>
            );
          })()}

          {/* Fila inferior de botones de acción bien alineados */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setRsvpListEvent(upcomingEvent)}
                className="min-h-[44px] px-[18px] rounded-[10px] bg-transparent border border-white text-white hover:bg-white/15 text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                title="Ver lista de personas que han confirmado asistencia"
              >
                <Users className="w-5 h-5 text-white" />
                <span>Ver confirmados</span>
              </button>
            )}

            {canManageHeadcount && (
              <button
                type="button"
                onClick={() => setHeadcountEvent(upcomingEvent)}
                className="min-h-[44px] px-[18px] rounded-[10px] bg-transparent border border-white text-white hover:bg-white/15 text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                title="Conteo de Asistencia"
              >
                <span>
                  {headcountsByEvent[upcomingEvent.id]
                    ? `Conteo: ${headcountsByEvent[upcomingEvent.id].total_count}`
                    : 'Registrar conteo'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setAssignmentsEvent(upcomingEvent)}
              className="min-h-[44px] px-[18px] rounded-[10px] bg-white text-[#0a5961] hover:bg-[#d9f7f8] text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              title="Programa del Culto / Servidores de Turno"
            >
              <Users className="w-5 h-5 text-[#0a5961]" />
              <span>{isAdmin ? 'Gestionar Programa / Turnos' : 'Ver Servidores de Turno'}</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleOpenEdit(upcomingEvent)}
                className="min-h-[44px] px-[18px] rounded-[10px] bg-transparent border border-white text-white hover:bg-white/15 text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <Edit2 className="w-5 h-5 text-white" />
                <span>Editar</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Cuadrícula Mensual Interactiva (Calendar Grid View) */}
      <CalendarGridView
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        events={events}
        eventsByDate={eventsByDate}
        selectedDate={activeDateKey}
        onSelectDate={(dateKey) => setUserSelectedDateKey(dateKey)}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onGoToday={handleGoToday}
      />

      {/* Alerta de Error */}
      {(error || headcountError || rsvpError) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-rose-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error || headcountError || rsvpError}</span>
          </div>
          <button
            onClick={() => {
              if (error) clearError();
              if (headcountError) clearHeadcountError();
              if (rsvpError) clearRsvpError();
            }}
            className="text-rose-500 hover:text-rose-700 p-1"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Contenido de Eventos / Lista de Agenda */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-600 text-sm font-medium">Cargando actividades del calendario...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No hay actividades este mes</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            No se han registrado cultos o eventos para {MONTH_NAMES_ES[selectedMonth]} de {selectedYear}.
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Programar primera actividad</span>
            </button>
          )}
        </div>
      ) : activeDayEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              No hay actividades programadas para este día
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              No se han registrado actividades para el {formatDateKeyFriendly(activeDateKey)}.
            </p>
          </div>
          {isAdmin && (
            <div className="pt-1">
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[40px] touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                <span>Programar actividad en esta fecha</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Cabecera destacada de la fecha seleccionada (idéntica a .day-head en calendario.html) */}
          <section
            aria-label="Fecha seleccionada"
            className="bg-white border border-[#d4d7dc] rounded-[12px] p-4 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-[10px] bg-[#0e7c86] text-white flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {isTodayActive ? (
                  <span className="text-xs font-bold uppercase tracking-[0.05em] text-[#0a5961] bg-[#d9f7f8] px-2 py-0.5 rounded-[6px]">
                    Actividades de HOY
                  </span>
                ) : isFutureActive ? (
                  <span className="text-xs font-bold uppercase tracking-[0.05em] text-[#7a2f5a] bg-[#f6e6ef] px-2 py-0.5 rounded-[6px]">
                    Próxima fecha con actividad
                  </span>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-[0.05em] text-[#1a1a1a] bg-[#ebedef] px-2 py-0.5 rounded-[6px]">
                    Histórico / Fecha anterior
                  </span>
                )}
                <span className="px-2 py-0.5 bg-[#ebedef] text-[#1a1a1a] rounded-full text-xs font-bold">
                  {activeDayEvents.length}{' '}
                  {activeDayEvents.length === 1 ? 'actividad' : 'actividades'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a] mt-1">
                {isFutureActive && !isTodayActive
                  ? `Próxima fecha: ${formatDateKeyFriendly(activeDateKey)}`
                  : formatDateKeyFriendly(activeDateKey)}
              </h2>
            </div>
          </section>

          {/* Tarjetas de eventos de la fecha activa */}
          <div className="space-y-3">
            {activeDayEvents.map((event) => {
                    const typeConfig = EVENT_TYPES_CONFIG[event.event_type] || EVENT_TYPES_CONFIG.otro;
                    return (
                      <article
                        key={event.id}
                        className="bg-white border border-[#d4d7dc] rounded-[12px] p-4 grid gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-xs font-semibold border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${typeConfig.dotColor}`}></span>
                                {typeConfig.label}
                              </span>

                              {event.is_public === true && (
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-xs font-bold bg-[#23d5da] text-[#1a1a1a] border border-[#0e7c86]"
                                  title="Evento visible en la página pública de bienvenida"
                                >
                                  <Globe className="w-3.5 h-3.5 text-[#1a1a1a] flex-shrink-0" aria-hidden="true" />
                                  <span>Público</span>
                                </span>
                              )}
                            </div>

                            {/* Acciones de Admin */}
                            {isAdmin && (
                              <div className="flex items-center">
                                <button
                                  onClick={() => handleOpenEdit(event)}
                                  className="w-11 min-h-[44px] rounded-[10px] text-[#4a4f57] hover:bg-[#ebedef] hover:text-[#1a1a1a] inline-flex items-center justify-center transition-colors"
                                  title="Editar actividad"
                                  aria-label="Editar actividad"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setDeletingEvent(event)}
                                  className="w-11 min-h-[44px] rounded-[10px] text-[#4a4f57] hover:bg-[#fdecec] hover:text-[#9b1c1c] inline-flex items-center justify-center transition-colors"
                                  title="Archivar actividad"
                                  aria-label="Archivar actividad"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-[#1a1a1a]">
                            {event.title}
                          </h3>

                          {event.description && (
                            <p className="text-sm text-[#4a4f57] leading-relaxed whitespace-pre-line">
                              {event.description}
                            </p>
                          )}
                        </div>

                        {/* Programa de Culto y Servidores asignados */}
                        {(() => {
                          const evAssignments = assignmentsByEvent[event.id] || [];
                          return (
                            <div className="pt-3 border-t border-[#d4d7dc] grid gap-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-[#1a1a1a] inline-flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-[#0e7c86]" />
                                  <span>Programa del Culto / Servidores de Turno</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setAssignmentsEvent(event)}
                                  className="text-xs font-semibold min-h-[44px] px-3 rounded-[10px] border border-[#767b83] bg-white hover:bg-[#ebedef] text-[#1a1a1a] inline-flex items-center gap-1.5 transition-colors"
                                >
                                  <Users className="w-4 h-4 text-[#0e7c86]" />
                                  <span>{isAdmin ? 'Gestionar Programa / Turnos' : 'Ver Servidores de Turno'}</span>
                                </button>
                              </div>

                              {evAssignments.length === 0 ? (
                                <p className="text-xs text-[#4a4f57]">
                                  Aún no se han asignado servidores para esta reunión.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {evAssignments.map((asgn) => {
                                    const rConfig = CHURCH_ROLES_CONFIG[asgn.role_type];
                                    const personName = asgn.person
                                      ? `${asgn.person.first_name} ${asgn.person.last_name}`
                                      : 'Servidor';
                                    return (
                                      <span
                                        key={asgn.id}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border ${rConfig.badgeBg} ${rConfig.badgeText} ${rConfig.badgeBorder}`}
                                        title={asgn.notes ? `${rConfig.label}: ${personName} (${asgn.notes})` : `${rConfig.label}: ${personName}`}
                                      >
                                        {getRoleIcon(asgn.role_type, 'w-3 h-3')}
                                        <span className="font-semibold">{rConfig.shortLabel}:</span>
                                        <span className="truncate max-w-[120px]">{personName}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Bloque de Confirmación Previa de Asistencia (RSVP) */}
                        {(() => {
                          const rsvpSummary = summariesByEvent[event.id];
                          const userRsvp = myRsvpsByEvent[event.id];
                          const isFuture = isEventFuture(event.start_time);

                          return (
                            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                {/* Resumen público para todos los miembros */}
                                <div className="flex items-center gap-1.5">
                                  <CalendarCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  <span className="text-xs font-bold text-slate-700">Confirmación previa:</span>
                                  {rsvpSummary && (rsvpSummary.confirmed > 0 || rsvpSummary.maybe > 0) ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                      <span>
                                        {rsvpSummary.confirmed} {rsvpSummary.confirmed === 1 ? 'confirmado' : 'confirmados'}
                                      </span>
                                      {rsvpSummary.guests > 0 && (
                                        <span className="text-blue-600 font-semibold">
                                          ({rsvpSummary.guests} {rsvpSummary.guests === 1 ? 'invitado' : 'invitados'})
                                        </span>
                                      )}
                                      {rsvpSummary.maybe > 0 && (
                                        <span className="text-amber-700 font-normal text-[11px] ml-0.5">
                                          · {rsvpSummary.maybe} quizás
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">Sin confirmaciones aún</span>
                                  )}
                                </div>

                                {/* Acción de confirmar asistencia para miembros en eventos futuros */}
                                {isFuture ? (
                                  <div>
                                    {userRsvp ? (
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                                            userRsvp.status === 'asistire'
                                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                              : userRsvp.status === 'quizas'
                                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                                              : 'bg-slate-100 text-slate-700 border-slate-300'
                                          }`}
                                        >
                                          {userRsvp.status === 'asistire' && (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          )}
                                          {userRsvp.status === 'quizas' && (
                                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                                          )}
                                          {userRsvp.status === 'no_asistire' && (
                                            <XCircle className="w-3.5 h-3.5 text-slate-500" />
                                          )}
                                          <span>
                                            {userRsvp.status === 'asistire'
                                              ? `Asistirás${userRsvp.guests > 0 ? ` (+${userRsvp.guests})` : ''}`
                                              : userRsvp.status === 'quizas'
                                              ? `Quizás${userRsvp.guests > 0 ? ` (+${userRsvp.guests})` : ''}`
                                              : 'No asistirás'}
                                          </span>
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() => setRsvpModalEvent(event)}
                                          className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 transition-colors min-h-[32px]"
                                          title="Modificar o cancelar tu respuesta"
                                        >
                                          Modificar
                                        </button>
                                      </div>
                                    ) : isPersonLinked ? (
                                      <button
                                        type="button"
                                        onClick={() => setRsvpModalEvent(event)}
                                        className="text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-600 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors inline-flex items-center gap-1.5 min-h-[36px] shadow-sm"
                                      >
                                        <CalendarCheck className="w-3.5 h-3.5 text-white" />
                                        <span>Confirmar asistencia</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled
                                        className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed inline-flex items-center gap-1.5 min-h-[36px]"
                                        title="Tu cuenta aún no está vinculada a tu ficha; pídele al administrador que la vincule"
                                      >
                                        <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Confirmar asistencia</span>
                                      </button>
                                    )}
                                  </div>
                                ) : null}
                              </div>

                              {/* Aviso amigable si el usuario no tiene ficha vinculada */}
                              {isFuture && !isPersonLinked && (
                                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] sm:text-xs flex items-center gap-2">
                                  <Info className="w-4 h-4 flex-shrink-0 text-amber-600" />
                                  <span>
                                    Tu cuenta aún no está vinculada a tu ficha; pídele al administrador que la vincule.
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Bloque de Conteo de Asistencia Congregacional (Admin y Tesorero) */}
                        {canManageHeadcount && (
                          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-bold text-slate-700">Asistencia del Culto:</span>
                              {headcountsByEvent[event.id] ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <span>{headcountsByEvent[event.id].total_count} personas</span>
                                  <span className="text-[10px] font-normal text-emerald-600">
                                    ({headcountsByEvent[event.id].adults_count} ad · {headcountsByEvent[event.id].children_count} niñ · {headcountsByEvent[event.id].visitors_count} vis)
                                  </span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Sin registrar</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              {/* Botón Ver Confirmados (Solo Admin) */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setRsvpListEvent(event)}
                                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
                                  title="Ver lista de personas que han confirmado asistencia"
                                >
                                  <Users className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Ver confirmados</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setHeadcountEvent(event)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors inline-flex items-center gap-1.5 min-h-[36px] ${
                                  headcountsByEvent[event.id]
                                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                    : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400'
                                }`}
                              >
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{headcountsByEvent[event.id] ? 'Editar conteo' : 'Registrar conteo'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Pie de la tarjeta con hora y ubicación */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>
                              {formatEventTime(event.start_time)}
                              {event.end_time && ` - ${formatEventTime(event.end_time)}`}
                            </span>
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="truncate max-w-[200px]" title={event.location}>
                                {event.location}
                              </span>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

      {/* MODAL DE CREACIÓN / EDICIÓN DE ACTIVIDAD (Solo Admin) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingEvent ? 'Editar Actividad' : 'Nueva Actividad Congregacional'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título de la actividad *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Culto Dominical de Adoración"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Tipo de Evento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de actividad *
                </label>
                <select
                  value={formData.event_type}
                  onChange={(e) =>
                    setFormData({ ...formData, event_type: e.target.value as ChurchEventType })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  <option value="culto">Culto General</option>
                  <option value="oracion">Reunión de Oración / Vigilia</option>
                  <option value="jovenes">Jóvenes / Adolescentes</option>
                  <option value="especial">Evento Especial (Aniversario / Conferencia)</option>
                  <option value="venta_verbena">Actividad Pro-fondos (Venta / Verbena)</option>
                  <option value="otro">Otra Actividad</option>
                </select>
              </div>

              {/* Fecha y Hora Inicio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fecha de inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hora de inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time_val}
                    onChange={(e) => setFormData({ ...formData, start_time_val: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Fecha y Hora Fin (Opcional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fecha de finalización (opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hora de fin (opcional)
                  </label>
                  <input
                    type="time"
                    value={formData.end_time_val || ''}
                    onChange={(e) => setFormData({ ...formData, end_time_val: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lugar / Ubicación
                </label>
                <input
                  type="text"
                  placeholder="Ej: Salón Principal, Calle ..., Zoom"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Detalles o notas para la congregación
                </label>
                <textarea
                  rows={3}
                  placeholder="Información adicional, vestimenta, traer plato para compartir, etc."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"
                />
              </div>

              {/* Casilla de Evento Público (exclusivo Admin) */}
              <div
                className={`rounded-xl border p-3.5 transition-colors ${
                  formData.is_public
                    ? 'bg-[#d9f7f8]/60 border-[#0e7c86]'
                    : 'bg-[#f5f5f5] border-[#d4d7dc]'
                }`}
              >
                <label
                  htmlFor="event_is_public"
                  className="min-h-[44px] flex items-center gap-3 cursor-pointer select-none"
                >
                  <input
                    id="event_is_public"
                    type="checkbox"
                    checked={Boolean(formData.is_public)}
                    onChange={(e) =>
                      setFormData({ ...formData, is_public: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-[#767b83] text-[#0e7c86] focus:ring-2 focus:ring-[#0e7c86] flex-shrink-0 cursor-pointer accent-[#0e7c86]"
                  />
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1a1a1a]">
                    <Globe className="w-4 h-4 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
                    <span>Evento público (visible en la página de bienvenida)</span>
                  </span>
                </label>
                <p className="mt-1 pl-8 text-xs text-[#4a4f57] leading-relaxed">
                  Se mostrará a cualquier persona sin iniciar sesión: solo título, fecha, hora y lugar. Nunca se muestran descripciones internas, turnos, conteos ni confirmaciones.
                </p>
              </div>

              {/* Botones de acción del Modal */}
              <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : null}
                  <span>{editingEvent ? 'Guardar Cambios' : 'Publicar Actividad'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ARCHIVADO (Soft-Delete) */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">¿Archivar esta actividad?</h3>
            </div>
            <p className="text-sm text-slate-600">
              La actividad <strong>"{deletingEvent.title}"</strong> dejará de mostrarse en el calendario de la congregación.
            </p>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-800 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>Esta acción respeta el registro histórico eclesial mediante archivado seguro.</span>
            </div>
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px]"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : null}
                <span>Sí, archivar actividad</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PROGRAMA DE CULTO Y TURNOS DE SERVIDORES */}
      {assignmentsEvent && (
        <EventAssignmentsModal
          event={assignmentsEvent}
          isAdmin={isAdmin}
          isOpen={!!assignmentsEvent}
          onClose={() => setAssignmentsEvent(null)}
          onAssignmentsUpdated={() => refetchBatch()}
        />
      )}

      {/* MODAL DE CONTEO DE ASISTENCIA CONGREGACIONAL (Admin y Tesorero) */}
      {headcountEvent && (
        <EventHeadcountModal
          event={headcountEvent}
          currentHeadcount={headcountsByEvent[headcountEvent.id]}
          isOpen={!!headcountEvent}
          onClose={() => setHeadcountEvent(null)}
          onSave={upsertHeadcount}
          onDelete={deleteHeadcount}
          actionLoading={headcountActionLoading}
        />
      )}

      {/* MODAL DE RESUMEN DE ASISTENCIA / MÉTRICAS MENSUALES (Admin y Tesorero) */}
      {isMetricsOpen && (
        <HeadcountMetricsModal
          isOpen={isMetricsOpen}
          onClose={() => setIsMetricsOpen(false)}
          summary={monthSummary}
          events={events}
          headcountsByEvent={headcountsByEvent}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onSelectMonthYear={(m, y) => {
            setSelectedMonth(m);
            setSelectedYear(y);
            setUserSelectedDateKey(null);
          }}
        />
      )}

      {/* MODAL DE CREACIÓN / EDICIÓN DE ANUNCIOS ESPECIALES (Admin) */}
      <AnnouncementModal
        isOpen={isAnnouncementFormOpen}
        onClose={() => setIsAnnouncementFormOpen(false)}
        onSave={handleSaveAnnouncement}
        announcementToEdit={editingAnnouncement}
        isLoading={announcementsActionLoading}
      />

      {/* MODAL DE GESTIÓN Y LISTADO DE AVISOS (Admin) */}
      {isAdmin && (
        <AnnouncementsManagerModal
          isOpen={isAnnouncementsManagerOpen}
          onClose={() => setIsAnnouncementsManagerOpen(false)}
          announcements={allAnnouncements}
          onOpenCreate={handleOpenCreateAnnouncement}
          onOpenEdit={handleOpenEditAnnouncement}
          onToggleActive={toggleAnnouncementActive}
          onDelete={deleteAnnouncement}
          isLoading={announcementsActionLoading}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE ASISTENCIA INDIVIDUAL (RSVP - Miembros / Alumnos) */}
      {rsvpModalEvent && (
        <EventRSVPModal
          event={rsvpModalEvent}
          currentRSVP={myRsvpsByEvent[rsvpModalEvent.id]}
          personName={personName}
          isOpen={!!rsvpModalEvent}
          onClose={() => setRsvpModalEvent(null)}
          onSave={upsertRSVP}
          onDelete={deleteRSVP}
          actionLoading={rsvpActionLoading}
        />
      )}

      {/* MODAL DE LISTA DE ASISTENTES CONFIRMADOS (RSVP - Solo Admin) */}
      {rsvpListEvent && (
        <EventRSVPListModal
          event={rsvpListEvent}
          isOpen={!!rsvpListEvent}
          onClose={() => setRsvpListEvent(null)}
        />
      )}
    </div>
  );
};
export default CalendarioView;
