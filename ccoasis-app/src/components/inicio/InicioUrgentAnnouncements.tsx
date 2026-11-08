import React from 'react';
import { useAnnouncements, formatAnnouncementDate, formatAnnouncementDateTime } from '../../lib/useAnnouncements';
import { DashboardErrorState } from './DashboardErrorState';
import { DashboardSkeleton } from './DashboardSkeleton';
import { AlertCircle, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Announcement } from '../../types/announcements';

export const InicioUrgentAnnouncements: React.FC = () => {
  const { activeAnnouncements, loading, error, refetch } = useAnnouncements();

  // Filtrar únicamente los avisos urgentes o importantes (máximo 3)
  const urgentOrImportant = activeAnnouncements
    .filter((a) => a.priority === 'urgente' || a.priority === 'importante')
    .slice(0, 3);

  // 1. Estado de carga
  if (loading) {
    return <DashboardSkeleton lines={1} className="border-amber-200" />;
  }

  // 2. Estado de error (NUNCA mostrar vacío ante un fallo de red o RLS)
  if (error) {
    return (
      <DashboardErrorState
        title="No se pudieron cargar los avisos prioritarios"
        message={error}
        onRetry={refetch}
      />
    );
  }

  // 3. Si no hay avisos de alta prioridad vigentes, no ocupamos espacio en la parte superior
  if (urgentOrImportant.length === 0) {
    return null;
  }

  // 4. Renderizado de avisos urgentes / importantes (máx 3)
  return (
    <section aria-label="Avisos urgentes e importantes" className="space-y-3">
      {urgentOrImportant.map((item: Announcement) => {
        const isUrgent = item.priority === 'urgente';

        return (
          <article
            key={item.id}
            className={`p-4 sm:p-5 rounded-[12px] border transition-all shadow-xs ${
              isUrgent
                ? 'bg-[#fdecec] border-[#c0392b] text-[#9b1c1c]'
                : 'bg-[#fdf3d6] border-[#a8741a] text-[#713f12]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs ${
                  isUrgent
                    ? 'bg-[#fbdada] text-[#c0392b]'
                    : 'bg-[#fae7b5] text-[#a8741a]'
                }`}
                aria-hidden="true"
              >
                {isUrgent ? (
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                      isUrgent
                        ? 'bg-[#c0392b] text-white'
                        : 'bg-[#a8741a] text-white'
                    }`}
                  >
                    {isUrgent ? 'Aviso urgente' : 'Aviso importante'}
                  </span>
                  <span className="text-xs opacity-80 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{formatAnnouncementDate(item.created_at)}</span>
                  </span>
                </div>

                <h3
                  className={`text-base font-bold leading-snug ${
                    isUrgent ? 'text-[#7d1414]' : 'text-[#5a320d]'
                  }`}
                >
                  {item.title}
                </h3>

                <p
                  className={`text-xs sm:text-sm whitespace-pre-line leading-relaxed ${
                    isUrgent ? 'text-[#871919]' : 'text-[#63370f]'
                  }`}
                >
                  {item.message}
                </p>

                {item.expires_at && (
                  <div
                    className={`pt-1.5 flex items-center gap-1.5 text-xs font-semibold ${
                      isUrgent ? 'text-[#871919]' : 'text-[#63370f]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Válido hasta: {formatAnnouncementDateTime(item.expires_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
};
