import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Mail,
  MessageCircle,
  Smartphone,
  MoreVertical,
  Share,
  ExternalLink,
} from 'lucide-react';
import { PublicSiteSettings } from '../../types/publicPage';
import { isSafePublicUrl } from '../../lib/publicPageSecurity';
import { isSafeEmailAddress } from './publicDateFormatters';

interface PublicContactAndPwaSectionProps {
  settings: PublicSiteSettings;
  hasSession: boolean;
}

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

export const PublicContactAndPwaSection: React.FC<
  PublicContactAndPwaSectionProps
> = ({ settings, hasSession }) => {
  const addressText = settings.address?.trim() || '';
  const emailText = settings.contact_email?.trim() || '';

  const hasSafeInstagram =
    Boolean(settings.instagram_url?.trim()) &&
    isSafePublicUrl(settings.instagram_url);
  const hasSafeYoutube =
    Boolean(settings.youtube_url?.trim()) && isSafePublicUrl(settings.youtube_url);
  const hasSafeWhatsapp =
    Boolean(settings.whatsapp_url?.trim()) &&
    isSafePublicUrl(settings.whatsapp_url);
  const hasSafeMaps =
    Boolean(settings.maps_url?.trim()) && isSafePublicUrl(settings.maps_url);
  const hasSafeEmail = isSafeEmailAddress(emailText);

  const hasAnySocialButton =
    hasSafeInstagram || hasSafeYoutube || hasSafeWhatsapp || hasSafeEmail;

  return (
    <>
      {/* F) Sección "Contacto y Redes Sociales" */}
      <section
        id="contacto"
        aria-labelledby="public-contact-heading"
        className="max-w-6xl mx-auto px-4 pt-8 sm:pt-10 scroll-mt-28"
      >
        <h2
          id="public-contact-heading"
          className="text-xl sm:text-2xl font-extrabold text-[#1a1a1a] mb-4"
        >
          Contacto y redes sociales
        </h2>

        <div className="bg-white border border-[#d4d7dc] rounded-[16px] p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Información textual de contacto */}
          <div className="space-y-2.5 text-sm sm:text-base">
            <div className="flex items-start gap-2.5 text-[#1a1a1a]">
              <MapPin
                className="w-5 h-5 text-[#0e7c86] flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <span className="font-bold">Dirección: </span>
                <span className="text-[#4a4f57]">
                  {addressText || 'Madrid, España · Centro Cristiano Oasis'}
                </span>
                {hasSafeMaps && (
                  <a
                    href={settings.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-[#0e7c86] hover:text-[#0a5961] underline"
                  >
                    <span>Ver en el mapa</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            {hasSafeEmail && (
              <div className="flex items-center gap-2.5 text-[#1a1a1a]">
                <Mail
                  className="w-5 h-5 text-[#0e7c86] flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <span className="font-bold">Correo: </span>
                  <a
                    href={`mailto:${emailText}`}
                    className="text-[#0e7c86] hover:text-[#0a5961] font-semibold underline break-all"
                  >
                    {emailText}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Botones de redes sociales y contacto validados con isSafePublicUrl */}
          {hasAnySocialButton ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {hasSafeWhatsapp && (
                <a
                  href={settings.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-4 py-2 rounded-full border-2 border-[#0e7c86] bg-white hover:bg-[#d9f7f8] text-[#0a5961] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              )}

              {hasSafeInstagram && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-4 py-2 rounded-full border-2 border-[#ae4a84] bg-white hover:bg-[#f6e6ef] text-[#7a2f5a] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <InstagramIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Instagram</span>
                </a>
              )}

              {hasSafeYoutube && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-4 py-2 rounded-full border-2 border-[#ae4a84] bg-white hover:bg-[#f6e6ef] text-[#7a2f5a] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <YoutubeIcon className="w-4 h-4 flex-shrink-0" />
                  <span>YouTube</span>
                </a>
              )}

              {hasSafeEmail && (
                <a
                  href={`mailto:${emailText}`}
                  className="min-h-[44px] px-4 py-2 rounded-full border border-[#767b83] bg-white hover:bg-[#ebedef] text-[#1a1a1a] text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span>Escribir correo</span>
                </a>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-[#4a4f57]">
              Síguenos y mantente al día con nuestras actividades congregacionales en Madrid.
            </p>
          )}
        </div>
      </section>

      {/* G) Franja "Instala la app en tu móvil" (guía rápida PWA) */}
      <section
        id="instalar-app"
        aria-labelledby="public-install-pwa-heading"
        className="max-w-6xl mx-auto px-4 pt-8 sm:pt-10 scroll-mt-28"
      >
        <div className="bg-[#0a5961] text-white rounded-[18px] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[12px] bg-white/15 text-white inline-flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="public-install-pwa-heading"
                className="text-lg sm:text-xl font-extrabold text-white"
              >
                Instala la app en tu móvil
              </h2>
              <p className="text-xs sm:text-sm text-white/90">
                Accede rápido desde tu pantalla de inicio sin ocupar espacio extra:
              </p>
            </div>
          </div>

          {/* Dos tarjetas blancas con contraste AA para explicar Android e iPhone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Android (Chrome) */}
            <div className="bg-white text-[#1a1a1a] rounded-[14px] p-4 border border-[#d4d7dc] flex items-start gap-3">
              <span className="w-9 h-9 rounded-[10px] bg-[#d9f7f8] text-[#0a5961] inline-flex items-center justify-center flex-shrink-0 mt-0.5">
                <MoreVertical className="w-5 h-5" aria-hidden="true" />
              </span>
              <div className="text-sm leading-relaxed">
                <h3 className="font-extrabold text-[#1a1a1a]">
                  Android (Chrome)
                </h3>
                <p className="text-[#4a4f57] mt-0.5">
                  Pulsa el menú de tres puntos (<strong>⋮</strong>) arriba a la derecha y elige{' '}
                  <strong className="text-[#1a1a1a]">&ldquo;Instalar aplicación&rdquo;</strong> o{' '}
                  <strong className="text-[#1a1a1a]">
                    &ldquo;Añadir a pantalla de inicio&rdquo;
                  </strong>
                  .
                </p>
              </div>
            </div>

            {/* iPhone / iPad (Safari) */}
            <div className="bg-white text-[#1a1a1a] rounded-[14px] p-4 border border-[#d4d7dc] flex items-start gap-3">
              <span className="w-9 h-9 rounded-[10px] bg-[#f6e6ef] text-[#7a2f5a] inline-flex items-center justify-center flex-shrink-0 mt-0.5">
                <Share className="w-5 h-5" aria-hidden="true" />
              </span>
              <div className="text-sm leading-relaxed">
                <h3 className="font-extrabold text-[#1a1a1a]">
                  iPhone / iPad (Safari)
                </h3>
                <p className="text-[#4a4f57] mt-0.5">
                  Pulsa el botón <strong className="text-[#1a1a1a]">&ldquo;Compartir&rdquo;</strong>{' '}
                  (cuadrado con flecha hacia arriba) en la barra inferior y elige{' '}
                  <strong className="text-[#1a1a1a]">
                    &ldquo;Añadir a pantalla de inicio&rdquo;
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pie de página discreto */}
      <footer className="max-w-6xl mx-auto px-4 py-8 mt-4 text-center text-xs sm:text-sm text-[#4a4f57]">
        <div className="border-t border-[#d4d7dc] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-[#4a4f57]">
            &copy; {new Date().getFullYear()} Centro Cristiano Oasis &middot; Madrid
          </p>

          <Link
            to={hasSession ? '/inicio' : '/login'}
            className="min-h-[44px] px-4 py-2 rounded-[10px] text-[#9a3f73] hover:text-[#7a2f5a] hover:bg-[#ebedef] font-bold inline-flex items-center justify-center transition-colors"
          >
            {hasSession ? 'Ir a mi panel' : 'Iniciar sesión'}
          </Link>
        </div>
      </footer>
    </>
  );
};
