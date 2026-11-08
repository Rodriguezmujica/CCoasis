import React from 'react';
import {
  MapPin,
  Clock,
  Calendar,
  Radio,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { PublicEventItem, PublicSiteSettings } from '../../types/publicPage';
import { PublicSectionState } from '../../lib/usePublicWelcomeData';
import { isSafePublicUrl } from '../../lib/publicPageSecurity';
import { EVENT_TYPES_CONFIG } from '../../types/events';
import {
  formatPublicEventFullDate,
  formatPublicEventTimeRange,
} from './publicDateFormatters';

interface PublicHeroSectionProps {
  settings: PublicSiteSettings;
  nextPublicCulto: PublicEventItem | null;
  eventsState: PublicSectionState;
}

export const PublicHeroSection: React.FC<PublicHeroSectionProps> = ({
  settings,
  nextPublicCulto,
  eventsState,
}) => {
  const heroTitle = settings.hero_title?.trim() || 'Te esperamos este domingo';
  const welcomeText = settings.welcome_text?.trim() || '';
  const hasSafeMapsUrl =
    Boolean(settings.maps_url?.trim()) && isSafePublicUrl(settings.maps_url);
  const hasSafeLiveStreamUrl =
    Boolean(settings.live_stream_url?.trim()) &&
    isSafePublicUrl(settings.live_stream_url);

  const eventMeta = nextPublicCulto
    ? EVENT_TYPES_CONFIG[nextPublicCulto.event_type] || EVENT_TYPES_CONFIG.culto
    : EVENT_TYPES_CONFIG.culto;

  return (
    <section
      aria-labelledby="hero-welcome-heading"
      className="max-w-6xl mx-auto px-4 pt-5 sm:pt-8"
    >
      {/* En móvil: bloque integrado con degradado; en escritorio: 2 columnas armonizadas como en la maqueta */}
      <div className="oasis-title-gradient rounded-[20px] p-5 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch">
          {/* Columna izquierda: Título grande (>= 24px bold blanco sobre #0f9aa2 -> #ae4a84) y tarjeta blanca de bienvenida */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <h1
                id="hero-welcome-heading"
                className="text-[28px] sm:text-[36px] font-extrabold text-white leading-tight tracking-tight"
              >
                {heroTitle}
              </h1>

              {/* Texto de bienvenida siempre dentro de tarjeta blanca con contraste AA (#1a1a1a sobre #ffffff) */}
              {welcomeText ? (
                <div className="bg-white text-[#1a1a1a] rounded-[14px] p-4 sm:p-5 border border-[#d4d7dc] shadow-sm">
                  <p className="text-sm sm:text-base text-[#1a1a1a] leading-relaxed whitespace-pre-line">
                    {welcomeText}
                  </p>
                </div>
              ) : (
                <div className="bg-white text-[#1a1a1a] rounded-[14px] p-4 sm:p-5 border border-[#d4d7dc] shadow-sm">
                  <p className="text-sm sm:text-base text-[#1a1a1a] leading-relaxed">
                    Somos una familia de fe en Madrid donde cada persona tiene un lugar. Ven tal como eres: estaremos felices de recibirte.
                  </p>
                </div>
              )}
            </div>

            {/* Acceso directo de ubicación en escritorio cuando existe maps_url */}
            {hasSafeMapsUrl && (
              <div className="hidden lg:flex items-center gap-3 pt-1">
                <a
                  href={settings.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-white hover:bg-[#ebedef] text-[#0a5961] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <MapPin className="w-4 h-4 flex-shrink-0 text-[#0e7c86]" aria-hidden="true" />
                  <span>Cómo llegar</span>
                </a>
              </div>
            )}
          </div>

          {/* Columna derecha / inferior: Tarjeta destacada blanca del "Próximo culto o actividad" */}
          <div
            id="proximo-culto"
            className="lg:col-span-5 bg-white text-[#1a1a1a] rounded-[16px] p-5 sm:p-6 border border-[#d4d7dc] shadow-sm flex flex-col justify-between scroll-mt-28"
          >
            {eventsState.loading ? (
              <div
                role="status"
                aria-label="Cargando próximo culto"
                className="space-y-3 py-2 animate-pulse"
              >
                <div className="h-5 w-32 bg-[#ebedef] rounded-full" />
                <div className="h-6 w-3/4 bg-[#ebedef] rounded-[8px]" />
                <div className="h-4 w-2/3 bg-[#ebedef] rounded-[8px]" />
                <div className="h-4 w-1/2 bg-[#ebedef] rounded-[8px]" />
                <div className="h-11 w-full bg-[#ebedef] rounded-full mt-3" />
                <span className="sr-only">Cargando próximo evento...</span>
              </div>
            ) : eventsState.error ? (
              <div role="alert" className="space-y-3 py-1">
                <div className="flex items-start gap-2.5 text-[#9b1c1c]">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-[#1a1a1a]">
                      No se pudo cargar el próximo evento
                    </p>
                    <p className="text-xs text-[#4a4f57] mt-0.5">{eventsState.error}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void eventsState.retry()}
                  className="w-full min-h-[44px] px-4 py-2 rounded-[10px] bg-[#0e7c86] hover:bg-[#0a5961] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  <span>Reintentar</span>
                </button>
              </div>
            ) : nextPublicCulto ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#7a2f5a]">
                    Próximo culto
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${eventMeta.badgeBg} ${eventMeta.badgeText} ${eventMeta.badgeBorder}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${eventMeta.dotColor}`}
                      aria-hidden="true"
                    />
                    <span>{eventMeta.label}</span>
                  </span>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#1a1a1a] leading-snug">
                    {nextPublicCulto.title}
                  </h2>

                  <div className="mt-2.5 space-y-1.5 text-sm text-[#1a1a1a]">
                    <div className="flex items-center gap-2 font-bold">
                      <Calendar
                        className="w-4 h-4 text-[#0e7c86] flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{formatPublicEventFullDate(nextPublicCulto.start_time)}</span>
                    </div>

                    <div className="flex items-center gap-2 font-semibold text-[#4a4f57]">
                      <Clock
                        className="w-4 h-4 text-[#0e7c86] flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {formatPublicEventTimeRange(
                          nextPublicCulto.start_time,
                          nextPublicCulto.end_time
                        )}
                      </span>
                    </div>

                    {(nextPublicCulto.location || settings.address) && (
                      <div className="flex items-start gap-2 text-[#4a4f57]">
                        <MapPin
                          className="w-4 h-4 text-[#0e7c86] flex-shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{nextPublicCulto.location || settings.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(hasSafeMapsUrl || hasSafeLiveStreamUrl) && (
                  <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                    {hasSafeMapsUrl && (
                      <a
                        href={settings.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-h-[44px] px-4 py-2.5 rounded-full bg-[#0e7c86] hover:bg-[#0a5961] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span>Cómo llegar</span>
                      </a>
                    )}

                    {hasSafeLiveStreamUrl && (
                      <a
                        href={settings.live_stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-h-[44px] px-4 py-2.5 rounded-full bg-[#ae4a84] hover:bg-[#8f3b6b] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <Radio className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span>Ver transmisión en vivo</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Respaldo cuando no hay eventos públicos cargados aún */
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ae4a84]" aria-hidden="true" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#7a2f5a]">
                    Próximo culto
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-[#1a1a1a]">
                    Culto Dominical en Familia
                  </h2>
                  <p className="mt-1.5 text-sm text-[#4a4f57] whitespace-pre-line leading-relaxed">
                    {settings.service_schedule?.trim()
                      ? settings.service_schedule
                      : 'Te invitamos cada domingo a compartir un tiempo de alabanza, Palabra de Dios y comunión fraterna.'}
                  </p>
                  {settings.address?.trim() && (
                    <div className="mt-2.5 flex items-start gap-2 text-sm text-[#4a4f57]">
                      <MapPin
                        className="w-4 h-4 text-[#0e7c86] flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{settings.address}</span>
                    </div>
                  )}
                </div>

                {(hasSafeMapsUrl || hasSafeLiveStreamUrl) && (
                  <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                    {hasSafeMapsUrl && (
                      <a
                        href={settings.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-h-[44px] px-4 py-2.5 rounded-full bg-[#0e7c86] hover:bg-[#0a5961] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span>Cómo llegar</span>
                      </a>
                    )}

                    {hasSafeLiveStreamUrl && (
                      <a
                        href={settings.live_stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-h-[44px] px-4 py-2.5 rounded-full bg-[#ae4a84] hover:bg-[#8f3b6b] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <Radio className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span>Ver transmisión en vivo</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
