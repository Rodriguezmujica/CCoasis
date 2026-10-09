import React, { useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Sparkles,
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

export const CalendarioView: React.FC = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const isTesorero = roles.includes('tesorero');
  const canManageHeadcount = isAdmin || isTesorero;

  // Control de fecha seleccionada (año y mes)
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());

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
  });

  // Navegación de mes anterior / siguiente
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  // Abrir modal de creación
  const handleOpenCreate = () => {
    // Si estamos en un mes futuro, sugerir el primer día de ese mes o hoy si es el mes actual
    const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();
    const defaultDate = isCurrentMonth 
      ? toLocalDateString(today.toISOString())
      : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;

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

  // Array ordenado de fechas de eventos en este mes
  const sortedDates = Object.keys(eventsByDate).sort();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Calendario Eclesial</h1>
              <p className="text-sm text-slate-500">
                Cultos, reuniones de oración, eventos y actividades de la congregación
              </p>
            </div>
          </div>
        </div>

        {/* Botones de Acción (Admin / Tesorero) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {canManageHeadcount && (
            <button
              onClick={() => setIsMetricsOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-800 rounded-xl font-semibold shadow-sm hover:shadow transition-all text-sm min-h-[48px]"
              title="Ver resumen y métricas de asistencias del mes"
            >
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Resumen de Asistencia</span>
              {monthSummary.totalEventsWithAttendance > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                  {monthSummary.averageAttendance} prom.
                </span>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsAnnouncementsManagerOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-800 rounded-xl font-semibold shadow-sm hover:shadow transition-all text-sm min-h-[48px]"
              title="Administrar tablón parroquial de avisos"
            >
              <Megaphone className="w-4 h-4 text-blue-600" />
              <span>Avisos</span>
              {activeAnnouncements.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                  {activeAnnouncements.length}
                </span>
              )}
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold shadow-sm hover:shadow transition-all text-base min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva actividad</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner / Tablón de Avisos y Anuncios Generales (Bloque 4) */}
      <AnnouncementsBanner
        announcements={activeAnnouncements}
        isAdmin={isAdmin}
        onOpenCreate={handleOpenCreateAnnouncement}
        onOpenManager={() => setIsAnnouncementsManagerOpen(true)}
        onOpenEdit={handleOpenEditAnnouncement}
      />

      {/* Banner de Próxima Actividad destacada */}
      {upcomingEvent && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 pointer-events-none">
            <CalendarDays className="w-48 h-48" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Próxima actividad congregacional</span>
                <span className="mx-1">•</span>
                <span className="font-bold text-amber-200">
                  {getFriendlyRelativeTime(upcomingEvent.start_time)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {upcomingEvent.title}
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/25 font-medium">
                  {EVENT_TYPES_CONFIG[upcomingEvent.event_type]?.label || upcomingEvent.event_type}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-blue-100">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-white" />
                  <span>{formatEventFriendlyDate(upcomingEvent.start_time)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-white" />
                  <span>
                    {formatEventTime(upcomingEvent.start_time)}
                    {upcomingEvent.end_time && ` - ${formatEventTime(upcomingEvent.end_time)}`}
                  </span>
                </div>
                {upcomingEvent.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-white" />
                    <span>{upcomingEvent.location}</span>
                  </div>
                )}
              </div>

              {upcomingEvent.description && (
                <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl pt-1">
                  {upcomingEvent.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto pt-2 md:pt-0">
              {canManageHeadcount && (
                <button
                  onClick={() => setHeadcountEvent(upcomingEvent)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 active:bg-white/40 text-white text-xs font-bold backdrop-blur-sm shadow-sm transition-colors flex items-center gap-1.5 min-h-[40px]"
                  title="Conteo de Asistencia"
                >
                  <UserCheck className="w-4 h-4 text-emerald-300" />
                  <span>
                    {headcountsByEvent[upcomingEvent.id]
                      ? `Asistencia: ${headcountsByEvent[upcomingEvent.id].total_count}`
                      : 'Registrar Asistencia'}
                  </span>
                </button>
              )}

              <button
                onClick={() => setAssignmentsEvent(upcomingEvent)}
                className="px-3.5 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 active:bg-blue-100 text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 min-h-[40px]"
                title="Programa del Culto / Servidores de Turno"
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>{isAdmin ? 'Gestionar Programa / Turnos' : 'Ver Servidores de Turno'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => handleOpenEdit(upcomingEvent)}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selector de Mes y Año con navegación móvil amigable */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 transition-colors"
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="px-2 sm:px-3">
            <span className="text-lg sm:text-xl font-bold text-slate-900 block leading-tight">
              {MONTH_NAMES_ES[selectedMonth]} {selectedYear}
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              {events.length} {events.length === 1 ? 'actividad programada' : 'actividades programadas'}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 transition-colors"
            title="Mes siguiente"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleGoToday}
          className="px-3 py-2 text-xs sm:text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-xl transition-colors min-h-[40px]"
        >
          Ir a hoy
        </button>
      </div>

      {/* Alerta de Error */}
      {(error || headcountError) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-rose-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error || headcountError}</span>
          </div>
          <button
            onClick={() => {
              if (error) clearError();
              if (headcountError) clearHeadcountError();
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
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const dayEvents = eventsByDate[dateKey];
            const isToday = toLocalDateString(today.toISOString()) === dateKey;

            return (
              <div key={dateKey} className="space-y-3">
                {/* Cabecera del día */}
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{formatEventFriendlyDate(dayEvents[0].start_time)}</span>
                    {isToday && (
                      <span className="text-[10px] bg-white text-blue-700 px-1.5 py-0.2 rounded font-extrabold">
                        HOY
                      </span>
                    )}
                  </div>
                  <div className="h-[1px] bg-slate-200 flex-1"></div>
                </div>

                {/* Tarjetas de eventos de ese día */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dayEvents.map((event) => {
                    const typeConfig = EVENT_TYPES_CONFIG[event.event_type] || EVENT_TYPES_CONFIG.otro;
                    return (
                      <div
                        key={event.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${typeConfig.dotColor}`}></span>
                              {typeConfig.label}
                            </span>

                            {/* Acciones de Admin */}
                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEdit(event)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar actividad"
                                  aria-label="Editar actividad"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeletingEvent(event)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Archivar actividad"
                                  aria-label="Archivar actividad"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 leading-snug">
                            {event.title}
                          </h3>

                          {event.description && (
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                              {event.description}
                            </p>
                          )}
                        </div>

                        {/* Programa de Culto y Servidores asignados */}
                        {(() => {
                          const evAssignments = assignmentsByEvent[event.id] || [];
                          return (
                            <div className="pt-3 border-t border-slate-100 space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Programa del Culto / Servidores de Turno</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setAssignmentsEvent(event)}
                                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 inline-flex items-center gap-1.5 transition-colors min-h-[36px]"
                                >
                                  <Users className="w-3.5 h-3.5 text-blue-600" />
                                  <span>{isAdmin ? 'Gestionar Programa / Turnos' : 'Ver Servidores de Turno'}</span>
                                </button>
                              </div>

                              {evAssignments.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">
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

                        {/* Bloque de Conteo de Asistencia Congregacional (Admin y Tesorero) */}
                        {canManageHeadcount && (
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
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
                              <span>{headcountsByEvent[event.id] ? 'Editar Conteo' : 'Registrar Asistencia'}</span>
                            </button>
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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
        />
      )}

      {/* MODAL DE CREACIÓN / EDICIÓN DE AVISOS PARROQUIALES (Admin) */}
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
    </div>
  );
};
export default CalendarioView;
