import React from 'react';
import { HeadcountMonthSummary, EventHeadcount } from '../../types/headcount';
import { ChurchEvent } from '../../types/events';
import { MONTH_NAMES_ES, formatEventFriendlyDate, formatEventTime } from '../../lib/useEvents';
import {
  Users,
  X,
  TrendingUp,
  Award,
  Sparkles,
  UserCheck,
  CalendarDays,
  Clock,
  FileText,
} from 'lucide-react';

interface HeadcountMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: HeadcountMonthSummary;
  events: ChurchEvent[];
  headcountsByEvent: Record<string, EventHeadcount>;
  selectedMonth: number;
  selectedYear: number;
}

export const HeadcountMetricsModal: React.FC<HeadcountMetricsModalProps> = ({
  isOpen,
  onClose,
  summary,
  events,
  headcountsByEvent,
  selectedMonth,
  selectedYear,
}) => {
  if (!isOpen) return null;

  // Filtrar eventos de este mes que tengan conteo registrado
  const eventsWithHeadcount = events
    .filter((e) => !!headcountsByEvent[e.id])
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 sm:p-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-blue-200" />
                Métricas Eclesiales
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                Resumen de Asistencia · {MONTH_NAMES_ES[selectedMonth]} {selectedYear}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors"
              title="Cerrar"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {summary.totalEventsWithAttendance === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Sin registros de asistencia en este mes
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Aún no has registrado conteos en las actividades de {MONTH_NAMES_ES[selectedMonth]} {selectedYear}. Haz clic en "Conteo de Asistencia" en cualquier actividad para comenzar.
              </p>
            </div>
          ) : (
            <>
              {/* Tarjetas Principales de KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. Asistencia Promedio */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Promedio
                    </span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-blue-900 tracking-tight">
                        {summary.averageAttendance}
                      </span>
                      <span className="text-xs font-bold text-slate-500">pers. / culto</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      En {summary.totalEventsWithAttendance} {summary.totalEventsWithAttendance === 1 ? 'reunión' : 'reuniones'}
                    </span>
                  </div>
                </div>

                {/* 2. Total Asistencias del Mes */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Total Acumulado
                    </span>
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-emerald-900 tracking-tight">
                        {summary.totalAttendees}
                      </span>
                      <span className="text-xs font-bold text-slate-500">asistencias</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Suma total del mes
                    </span>
                  </div>
                </div>

                {/* 3. Culto Mayor Asistencia */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                      Pico Máximo
                    </span>
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-amber-900 tracking-tight">
                        {summary.highestEvent?.total || 0}
                      </span>
                      <span className="text-xs font-bold text-slate-500">asistentes</span>
                    </div>
                    <span className="text-[11px] text-amber-800 font-medium truncate mt-0.5 block" title={summary.highestEvent?.title}>
                      {summary.highestEvent?.title || 'Sin datos'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desglose Congregacional Acumulado */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Desglose Acumulado del Mes
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-semibold">Adultos</span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      {summary.totalAdults}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-semibold">Niños</span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      {summary.totalChildren}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-semibold">Visitas</span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      {summary.totalVisitors}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista Detallada de Cultos con Asistencia */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Histórico de Cultos Registrados ({eventsWithHeadcount.length})
                </h4>
                <div className="space-y-2.5">
                  {eventsWithHeadcount.map((ev) => {
                    const hc = headcountsByEvent[ev.id];
                    if (!hc) return null;
                    return (
                      <div
                        key={ev.id}
                        className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-200 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                              {ev.title}
                            </h5>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-slate-400" />
                              {formatEventFriendlyDate(ev.start_time)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {formatEventTime(ev.start_time)}
                            </span>
                          </div>
                          {hc.notes && (
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1.5 flex items-start gap-1">
                              <FileText className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                              <span>{hc.notes}</span>
                            </p>
                          )}
                        </div>

                        {/* Indicadores de Asistencia */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700">
                            <span title="Adultos">Ad: <strong>{hc.adults_count}</strong></span>
                            <span>•</span>
                            <span title="Niños">Niñ: <strong>{hc.children_count}</strong></span>
                            <span>•</span>
                            <span title="Visitas">Vis: <strong>{hc.visitors_count}</strong></span>
                          </div>

                          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl font-bold text-sm min-w-[50px] text-center shadow-sm">
                            {hc.total_count}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pie con botón de cierre */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 rounded-xl font-semibold text-sm transition-colors min-h-[44px]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
