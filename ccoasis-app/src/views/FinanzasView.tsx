import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Finanzas</h1>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  {isAdmin ? 'Administrador' : isTesorero ? 'Tesorero' : 'Finanzas'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Gestión de ofrendas, egresos con comprobantes y balance en Euros (€)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-sm transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Alerta de error general */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Atención</p>
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

      {/* Selector de pestañas móvil y escritorio */}
      <div className="flex border-b border-slate-200 mb-6 bg-slate-100/70 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('ofrendas')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'ofrendas'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Ofrendas / Ingresos</span>
          <span className="hidden sm:inline-block ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
            {formatCurrency(summary.totalIncome)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gastos')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'gastos'
              ? 'bg-white text-rose-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingDown className="w-4 h-4 text-rose-600" />
          <span>Gastos / Egresos</span>
          <span className="hidden sm:inline-block ml-1 text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold">
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
