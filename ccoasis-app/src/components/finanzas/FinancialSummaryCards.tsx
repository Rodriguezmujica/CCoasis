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
        <div className="bg-white rounded-3xl p-5 border border-[#d4d7dc] shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4a4f57]">
              Total Ingresos
            </span>
            <div
              className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-600 flex items-center justify-center"
              aria-hidden="true"
            >
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight">
              +{formatCurrency(summary.totalIncome)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#4a4f57] mt-2.5">
              <span className="font-medium">{periodLabel}</span>
              <span className="font-bold bg-emerald-100 text-emerald-950 border border-emerald-600 px-2.5 py-0.5 rounded-full">
                {summary.offeringsCount} {summary.offeringsCount === 1 ? 'ofrenda' : 'ofrendas'}
              </span>
            </div>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="bg-white rounded-3xl p-5 border border-[#d4d7dc] shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4a4f57]">
              Total Egresos
            </span>
            <div
              className="w-10 h-10 rounded-xl bg-rose-100 text-rose-950 border border-rose-600 flex items-center justify-center"
              aria-hidden="true"
            >
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-800 tracking-tight">
              -{formatCurrency(summary.totalExpenses)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#4a4f57] mt-2.5">
              <span className="font-medium">{periodLabel}</span>
              <span className="font-bold bg-rose-100 text-rose-950 border border-rose-600 px-2.5 py-0.5 rounded-full">
                {summary.expensesCount} {summary.expensesCount === 1 ? 'gasto' : 'gastos'}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Neto */}
        <div className="bg-white rounded-3xl p-5 border border-[#d4d7dc] shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4a4f57]">
              Balance Neto
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isPositiveBalance
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-600'
                  : 'bg-rose-100 text-rose-950 border-rose-600'
              }`}
              aria-hidden="true"
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isPositiveBalance ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {formatCurrency(summary.netBalance)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#4a4f57] mt-2.5">
              <span className="font-medium">Neto del periodo</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full border ${
                  isPositiveBalance
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-600'
                    : 'bg-rose-100 text-rose-950 border-rose-600'
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
        <div className="bg-white rounded-3xl p-5 border border-[#d4d7dc] shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-amber-100 text-amber-950 border border-amber-600 flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] block">
                  En Caja Efectivo
                </span>
                <span className="text-xs text-[#4a4f57]">Total disponible en efectivo</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-950 border border-amber-600">
              Efectivo
            </span>
          </div>

          <div className="mt-2">
            <div
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isPositiveCash ? 'text-[#1a1a1a]' : 'text-rose-800'
              }`}
            >
              {formatCurrency(summary.cashBalance)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#4a4f57] mt-2.5 pt-2.5 border-t border-[#e5e7eb]">
              <span className="text-emerald-800 font-bold">
                +{formatCurrency(summary.cashIncome)} ingresos
              </span>
              <span className="text-rose-800 font-bold">
                -{formatCurrency(summary.cashExpenses)} gastos
              </span>
            </div>
          </div>
        </div>

        {/* En Banco / Digital */}
        <div className="bg-white rounded-3xl p-5 border border-[#d4d7dc] shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] block">
                  En Banco / Digital
                </span>
                <span className="text-xs text-[#4a4f57]">Total disponible en cuenta</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]">
              Banco / Bizum
            </span>
          </div>

          <div className="mt-2">
            <div
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isPositiveBank ? 'text-[#1a1a1a]' : 'text-rose-800'
              }`}
            >
              {formatCurrency(summary.bankBalance)}
            </div>
            <div className="flex items-center justify-between text-xs text-[#4a4f57] mt-2.5 pt-2.5 border-t border-[#e5e7eb]">
              <span className="text-emerald-800 font-bold">
                +{formatCurrency(summary.bankIncome)} ingresos
              </span>
              <span className="text-rose-800 font-bold">
                -{formatCurrency(summary.bankExpenses)} gastos
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
