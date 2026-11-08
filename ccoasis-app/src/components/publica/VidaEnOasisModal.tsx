import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Calendar, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { PublicNewsCategory, PublicNewsItem } from '../../types/publicPage';
import { getPublicMediaUrl, isSafePublicUrl } from '../../lib/publicPageSecurity';
import { formatPublicNewsDate } from './publicDateFormatters';

export interface VidaEnOasisModalProps {
  item: PublicNewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function getVidaEnOasisCategoryBadgeClasses(category: PublicNewsCategory): string {
  switch (category) {
    case 'Bautizos':
      // Fondo cian #23d5da con texto oscuro #1a1a1a (9,62:1 WCAG AA)
      return 'bg-[#23d5da] text-[#1a1a1a]';
    case 'Comunidad':
      // Fondo magenta #ae4a84 con texto blanco (5,11:1 WCAG AA)
      return 'bg-[#ae4a84] text-white';
    case 'Discipulado':
    default:
      // Fondo verde petróleo #0e7c86 con texto blanco (4,95:1 WCAG AA)
      return 'bg-[#0e7c86] text-white';
  }
}

export const VidaEnOasisModal: React.FC<VidaEnOasisModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [imgFailed, setImgFailed] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Galería segura: image_urls (o [image_url] / [image_path]) filtrada con isSafePublicUrl
  const galleryUrls: string[] = useMemo(() => {
    if (!item) return [];
    const raw =
      item.image_urls && item.image_urls.length > 0
        ? item.image_urls
        : [item.image_url || getPublicMediaUrl(item.image_path)];
    return raw
      .map((u) => (u || '').trim())
      .filter((u) => Boolean(u) && isSafePublicUrl(u));
  }, [item]);
  const galleryCount = galleryUrls.length;
  const hasCarousel = galleryCount > 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [item?.id, isOpen]);

  useEffect(() => {
    setImgFailed(false);
  }, [item?.id, activeIndex, isOpen]);

  const goPrev = useCallback(() => {
    if (galleryCount > 1) setActiveIndex((i) => (i - 1 + galleryCount) % galleryCount);
  }, [galleryCount]);

  const goNext = useCallback(() => {
    if (galleryCount > 1) setActiveIndex((i) => (i + 1) % galleryCount);
  }, [galleryCount]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowLeft' && galleryCount > 1) {
        event.preventDefault();
        goPrev();
      } else if (event.key === 'ArrowRight' && galleryCount > 1) {
        event.preventDefault();
        goNext();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, galleryCount, goPrev, goNext]);

  if (!isOpen || !item) {
    return null;
  }

  const safeImageUrl = galleryUrls[Math.min(activeIndex, Math.max(galleryCount - 1, 0))] || '';
  const showImage = Boolean(safeImageUrl) && !imgFailed;

  const badgeClasses = getVidaEnOasisCategoryBadgeClasses(item.category);
  const formattedDate = formatPublicNewsDate(item.event_date);

  const carouselButtonClass =
    'absolute top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#1a1a1a]/85 hover:bg-[#1a1a1a] text-white inline-flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1a1a1a]/65 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vida-oasis-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white border border-[#d4d7dc] rounded-[16px] shadow-xl max-w-2xl w-full overflow-hidden my-auto max-h-[90vh] flex flex-col motion-safe:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera superior con insignia, fecha y botón Cerrar (>= 44x44px) */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#d4d7dc] bg-white flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold tracking-wide ${badgeClasses}`}
            >
              {item.category}
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#4a4f57]">
              <Calendar className="w-4 h-4 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
              <span>{formattedDate}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar historia"
            className="min-w-[44px] min-h-[44px] px-2.5 rounded-[10px] bg-[#f5f5f5] hover:bg-[#ebedef] text-[#1a1a1a] border border-[#d4d7dc] inline-flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Cuerpo desplazable: foto ampliada (o carrusel) + título + crónica completa */}
        <div className="overflow-y-auto flex-1">
          {/* Imagen panorámica ampliada, carrusel accesible o fallback elegante */}
          <div
            className="w-full bg-[#ebedef] border-b border-[#d4d7dc]"
            role={hasCarousel ? 'group' : undefined}
            aria-roledescription={hasCarousel ? 'carrusel' : undefined}
            aria-label={hasCarousel ? `Álbum de fotos: ${item.title}` : undefined}
          >
            <div className="relative">
              {showImage ? (
                <img
                  src={safeImageUrl}
                  alt={
                    hasCarousel
                      ? `${item.title} (foto ${activeIndex + 1} de ${galleryCount})`
                      : item.title
                  }
                  onError={() => setImgFailed(true)}
                  className="w-full max-h-[420px] aspect-video object-cover block"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="aspect-video w-full bg-gradient-to-br from-[#d9f7f8] via-[#f5f5f5] to-[#f6e6ef] flex flex-col items-center justify-center p-6 text-center"
                >
                  <span className="w-12 h-12 rounded-full bg-white border border-[#d4d7dc] text-[#0a5961] inline-flex items-center justify-center shadow-2xs mb-2">
                    <Camera className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold text-[#1a1a1a]">
                    Centro Cristiano Oasis
                  </span>
                  <span className="text-xs font-medium text-[#4a4f57] mt-0.5">
                    Recuerdo de nuestra comunidad
                  </span>
                </div>
              )}

              {hasCarousel && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Anterior"
                    className={`${carouselButtonClass} left-2`}
                  >
                    <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Siguiente"
                    className={`${carouselButtonClass} right-2`}
                  >
                    <ChevronRight className="w-6 h-6" aria-hidden="true" />
                  </button>
                  <span
                    className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-[#1a1a1a]/85 text-white text-xs font-bold"
                    aria-live="polite"
                  >
                    {activeIndex + 1} / {galleryCount}
                  </span>
                </>
              )}
            </div>

            {hasCarousel && (
              <ul
                className="flex gap-2 overflow-x-auto p-2.5 bg-white"
                aria-label="Miniaturas del álbum"
              >
                {galleryUrls.map((url, idx) => (
                  <li key={`${url}-${idx}`} className="flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`Ver foto ${idx + 1} de ${galleryCount}`}
                      aria-current={idx === activeIndex ? 'true' : undefined}
                      className={`block w-14 h-14 min-w-[44px] min-h-[44px] rounded-[10px] overflow-hidden border-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0e7c86] ${
                        idx === activeIndex
                          ? 'border-[#0e7c86]'
                          : 'border-[#d4d7dc] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover block"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Contenido textual (SIEMPRE nodo de texto plano, 0 dangerouslySetInnerHTML) */}
          <div className="p-5 sm:p-6 space-y-4">
            <h2
              id="vida-oasis-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-[#1a1a1a] leading-snug break-words"
            >
              {item.title}
            </h2>

            <p className="text-sm sm:text-base text-[#1a1a1a] leading-relaxed whitespace-pre-line break-words">
              {item.summary}
            </p>
          </div>
        </div>

        {/* Pie del modal con botón táctil Cerrar (>= 44px) */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-[#d4d7dc] bg-[#f5f5f5] flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-[10px] bg-[#0e7c86] hover:bg-[#0a5961] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
