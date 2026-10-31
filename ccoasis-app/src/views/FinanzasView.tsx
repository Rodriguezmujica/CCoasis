import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinances, formatCurrency } from '../lib/useFinances';
import { MONTH_NAMES } from '../types/finances';
import { FinancialSummaryCards } from '../components/finanzas/FinancialSummaryCards';
import { PeriodSelector } from '../components/finanzas/PeriodSelector';
import { OfferingsTab } from '../components/finanzas/OfferingsTab';
import { ExpensesTab } from '../components/finanzas/ExpensesTab';
import { OfferingModal } from '../components/finanzas/OfferingModal';
import { ExpenseModal } from '../components/finanzas/ExpenseModal';
import { CategoriesModal } from '../components/finanzas/CategoriesModal';

type ActiveTab = 'ofrendas' | 'gastos';

export const FinanzasView: React.FC = () => {
  const { roles } = useAuth();
  const {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    offerings,
    expenses,
    categories,
    persons,
    isLoading,
    error,
    summary,
    refresh,
    createOffering,
    deleteOffering,
    createExpense,
    deleteExpense,
    getReceiptSignedUrl,
    createCategory,
    deleteCategory,
    exportToCSV,
  } = useFinances();

  const [activeTab, setActiveTab] = useState<ActiveTab>('ofrendas');
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  const periodLabel =
    selectedMonth === 0
      ? `Año ${selectedYear}`
      : `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  const isTesorero = roles.includes('tesorero');
  const isAdmin = roles.includes('admin');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Cabecera de la vista */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-[12px] bg-[#0e7c86] flex items-center justify-center text-white shadow-sm shrink-0"
              aria-hidden="true"
            >
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[24px] sm:text-[25px] font-extrabold oasis-text-gradient tracking-tight leading-tight">
                  Gestión Financiera
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0e7c86]" aria-hidden="true" />
                  {isAdmin ? 'Administrador' : isTesorero ? 'Tesorero' : 'Finanzas'}
                </span>
              </div>
              <p className="text-sm text-[#4a4f57] mt-0.5">
                Gestión de ofrendas, egresos con comprobantes y balance en Euros (€)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={refresh}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] shadow-sm transition-colors"
              title="Recargar datos"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0e7c86]' : 'text-[#4a4f57]'}`}
                aria-hidden="true"
              />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 text-[#9b1c1c]" aria-hidden="true" />
              <span>+ Registrar Gasto</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOfferingModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold text-white bg-[#0e7c86] hover:bg-[#0a5961] shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              <span>+ Registrar Ofrenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de error general */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-600 text-rose-950 text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-700 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-bold">Atención</p>
            <p className="text-xs sm:text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Selector de Periodo y Acciones globales */}
      <PeriodSelector
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        onExportCSV={exportToCSV}
        onOpenCategories={() => setIsCategoriesModalOpen(true)}
        totalTransactionsCount={offerings.length + expenses.length}
      />

      {/* Tarjetas superiores de Resumen y Balance */}
      <FinancialSummaryCards summary={summary} periodLabel={periodLabel} />

      {/* Pestañas de navegación interna */}
      <div className="flex border-b border-[#d4d7dc] mb-6 bg-white rounded-t-2xl px-2 pt-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ofrendas')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 min-h-[44px] text-sm font-bold border-b-[3px] transition-colors whitespace-nowrap ${
            activeTab === 'ofrendas'
              ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 rounded-t-xl'
              : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:border-[#858a93]'
          }`}
        >
          <TrendingUp
            className={`w-4 h-4 ${activeTab === 'ofrendas' ? 'text-[#0e7c86]' : 'text-[#4a4f57]'}`}
            aria-hidden="true"
          />
          <span>Ofrendas / Ingresos</span>
          <span className="hidden sm:inline-block ml-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-600 font-bold">
            {formatCurrency(summary.totalIncome)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gastos')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 min-h-[44px] text-sm font-bold border-b-[3px] transition-colors whitespace-nowrap ${
            activeTab === 'gastos'
              ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 rounded-t-xl'
              : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:border-[#858a93]'
          }`}
        >
          <TrendingDown
            className={`w-4 h-4 ${activeTab === 'gastos' ? 'text-[#0e7c86]' : 'text-[#4a4f57]'}`}
            aria-hidden="true"
          />
          <span>Gastos / Egresos</span>
          <span className="hidden sm:inline-block ml-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-950 border border-rose-600 font-bold">
            {formatCurrency(summary.totalExpenses)}
          </span>
        </button>
      </div>

      {/* Contenido de la pestaña activa */}
      {activeTab === 'ofrendas' ? (
        <OfferingsTab
          offerings={offerings}
          onOpenCreate={() => setIsOfferingModalOpen(true)}
          onDeleteOffering={deleteOffering}
          isLoading={isLoading}
        />
      ) : (
        <ExpensesTab
          expenses={expenses}
          onOpenCreate={() => setIsExpenseModalOpen(true)}
          onDeleteExpense={deleteExpense}
          onGetReceiptUrl={getReceiptSignedUrl}
          isLoading={isLoading}
        />
      )}

      {/* Modal: Registrar nueva ofrenda */}
      <OfferingModal
        isOpen={isOfferingModalOpen}
        onClose={() => setIsOfferingModalOpen(false)}
        onSubmit={createOffering}
        categories={categories}
        persons={persons}
        onOpenCategories={() => {
          setIsOfferingModalOpen(false);
          setIsCategoriesModalOpen(true);
        }}
      />

      {/* Modal: Registrar nuevo gasto */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={createExpense}
        categories={categories}
        onOpenCategories={() => {
          setIsExpenseModalOpen(false);
          setIsCategoriesModalOpen(true);
        }}
      />

      {/* Modal: Gestión de Categorías */}
      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categories}
        onCreateCategory={createCategory}
        onDeleteCategory={deleteCategory}
      />
    </div>
  );
};
export default FinanzasView;
