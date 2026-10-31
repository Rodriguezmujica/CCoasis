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
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#d4d7dc] shadow-sm mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Controles de selección de periodo */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 text-[#1a1a1a] font-bold text-sm">
          <Calendar className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
          <span className="hidden sm:inline">Periodo:</span>
        </div>

        {/* Botón mes anterior */}
        <button
          type="button"
          onClick={handlePrevMonth}
          title="Mes anterior"
          aria-label="Mes anterior"
          className="p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[#1a1a1a] hover:bg-[#f5f5f5] rounded-xl transition-colors border border-[#858a93]"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Selector de Mes */}
        <select
          aria-label="Seleccionar mes"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="bg-white hover:bg-[#f5f5f5] border border-[#858a93] text-[#1a1a1a] text-base font-medium rounded-xl px-3.5 py-2.5 min-h-[44px] focus:border-[#0e7c86] focus:outline-none transition-colors"
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
          aria-label="Seleccionar año"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-white hover:bg-[#f5f5f5] border border-[#858a93] text-[#1a1a1a] text-base font-medium rounded-xl px-3.5 py-2.5 min-h-[44px] focus:border-[#0e7c86] focus:outline-none transition-colors"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Botón mes siguiente */}
        <button
          type="button"
          onClick={handleNextMonth}
          title="Mes siguiente"
          aria-label="Mes siguiente"
          className="p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[#1a1a1a] hover:bg-[#f5f5f5] rounded-xl transition-colors border border-[#858a93]"
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Botones de acción secundaria y exportación */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Botón Gestión de Categorías */}
        <button
          type="button"
          onClick={onOpenCategories}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] rounded-xl transition-colors shadow-sm"
        >
          <Tags className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
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
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-bold text-[#0a5961] bg-[#d9f7f8] hover:bg-[#aaeif0] border border-[#0e7c86] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
          <span>Exportar CSV</span>
        </button>
      </div>
    </div>
  );
};
