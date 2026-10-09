import React from 'react';
import { Calendar, Download, Tags, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES } from '../../types/finances';

interface PeriodSelectorProps {
  selectedMonth: number; // 0 para todo el año, 1-12 para meses
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  onExportCSV: () => void;
  onOpenCategories: () => void;
  totalTransactionsCount: number;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onExportCSV,
  onOpenCategories,
  totalTransactionsCount,
}) => {
  const currentYear = new Date().getFullYear();
  // Años disponibles: desde 2024 hasta el año que viene
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Navegación rápida de meses (si no está en 'Todo el año')
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(1);
    } else if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Controles de selección de periodo */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Periodo:</span>
        </div>

        {/* Botón mes anterior */}
        <button
          onClick={handlePrevMonth}
          title="Mes anterior"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/60"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Selector de Mes */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
        >
          <option value={0}>Todo el año</option>
          {MONTH_NAMES.map((name, index) => (
            <option key={index + 1} value={index + 1}>
              {name}
            </option>
          ))}
        </select>

        {/* Selector de Año */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Botón mes siguiente */}
        <button
          onClick={handleNextMonth}
          title="Mes siguiente"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/60"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Botones de acción secundaria y exportación */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Botón Gestión de Categorías */}
        <button
          type="button"
          onClick={onOpenCategories}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors"
        >
          <Tags className="w-4 h-4 text-slate-600" />
          <span>Categorías</span>
        </button>

        {/* Botón Exportar a CSV */}
        <button
          type="button"
          onClick={onExportCSV}
          disabled={totalTransactionsCount === 0}
          title={
            totalTransactionsCount === 0
              ? 'No hay movimientos en este periodo para exportar'
              : 'Descargar archivo CSV compatible con Excel'
          }
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 text-emerald-800" />
          <span>Exportar a CSV</span>
        </button>
      </div>
    </div>
  );
};
