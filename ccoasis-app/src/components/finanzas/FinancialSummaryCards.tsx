import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { FinancialSummary } from '../../types/finances';
import { formatCurrency } from '../../lib/useFinances';

interface FinancialSummaryCardsProps {
  summary: FinancialSummary;
  periodLabel: string;
}

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({
  summary,
  periodLabel,
}) => {
  const isPositiveBalance = summary.netBalance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Total Ingresos */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Ingresos
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
            +{formatCurrency(summary.totalIncome)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>{periodLabel}</span>
            <span className="font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
              {summary.offeringsCount} {summary.offeringsCount === 1 ? 'ofrenda' : 'ofrendas'}
            </span>
          </div>
        </div>
      </div>

      {/* Total Gastos */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Gastos
          </span>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
            -{formatCurrency(summary.totalExpenses)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>{periodLabel}</span>
            <span className="font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">
              {summary.expensesCount} {summary.expensesCount === 1 ? 'gasto' : 'gastos'}
            </span>
          </div>
        </div>
      </div>

      {/* Balance Neto */}
      <div
        className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
          isPositiveBalance ? 'border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/20' : 'border-rose-200/80 bg-gradient-to-br from-white to-rose-50/20'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Balance Neto
          </span>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPositiveBalance ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isPositiveBalance ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(summary.netBalance)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>Superávit / Déficit</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                isPositiveBalance
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isPositiveBalance ? 'Favorable' : 'Déficit'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
