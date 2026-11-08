import React, { useState, useMemo } from 'react';
import { useEvents, formatEventFriendlyDate, formatEventTime, getFriendlyRelativeTime } from '../../lib/useEvents';
import { useEventRSVPs } from '../../lib/useEventRSVPs';
import { EventRSVPModal } from '../calendario/EventRSVPModal';
import { DashboardCard } from './DashboardCard';
import { DashboardEmptyState } from './DashboardEmptyState';
import { DashboardErrorState } from './DashboardErrorState';
import { DashboardSkeleton } from './DashboardSkeleton';
import { EVENT_TYPES_CONFIG } from '../../types/events';
import { RSVP_STATUS_CONFIG } from '../../types/rsvps';
import {
  CalendarDays,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  CalendarCheck,
  UserCheck,
} from 'lucide-react';

export const InicioNextEventCard: React.FC = () => {
  const [isRSVPModalOpen, setIsRSVPModalOpen] = useState(false);

  // Fecha de referencia actual para cargar eventos
  const today = useMemo(() => new Date(), []);
  const {
    upcomingEvent,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useEvents(today.getFullYear(), today.getMonth());

  // Preparar array memoizado para useEventRSVPs
  const eventsForRSVP = useMemo(
    () => (upcomingEvent ? [upcomingEvent] : []),
    [upcomingEvent?.id, upcomingEvent?.start_time]
  );

  const {
    myRsvpsByEvent,
    summariesByEvent,
    isPersonLinked,
    personName,
    actionLoading: rsvpActionLoading,
    upsertRSVP,
    deleteRSVP,
  } = useEventRSVPs(eventsForRSVP);

  // 1. Estado de carga
  if (eventsLoading) {
    return (
      <DashboardCard
        icon={<CalendarDays className="w-5 h-5 text-[#0e7c86]" />}
        title="Próxima actividad"
        action={{ label: 'Ver calendario', to: '/calendario' }}
      >
        <DashboardSkeleton lines={2} hasHeader={false} className="border-none p-0" />
      </DashboardCard>
    );
  }

  // 2. Estado de error (NUNCA mostrar vacío ante un fallo de red o permisos)
  if (eventsError) {
    return (
      <DashboardCard
        icon={<CalendarDays className="w-5 h-5 text-[#0e7c86]" />}
        title="Próxima actividad"
        action={{ label: 'Ver calendario', to: '/calendario' }}
      >
        <DashboardErrorState
          title="No se pudo cargar el próximo evento"
          message={eventsError}
          onRetry={refetchEvents}
        />
      </DashboardCard>
    );
  }

  // 3. Estado vacío amable si no hay eventos futuros
  if (!upcomingEvent) {
    return (
      <DashboardCard
        icon={<CalendarDays className="w-5 h-5 text-[#0e7c86]" />}
        title="Próxima actividad"
        action={{ label: 'Ver calendario', to: '/calendario' }}
      >
        <DashboardEmptyState
          icon={<CalendarDays className="w-5 h-5 text-[#4a4f57]" />}
          title="Sin actividades próximas"
          description="No hay cultos o eventos programados próximamente en el calendario."
          action={{ label: 'Ir al calendario', to: '/calendario' }}
        />
      </DashboardCard>
    );
  }

  // 4. Datos del próximo evento
  const myRsvp = myRsvpsByEvent[upcomingEvent.id];
  const summary = summariesByEvent[upcomingEvent.id] || { confirmed: 0, maybe: 0, guests: 0 };
  const totalConfirmed = summary.confirmed + summary.guests;
  const typeConfig = EVENT_TYPES_CONFIG[upcomingEvent.event_type] || EVENT_TYPES_CONFIG.otro;
  const relativeTimeText = getFriendlyRelativeTime(upcomingEvent.start_time);
  const myRsvpConfig = myRsvp ? RSVP_STATUS_CONFIG[myRsvp.status] : null;

  return (
    <>
      <DashboardCard
        icon={<CalendarDays className="w-5 h-5 text-[#0e7c86]" />}
        title="Próxima actividad"
        action={{ label: 'Ver calendario', to: '/calendario' }}
        badge={
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]/30">
            {relativeTimeText}
          </span>
        }
      >
        <div className="space-y-4">
          {/* Cabecera del Evento: Tipo de evento y Título */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
              >
                <span className={`w-2 h-2 rounded-full ${typeConfig.dotColor}`} aria-hidden="true" />
                <span>{typeConfig.label}</span>
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#1a1a1a] leading-snug">
              {upcomingEvent.title}
            </h3>

            {upcomingEvent.description && (
              <p className="text-xs sm:text-sm text-[#4a4f57] line-clamp-2 leading-relaxed">
                {upcomingEvent.description}
              </p>
            )}
          </div>

          {/* Fechas, horarios y lugar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-[10px] bg-[#f5f5f5] border border-[#d4d7dc] text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-[#1a1a1a]">
              <Calendar className="w-4 h-4 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
              <span className="font-semibold">{formatEventFriendlyDate(upcomingEvent.start_time)}</span>
            </div>

            <div className="flex items-center gap-2 text-[#4a4f57]">
              <Clock className="w-4 h-4 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
              <span>
                {formatEventTime(upcomingEvent.start_time)}
                {upcomingEvent.end_time ? ` - ${formatEventTime(upcomingEvent.end_time)}` : ''}
              </span>
            </div>

            {upcomingEvent.location && (
              <div className="flex items-center gap-2 text-[#4a4f57] sm:col-span-2">
                <MapPin className="w-4 h-4 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{upcomingEvent.location}</span>
              </div>
            )}
          </div>

          {/* Bloque de Confirmación de Asistencia (RSVP) */}
          <div className="p-3.5 sm:p-4 rounded-[10px] bg-white border border-[#d4d7dc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            {/* Información de estado de RSVP y conteo */}
            <div className="space-y-1 w-full sm:w-auto">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#1a1a1a]">Tu asistencia:</span>
                {myRsvpConfig ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${myRsvpConfig.badgeBg} ${myRsvpConfig.badgeText} ${myRsvpConfig.badgeBorder}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${myRsvpConfig.dotColor}`} aria-hidden="true" />
                    <span>
                      {myRsvpConfig.label}
                      {myRsvp?.status === 'asistire' && (myRsvp.guests || 0) > 0
                        ? ` (+${myRsvp.guests})`
                        : ''}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-[#4a4f57] font-medium bg-[#ebedef] px-2 py-0.5 rounded-full">
                    Sin responder
                  </span>
                )}
              </div>

              {/* Resumen congregacional */}
              <div className="flex items-center gap-1.5 text-xs text-[#4a4f57]">
                <Users className="w-3.5 h-3.5 text-[#0e7c86]" aria-hidden="true" />
                <span>
                  {totalConfirmed} confirmado{totalConfirmed === 1 ? '' : 's'}
                  {summary.maybe > 0 ? ` · ${summary.maybe} por confirmar` : ''}
                </span>
              </div>
            </div>

            {/* Acción de Confirmación */}
            <div className="w-full sm:w-auto flex-shrink-0">
              {isPersonLinked === false ? (
                <div
                  className="flex items-center gap-1.5 text-xs text-[#4a4f57] bg-[#f5f5f5] p-2 rounded-[8px] border border-[#d4d7dc]"
                  title="Cuenta sin ficha vinculada"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#767b83]" aria-hidden="true" />
                  <span>Requiere ficha de miembro</span>
                </div>
              ) : myRsvp ? (
                <button
                  type="button"
                  onClick={() => setIsRSVPModalOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-[10px] border border-[#767b83] bg-white hover:bg-[#ebedef] active:bg-[#d4d7dc] text-[#1a1a1a] text-xs font-semibold transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0e7c86]"
                  aria-label="Modificar mi confirmación de asistencia"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                  <span>Modificar respuesta</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRSVPModalOpen(true)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-[10px] bg-[#0e7c86] hover:bg-[#0a5961] active:bg-[#08474e] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0e7c86] focus:ring-offset-2"
                  aria-label="Confirmar asistencia a este evento"
                >
                  <CalendarCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Confirmar asistencia</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Modal de confirmación de asistencia (reutiliza EventRSVPModal existente) */}
      {isRSVPModalOpen && upcomingEvent && (
        <EventRSVPModal
          event={upcomingEvent}
          currentRSVP={myRsvp || null}
          personName={personName}
          isOpen={isRSVPModalOpen}
          onClose={() => setIsRSVPModalOpen(false)}
          onSave={upsertRSVP}
          onDelete={deleteRSVP}
          actionLoading={rsvpActionLoading}
        />
      )}
    </>
  );
};
