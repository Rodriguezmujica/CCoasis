import React, { useState, useEffect } from 'react';
import {
  Announcement,
  AnnouncementPriority,
  PRIORITY_CONFIG,
} from '../../types/announcements';
import {
  formatAnnouncementDate,
  formatAnnouncementDateTime,
} from '../../lib/useAnnouncements';
import {
  Megaphone,
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Settings,
  Edit2,
} from 'lucide-react';

interface AnnouncementsBannerProps {
  announcements: Announcement[];
  isAdmin: boolean;
  onOpenCreate: () => void;
  onOpenManager: () => void;
  onOpenEdit: (announcement: Announcement) => void;
}

export const AnnouncementsBanner: React.FC<AnnouncementsBannerProps> = ({
  announcements,
  isAdmin,
  onOpenCreate,
  onOpenManager,
  onOpenEdit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Asegurar que el índice no quede fuera de rango si cambia la lista
  useEffect(() => {
    if (currentIndex >= announcements.length && announcements.length > 0) {
      setCurrentIndex(0);
    }
  }, [announcements.length, currentIndex]);

  // Si no hay avisos activos y no es admin, no renderizar nada
  if (announcements.length === 0) {
    if (!isAdmin) return null;

    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Tablón Parroquial de Avisos
            </p>
            <p className="text-xs text-slate-500">
              No hay comunicados vigentes para la congregación.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenManager}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver historial</span>
          </button>
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Redactar aviso</span>
          </button>
        </div>
      </div>
    );
  }

  const current = announcements[currentIndex];
  const priorityConfig = PRIORITY_CONFIG[current.priority];
  const total = announcements.length;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  const getPriorityIcon = (p: AnnouncementPriority) => {
    switch (p) {
      case 'urgente':
        return <AlertCircle className="w-5 h-5 text-rose-600 animate-pulse" />;
      case 'importante':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'normal':
      default:
        return <Megaphone className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div
      className={`rounded-2xl border shadow-sm transition-all overflow-hidden ${
        current.priority === 'urgente'
          ? 'bg-gradient-to-r from-rose-50 via-red-50 to-rose-100/60 border-rose-300 ring-1 ring-rose-300/60'
          : current.priority === 'importante'
          ? 'bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-100/50 border-amber-300'
          : 'bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50/50 border-blue-200'
      }`}
    >
      <div className="p-4 sm:p-5 space-y-3">
        {/* Fila superior: Badge de prioridad, contador de carrusel y acciones */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Distintivo de Prioridad */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${priorityConfig.badgeBg} ${priorityConfig.badgeText} ${priorityConfig.badgeBorder}`}
            >
              {getPriorityIcon(current.priority)}
              <span>{priorityConfig.label}</span>
            </span>

            {/* Contador de anuncios si hay más de 1 */}
            {total > 1 && (
              <span className="text-[11px] font-semibold text-slate-500 bg-white/70 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-200/80">
                {currentIndex + 1} de {total}
              </span>
            )}
          </div>

          {/* Acciones de administración y carrusel */}
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  onClick={() => onOpenEdit(current)}
                  title="Editar este aviso"
                  className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 text-xs font-semibold flex items-center gap-1 transition-colors min-h-[34px]"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-[11px] hidden md:inline">Editar</span>
                </button>
                <button
                  onClick={onOpenManager}
                  title="Administrar tablón de avisos"
                  className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 text-xs font-semibold flex items-center gap-1 transition-colors min-h-[34px]"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-[11px] hidden sm:inline">Gestionar</span>
                </button>
              </div>
            )}

            {/* Controles del Carrusel (si hay más de 1 aviso) */}
            {total > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  aria-label="Aviso anterior"
                  className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white active:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Siguiente aviso"
                  className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white active:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Título y Mensaje */}
        <div className="space-y-1.5">
          <h3
            className={`text-base sm:text-lg font-bold leading-snug ${
              current.priority === 'urgente'
                ? 'text-rose-950'
                : current.priority === 'importante'
                ? 'text-amber-950'
                : 'text-slate-900'
            }`}
          >
            {current.title}
          </h3>

          <p
            className={`text-xs sm:text-sm whitespace-pre-line leading-relaxed ${
              current.priority === 'urgente'
                ? 'text-rose-900/90'
                : current.priority === 'importante'
                ? 'text-amber-900/90'
                : 'text-slate-700'
            }`}
          >
            {current.message}
          </p>
        </div>

        {/* Metadatos: Fecha de publicación y caducidad */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/5 text-[11px] text-slate-500">
          <span>Publicado el {formatAnnouncementDate(current.created_at)}</span>

          {current.expires_at && (
            <div className="flex items-center gap-1 font-medium text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Válido hasta: {formatAnnouncementDateTime(current.expires_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
