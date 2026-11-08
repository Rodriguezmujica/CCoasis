import React from 'react';
import { CalendarDays, Clock, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { PublicEventItem } from '../../types/publicPage';
import { PublicSectionState } from '../../lib/usePublicWelcomeData';
import { EVENT_TYPES_CONFIG } from '../../types/events';
import {
  formatPublicEventFullDate,
  formatPublicEventTimeRange,
  getPublicEventDateBadge,
} from './publicDateFormatters';

interface PublicUpcomingEventsSectionProps {
  upcomingPublicEvents: PublicEventItem[];
  eventsState: PublicSectionState;
}

export const PublicUpcomingEventsSection: React.FC<
  PublicUpcomingEventsSectionProps
> = ({ upcomingPublicEvents, eventsState }) => {
  return (
    <section
      id="eventos"
      aria-labelledby="public-events-heading"
      className="max-w-6xl mx-auto px-4 pt-8 sm:pt-10 scroll-mt-28"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2
          id="public-events-heading"
          className="text-xl sm:text-2xl font-extrabold text-[#1a1a1a]"
        >
          Próximos eventos
        </h2>
        <span className="text-xs font-semibold text-[#4a4f57]">
          Próximos 60 días
        </span>
      </div>

      {/* Estado 1: Cargando */}
      {eventsState.loading ? (
        <div
          role="status"
          aria-label="Cargando próximos eventos"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5"
        >
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white border border-[#d4d7dc] rounded-[16px] p-4 flex items-center gap-3.5 animate-pulse"
            >
              <div className="w-16 h-16 rounded-[12px] bg-[#ebedef] flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-[#ebedef] rounded-full" />
                <div className="h-5 w-3/4 bg-[#ebedef] rounded-[6px]" />
                <div className="h-3.5 w-1/2 bg-[#ebedef] rounded-[6px]" />
              </div>
            </div>
          ))}
          <span className="sr-only">Cargando eventos públicos...</span>
        </div>
      ) : eventsState.error ? (
        /* Estado 2: Error con botón Reintentar */
        <div
          role="alert"
          className="bg-white border border-[#d4d7dc] rounded-[16px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="w-5 h-5 text-[#9b1c1c] flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-bold text-[#1a1a1a]">
                No se pudieron cargar los próximos eventos
              </p>
              <p className="text-xs text-[#4a4f57] mt-0.5">{eventsState.error}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void eventsState.retry()}
            className="min-h-[44px] px-4 py-2 rounded-[10px] bg-[#0e7c86] hover:bg-[#0a5961] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Reintentar</span>
          </button>
        </div>
      ) : upcomingPublicEvents.length === 0 ? (
        /* Estado 3a: Vacío compacto y amable */
        <div className="bg-white border border-[#d4d7dc] rounded-[16px] p-5 sm:p-6 flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-[12px] bg-[#d9f7f8] text-[#0a5961] flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1a1a1a]">
              Sin actividades especiales programadas por ahora
            </h3>
            <p className="text-sm text-[#4a4f57] mt-1">
              No hay más eventos públicos extraordinarios en los próximos 60 días. Te esperamos en nuestros cultos y reuniones semanales habituales.
            </p>
          </div>
        </div>
      ) : (
        /* Estado 3b: Lista de tarjetas públicas (solo título, tipo, fecha, hora y lugar) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {upcomingPublicEvents.map((event) => {
            const badgeDate = getPublicEventDateBadge(event.start_time);
            const meta =
              EVENT_TYPES_CONFIG[event.event_type] || EVENT_TYPES_CONFIG.otro;

            return (
              <article
                key={event.id}
                className="bg-white border border-[#d4d7dc] rounded-[16px] p-4 flex items-start gap-3.5 shadow-sm"
              >
                {/* Insignia de día y mes con fondo cian (#23d5da) y texto oscuro (#1a1a1a, 9.62:1) como en la maqueta */}
                <div
                  aria-hidden="true"
                  className="w-16 min-h-[64px] rounded-[12px] bg-[#23d5da] text-[#1a1a1a] flex flex-col items-center justify-center px-2 py-1.5 flex-shrink-0 text-center"
                >
                  <span className="text-xl font-extrabold leading-none text-[#1a1a1a]">
                    {badgeDate.day}
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider mt-1 text-[#1a1a1a]">
                    {badgeDate.monthShort}
                  </span>
                </div>

                {/* Datos públicos del evento */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${meta.dotColor}`}
                        aria-hidden="true"
                      />
                      <span>{meta.label}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1a1a1a] leading-snug break-words">
                    {event.title}
                  </h3>

                  <p className="text-xs font-medium text-[#4a4f57]">
                    {formatPublicEventFullDate(event.start_time)}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#4a4f57]">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Clock
                        className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {formatPublicEventTimeRange(event.start_time, event.end_time)}
                      </span>
                    </span>

                    {event.location && (
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <MapPin
                          className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate">{event.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
