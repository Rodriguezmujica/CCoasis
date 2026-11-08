import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CalendarX2,
  Megaphone,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  UserPlus,
  CalendarCheck,
  HelpCircle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardEmptyState } from './DashboardEmptyState';
import { DashboardErrorState } from './DashboardErrorState';
import {
  AdminUnassignedEventItem,
  AdminExpiringAnnouncementItem,
  AdminNextEventRSVPsItem,
} from '../../lib/useInicioDashboard';
import { EVENT_TYPES_CONFIG } from '../../types/events';
import { formatEventFriendlyDate, formatEventTime } from '../../lib/useEvents';
import { formatAnnouncementDateTime } from '../../lib/useAnnouncements';

export interface InicioAdminSectionProps {
  unassignedEventsState: {
    events: AdminUnassignedEventItem[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
  expiringAnnouncementsState: {
    announcements: AdminExpiringAnnouncementItem[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
  nextEventRSVPsState: {
    data: AdminNextEventRSVPsItem | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
}

export const InicioAdminSection: React.FC<InicioAdminSectionProps> = ({
  unassignedEventsState,
  expiringAnnouncementsState,
  nextEventRSVPsState,
}) => {
  const {
    events: unassignedEvents,
    isLoading: isLoadingUnassigned,
    error: errorUnassigned,
    refetch: refetchUnassigned,
  } = unassignedEventsState;

  const {
    announcements: expiringAnnouncements,
    isLoading: isLoadingExpiring,
    error: errorExpiring,
    refetch: refetchExpiring,
  } = expiringAnnouncementsState;

  const {
    data: nextEventRSVPs,
    isLoading: isLoadingRSVPs,
    error: errorRSVPs,
    refetch: refetchRSVPs,
  } = nextEventRSVPsState;

  return (
    <section aria-labelledby="seccion-admin-title" className="space-y-4 pt-2">
      {/* Cabecera de la Sección Administración */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#d4d7dc]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[8px] bg-[#0e7c86] text-white flex items-center justify-center flex-shrink-0 shadow-2xs"
            aria-hidden="true"
          >
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2
              id="seccion-admin-title"
              className="text-lg sm:text-xl font-extrabold text-[#1a1a1a] tracking-tight"
            >
              Administración
            </h2>
            <p className="text-xs text-[#4a4f57]">
              Pendientes de la semana: eventos sin servidores, avisos por caducar y asistencia esperada
            </p>
          </div>
        </div>

        <Link
          to="/calendario"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px] transition-colors"
          aria-label="Ir al módulo Calendario"
        >
          <span>Ir a Calendario</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Tarjeta 1: Eventos futuros sin turnos asignados */}
      <DashboardCard
        icon={<CalendarX2 className="w-5 h-5 text-[#0e7c86]" />}
        title="Eventos futuros sin turnos asignados"
        subtitle="Próximas actividades que aún no tienen servidores programados"
        action={{ label: 'Ver todo', to: '/calendario' }}
        badge={
          unassignedEvents.length > 0 ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fdecec] text-[#9b1c1c] border border-[#9b1c1c]/20">
              {unassignedEvents.length}{' '}
              {unassignedEvents.length === 1 ? 'sin turnos' : 'sin turnos'}
            </span>
          ) : undefined
        }
      >
        {isLoadingUnassigned ? (
          <DashboardSkeleton lines={3} hasHeader={false} className="border-none p-0" />
        ) : errorUnassigned ? (
          <DashboardErrorState
            title="No se pudieron cargar los eventos sin turnos"
            message={errorUnassigned}
            onRetry={refetchUnassigned}
          />
        ) : unassignedEvents.length === 0 ? (
          <DashboardEmptyState
            compact
            icon={<CheckCircle2 className="w-5 h-5 text-[#0e7c86]" />}
            title="Todos los eventos con turnos"
            description="No hay actividades futuras pendientes de asignar servidores en el calendario."
            action={{ label: 'Ir al calendario', to: '/calendario' }}
          />
        ) : (
          <div className="space-y-3">
            {unassignedEvents.map((ev) => {
              const typeCfg = EVENT_TYPES_CONFIG[ev.eventType] || EVENT_TYPES_CONFIG.otro;
              return (
                <div
                  key={ev.id}
                  className="p-3.5 sm:p-4 rounded-[10px] bg-white border border-[#d4d7dc] hover:border-[#0e7c86]/40 transition-colors shadow-2xs space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeCfg.badgeBg} ${typeCfg.badgeText} ${typeCfg.badgeBorder}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${typeCfg.dotColor}`}
                        aria-hidden="true"
                      />
                      <span>{typeCfg.label}</span>
                    </span>

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fdecec] text-[#9b1c1c] border border-[#9b1c1c]/20">
                      0 servidores asignados
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#1a1a1a] leading-snug">
                      {ev.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#ebedef]">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#4a4f57]">
                      <div className="flex items-center gap-1.5 text-[#1a1a1a] font-semibold">
                        <Calendar
                          className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>{formatEventFriendlyDate(ev.startTime)}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock
                          className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          {formatEventTime(ev.startTime)}
                          {ev.endTime ? ` - ${formatEventTime(ev.endTime)}` : ''}
                        </span>
                      </div>

                      {ev.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin
                            className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate max-w-[180px]">{ev.location}</span>
                        </div>
                      )}
                    </div>

                    <Link
                      to="/calendario"
                      className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-1.5 rounded-[8px] bg-[#0e7c86] hover:bg-[#0a5961] text-white text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0e7c86]"
                      aria-label={`Asignar turnos para el evento ${ev.title}`}
                    >
                      <span>Asignar turnos</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })}

            <div className="pt-1 text-center sm:text-right">
              <Link
                to="/calendario"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px]"
              >
                <span>Ver todos los eventos y turnos en el calendario &rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Tarjeta 2: Avisos que caducan en 7 días */}
      <DashboardCard
        icon={<Megaphone className="w-5 h-5 text-[#0e7c86]" />}
        title="Avisos que caducan en 7 días"
        subtitle="Anuncios activos cuya fecha de vigencia termina esta semana"
        action={{ label: 'Ver todo', to: '/calendario' }}
        badge={
          expiringAnnouncements.length > 0 ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fdf3d6] text-[#713f12] border border-[#a8741a]/30">
              {expiringAnnouncements.length}{' '}
              {expiringAnnouncements.length === 1 ? 'por caducar' : 'por caducar'}
            </span>
          ) : undefined
        }
      >
        {isLoadingExpiring ? (
          <DashboardSkeleton lines={3} hasHeader={false} className="border-none p-0" />
        ) : errorExpiring ? (
          <DashboardErrorState
            title="No se pudieron cargar los avisos por caducar"
            message={errorExpiring}
            onRetry={refetchExpiring}
          />
        ) : expiringAnnouncements.length === 0 ? (
          <DashboardEmptyState
            icon={<Megaphone className="w-5 h-5 text-[#4a4f57]" />}
            title="Sin avisos próximos a caducar"
            description="No hay anuncios activos que venzan dentro de los próximos 7 días."
            action={{ label: 'Gestionar avisos en Calendario', to: '/calendario' }}
          />
        ) : (
          <div className="space-y-3">
            {expiringAnnouncements.map((item) => {
              const isUrgent = item.priority === 'urgente';
              const isImportant = item.priority === 'importante';

              const diffMs = new Date(item.expiresAt).getTime() - Date.now();
              const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
              const daysLabel =
                diffDays <= 1 ? 'Caduca en menos de 24 h' : `Caduca en ${diffDays} días`;

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-[10px] bg-white border border-[#d4d7dc] hover:border-[#0e7c86]/40 transition-colors shadow-2xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isUrgent
                          ? 'bg-[#fdecec] text-[#9b1c1c] border-[#c0392b]/40'
                          : isImportant
                          ? 'bg-[#fdf3d6] text-[#713f12] border-[#a8741a]/40'
                          : 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]/30'
                      }`}
                    >
                      {isUrgent
                        ? 'Urgente'
                        : isImportant
                        ? 'Importante'
                        : 'General'}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#713f12] bg-[#fdf3d6] px-2.5 py-0.5 rounded-full border border-[#a8741a]/30">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>{daysLabel}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#1a1a1a] leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#4a4f57] line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#ebedef]">
                    <span className="text-xs text-[#4a4f57] font-medium">
                      Vence: {formatAnnouncementDateTime(item.expiresAt)}
                    </span>

                    <Link
                      to="/calendario"
                      className="inline-flex items-center justify-center min-h-[44px] px-3 py-1.5 rounded-[8px] bg-[#f5f5f5] hover:bg-[#ebedef] border border-[#d4d7dc] text-xs font-semibold text-[#1a1a1a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0e7c86]"
                      aria-label={`Gestionar aviso ${item.title} en Calendario`}
                    >
                      <span>Gestionar aviso</span>
                    </Link>
                  </div>
                </div>
              );
            })}

            <div className="pt-1 text-center sm:text-right">
              <Link
                to="/calendario"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px]"
              >
                <span>Ver y administrar todos los avisos en Calendario &rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Tarjeta 3: Confirmaciones del próximo culto/evento */}
      <DashboardCard
        icon={<Users className="w-5 h-5 text-[#0e7c86]" />}
        title="Confirmaciones del próximo culto"
        subtitle="Resumen de miembros e invitados confirmados (RSVP) para la próxima actividad"
        action={{ label: 'Ver todo', to: '/calendario' }}
      >
        {isLoadingRSVPs ? (
          <DashboardSkeleton lines={2} hasHeader={false} className="border-none p-0" />
        ) : errorRSVPs ? (
          <DashboardErrorState
            title="No se pudieron cargar las confirmaciones del próximo evento"
            message={errorRSVPs}
            onRetry={refetchRSVPs}
          />
        ) : !nextEventRSVPs ? (
          <DashboardEmptyState
            icon={<Users className="w-5 h-5 text-[#4a4f57]" />}
            title="Sin eventos próximos programados"
            description="No hay ningún culto o actividad futura en el calendario para consultar confirmaciones."
            action={{ label: 'Ir al calendario', to: '/calendario' }}
          />
        ) : (
          <div className="space-y-4">
            {/* Datos del evento al que corresponden las confirmaciones */}
            {(() => {
              const { event, summary, notAttendingCount } = nextEventRSVPs;
              const typeCfg = EVENT_TYPES_CONFIG[event.eventType] || EVENT_TYPES_CONFIG.otro;
              const totalExpected = summary.confirmed + summary.guests;

              return (
                <>
                  <div className="p-3.5 rounded-[10px] bg-[#f5f5f5] border border-[#d4d7dc] flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeCfg.badgeBg} ${typeCfg.badgeText} ${typeCfg.badgeBorder}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${typeCfg.dotColor}`}
                            aria-hidden="true"
                          />
                          <span>{typeCfg.label}</span>
                        </span>
                        <span className="text-xs font-semibold text-[#1a1a1a]">
                          {formatEventFriendlyDate(event.startTime)} ·{' '}
                          {formatEventTime(event.startTime)}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#1a1a1a] truncate">
                        {event.title}
                      </h3>
                    </div>

                    <Link
                      to="/calendario"
                      className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-2 rounded-[10px] bg-[#0e7c86] hover:bg-[#0a5961] text-white text-xs font-bold transition-colors gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0e7c86]"
                      aria-label={`Ver lista de confirmados de ${event.title} en Calendario`}
                    >
                      <span>Ver en Calendario</span>
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>

                  {/* Cuadrícula de métricas RSVP */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-white p-3.5 rounded-[10px] border border-[#d4d7dc] shadow-2xs">
                      <div className="flex items-center justify-between text-[#14532d] mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Confirmados
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-[#14532d]" aria-hidden="true" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#1a1a1a]">
                        {summary.confirmed}
                      </div>
                      <div className="text-xs text-[#4a4f57]">miembros asistirán</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-[10px] border border-[#d4d7dc] shadow-2xs">
                      <div className="flex items-center justify-between text-[#0a5961] mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Invitados
                        </span>
                        <UserPlus className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#1a1a1a]">
                        {summary.guests}
                      </div>
                      <div className="text-xs text-[#4a4f57]">acompañantes</div>
                    </div>

                    <div className="bg-[#d9f7f8]/60 p-3.5 rounded-[10px] border border-[#0e7c86]/40 shadow-2xs">
                      <div className="flex items-center justify-between text-[#0a5961] mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Total Esperado
                        </span>
                        <CalendarCheck className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#0a5961]">
                        {totalExpected}
                      </div>
                      <div className="text-xs text-[#0a5961] font-semibold">
                        personas en total
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-[10px] border border-[#d4d7dc] shadow-2xs">
                      <div className="flex items-center justify-between text-[#713f12] mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Quizás / No
                        </span>
                        <HelpCircle className="w-4 h-4 text-[#a8741a]" aria-hidden="true" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#1a1a1a]">
                        {summary.maybe}{' '}
                        <span className="text-sm font-semibold text-[#4a4f57]">
                          / {notAttendingCount}
                        </span>
                      </div>
                      <div className="text-xs text-[#4a4f57]">en duda / no asisten</div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </DashboardCard>
    </section>
  );
};
