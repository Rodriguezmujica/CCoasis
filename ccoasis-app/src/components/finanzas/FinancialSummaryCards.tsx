import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Landmark, Banknote } from 'lucide-react';
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
  const isPositiveCash = summary.cashBalance >= 0;
  const isPositiveBank = summary.bankBalance >= 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Balances generales del periodo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        {/* Balance Total */}
        <div
          className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
            isPositiveBalance
              ? 'border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/20'
              : 'border-rose-200/80 bg-gradient-to-br from-white to-rose-50/20'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Balance Total
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
              <span>Neto del periodo</span>
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

      {/* Desglose resumido de tesorería: En Caja Efectivo y En Banco / Digital */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* En Caja Efectivo */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/70 shadow-sm flex flex-col justify-between transition-all hover:shadow-md bg-gradient-to-br from-white via-white to-amber-50/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  En Caja Efectivo
                </span>
                <span className="text-[11px] text-slate-400">Total disponible en efectivo</span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
              Efectivo
            </span>
          </div>

          <div className="mt-2">
            <div
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isPositiveCash ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatCurrency(summary.cashBalance)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="text-emerald-700 font-medium">
                +{formatCurrency(summary.cashIncome)} ingresos
              </span>
              <span className="text-rose-600 font-medium">
                -{formatCurrency(summary.cashExpenses)} gastos
              </span>
            </div>
          </div>
        </div>

        {/* En Banco / Digital */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sky-200/70 shadow-sm flex flex-col justify-between transition-all hover:shadow-md bg-gradient-to-br from-white via-white to-sky-50/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  En Banco / Digital
                </span>
                <span className="text-[11px] text-slate-400">Total disponible en cuenta</span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200/60">
              Banco / Bizum
            </span>
          </div>

          <div className="mt-2">
            <div
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isPositiveBank ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatCurrency(summary.bankBalance)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className="text-emerald-700 font-medium">
                +{formatCurrency(summary.bankIncome)} ingresos
              </span>
              <span className="text-rose-600 font-medium">
                -{formatCurrency(summary.bankExpenses)} gastos
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
