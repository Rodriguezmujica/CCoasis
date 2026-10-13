import React, { useMemo, useState } from 'react';
import { ChurchEvent, ChurchEventType } from '../../types/events';
import { MONTH_NAMES_ES, DAYS_NAMES_ES } from '../../lib/useEvents';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  CalendarDays,
  Calendar as CalendarIcon,
  X,
} from 'lucide-react';

export interface CalendarGridViewProps {
  selectedYear: number;
  selectedMonth: number; // 0 a 11
  events: ChurchEvent[];
  eventsByDate: Record<string, ChurchEvent[]>;
  selectedDate: string | null; // Formato 'YYYY-MM-DD' o null para todo el mes
  onSelectDate: (dateKey: string | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToday: () => void;
}

interface CalendarCell {
  dayNumber: number;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: ChurchEvent[];
}

interface EventTypeCellStyle {
  bg: string;
  border: string;
  text: string;
  dotColor: string;
  label: string;
}

// Estilos de alto contraste y fondo completo para cada tipo de actividad (Accesibilidad visual para adultos mayores)
export const EVENT_TYPE_CELL_STYLES: Record<ChurchEventType, EventTypeCellStyle> = {
  culto: {
    bg: 'bg-blue-100/90',
    border: 'border-blue-300',
    text: 'text-blue-950',
    dotColor: 'bg-blue-600',
    label: 'Culto General',
  },
  oracion: {
    bg: 'bg-purple-100/90',
    border: 'border-purple-300',
    text: 'text-purple-950',
    dotColor: 'bg-purple-600',
    label: 'Reunión de Oración',
  },
  jovenes: {
    bg: 'bg-emerald-100/90',
    border: 'border-emerald-300',
    text: 'text-emerald-950',
    dotColor: 'bg-emerald-600',
    label: 'Jóvenes / Adolescentes',
  },
  especial: {
    bg: 'bg-amber-100/90',
    border: 'border-amber-300',
    text: 'text-amber-950',
    dotColor: 'bg-amber-600',
    label: 'Evento Especial',
  },
  venta_verbena: {
    bg: 'bg-rose-100/90',
    border: 'border-rose-300',
    text: 'text-rose-950',
    dotColor: 'bg-rose-600',
    label: 'Actividad Pro-fondos',
  },
  otro: {
    bg: 'bg-slate-100/90',
    border: 'border-slate-300',
    text: 'text-slate-900',
    dotColor: 'bg-slate-600',
    label: 'Otra Actividad',
  },
};

const WEEKDAYS = [
  { short: 'L', full: 'Lun' },
  { short: 'M', full: 'Mar' },
  { short: 'X', full: 'Mié' },
  { short: 'J', full: 'Jue' },
  { short: 'V', full: 'Vie' },
  { short: 'S', full: 'Sáb' },
  { short: 'D', full: 'Dom' },
];

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function formatDateKeyFriendly(dateKey: string): string {
  if (!dateKey) return '';
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3) return dateKey;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d);
  const dayName = DAYS_NAMES_ES[dateObj.getDay()];
  const monthName = MONTH_NAMES_ES[dateObj.getMonth()];
  return `${dayName}, ${d} de ${monthName}`;
}

export const CalendarGridView: React.FC<CalendarGridViewProps> = ({
  selectedYear,
  selectedMonth,
  events,
  eventsByDate,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onGoToday,
}) => {
  const today = new Date();
  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Estado de plegado/desplegado de la cuadrícula
  // En móviles inicia colapsado para evitar scroll excesivo; en pantallas grandes inicia expandido.
  // Recuerda la preferencia en localStorage.
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ccoasis_calendar_grid_expanded');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // Ignorar fallo de almacenamiento
    }
    return typeof window !== 'undefined' ? window.innerWidth >= 640 : true;
  });

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ccoasis_calendar_grid_expanded', String(next));
      } catch {
        // Ignorar fallo de almacenamiento
      }
      return next;
    });
  };

  // Generación de celdas del mes respetando lunes como primer día (L, M, X, J, V, S, D)
  const calendarCells = useMemo<CalendarCell[]>(() => {
    const cells: CalendarCell[] = [];

    // Primer día del mes seleccionado
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    // En JS getDay(): 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    // Convertir a base Lunes = 0: (getDay() + 6) % 7
    const startOffset = (firstDay.getDay() + 6) % 7;

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    // 1. Celdas de relleno del mes anterior
    for (let i = 0; i < startOffset; i++) {
      const dayNum = daysInPrevMonth - startOffset + 1 + i;
      const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      const dateKey = formatDateKey(prevYear, prevMonth, dayNum);

      cells.push({
        dayNumber: dayNum,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedDate,
        events: eventsByDate[dateKey] || [],
      });
    }

    // 2. Celdas del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = formatDateKey(selectedYear, selectedMonth, d);
      cells.push({
        dayNumber: d,
        dateKey,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedDate,
        events: eventsByDate[dateKey] || [],
      });
    }

    // 3. Celdas de relleno del mes siguiente para completar la cuadrícula de 7 columnas
    const totalSlots = Math.ceil(cells.length / 7) * 7;
    const remaining = totalSlots - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
      const dateKey = formatDateKey(nextYear, nextMonth, i);

      cells.push({
        dayNumber: i,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedDate,
        events: eventsByDate[dateKey] || [],
      });
    }

    return cells;
  }, [selectedYear, selectedMonth, eventsByDate, todayKey, selectedDate]);

  const handleCellClick = (cell: CalendarCell) => {
    // Si toca una celda de otro mes, navegar a ese mes
    if (!cell.isCurrentMonth) {
      if (cell.dayNumber > 15) {
        onPrevMonth();
      } else {
        onNextMonth();
      }
      return;
    }

    // Si ya estaba seleccionado ese día, alternar para volver a ver todo el mes
    if (selectedDate === cell.dateKey) {
      onSelectDate(null);
    } else {
      onSelectDate(cell.dateKey);
    }
  };

  const selectedDayEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-5 space-y-4">
      {/* Cabecera con selector de mes/año, contador y botones (Ir a hoy + Toggle Cuadrícula) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 transition-colors touch-manipulation"
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="px-2">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {MONTH_NAMES_ES[selectedMonth]} {selectedYear}
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                {events.length} {events.length === 1 ? 'actividad' : 'actividades'}
              </span>
            </div>
          </div>

          <button
            onClick={onNextMonth}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 transition-colors touch-manipulation"
            title="Mes siguiente"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones: Ir a hoy / Restablecer filtro / Plegar o Desplegar cuadrícula */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {selectedDate && (
            <button
              onClick={() => onSelectDate(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors min-h-[40px] touch-manipulation"
              title="Restablecer para ver todo el mes"
            >
              <CalendarDays className="w-4 h-4 text-slate-600" />
              <span>Ver todo el mes</span>
            </button>
          )}

          <button
            onClick={onGoToday}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-xl transition-colors min-h-[40px] touch-manipulation"
            title="Ir al mes y día actual"
          >
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>Ir a hoy</span>
          </button>

          {/* Botón de Plegar / Desplegar la Cuadrícula */}
          <button
            type="button"
            onClick={toggleExpanded}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors min-h-[40px] touch-manipulation border border-slate-200"
            title={isExpanded ? 'Ocultar cuadrícula mensual' : 'Ver cuadrícula mensual'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Ocultar cuadrícula</span>
                <span className="sm:hidden">Ocultar</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Ver cuadrícula</span>
                <span className="sm:hidden">Ver cuadrícula</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resumen compacto cuando la cuadrícula está colapsada pero hay un día filtrado */}
      {!isExpanded && selectedDate && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 animate-pulse" />
            <span>
              Filtrado por: <strong className="text-slate-900 font-bold">{formatDateKeyFriendly(selectedDate)}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectDate(null)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline flex-shrink-0"
          >
            Quitar filtro
          </button>
        </div>
      )}

      {/* Sección desplegable: Días de la semana, Celdas y Leyenda */}
      {isExpanded && (
        <div className="space-y-4 pt-1 animate-fadeIn">
          {/* Días de la semana (L, M, X, J, V, S, D) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center border-b border-slate-100 pb-2">
            {WEEKDAYS.map((w, index) => {
              const isWeekend = index === 5 || index === 6;
              return (
                <div
                  key={w.full}
                  className={`text-xs font-bold uppercase tracking-wider py-1 ${
                    isWeekend ? 'text-blue-600' : 'text-slate-500'
                  }`}
                >
                  <span className="sm:hidden">{w.short}</span>
                  <span className="hidden sm:inline">{w.full}</span>
                </div>
              );
            })}
          </div>

          {/* Cuadrícula interactiva de días con accesibilidad visual mejorada */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((cell) => {
              const hasEvents = cell.events.length > 0;
              const firstEvent = hasEvents ? cell.events[0] : null;
              const primaryStyle = firstEvent
                ? EVENT_TYPE_CELL_STYLES[firstEvent.event_type] || EVENT_TYPE_CELL_STYLES.otro
                : null;

              // Determinación de clases visuales por estado y color temático
              let cellStyle = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300';
              let numberColor = 'text-slate-800 font-bold';

              if (!cell.isCurrentMonth) {
                // Días de otros meses (atenuados)
                cellStyle = 'bg-slate-50/50 border-transparent text-slate-300 hover:bg-slate-100/60 hover:text-slate-400';
                numberColor = 'text-slate-300 font-normal';
              } else if (hasEvents && primaryStyle) {
                // DÍA CON ACTIVIDAD: PINTAR TODA LA CASILLA CON EL COLOR DE LA ACTIVIDAD
                cellStyle = `${primaryStyle.bg} ${primaryStyle.border} shadow-xs hover:brightness-95`;
                numberColor = `${primaryStyle.text} font-black`;

                // Si está seleccionado: borde grueso/anillo sin tapar el color
                if (cell.isSelected) {
                  cellStyle += ' ring-4 ring-blue-600 ring-offset-2 z-10 border-blue-600 shadow-md scale-[1.02]';
                } else if (cell.isToday) {
                  // Si es hoy: anillo azul distintivo
                  cellStyle += ' ring-2 ring-blue-600 border-blue-500';
                }
              } else {
                // DÍA SIN ACTIVIDAD
                if (cell.isSelected) {
                  cellStyle = 'bg-blue-50 border-2 border-blue-600 text-blue-950 ring-4 ring-blue-600 ring-offset-1 font-black shadow-md z-10';
                  numberColor = 'text-blue-950 font-black';
                } else if (cell.isToday) {
                  cellStyle = 'bg-blue-50/70 border-blue-400 text-blue-900 ring-2 ring-blue-500 font-bold';
                  numberColor = 'text-blue-900 font-bold';
                }
              }

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => handleCellClick(cell)}
                  className={`min-h-[48px] sm:min-h-[60px] p-1 sm:p-1.5 rounded-xl border flex flex-col items-center justify-between transition-all touch-manipulation relative group ${cellStyle}`}
                  title={
                    cell.isCurrentMonth
                      ? `${cell.dayNumber} de ${MONTH_NAMES_ES[selectedMonth]}${
                          hasEvents
                            ? ` - ${firstEvent?.title} (${cell.events.length} ${
                                cell.events.length === 1 ? 'actividad' : 'actividades'
                              })`
                            : ''
                        }${cell.isToday ? ' - Hoy' : ''}`
                      : `Día ${cell.dayNumber}`
                  }
                  aria-label={`Día ${cell.dayNumber}${
                    hasEvents ? `, ${cell.events.length} actividades` : ''
                  }`}
                >
                  {/* Número del día y distintivo 'Hoy' */}
                  <div className="w-full flex items-center justify-center relative">
                    <span className={`text-xs sm:text-base leading-none ${numberColor}`}>
                      {cell.dayNumber}
                    </span>

                    {/* Insignia visual destacada 'HOY' */}
                    {cell.isToday && cell.isCurrentMonth && (
                      <span className="absolute -top-1 -right-1 text-[9px] font-black tracking-tight text-white uppercase bg-blue-600 px-1 py-0.2 rounded-full shadow-xs">
                        HOY
                      </span>
                    )}
                  </div>

                  {/* Indicadores complementarios si hay actividades */}
                  <div className="w-full min-h-[10px] flex items-center justify-center gap-1 mt-0.5">
                    {hasEvents && cell.isCurrentMonth && (
                      <>
                        {/* Puntos coloreados de apoyo */}
                        {cell.events.slice(0, 3).map((ev, idx) => {
                          const evStyle =
                            EVENT_TYPE_CELL_STYLES[ev.event_type] ||
                            EVENT_TYPE_CELL_STYLES.otro;
                          return (
                            <span
                              key={`${ev.id}-${idx}`}
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${evStyle.dotColor} ring-1 ring-white/80 shadow-2xs`}
                              title={`${evStyle.label}: ${ev.title}`}
                            />
                          );
                        })}
                        {cell.events.length > 3 && (
                          <span className="text-[9px] font-black text-slate-900 leading-none">
                            +{cell.events.length - 3}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Barra de estado cuando hay un día seleccionado */}
          {selectedDate && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-blue-50/80 -mx-3.5 sm:-mx-5 -mb-3.5 sm:-mb-5 p-3 sm:p-4 rounded-b-2xl">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                <span>
                  Filtrando actividades del:{' '}
                  <strong className="text-slate-900 font-bold">
                    {formatDateKeyFriendly(selectedDate)}
                  </strong>
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                  {selectedDayEvents.length}{' '}
                  {selectedDayEvents.length === 1 ? 'actividad' : 'actividades'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectDate(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-xl transition-colors shadow-xs touch-manipulation"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ver todo el mes</span>
              </button>
            </div>
          )}

          {/* Leyenda amigable de tipos de actividades con muestras de color completas */}
          {!selectedDate && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-xs text-slate-600">
              <span className="font-bold text-slate-800">Leyenda:</span>
              {Object.entries(EVENT_TYPE_CELL_STYLES).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded-md ${config.bg} border ${config.border} flex-shrink-0 shadow-2xs`} />
                  <span className="font-medium text-slate-800">{config.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
