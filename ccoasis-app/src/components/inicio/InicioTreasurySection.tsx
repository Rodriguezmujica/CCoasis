import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowRight, ChevronRight } from 'lucide-react';
import { useFinances } from '../../lib/useFinances';
import { MONTH_NAMES } from '../../types/finances';
import { FinancialSummaryCards } from '../finanzas/FinancialSummaryCards';
import { DashboardCard } from './DashboardCard';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardEmptyState } from './DashboardEmptyState';
import { DashboardErrorState } from './DashboardErrorState';

export const InicioTreasurySection: React.FC = () => {
  // useFinances() se inicializa por defecto en el mes y año actual
  const {
    selectedMonth,
    selectedYear,
    summary,
    isLoading,
    error,
    refresh,
  } = useFinances();

  const periodLabel =
    selectedMonth > 0 && selectedMonth <= 12
      ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
      : `Año ${selectedYear}`;

  const isEmpty =
    summary.offeringsCount === 0 && summary.expensesCount === 0;

  return (
    <section aria-labelledby="seccion-tesoreria-title" className="space-y-4 pt-2">
      {/* Cabecera de la Sección Tesorería */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#d4d7dc]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[8px] bg-[#0e7c86] text-white flex items-center justify-center flex-shrink-0 shadow-2xs"
            aria-hidden="true"
          >
            <Wallet className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2
              id="seccion-tesoreria-title"
              className="text-lg sm:text-xl font-extrabold text-[#1a1a1a] tracking-tight"
            >
              Tesorería
            </h2>
            <p className="text-xs text-[#4a4f57]">
              Balance de ofrendas, gastos y fondos del mes en curso ({periodLabel})
            </p>
          </div>
        </div>

        <Link
          to="/finanzas"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px] transition-colors"
          aria-label="Ir al módulo Finanzas"
        >
          <span>Ir a Finanzas</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Tarjeta de Resumen Financiero del Mes */}
      <DashboardCard
        icon={<Wallet className="w-5 h-5 text-[#0e7c86]" />}
        title={`Resumen financiero · ${periodLabel}`}
        subtitle="Ingresos, egresos y disponibilidad en caja y banco de este mes"
        action={{ label: 'Ver todo', to: '/finanzas' }}
      >
        {isLoading ? (
          <DashboardSkeleton lines={3} hasHeader={false} className="border-none p-0" />
        ) : error ? (
          <DashboardErrorState
            title="No se pudo cargar el resumen financiero"
            message={error}
            onRetry={refresh}
          />
        ) : isEmpty ? (
          <DashboardEmptyState
            icon={<Wallet className="w-5 h-5 text-[#4a4f57]" />}
            title={`Sin movimientos registrados en ${periodLabel}`}
            description="Aún no se han registrado ofrendas ni gastos durante el mes en curso."
            action={{ label: 'Registrar movimientos en Finanzas', to: '/finanzas' }}
          />
        ) : (
          <div className="space-y-2">
            <div className="[&>div]:mb-0">
              <FinancialSummaryCards summary={summary} periodLabel={periodLabel} />
            </div>

            <div className="pt-2 text-center sm:text-right">
              <Link
                to="/finanzas"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-[10px] bg-[#0e7c86] hover:bg-[#0a5961] active:bg-[#08474e] text-white text-xs font-bold transition-all shadow-xs gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0e7c86] focus:ring-offset-2"
                aria-label="Ver detalle completo en Finanzas"
              >
                <span>Gestionar ofrendas y gastos en Finanzas</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </DashboardCard>
    </section>
  );
};
