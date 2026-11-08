import React from 'react';
import { useAnnouncements, formatAnnouncementDate, formatAnnouncementDateTime } from '../../lib/useAnnouncements';
import { DashboardCard } from './DashboardCard';
import { DashboardEmptyState } from './DashboardEmptyState';
import { DashboardErrorState } from './DashboardErrorState';
import { DashboardSkeleton } from './DashboardSkeleton';
import { Megaphone, Calendar, Clock } from 'lucide-react';
import { Announcement } from '../../types/announcements';

export const InicioNormalAnnouncements: React.FC = () => {
  const { activeAnnouncements, loading, error, refetch } = useAnnouncements();

  // Filtrar avisos normales vigentes (máximo 3)
  const normalAnnouncements = activeAnnouncements
    .filter((a) => a.priority === 'normal')
    .slice(0, 3);

  // 1. Estado de carga
  if (loading) {
    return (
      <DashboardCard
        icon={<Megaphone className="w-5 h-5 text-[#0e7c86]" />}
        title="Avisos de la congregación"
        action={{ label: 'Ver todos', to: '/calendario' }}
      >
        <DashboardSkeleton lines={2} hasHeader={false} className="border-none p-0" />
      </DashboardCard>
    );
  }

  // 2. Estado de error (NUNCA mostrar vacío ante un error de red o RLS)
  if (error) {
    return (
      <DashboardCard
        icon={<Megaphone className="w-5 h-5 text-[#0e7c86]" />}
        title="Avisos de la congregación"
        action={{ label: 'Ver todos', to: '/calendario' }}
      >
        <DashboardErrorState
          title="No se pudieron cargar los avisos"
          message={error}
          onRetry={refetch}
        />
      </DashboardCard>
    );
  }

  // 3. Estado vacío amable si no hay comunicados generales
  if (normalAnnouncements.length === 0) {
    return (
      <DashboardCard
        icon={<Megaphone className="w-5 h-5 text-[#0e7c86]" />}
        title="Avisos de la congregación"
        action={{ label: 'Ver todos', to: '/calendario' }}
      >
        <DashboardEmptyState
          icon={<Megaphone className="w-5 h-5 text-[#4a4f57]" />}
          title="Sin comunicados generales"
          description="No hay avisos generales vigentes por el momento en la congregación."
        />
      </DashboardCard>
    );
  }

  // 4. Lista de avisos normales (máximo 3)
  return (
    <DashboardCard
      icon={<Megaphone className="w-5 h-5 text-[#0e7c86]" />}
      title="Avisos de la congregación"
      action={{ label: 'Ver todos', to: '/calendario' }}
      badge={
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#d9f7f8] text-[#0a5961]">
          {normalAnnouncements.length}
        </span>
      }
    >
      <div className="space-y-3">
        {normalAnnouncements.map((announcement: Announcement) => (
          <article
            key={announcement.id}
            className="p-3.5 sm:p-4 rounded-[10px] bg-[#f5f5f5] border border-[#d4d7dc] space-y-2 hover:border-[#767b83] transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ebedef] text-[#1a1a1a] border border-[#d4d7dc]">
                General
              </span>
              <span className="text-xs text-[#4a4f57] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{formatAnnouncementDate(announcement.created_at)}</span>
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-[#1a1a1a] leading-snug">
              {announcement.title}
            </h3>

            <p className="text-xs sm:text-sm text-[#4a4f57] whitespace-pre-line leading-relaxed">
              {announcement.message}
            </p>

            {announcement.expires_at && (
              <div className="pt-1 flex items-center gap-1.5 text-xs text-[#4a4f57] font-medium border-t border-[#ebedef]">
                <Clock className="w-3.5 h-3.5 text-[#767b83]" aria-hidden="true" />
                <span>Válido hasta: {formatAnnouncementDateTime(announcement.expires_at)}</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </DashboardCard>
  );
};
