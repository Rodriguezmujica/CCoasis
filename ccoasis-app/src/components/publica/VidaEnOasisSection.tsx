import React, { useState } from 'react';
import {
  Camera,
  Calendar,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { PublicNewsItem } from '../../types/publicPage';
import { getPublicMediaUrl, isSafePublicUrl } from '../../lib/publicPageSecurity';
import { formatPublicNewsDate } from './publicDateFormatters';
import {
  VidaEnOasisModal,
  getVidaEnOasisCategoryBadgeClasses,
} from './VidaEnOasisModal';

export interface VidaEnOasisSectionProps {
  news: PublicNewsItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  instagramUrl?: string;
  variant?: 'public' | 'dashboard';
}

const InstagramOutlineIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
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

export const VidaEnOasisSection: React.FC<VidaEnOasisSectionProps> = ({
  news,
  loading,
  error,
  onRetry,
  instagramUrl,
  variant = 'public',
}) => {
  const [selectedItem, setSelectedItem] = useState<PublicNewsItem | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const visibleNews = (news || []).slice(0, 6);

  const trimmedInstagram = instagramUrl?.trim() || '';
  const hasSafeInstagram =
    Boolean(trimmedInstagram) && isSafePublicUrl(trimmedInstagram);

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const isPublicVariant = variant === 'public';

  const sectionContent = (
    <>
      {isPublicVariant && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
          <div>
            <h2
              id="vida-en-oasis-heading"
              className="text-xl sm:text-2xl font-extrabold text-[#1a1a1a]"
            >
              Vida en Oasis
            </h2>
            <p className="text-xs sm:text-sm text-[#4a4f57] mt-0.5">
              Momentos, bautizos y recuerdos de nuestra vida en comunidad
            </p>
          </div>
        </div>
      )}

      {/* Estado a) Cargando: esqueleto de tarjetas con proporción 16:9 */}
      {loading ? (
        <div
          role="status"
          aria-label="Cargando recuerdos de Vida en Oasis"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {[1, 2, 3].map((placeholder) => (
            <div
              key={placeholder}
              className="bg-white border border-[#d4d7dc] rounded-[18px] overflow-hidden shadow-sm animate-pulse flex flex-col"
            >
              <div className="aspect-video w-full bg-[#ebedef]" />
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-5 w-24 bg-[#ebedef] rounded-full" />
                  <div className="h-4 w-28 bg-[#ebedef] rounded-[6px]" />
                </div>
                <div className="h-5 w-4/5 bg-[#ebedef] rounded-[6px]" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-full bg-[#ebedef] rounded-[6px]" />
                  <div className="h-3.5 w-5/6 bg-[#ebedef] rounded-[6px]" />
                </div>
                <div className="h-4 w-40 bg-[#ebedef] rounded-[6px] pt-1" />
              </div>
            </div>
          ))}
          <span className="sr-only">Cargando recuerdos de Vida en Oasis...</span>
        </div>
      ) : error ? (
        /* Estado b) Error: mensaje claro "No se pudo cargar Vida en Oasis" + botón Reintentar */
        <div
          role="alert"
          className="bg-white border border-[#d4d7dc] rounded-[18px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="w-5 h-5 text-[#9b1c1c] flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm sm:text-base font-bold text-[#1a1a1a]">
                No se pudo cargar Vida en Oasis
              </p>
              <p className="text-xs sm:text-sm text-[#4a4f57] mt-0.5">{error}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRetry}
            className="min-h-[44px] px-4 py-2 rounded-[10px] bg-[#0e7c86] hover:bg-[#0a5961] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors flex-shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Reintentar</span>
          </button>
        </div>
      ) : visibleNews.length === 0 ? (
        /* Estado c) Vacío (sin error): estado vacío compacto y amable */
        <div className="bg-white border border-[#d4d7dc] rounded-[18px] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-[12px] bg-[#d9f7f8] text-[#0a5961] flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1a1a1a]">
                Recuerdos de nuestra iglesia
              </h3>
              <p className="text-sm text-[#4a4f57] mt-1">
                Pronto compartiremos aquí fotos y recuerdos de nuestra vida en comunidad
              </p>
            </div>
          </div>

          {hasSafeInstagram && (
            <a
              href={trimmedInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#ae4a84] hover:bg-[#8f3b6b] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors flex-shrink-0 shadow-xs"
            >
              <InstagramOutlineIcon className="w-4 h-4 flex-shrink-0" />
              <span>Ver más álbumes en nuestro Instagram oficial</span>
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            </a>
          )}
        </div>
      ) : (
        /* Estado d) Con elementos en news (hasta 6 tarjetas) */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleNews.map((item) => {
              const rawImageUrl =
                item.image_url || getPublicMediaUrl(item.image_path);
              const safeImageUrl =
                Boolean(rawImageUrl?.trim()) && isSafePublicUrl(rawImageUrl)
                  ? rawImageUrl.trim()
                  : '';
              const showImage = Boolean(safeImageUrl) && !failedImages[item.id];
              const badgeClasses = getVidaEnOasisCategoryBadgeClasses(
                item.category
              );
              const formattedDate = formatPublicNewsDate(item.event_date);

              return (
                <article
                  key={item.id}
                  className="bg-white border border-[#d4d7dc] rounded-[18px] overflow-hidden shadow-sm hover:border-[#767b83] transition-colors flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    aria-label={`Leer historia completa: ${item.title}`}
                    className="w-full flex-1 flex flex-col text-left cursor-pointer group rounded-[18px]"
                  >
                    {/* Imagen panorámica 16:9 con fallback elegante */}
                    <div className="aspect-video w-full bg-[#ebedef] border-b border-[#d4d7dc] overflow-hidden relative">
                      {showImage ? (
                        <img
                          src={safeImageUrl}
                          alt={item.title}
                          loading="lazy"
                          onError={() => handleImageError(item.id)}
                          className="aspect-video w-full h-full object-cover block motion-safe:group-hover:scale-[1.02] motion-safe:transition-transform duration-200"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="aspect-video w-full h-full bg-gradient-to-br from-[#d9f7f8] via-[#f5f5f5] to-[#f6e6ef] flex flex-col items-center justify-center p-4 text-center"
                        >
                          <span className="w-10 h-10 rounded-full bg-white border border-[#d4d7dc] text-[#0a5961] inline-flex items-center justify-center shadow-2xs mb-1.5">
                            <Camera className="w-5 h-5" aria-hidden="true" />
                          </span>
                          <span className="text-xs font-bold text-[#1a1a1a]">
                            Centro Cristiano Oasis
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cuerpo de la tarjeta (fondo blanco, contraste AA) */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2.5">
                        {/* Insignia de categoría y fecha */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide ${badgeClasses}`}
                          >
                            {item.category}
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#4a4f57]">
                            <Calendar
                              className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0"
                              aria-hidden="true"
                            />
                            <span>{formattedDate}</span>
                          </span>
                        </div>

                        {/* Título en negrita (#1a1a1a) */}
                        <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] leading-snug break-words group-hover:text-[#0a5961] transition-colors">
                          {item.title}
                        </h3>

                        {/* Crónica corta truncada a 3 líneas */}
                        <p className="text-xs sm:text-sm text-[#4a4f57] leading-relaxed line-clamp-3 break-words">
                          {item.summary}
                        </p>
                      </div>

                      {/* Indicador visual táctil */}
                      <div className="pt-2 border-t border-[#ebedef] flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-[#0e7c86] group-hover:text-[#0a5961] group-hover:underline">
                          Leer historia completa →
                        </span>
                      </div>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>

          {/* Pie de la sección con enlace a Instagram si instagramUrl es válida */}
          {hasSafeInstagram && (
            <div className="mt-5 flex justify-center sm:justify-end">
              <a
                href={trimmedInstagram}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#ae4a84] hover:bg-[#8f3b6b] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <InstagramOutlineIcon className="w-4 h-4 flex-shrink-0" />
                <span>Ver más álbumes en nuestro Instagram oficial</span>
                <ExternalLink
                  className="w-3.5 h-3.5 flex-shrink-0"
                  aria-hidden="true"
                />
              </a>
            </div>
          )}
        </>
      )}

      {/* Modal para ver foto ampliada e historia completa */}
      <VidaEnOasisModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );

  if (!isPublicVariant) {
    return <div data-section="vida-en-oasis-dashboard">{sectionContent}</div>;
  }

  return (
    <section
      id="vida-en-oasis"
      data-section="vida-en-oasis"
      aria-labelledby="vida-en-oasis-heading"
      className="max-w-6xl mx-auto px-4 pt-8 sm:pt-10 scroll-mt-28"
    >
      {sectionContent}
    </section>
  );
};
