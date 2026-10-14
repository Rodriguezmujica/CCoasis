import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HeadcountMonthSummary, EventHeadcount } from '../../types/headcount';
import { ChurchEvent, EVENT_TYPES_CONFIG } from '../../types/events';
import { MONTH_NAMES_ES, formatEventFriendlyDate, formatEventTime } from '../../lib/useEvents';
import { supabase } from '../../lib/supabase';
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
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface HeadcountMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: HeadcountMonthSummary;
  events: ChurchEvent[];
  headcountsByEvent: Record<string, EventHeadcount>;
  selectedMonth: number;
  selectedYear: number;
  onSelectMonthYear?: (month: number, year: number) => void;
}

interface YearCacheEntry {
  events: ChurchEvent[];
  headcounts: Record<string, EventHeadcount>;
}

interface HighestEventInfo {
  title: string;
  date: string;
  total: number;
}

export const HeadcountMetricsModal: React.FC<HeadcountMetricsModalProps> = ({
  isOpen,
  onClose,
  events: propEvents,
  headcountsByEvent: propHeadcounts,
  selectedMonth,
  selectedYear,
  onSelectMonthYear,
}) => {
  // Modo de visualización: mensual o anual/histórico
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  // Mes y año activos dentro del modal para navegación independiente
  const [modalMonth, setModalMonth] = useState<number>(selectedMonth);
  const [modalYear, setModalYear] = useState<number>(selectedYear);

  // Caché de eventos y conteos por año para navegación instantánea sin peticiones repetidas
  const [yearDataCache, setYearDataCache] = useState<Record<number, YearCacheEntry>>({});
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // Fecha del sistema para referencias
  const today = useMemo(() => new Date(), []);
  const currentSystemYear = today.getFullYear();
  const currentSystemMonth = today.getMonth();

  // Lista de años disponibles para el selector
  const yearsAvailable = useMemo(() => {
    const set = new Set([
      currentSystemYear - 2,
      currentSystemYear - 1,
      currentSystemYear,
      currentSystemYear + 1,
      modalYear,
      selectedYear,
    ]);
    return Array.from(set).sort((a, b) => a - b);
  }, [currentSystemYear, modalYear, selectedYear]);

  // Sincronizar estado cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      setModalMonth(selectedMonth);
      setModalYear(selectedYear);
      setViewMode('month');
    }
  }, [isOpen, selectedMonth, selectedYear]);

  // Cargar datos de todo el año seleccionado desde Supabase
  const fetchYearData = useCallback(
    async (year: number, forceRefresh = false) => {
      if (!forceRefresh && yearDataCache[year]) {
        return;
      }

      setIsFetching(true);
      try {
        const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0).toISOString();
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999).toISOString();

        // 1. Obtener eventos de todo el año
        const { data: eventsData, error: eventsErr } = await supabase
          .from('church_events')
          .select('*')
          .is('deleted_at', null)
          .gte('start_time', startOfYear)
          .lte('start_time', endOfYear)
          .order('start_time', { ascending: true });

        if (eventsErr) throw eventsErr;

        const loadedEvents = (eventsData as ChurchEvent[]) || [];
        const hcMap: Record<string, EventHeadcount> = {};

        // 2. Obtener los conteos de asistencia de todos los eventos del año
        if (loadedEvents.length > 0) {
          const eventIds = loadedEvents.map((e) => e.id);
          const { data: hcData, error: hcErr } = await supabase
            .from('church_event_headcount')
            .select('*')
            .in('event_id', eventIds);

          if (hcErr) throw hcErr;

          (hcData || []).forEach((item: EventHeadcount) => {
            hcMap[item.event_id] = item;
          });
        }

        setYearDataCache((prev) => ({
          ...prev,
          [year]: {
            events: loadedEvents,
            headcounts: hcMap,
          },
        }));
      } catch (err: any) {
        console.error('Error al cargar datos anuales de asistencia:', err);
      } finally {
        setIsFetching(false);
      }
    },
    [yearDataCache]
  );

  // Disparar carga cuando el modal esté abierto o cambie modalYear
  useEffect(() => {
    if (isOpen) {
      fetchYearData(modalYear);
    }
  }, [isOpen, modalYear, fetchYearData]);

  if (!isOpen) return null;

  // Obtener eventos y conteos del año actual en memoria (o fallback a props si aún carga)
  const cached = yearDataCache[modalYear];
  const allYearEvents: ChurchEvent[] =
    cached?.events ?? (modalYear === selectedYear ? propEvents : []);
  const allYearHeadcounts: Record<string, EventHeadcount> =
    cached?.headcounts ?? (modalYear === selectedYear ? propHeadcounts : {});

  // Navegación de mes anterior / siguiente en Vista Mensual
  const handlePrevMonth = () => {
    if (modalMonth === 0) {
      setModalMonth(11);
      setModalYear((y) => y - 1);
    } else {
      setModalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (modalMonth === 11) {
      setModalMonth(0);
      setModalYear((y) => y + 1);
    } else {
      setModalMonth((m) => m + 1);
    }
  };

  const handleGoCurrentMonth = () => {
    setModalMonth(currentSystemMonth);
    setModalYear(currentSystemYear);
  };

  const isCurrentMonthSelected =
    modalMonth === currentSystemMonth && modalYear === currentSystemYear;

  // -------------------------------------------------------------
  // CÁLCULOS VISTA MENSUAL
  // -------------------------------------------------------------
  const monthEventsWithHeadcount = allYearEvents
    .filter((e) => {
      const d = new Date(e.start_time);
      return (
        d.getFullYear() === modalYear &&
        d.getMonth() === modalMonth &&
        !!allYearHeadcounts[e.id]
      );
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

  let monthTotalAdults = 0;
  let monthTotalChildren = 0;
  let monthTotalVisitors = 0;
  let monthTotalAttendees = 0;
  let monthHighestEvent: HighestEventInfo | null = null;

  for (const ev of monthEventsWithHeadcount) {
    const hc = allYearHeadcounts[ev.id];
    if (hc) {
      monthTotalAdults += hc.adults_count;
      monthTotalChildren += hc.children_count;
      monthTotalVisitors += hc.visitors_count;
      monthTotalAttendees += hc.total_count;

      if (!monthHighestEvent || hc.total_count > monthHighestEvent.total) {
        monthHighestEvent = {
          title: ev.title,
          date: ev.start_time,
          total: hc.total_count,
        };
      }
    }
  }

  const monthTotalEventsCount = monthEventsWithHeadcount.length;
  const monthAverageAttendance =
    monthTotalEventsCount > 0
      ? Math.round(monthTotalAttendees / monthTotalEventsCount)
      : 0;

  // -------------------------------------------------------------
  // CÁLCULOS VISTA ANUAL / HISTÓRICO
  // -------------------------------------------------------------
  const yearEventsWithHeadcount = allYearEvents
    .filter((e) => {
      const d = new Date(e.start_time);
      return d.getFullYear() === modalYear && !!allYearHeadcounts[e.id];
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

  let yearTotalAdults = 0;
  let yearTotalChildren = 0;
  let yearTotalVisitors = 0;
  let yearTotalAttendees = 0;
  let yearHighestEvent: HighestEventInfo | null = null;

  for (const ev of yearEventsWithHeadcount) {
    const hc = allYearHeadcounts[ev.id];
    if (hc) {
      yearTotalAdults += hc.adults_count;
      yearTotalChildren += hc.children_count;
      yearTotalVisitors += hc.visitors_count;
      yearTotalAttendees += hc.total_count;

      if (!yearHighestEvent || hc.total_count > yearHighestEvent.total) {
        yearHighestEvent = {
          title: ev.title,
          date: ev.start_time,
          total: hc.total_count,
        };
      }
    }
  }

  const yearTotalEventsCount = yearEventsWithHeadcount.length;
  const yearAverageAttendance =
    yearTotalEventsCount > 0
      ? Math.round(yearTotalAttendees / yearTotalEventsCount)
      : 0;

  // Tabla resumen mes por mes para la vista anual
  const monthsSummaryTable = useMemo(() => {
    return Array.from({ length: 12 }, (_, mIndex) => {
      const eventsInM = yearEventsWithHeadcount.filter((e) => {
        const d = new Date(e.start_time);
        return d.getMonth() === mIndex;
      });

      let attendees = 0;
      let adults = 0;
      let children = 0;
      let visitors = 0;

      eventsInM.forEach((e) => {
        const hc = allYearHeadcounts[e.id];
        if (hc) {
          attendees += hc.total_count;
          adults += hc.adults_count;
          children += hc.children_count;
          visitors += hc.visitors_count;
        }
      });

      const avg =
        eventsInM.length > 0 ? Math.round(attendees / eventsInM.length) : 0;

      return {
        monthIndex: mIndex,
        monthName: MONTH_NAMES_ES[mIndex],
        totalEvents: eventsInM.length,
        totalAttendees: attendees,
        averageAttendance: avg,
        adults,
        children,
        visitors,
      };
    });
  }, [yearEventsWithHeadcount, allYearHeadcounts]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Cabecera Principal con gradiente y controles de periodo */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 sm:p-6 flex-shrink-0 space-y-4">
          {/* Fila Superior: Badge, Título Dinámico y Botón Cerrar */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-200" />
                  Métricas Eclesiales
                </span>
                {isFetching && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-900/50 text-blue-200 border border-blue-400/30">
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-300" />
                    Cargando año...
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                {viewMode === 'month'
                  ? `Resumen de Asistencia · ${MONTH_NAMES_ES[modalMonth]} ${modalYear}`
                  : `Resumen Anual e Histórico · ${modalYear}`}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors"
              title="Cerrar modal"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Fila Inferior de la Cabecera: Alternar modo y Navegación de periodo */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-white/15">
            {/* Pestañas de modo: Vista Mensual vs Resumen Anual / Histórico */}
            <div className="inline-flex p-1 bg-black/25 backdrop-blur-md rounded-2xl border border-white/10 self-start">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  viewMode === 'month'
                    ? 'bg-white text-blue-900 shadow-md font-bold'
                    : 'text-white/85 hover:text-white hover:bg-white/10'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Vista Mensual</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('year')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  viewMode === 'year'
                    ? 'bg-white text-blue-900 shadow-md font-bold'
                    : 'text-white/85 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Resumen Anual / Histórico</span>
              </button>
            </div>

            {/* Controles de Navegación por Periodo */}
            {viewMode === 'month' ? (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-2xl border border-white/15 self-start sm:self-auto shadow-sm">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl hover:bg-white/20 active:bg-white/30 text-white transition-colors"
                  title="Mes anterior"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 px-1">
                  <select
                    value={modalMonth}
                    onChange={(e) => setModalMonth(Number(e.target.value))}
                    className="bg-transparent text-white font-bold text-xs sm:text-sm border-none focus:outline-none focus:ring-0 cursor-pointer appearance-none hover:opacity-90"
                    aria-label="Seleccionar mes"
                  >
                    {MONTH_NAMES_ES.map((name, i) => (
                      <option key={i} value={i} className="text-slate-900 bg-white">
                        {name}
                      </option>
                    ))}
                  </select>
                  <span className="text-white/60 font-light">/</span>
                  <select
                    value={modalYear}
                    onChange={(e) => setModalYear(Number(e.target.value))}
                    className="bg-transparent text-white font-bold text-xs sm:text-sm border-none focus:outline-none focus:ring-0 cursor-pointer appearance-none hover:opacity-90"
                    aria-label="Seleccionar año"
                  >
                    {yearsAvailable.map((y) => (
                      <option key={y} value={y} className="text-slate-900 bg-white">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl hover:bg-white/20 active:bg-white/30 text-white transition-colors"
                  title="Mes siguiente"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {!isCurrentMonthSelected && (
                  <button
                    type="button"
                    onClick={handleGoCurrentMonth}
                    className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                    title="Volver al mes actual"
                  >
                    Hoy
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2 py-1 rounded-2xl border border-white/15 self-start sm:self-auto shadow-sm">
                <button
                  type="button"
                  onClick={() => setModalYear((y) => y - 1)}
                  className="p-1.5 rounded-xl hover:bg-white/20 active:bg-white/30 text-white transition-colors"
                  title="Año anterior"
                  aria-label="Año anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  value={modalYear}
                  onChange={(e) => setModalYear(Number(e.target.value))}
                  className="bg-transparent text-white font-bold text-xs sm:text-sm border-none focus:outline-none focus:ring-0 cursor-pointer appearance-none px-2 hover:opacity-90"
                  aria-label="Seleccionar año"
                >
                  {yearsAvailable.map((y) => (
                    <option key={y} value={y} className="text-slate-900 bg-white">
                      Año {y}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setModalYear((y) => y + 1)}
                  className="p-1.5 rounded-xl hover:bg-white/20 active:bg-white/30 text-white transition-colors"
                  title="Año siguiente"
                  aria-label="Año siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {modalYear !== currentSystemYear && (
                  <button
                    type="button"
                    onClick={() => setModalYear(currentSystemYear)}
                    className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                    title="Volver al año en curso"
                  >
                    {currentSystemYear}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contenido con scroll dinámico */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {viewMode === 'month' ? (
            /* ============================================================== */
            /* 1. VISTA MENSUAL                                                */
            /* ============================================================== */
            monthTotalEventsCount === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Sin registros de asistencia en {MONTH_NAMES_ES[modalMonth]} {modalYear}
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Aún no has registrado conteos en las actividades de este mes.
                  Usa las flechas superiores para consultar otros meses o cambia al Resumen Anual.
                </p>
              </div>
            ) : (
              <>
                {/* Tarjetas Principales de KPIs Mensuales */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* 1. Asistencia Promedio */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                        Promedio Mensual
                      </span>
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-blue-900 tracking-tight">
                          {monthAverageAttendance}
                        </span>
                        <span className="text-xs font-bold text-slate-500">pers. / culto</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        En {monthTotalEventsCount} {monthTotalEventsCount === 1 ? 'reunión' : 'reuniones'}
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
                          {monthTotalAttendees}
                        </span>
                        <span className="text-xs font-bold text-slate-500">asistencias</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Suma total en {MONTH_NAMES_ES[modalMonth]}
                      </span>
                    </div>
                  </div>

                  {/* 3. Culto con Mayor Asistencia */}
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
                          {monthHighestEvent?.total || 0}
                        </span>
                        <span className="text-xs font-bold text-slate-500">asistentes</span>
                      </div>
                      <span
                        className="text-[11px] text-amber-800 font-medium truncate mt-0.5 block"
                        title={monthHighestEvent?.title}
                      >
                        {monthHighestEvent?.title || 'Sin datos'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desglose Congregacional Acumulado del Mes */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Desglose Acumulado del Mes ({MONTH_NAMES_ES[modalMonth]} {modalYear})
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-semibold">Adultos</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        {monthTotalAdults}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-xs font-semibold">Niños</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        {monthTotalChildren}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold">Visitas</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        {monthTotalVisitors}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Historial Detallado de Reuniones Registradas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                      Historial de Reuniones Registradas ({monthEventsWithHeadcount.length})
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      {MONTH_NAMES_ES[modalMonth]} {modalYear}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {monthEventsWithHeadcount.map((ev) => {
                      const hc = allYearHeadcounts[ev.id];
                      if (!hc) return null;
                      const typeConfig = EVENT_TYPES_CONFIG[ev.event_type];

                      return (
                        <div
                          key={ev.id}
                          className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:border-blue-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                                {ev.title}
                              </h5>
                              {typeConfig && (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeConfig.badgeBg} ${typeConfig.badgeText} ${typeConfig.badgeBorder}`}
                                >
                                  {typeConfig.label}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-medium text-slate-600">
                                <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                                {formatEventFriendlyDate(ev.start_time)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {formatEventTime(ev.start_time)}
                              </span>
                              {ev.location && (
                                <span className="text-slate-400 truncate max-w-xs">
                                  • {ev.location}
                                </span>
                              )}
                            </div>

                            {hc.notes && (
                              <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-xl border border-slate-100 mt-1 flex items-start gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <span>{hc.notes}</span>
                              </p>
                            )}
                          </div>

                          {/* Indicadores de Asistencia */}
                          <div className="flex items-center gap-2.5 self-end sm:self-center flex-shrink-0">
                            <div className="flex items-center gap-2 bg-slate-100/90 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 border border-slate-200/70">
                              <span title="Adultos">
                                Ad: <strong className="text-blue-900">{hc.adults_count}</strong>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span title="Niños">
                                Niñ: <strong className="text-amber-900">{hc.children_count}</strong>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span title="Visitas">
                                Vis: <strong className="text-emerald-900">{hc.visitors_count}</strong>
                              </span>
                            </div>

                            <div
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3.5 py-1.5 rounded-xl font-black text-base min-w-[54px] text-center shadow-sm"
                              title="Asistencia Total"
                            >
                              {hc.total_count}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )
          ) : (
            /* ============================================================== */
            /* 2. RESUMEN ANUAL / HISTÓRICO                                   */
            /* ============================================================== */
            yearTotalEventsCount === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Sin registros de asistencia en el año {modalYear}
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Aún no se han registrado conteos de asistencia en las actividades de {modalYear}.
                  Puedes cambiar de año en la cabecera para consultar otros periodos.
                </p>
              </div>
            ) : (
              <>
                {/* Tarjetas Principales de KPIs Anuales */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* 1. Asistencia Promedio Anual */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 border border-indigo-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                        Promedio Anual
                      </span>
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-indigo-950 tracking-tight">
                          {yearAverageAttendance}
                        </span>
                        <span className="text-xs font-bold text-slate-500">pers. / culto</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        En {yearTotalEventsCount} {yearTotalEventsCount === 1 ? 'reunión registrada' : 'reuniones registradas'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Total Acumulado Anual */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        Total Acumulado {modalYear}
                      </span>
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-emerald-900 tracking-tight">
                          {yearTotalAttendees}
                        </span>
                        <span className="text-xs font-bold text-slate-500">asistencias</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Suma acumulada del año
                      </span>
                    </div>
                  </div>

                  {/* 3. Pico Máximo de Todo el Año */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                        Pico Máximo del Año
                      </span>
                      <Award className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-amber-900 tracking-tight">
                          {yearHighestEvent?.total || 0}
                        </span>
                        <span className="text-xs font-bold text-slate-500">asistentes</span>
                      </div>
                      <span
                        className="text-[11px] text-amber-800 font-medium truncate mt-0.5 block"
                        title={
                          yearHighestEvent
                            ? `${yearHighestEvent.title} (${formatEventFriendlyDate(yearHighestEvent.date)})`
                            : 'Sin datos'
                        }
                      >
                        {yearHighestEvent
                          ? `${yearHighestEvent.title} · ${formatEventFriendlyDate(yearHighestEvent.date)}`
                          : 'Sin datos'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desglose Congregacional Acumulado del Año */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Desglose Acumulado Anual ({modalYear})
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-semibold">Adultos</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        {yearTotalAdults}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-xs font-semibold">Niños</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        {yearTotalChildren}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-center gap-1 text-slate-600 mb-1">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold">Visitas</span>
                      </div>
                      <span className="text-xl font-bold text-slate-900">
                        {yearTotalVisitors}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Historial Detallado de Reuniones Registradas: Evolución Mes por Mes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                      Historial de Reuniones Registradas · Evolución Mes a Mes ({modalYear})
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      12 Meses
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] sm:text-xs uppercase tracking-wider">
                            <th className="py-3 px-3 sm:px-4">Mes</th>
                            <th className="py-3 px-2 sm:px-3 text-center">Reuniones</th>
                            <th className="py-3 px-2 sm:px-3 text-right">Promedio</th>
                            <th className="py-3 px-2 sm:px-3 text-right">Acumulado</th>
                            <th className="py-3 px-2 sm:px-4 text-center hidden md:table-cell">
                              Desglose (Ad / Niñ / Vis)
                            </th>
                            <th className="py-3 px-3 sm:px-4 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {monthsSummaryTable.map((row) => {
                            const hasData = row.totalEvents > 0;
                            return (
                              <tr
                                key={row.monthIndex}
                                className={`transition-colors ${
                                  hasData
                                    ? 'hover:bg-blue-50/50 bg-white'
                                    : 'bg-slate-50/30 text-slate-400'
                                }`}
                              >
                                <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold text-slate-800">
                                  <span className="flex items-center gap-1.5">
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        hasData ? 'bg-blue-600' : 'bg-slate-300'
                                      }`}
                                    />
                                    {row.monthName}
                                  </span>
                                </td>
                                <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center">
                                  {hasData ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                      {row.totalEvents} {row.totalEvents === 1 ? 'culto' : 'cultos'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">0</span>
                                  )}
                                </td>
                                <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-right font-bold text-slate-700">
                                  {hasData ? `${row.averageAttendance} pers.` : '-'}
                                </td>
                                <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-right font-extrabold text-blue-900">
                                  {hasData ? row.totalAttendees : '-'}
                                </td>
                                <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-center hidden md:table-cell">
                                  {hasData ? (
                                    <span className="text-xs text-slate-600 font-medium">
                                      <span title="Adultos" className="text-blue-700 font-semibold">
                                        {row.adults}
                                      </span>
                                      {' / '}
                                      <span title="Niños" className="text-amber-700 font-semibold">
                                        {row.children}
                                      </span>
                                      {' / '}
                                      <span title="Visitas" className="text-emerald-700 font-semibold">
                                        {row.visitors}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                                <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalMonth(row.monthIndex);
                                      setViewMode('month');
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-100/70 active:bg-blue-200 px-2.5 py-1 rounded-lg transition-colors"
                                    title={`Ver detalle de ${row.monthName}`}
                                  >
                                    <span>Ver mes</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-200 text-slate-900 text-xs sm:text-sm">
                            <td className="py-3 px-3 sm:px-4 uppercase tracking-wider">
                              TOTAL ANUAL {modalYear}
                            </td>
                            <td className="py-3 px-2 sm:px-3 text-center">
                              {yearTotalEventsCount} {yearTotalEventsCount === 1 ? 'reunión' : 'reuniones'}
                            </td>
                            <td className="py-3 px-2 sm:px-3 text-right">
                              {yearAverageAttendance} pers.
                            </td>
                            <td className="py-3 px-2 sm:px-3 text-right font-black text-blue-950">
                              {yearTotalAttendees}
                            </td>
                            <td className="py-3 px-2 sm:px-4 text-center hidden md:table-cell">
                              <span className="text-blue-800 font-bold">{yearTotalAdults}</span>
                              {' / '}
                              <span className="text-amber-800 font-bold">{yearTotalChildren}</span>
                              {' / '}
                              <span className="text-emerald-800 font-bold">{yearTotalVisitors}</span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-right text-xs text-slate-500">
                              Acumulado
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )
          )}
        </div>

        {/* Pie con opciones y botón de cierre */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            {onSelectMonthYear && (
              <button
                type="button"
                onClick={() => {
                  onSelectMonthYear(modalMonth, modalYear);
                  onClose();
                }}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
                title="Abrir este mes en la vista de calendario principal"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Abrir {MONTH_NAMES_ES[modalMonth]} {modalYear} en calendario</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 rounded-xl font-semibold text-sm transition-colors min-h-[44px]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
