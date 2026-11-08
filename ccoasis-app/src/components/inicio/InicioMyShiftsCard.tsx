import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  FileText,
} from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardEmptyState } from './DashboardEmptyState';
import { DashboardErrorState } from './DashboardErrorState';
import { MyShiftItem } from '../../lib/useInicioDashboard';
import { CHURCH_ROLES_CONFIG } from '../../types/assignments';
import { formatEventFriendlyDate, formatEventTime } from '../../lib/useEvents';

export interface InicioMyShiftsCardProps {
  shifts: MyShiftItem[];
  isLoading: boolean;
  error: string | null;
  isPersonLinked: boolean | null;
  onRetry: () => void;
}

export const InicioMyShiftsCard: React.FC<InicioMyShiftsCardProps> = ({
  shifts,
  isLoading,
  error,
  isPersonLinked,
  onRetry,
}) => {
  return (
    <DashboardCard
      icon={<CalendarCheck className="w-5 h-5 text-[#0e7c86]" />}
      title="Mis turnos"
      subtitle="Tus asignaciones de servicio en próximos cultos y eventos"
      action={{ label: 'Ver todo', to: '/calendario' }}
      badge={
        shifts.length > 0 ? (
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]/30">
            {shifts.length} {shifts.length === 1 ? 'turno' : 'turnos'}
          </span>
        ) : undefined
      }
    >
      {/* 1. Estado de carga */}
      {isLoading ? (
        <DashboardSkeleton lines={3} hasHeader={false} className="border-none p-0" />
      ) : error ? (
        /* 2. Estado de error (NUNCA mostrar vacío ante fallo de red o servidor) */
        <DashboardErrorState
          title="No se pudieron cargar tus turnos"
          message={error}
          onRetry={onRetry}
        />
      ) : isPersonLinked === false ? (
        /* 3. Aviso amigable si la persona no tiene ficha vinculada */
        <div className="p-4 rounded-[10px] bg-[#f5f5f5] border border-[#d4d7dc] flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-[8px] bg-white border border-[#d4d7dc] text-[#767b83] flex items-center justify-center flex-shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <UserCheck className="w-4 h-4 text-[#0e7c86]" />
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-bold text-[#1a1a1a]">Ficha de miembro no vinculada</p>
            <p className="text-[#4a4f57] leading-relaxed">
              Tu cuenta de acceso aún no está vinculada a tu ficha de miembro o servidor. Pídele al
              administrador o pastor que la vincule para poder ver tus turnos asignados.
            </p>
          </div>
        </div>
      ) : shifts.length === 0 ? (
        /* 4. Estado vacío si no tiene turnos programados */
        <DashboardEmptyState
          icon={<CalendarCheck className="w-5 h-5 text-[#4a4f57]" />}
          title="Sin turnos asignados"
          description="No tienes turnos o responsabilidades programadas en los próximos eventos del calendario."
          action={{ label: 'Ver calendario', to: '/calendario' }}
        />
      ) : (
        /* 5. Lista de turnos próximos (máximo 3) */
        <div className="space-y-3">
          {shifts.map((shift) => {
            const roleCfg =
              CHURCH_ROLES_CONFIG[shift.roleType] || {
                label: shift.roleType,
                shortLabel: shift.roleType,
                badgeBg: 'bg-slate-100',
                badgeText: 'text-slate-800',
                badgeBorder: 'border-slate-300',
                description: '',
              };

            return (
              <div
                key={shift.id}
                className="p-3.5 sm:p-4 rounded-[10px] bg-white border border-[#d4d7dc] hover:border-[#0e7c86]/40 transition-colors shadow-2xs space-y-2.5"
              >
                {/* Cabecera del turno: Rol asignado */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                    <span>{roleCfg.label}</span>
                  </span>

                  <span className="text-[11px] text-[#4a4f57] font-medium">
                    {formatEventTime(shift.event.startTime)}
                  </span>
                </div>

                {/* Título del evento */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1a1a1a] leading-snug">
                    {shift.event.title}
                  </h3>
                </div>

                {/* Fecha, hora y lugar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#4a4f57] pt-0.5">
                  <div className="flex items-center gap-1.5 text-[#1a1a1a] font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
                    <span>{formatEventFriendlyDate(shift.event.startTime)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
                    <span>
                      {formatEventTime(shift.event.startTime)}
                      {shift.event.endTime ? ` - ${formatEventTime(shift.event.endTime)}` : ''}
                    </span>
                  </div>

                  {shift.event.location && (
                    <div className="flex items-center gap-1.5 sm:col-span-2 text-[#4a4f57]">
                      <MapPin className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
                      <span className="truncate">{shift.event.location}</span>
                    </div>
                  )}
                </div>

                {/* Notas de la asignación si existen */}
                {shift.notes && (
                  <div className="p-2 rounded-[6px] bg-[#f5f5f5] text-[11px] text-[#4a4f57] flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="italic">{shift.notes}</span>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-1 text-center sm:text-right">
            <Link
              to="/calendario"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px]"
            >
              <span>Ver todos los eventos y turnos en el calendario &rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </DashboardCard>
  );
};
