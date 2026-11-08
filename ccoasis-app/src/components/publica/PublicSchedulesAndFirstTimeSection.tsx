import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Map,
  Navigation,
  MessageCircle,
  HeartHandshake,
  RefreshCw,
} from 'lucide-react';
import { PublicSiteSettings } from '../../types/publicPage';
import { PublicSectionState } from '../../lib/usePublicWelcomeData';
import { isSafePublicUrl } from '../../lib/publicPageSecurity';

interface PublicSchedulesAndFirstTimeSectionProps {
  settings: PublicSiteSettings;
  settingsState: PublicSectionState;
}

const DEFAULT_FALLBACK_SCHEDULE = [
  { name: 'Culto dominical', time: 'Domingos · Consultar horario' },
  { name: 'Reunión de oración', time: 'Entre semana · Consultar horario' },
  { name: 'Clases de discipulado', time: 'Por ciclos activos' },
];

export const PublicSchedulesAndFirstTimeSection: React.FC<
  PublicSchedulesAndFirstTimeSectionProps
> = ({ settings, settingsState }) => {
  const scheduleText = settings.service_schedule?.trim() || '';
  const addressText = settings.address?.trim() || '';
  const hasSafeMapsUrl =
    Boolean(settings.maps_url?.trim()) && isSafePublicUrl(settings.maps_url);
  const [showEmbeddedMap, setShowEmbeddedMap] = useState(false);
  const mapsLinkUrl = hasSafeMapsUrl
    ? settings.maps_url.trim()
    : addressText
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`
      : '';
  const hasSafeWhatsappUrl =
    Boolean(settings.whatsapp_url?.trim()) && isSafePublicUrl(settings.whatsapp_url);

  return (
    <section
      id="horarios"
      aria-labelledby="public-schedules-heading"
      className="max-w-6xl mx-auto px-4 pt-8 sm:pt-10 scroll-mt-28"
    >
      <h2
        id="public-schedules-heading"
        className="text-xl sm:text-2xl font-extrabold text-[#1a1a1a] mb-4"
      >
        Horarios y primera visita
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {/* 1) Tarjeta blanca de "Nuestros horarios" */}
        <div className="bg-white border border-[#d4d7dc] rounded-[16px] p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-[10px] bg-[#d9f7f8] text-[#0a5961] inline-flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-extrabold text-[#1a1a1a]">
                  Nuestros horarios y ubicación
                </h3>
              </div>

              {settingsState.error && (
                <button
                  type="button"
                  onClick={() => void settingsState.retry()}
                  className="min-h-[44px] px-3 py-1.5 rounded-[10px] border border-[#767b83] bg-white hover:bg-[#ebedef] text-xs font-semibold text-[#1a1a1a] inline-flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reintentar</span>
                </button>
              )}
            </div>

            {settingsState.loading ? (
              <div
                role="status"
                aria-label="Cargando horarios"
                className="space-y-2.5 py-2 animate-pulse"
              >
                <div className="h-4 w-3/4 bg-[#ebedef] rounded-[6px]" />
                <div className="h-4 w-2/3 bg-[#ebedef] rounded-[6px]" />
                <div className="h-4 w-1/2 bg-[#ebedef] rounded-[6px]" />
                <span className="sr-only">Cargando horarios...</span>
              </div>
            ) : scheduleText ? (
              <p className="text-sm sm:text-base text-[#1a1a1a] leading-relaxed whitespace-pre-line">
                {scheduleText}
              </p>
            ) : (
              <dl className="divide-y divide-[#d4d7dc] text-sm sm:text-base">
                {DEFAULT_FALLBACK_SCHEDULE.map((row) => (
                  <div
                    key={row.name}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <dt className="text-[#4a4f57] font-medium">{row.name}</dt>
                    <dd className="text-[#1a1a1a] font-bold text-right">
                      {row.time}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Dirección y enlace "Cómo llegar" */}
          <div className="pt-3.5 border-t border-[#d4d7dc] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2 text-sm text-[#4a4f57]">
              <MapPin
                className="w-4 h-4 text-[#0e7c86] flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>
                {addressText || 'Centro Cristiano Oasis · Madrid, España'}
              </span>
            </div>

            {mapsLinkUrl && (
              <a
                href={mapsLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2 rounded-full bg-[#0e7c86] hover:bg-[#0a5961] text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors flex-shrink-0"
              >
                <Navigation className="w-4 h-4" aria-hidden="true" />
                <span>Abrir en Google Maps / Cómo llegar</span>
              </a>
            )}
          </div>

          {/* Mapa interactivo con activación por clic (sin cookies de terceros al entrar) */}
          {addressText && (
            <div className="pt-3.5 border-t border-[#d4d7dc]">
              {showEmbeddedMap ? (
                <div className="space-y-3">
                  <iframe
                    title="Ubicación de Centro Cristiano Oasis"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(addressText)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-64 rounded-xl border border-[#d4d7dc]"
                  />
                  {mapsLinkUrl && (
                    <a
                      href={mapsLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[44px] px-4 py-2 rounded-full border border-[#0e7c86] bg-white hover:bg-[#d9f7f8] text-[#0a5961] text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Navigation className="w-4 h-4" aria-hidden="true" />
                      <span>Abrir ruta en la app de Google Maps</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-[#d4d7dc] bg-[#f5f5f5] p-4 flex flex-col items-center text-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-[#d9f7f8] text-[#0a5961] inline-flex items-center justify-center">
                    <Map className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-bold text-[#1a1a1a]">{addressText}</p>
                  <button
                    type="button"
                    onClick={() => setShowEmbeddedMap(true)}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-full bg-[#ae4a84] hover:bg-[#8f3b6b] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <Map className="w-4 h-4" aria-hidden="true" />
                    <span>Mostrar mapa interactivo aquí</span>
                  </button>
                  <p className="text-xs text-[#4a4f57]">
                    Al mostrar el mapa se carga contenido de Google Maps (puede usar cookies de Google).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2) Tarjeta destacada "¿Nos visitas por primera vez?" (borde #0e7c86 accesible >= 4.95:1 sobre blanco) */}
        <div className="bg-white border-2 border-[#0e7c86] rounded-[16px] p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-[10px] bg-[#f6e6ef] text-[#7a2f5a] inline-flex items-center justify-center flex-shrink-0">
                <HeartHandshake className="w-5 h-5" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-extrabold text-[#1a1a1a]">
                ¿Nos visitas por primera vez?
              </h3>
            </div>

            <p className="text-sm sm:text-base text-[#4a4f57] leading-relaxed">
              Escríbenos y te recibimos con alegría. No necesitas experiencia previa ni etiqueta especial: ven en familia o por tu cuenta y te acompañaremos desde la entrada.
            </p>
          </div>

          <div className="pt-1">
            {hasSafeWhatsappUrl ? (
              <a
                href={settings.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-full bg-[#ae4a84] hover:bg-[#8f3b6b] text-white text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>Escríbenos por WhatsApp</span>
              </a>
            ) : (
              <p className="text-xs font-semibold text-[#4a4f57] bg-[#f5f5f5] border border-[#d4d7dc] rounded-[10px] px-3.5 py-2.5">
                Te esperamos directamente en nuestro próximo culto dominical. Nuestro equipo de bienvenida estará encantado de saludarte.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
