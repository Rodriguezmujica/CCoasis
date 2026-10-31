import React, { useMemo, useState } from 'react';
import { ChurchEvent, ChurchEventType } from '../../types/events';
import { MONTH_NAMES_ES, DAYS_NAMES_ES } from '../../lib/useEvents';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar as CalendarIcon,
} from 'lucide-react';

export interface CalendarGridViewProps {
  selectedYear: number;
  selectedMonth: number; // 0 a 11
  events: ChurchEvent[];
  eventsByDate: Record<string, ChurchEvent[]>;
  selectedDate: string | null; // Formato 'YYYY-MM-DD'
  onSelectDate: (dateKey: string) => void;
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

// Estilos idénticos a la maqueta aprobada (calendario.html)
export const EVENT_TYPE_CELL_STYLES: Record<ChurchEventType, EventTypeCellStyle> = {
  culto: {
    bg: 'bg-[#d9f7f8]',
    border: 'border-[#0e7c86]',
    text: 'text-[#0a5961]',
    dotColor: 'bg-[#0e7c86]',
    label: 'Culto General',
  },
  oracion: {
    bg: 'bg-[#f6e6ef]',
    border: 'border-[#ae4a84]',
    text: 'text-[#7a2f5a]',
    dotColor: 'bg-[#ae4a84]',
    label: 'Reunión de Oración',
  },
  jovenes: {
    bg: 'bg-[#e3f5e9]',
    border: 'border-[#2f7d4f]',
    text: 'text-[#14532d]',
    dotColor: 'bg-[#2f7d4f]',
    label: 'Jóvenes / Adolescentes',
  },
  especial: {
    bg: 'bg-[#fdf3d6]',
    border: 'border-[#a8741a]',
    text: 'text-[#713f12]',
    dotColor: 'bg-[#a8741a]',
    label: 'Evento Especial',
  },
  venta_verbena: {
    bg: 'bg-[#fdecec]',
    border: 'border-[#c0392b]',
    text: 'text-[#9b1c1c]',
    dotColor: 'bg-[#c0392b]',
    label: 'Actividad Pro-fondos',
  },
  otro: {
    bg: 'bg-[#ebedef]',
    border: 'border-[#5b6068]',
    text: 'text-[#1a1a1a]',
    dotColor: 'bg-[#5b6068]',
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
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ccoasis_calendar_grid_expanded');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // Ignorar fallo de almacenamiento
    }
    return true;
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

    const firstDay = new Date(selectedYear, selectedMonth, 1);
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
    if (!cell.isCurrentMonth) {
      if (cell.dayNumber > 15) {
        onPrevMonth();
      } else {
        onNextMonth();
      }
      return;
    }

    onSelectDate(cell.dateKey);
  };

  const selectedDayEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  return (
    <section
      aria-label="Cuadrícula mensual"
      className="bg-white border border-[#d4d7dc] rounded-[12px] p-3 sm:p-4 grid gap-3.5"
    >
      {/* Cabecera compacta: < mes año [badge actividades] > a la izquierda, Ir a hoy + Ocultar cuadrícula a la derecha */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            type="button"
            onClick={onPrevMonth}
            className="w-11 min-h-[44px] rounded-[10px] border border-[#767b83] bg-white hover:bg-[#ebedef] text-[#4a4f57] inline-flex items-center justify-center transition-colors"
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xl font-bold text-[#1a1a1a] px-1 whitespace-nowrap">
            {MONTH_NAMES_ES[selectedMonth].toLowerCase()} {selectedYear}
          </span>

          <span className="bg-[#d9f7f8] text-[#0a5961] rounded-full text-xs font-bold px-2 py-0.5 whitespace-nowrap">
            {events.length} {events.length === 1 ? 'actividad' : 'actividades'}
          </span>

          <button
            type="button"
            onClick={onNextMonth}
            className="w-11 min-h-[44px] rounded-[10px] border border-[#767b83] bg-white hover:bg-[#ebedef] text-[#4a4f57] inline-flex items-center justify-center transition-colors"
            title="Mes siguiente"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones a la derecha en fila */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onGoToday}
            className="min-h-[44px] px-[18px] rounded-[10px] bg-[#d9f7f8] hover:bg-[#b8eff2] text-[#0a5961] text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
            title="Ir al mes y día actual"
          >
            <CalendarIcon className="w-5 h-5 text-[#0a5961]" />
            <span>Ir a hoy</span>
          </button>

          <button
            type="button"
            onClick={toggleExpanded}
            className="min-h-[44px] px-[18px] rounded-[10px] bg-white border border-[#767b83] hover:bg-[#ebedef] text-[#1a1a1a] text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
            title={isExpanded ? 'Ocultar cuadrícula mensual' : 'Ver cuadrícula mensual'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-5 h-5 text-[#1a1a1a]" />
                <span>Ocultar cuadrícula</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5 text-[#1a1a1a]" />
                <span>Ver cuadrícula</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resumen compacto cuando la cuadrícula está colapsada */}
      {!isExpanded && selectedDate && (
        <div className="pt-2 border-t border-[#d4d7dc] flex items-center justify-between gap-2 text-xs text-[#4a4f57]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-[#0e7c86] flex-shrink-0" />
            <span>
              Fecha seleccionada:{' '}
              <strong className="text-[#1a1a1a] font-bold">
                {formatDateKeyFriendly(selectedDate)}
              </strong>
            </span>
          </div>
          {selectedDayEvents.length > 0 && (
            <span className="px-2 py-0.5 bg-[#d9f7f8] text-[#0a5961] rounded-full text-xs font-bold flex-shrink-0">
              {selectedDayEvents.length}{' '}
              {selectedDayEvents.length === 1 ? 'actividad' : 'actividades'}
            </span>
          )}
        </div>
      )}

      {/* Sección desplegable: Días de la semana, Celdas y Leyenda */}
      {isExpanded && (
        <>
          {/* Días de la semana (L, M, X, J, V, S, D) */}
          <div
            className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center border-b border-[#d4d7dc] pb-1.5"
            aria-hidden="true"
          >
            {WEEKDAYS.map((w) => (
              <div
                key={w.full}
                className="text-xs font-bold uppercase tracking-[0.05em] text-[#4a4f57] py-1"
              >
                <span className="sm:hidden">{w.short}</span>
                <span className="hidden sm:inline">{w.full}</span>
              </div>
            ))}
          </div>

          {/* Cuadrícula interactiva de días */}
          <div
            role="grid"
            aria-label={`Días de ${MONTH_NAMES_ES[selectedMonth].toLowerCase()} ${selectedYear}`}
            className="grid grid-cols-7 gap-1 sm:gap-1.5"
          >
            {calendarCells.map((cell) => {
              const hasEvents = cell.events.length > 0;
              const firstEvent = hasEvents ? cell.events[0] : null;
              const primaryStyle = firstEvent
                ? EVENT_TYPE_CELL_STYLES[firstEvent.event_type] || EVENT_TYPE_CELL_STYLES.otro
                : null;

              let cellStyle = 'bg-white border-[#d4d7dc] text-[#1a1a1a] font-bold hover:bg-[#f5f5f5]';

              if (!cell.isCurrentMonth) {
                cellStyle = 'bg-transparent border-transparent text-[#6b7078] font-normal';
              } else if (hasEvents && primaryStyle) {
                cellStyle = `${primaryStyle.bg} ${primaryStyle.border} ${primaryStyle.text} font-bold hover:brightness-95`;
              }

              if (cell.isCurrentMonth && cell.isSelected) {
                cellStyle += ' outline outline-[3px] outline-[#1a1a1a] outline-offset-[1px] z-10';
              }

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  tabIndex={cell.isCurrentMonth ? 0 : -1}
                  onClick={() => handleCellClick(cell)}
                  className={`min-h-[52px] sm:min-h-[56px] rounded-[10px] border p-1 flex flex-col items-center justify-between text-sm sm:text-base cursor-pointer transition-colors ${cellStyle}`}
                  aria-label={`Día ${cell.dayNumber}${
                    hasEvents && primaryStyle ? `, ${primaryStyle.label}` : ''
                  }${cell.isToday && cell.isCurrentMonth ? ', hoy' : ''}`}
                >
                  {cell.isToday && cell.isCurrentMonth && (
                    <span className="text-[10px] font-extrabold bg-[#ae4a84] text-white px-[5px] py-[1px] rounded-[4px] leading-[1.2]">
                      HOY
                    </span>
                  )}

                  <span>{cell.dayNumber}</span>

                  <span className="flex gap-[3px] min-h-[8px] items-center justify-center">
                    {hasEvents &&
                      cell.isCurrentMonth &&
                      cell.events.slice(0, 3).map((ev, idx) => {
                        const evStyle =
                          EVENT_TYPE_CELL_STYLES[ev.event_type] ||
                          EVENT_TYPE_CELL_STYLES.otro;
                        return (
                          <span
                            key={`${ev.id}-${idx}`}
                            className={`w-2 h-2 rounded-full ${evStyle.dotColor}`}
                            title={`${evStyle.label}: ${ev.title}`}
                          />
                        );
                      })}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Leyenda de tipos de actividad */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs pt-3 border-t border-[#d4d7dc] text-[#1a1a1a] items-center">
            <b className="font-bold">Leyenda:</b>
            {Object.entries(EVENT_TYPE_CELL_STYLES).map(([key, config]) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span
                  className={`w-3.5 h-3.5 rounded-[4px] border ${config.bg} ${config.border} flex-shrink-0`}
                />
                <span>{config.label}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
