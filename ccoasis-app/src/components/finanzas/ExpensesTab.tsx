import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  FileText,
  Trash2,
  Loader2,
  Calendar,
  Tag,
  ExternalLink,
  Wallet,
  Landmark,
  Filter,
} from 'lucide-react';
import {
  Expense,
  PAYMENT_METHOD_SHORT_LABELS,
  FUND_ACCOUNT_SHORT_LABELS,
  FUND_ACCOUNT_LABELS,
  FundAccount,
} from '../../types/finances';
import { formatCurrency, formatShortDate } from '../../lib/useFinances';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';

interface ExpensesTabProps {
  expenses: Expense[];
  onOpenCreate: () => void;
  onDeleteExpense: (expense: Expense) => Promise<{ ok: boolean; error?: string }>;
  onGetReceiptUrl: (filePath: string) => Promise<{ url: string | null; error?: string }>;
  isLoading: boolean;
}

type FundFilter = 'todos' | 'caja_efectivo' | 'cuenta_bancaria';

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  onOpenCreate,
  onDeleteExpense,
  onGetReceiptUrl,
  isLoading,
}) => {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [fundFilter, setFundFilter] = useState<FundFilter>('todos');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

  const filteredExpenses = expenses.filter((item) => {
    if (fundFilter === 'todos') return true;
    return (item.fund_account || 'caja_efectivo') === fundFilter;
  });

  const handleDelete = async (expense: Expense) => {
    const confirmed = await confirm({
      title: '¿Eliminar gasto?',
      message: (
        <div>
          <p>
            ¿Deseas eliminar el gasto <strong>"{expense.description}"</strong> por valor de{' '}
            <strong>{formatCurrency(expense.amount)}</strong> del {formatShortDate(expense.expense_date)}?
          </p>
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mt-2">
            Esta acción es irreversible y eliminará el registro contable y su comprobante asociado si existe.
          </p>
        </div>
      ),
      confirmText: 'Eliminar gasto',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(expense.id);
    try {
      const res = await onDeleteExpense(expense);
      if (!res.ok) {
        toast.error(res.error || 'No se pudo eliminar el gasto.');
      } else {
        toast.success('Gasto eliminado correctamente.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenReceipt = async (expense: Expense) => {
    if (!expense.receipt_url) return;

    setLoadingReceiptId(expense.id);
    try {
      const { url, error } = await onGetReceiptUrl(expense.receipt_url);
      if (error || !url) {
        toast.error(error || 'No se pudo obtener el comprobante.');
      } else {
        // Abrir URL firmada en nueva pestaña
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al descargar comprobante.';
      toast.error(msg);
    } finally {
      setLoadingReceiptId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de acción superior con filtro */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-600" />
            <span>Gastos y Egresos Registrados</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'registro' : 'registros'}
            {fundFilter !== 'todos'
              ? ` en ${FUND_ACCOUNT_LABELS[fundFilter as FundAccount]}`
              : ' en el periodo seleccionado'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Filtro por ubicación de fondos */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFundFilter('todos')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                fundFilter === 'todos'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFundFilter('caja_efectivo')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                fundFilter === 'caja_efectivo'
                  ? 'bg-white text-amber-900 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
              <span>Solo Caja Efectivo</span>
            </button>
            <button
              type="button"
              onClick={() => setFundFilter('cuenta_bancaria')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                fundFilter === 'cuenta_bancaria'
                  ? 'bg-white text-sky-900 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-sky-600" />
              <span>Solo Banco</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo gasto</span>
          </button>
        </div>
      </div>

      {/* Estado de carga */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Cargando gastos...</p>
        </div>
      ) : expenses.length === 0 ? (
        /* Estado vacío general */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">No hay gastos registrados</h4>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            No se han registrado gastos ni egresos en el periodo seleccionado.
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar primer gasto</span>
          </button>
        </div>
      ) : filteredExpenses.length === 0 ? (
        /* Estado vacío por filtro de fondos */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2">
            <Filter className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">
            No hay gastos en {FUND_ACCOUNT_LABELS[fundFilter as FundAccount]}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            No se encontraron registros de gastos pagados desde este fondo en el periodo.
          </p>
          <button
            type="button"
            onClick={() => setFundFilter('todos')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <span>Mostrar todos los fondos</span>
          </button>
        </div>
      ) : (
        <>
          {/* Vista Móvil: Tarjetas táctiles */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredExpenses.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700">
                      <Tag className="w-3 h-3" />
                      {item.category?.name || 'General'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatShortDate(item.expense_date)}
                    </span>
                    {/* Badges de método y cuenta */}
                    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      {PAYMENT_METHOD_SHORT_LABELS[item.payment_method || 'efectivo'] || 'Efectivo'}
                    </span>
                    <span
                      className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                        (item.fund_account || 'caja_efectivo') === 'caja_efectivo'
                          ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                          : (item.fund_account || 'caja_efectivo') === 'cuenta_bancaria'
                          ? 'bg-sky-50 text-sky-800 border-sky-200/80'
                          : 'bg-purple-50 text-purple-800 border-purple-200/80'
                      }`}
                    >
                      {FUND_ACCOUNT_SHORT_LABELS[item.fund_account || 'caja_efectivo'] || 'Caja'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-rose-600">
                      -{formatCurrency(Number(item.amount))}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.description}</p>
                </div>

                {/* Comprobante y Acciones */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {item.receipt_url ? (
                    <button
                      type="button"
                      onClick={() => handleOpenReceipt(item)}
                      disabled={loadingReceiptId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      {loadingReceiptId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      <span>Ver comprobante</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sin comprobante</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs"
                    title="Eliminar gasto"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Vista Tablet / Desktop: Tabla detallada */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4">Método / Cuenta</th>
                    <th className="py-3.5 px-4">Concepto / Descripción</th>
                    <th className="py-3.5 px-4">Comprobante</th>
                    <th className="py-3.5 px-4 text-right">Monto</th>
                    <th className="py-3.5 px-4 text-center w-16">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredExpenses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {formatShortDate(item.expense_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700">
                          {item.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                            {PAYMENT_METHOD_SHORT_LABELS[item.payment_method || 'efectivo'] || 'Efectivo'}
                          </span>
                          <span
                            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border ${
                              (item.fund_account || 'caja_efectivo') === 'caja_efectivo'
                                ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                                : (item.fund_account || 'caja_efectivo') === 'cuenta_bancaria'
                                ? 'bg-sky-50 text-sky-800 border-sky-200/80'
                                : 'bg-purple-50 text-purple-800 border-purple-200/80'
                            }`}
                          >
                            {FUND_ACCOUNT_SHORT_LABELS[item.fund_account || 'caja_efectivo'] || 'Caja'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(item)}
                            disabled={loadingReceiptId === item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Descargar o ver archivo con enlace seguro"
                          >
                            {loadingReceiptId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ExternalLink className="w-3.5 h-3.5" />
                            )}
                            <span>Comprobante</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Ninguno</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 whitespace-nowrap">
                        -{formatCurrency(Number(item.amount))}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar gasto"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
