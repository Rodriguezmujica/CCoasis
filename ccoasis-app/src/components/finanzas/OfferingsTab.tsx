import React, { useState } from 'react';
import {
  Plus,
  HeartHandshake,
  User,
  Trash2,
  Loader2,
  Calendar,
  Tag,
  Wallet,
  Landmark,
  Filter,
} from 'lucide-react';
import {
  Offering,
  PAYMENT_METHOD_SHORT_LABELS,
  FUND_ACCOUNT_SHORT_LABELS,
  FUND_ACCOUNT_LABELS,
  FundAccount,
} from '../../types/finances';
import { formatCurrency, formatShortDate } from '../../lib/useFinances';
import { useConfirm } from '../../context/ConfirmContext';
import { useToast } from '../../context/ToastContext';

interface OfferingsTabProps {
  offerings: Offering[];
  onOpenCreate: () => void;
  onDeleteOffering: (id: string) => Promise<{ ok: boolean; error?: string }>;
  isLoading: boolean;
}

type FundFilter = 'todos' | 'caja_efectivo' | 'cuenta_bancaria';

export const OfferingsTab: React.FC<OfferingsTabProps> = ({
  offerings,
  onOpenCreate,
  onDeleteOffering,
  isLoading,
}) => {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [fundFilter, setFundFilter] = useState<FundFilter>('todos');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredOfferings = offerings.filter((item) => {
    if (fundFilter === 'todos') return true;
    return (item.fund_account || 'caja_efectivo') === fundFilter;
  });

  const handleDelete = async (offering: Offering) => {
    const donorText = offering.person
      ? `${offering.person.first_name} ${offering.person.last_name}`
      : 'anónima';
    const confirmed = await confirm({
      title: '¿Eliminar ofrenda?',
      message: (
        <div>
          <p>
            ¿Deseas eliminar la ofrenda de <strong>{formatCurrency(offering.amount)}</strong> ({donorText}) del{' '}
            {formatShortDate(offering.offering_date)}?
          </p>
          <p className="text-xs font-medium text-rose-950 bg-rose-50 p-2.5 rounded-xl border border-rose-600 mt-2">
            Esta acción es irreversible y eliminará el registro contable de la ofrenda.
          </p>
        </div>
      ),
      confirmText: 'Eliminar ofrenda',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(offering.id);
    try {
      const res = await onDeleteOffering(offering.id);
      if (!res.ok) {
        toast.error(res.error || 'No se pudo eliminar la ofrenda.');
      } else {
        toast.success('Ofrenda eliminada correctamente.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de acción superior con filtro */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-[#d4d7dc] shadow-sm">
        <div>
          <h3 className="text-base font-bold text-[#1a1a1a] flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#0e7c86]" aria-hidden="true" />
            <span>Ofrendas e Ingresos Registrados</span>
          </h3>
          <p className="text-xs text-[#4a4f57] mt-0.5 font-medium">
            {filteredOfferings.length} {filteredOfferings.length === 1 ? 'registro' : 'registros'}
            {fundFilter !== 'todos'
              ? ` en ${FUND_ACCOUNT_LABELS[fundFilter as FundAccount]}`
              : ' en el periodo seleccionado'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Filtro por ubicación de fondos */}
          <div className="inline-flex flex-wrap items-center bg-[#f5f5f5] p-1 rounded-xl border border-[#d4d7dc] text-xs font-bold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFundFilter('todos')}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg transition-all ${
                fundFilter === 'todos'
                  ? 'bg-[#0e7c86] text-white shadow-sm'
                  : 'text-[#4a4f57] hover:text-[#1a1a1a]'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFundFilter('caja_efectivo')}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg transition-all flex items-center gap-1.5 ${
                fundFilter === 'caja_efectivo'
                  ? 'bg-[#0e7c86] text-white shadow-sm'
                  : 'text-[#4a4f57] hover:text-[#1a1a1a]'
              }`}
            >
              <Wallet
                className={`w-3.5 h-3.5 ${fundFilter === 'caja_efectivo' ? 'text-white' : 'text-amber-700'}`}
                aria-hidden="true"
              />
              <span>Solo Caja Efectivo</span>
            </button>
            <button
              type="button"
              onClick={() => setFundFilter('cuenta_bancaria')}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg transition-all flex items-center gap-1.5 ${
                fundFilter === 'cuenta_bancaria'
                  ? 'bg-[#0e7c86] text-white shadow-sm'
                  : 'text-[#4a4f57] hover:text-[#1a1a1a]'
              }`}
            >
              <Landmark
                className={`w-3.5 h-3.5 ${fundFilter === 'cuenta_bancaria' ? 'text-white' : 'text-[#0e7c86]'}`}
                aria-hidden="true"
              />
              <span>Solo Banco</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-bold text-white bg-[#0e7c86] hover:bg-[#0a5961] rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span>+ Registrar Ofrenda</span>
          </button>
        </div>
      </div>

      {/* Estado de carga */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#0e7c86] mx-auto mb-3" />
          <p className="text-sm font-medium text-[#4a4f57]">Cargando ofrendas...</p>
        </div>
      ) : offerings.length === 0 ? (
        /* Estado vacío general */
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#d9f7f8] text-[#0e7c86] flex items-center justify-center mx-auto mb-3">
            <HeartHandshake className="w-6 h-6" aria-hidden="true" />
          </div>
          <h4 className="text-base font-bold text-[#1a1a1a]">No hay ofrendas registradas</h4>
          <p className="text-sm text-[#4a4f57] max-w-md mx-auto mt-1 mb-5">
            No se han registrado ofrendas ni ingresos en el periodo seleccionado.
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-bold text-white bg-[#0e7c86] hover:bg-[#0a5961] rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Registrar primera ofrenda</span>
          </button>
        </div>
      ) : filteredOfferings.length === 0 ? (
        /* Estado vacío por filtro de fondos */
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-8 text-center shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] text-[#4a4f57] flex items-center justify-center mx-auto mb-2">
            <Filter className="w-5 h-5" aria-hidden="true" />
          </div>
          <h4 className="text-sm font-bold text-[#1a1a1a]">
            No hay ofrendas en {FUND_ACCOUNT_LABELS[fundFilter as FundAccount]}
          </h4>
          <p className="text-xs text-[#4a4f57] max-w-sm mx-auto mt-1 mb-4">
            No se encontraron registros de ofrenda con este destino de fondos en el periodo.
          </p>
          <button
            type="button"
            onClick={() => setFundFilter('todos')}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] text-xs font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] rounded-xl transition-colors"
          >
            <span>Mostrar todos los fondos</span>
          </button>
        </div>
      ) : (
        <>
          {/* Vista Móvil: Tarjetas táctiles */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredOfferings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-[#d4d7dc] shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-600">
                      <Tag className="w-3 h-3" aria-hidden="true" />
                      {item.category?.name || 'General'}
                    </span>
                    <span className="text-xs text-[#4a4f57] font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#0e7c86]" aria-hidden="true" />
                      {formatShortDate(item.offering_date)}
                    </span>
                    {/* Badges de método y cuenta */}
                    <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f5f5f5] text-[#1a1a1a] border border-[#858a93]">
                      {PAYMENT_METHOD_SHORT_LABELS[item.payment_method || 'efectivo'] || 'Efectivo'}
                    </span>
                    <span
                      className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        (item.fund_account || 'caja_efectivo') === 'caja_efectivo'
                          ? 'bg-amber-100 text-amber-950 border-amber-600'
                          : (item.fund_account || 'caja_efectivo') === 'cuenta_bancaria'
                          ? 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]'
                          : 'bg-[#f6e6ef] text-[#7a2f5a] border-[#ae4a84]'
                      }`}
                    >
                      {FUND_ACCOUNT_SHORT_LABELS[item.fund_account || 'caja_efectivo'] || 'Caja'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-emerald-800">
                      +{formatCurrency(Number(item.amount))}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-[#4a4f57]">
                    <User className="w-3.5 h-3.5 text-[#0e7c86] shrink-0" aria-hidden="true" />
                    {item.person ? (
                      <span className="font-bold text-[#1a1a1a]">
                        {item.person.first_name} {item.person.last_name}
                      </span>
                    ) : (
                      <span className="italic text-[#4a4f57]">Donante Anónimo</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-[#1a1a1a] bg-[#f5f5f5] p-2.5 rounded-xl border border-[#e5e7eb]">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#e5e7eb] flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    aria-label={`Eliminar ofrenda de ${formatCurrency(Number(item.amount))}`}
                    className="px-3.5 py-2 min-h-[44px] text-[#9b1c1c] hover:bg-rose-50 rounded-xl transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
                    title="Eliminar ofrenda"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        <span>Eliminar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Vista Tablet / Desktop: Tabla detallada */}
          <div className="hidden sm:block bg-white rounded-3xl border border-[#d4d7dc] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d4d7dc] bg-[#f5f5f5] text-xs font-bold uppercase tracking-wider text-[#4a4f57]">
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4">Método / Cuenta</th>
                    <th className="py-3.5 px-4">Donante</th>
                    <th className="py-3.5 px-4">Concepto / Notas</th>
                    <th className="py-3.5 px-4 text-right">Monto</th>
                    <th className="py-3.5 px-4 text-center w-20">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] text-sm">
                  {filteredOfferings.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#1a1a1a] whitespace-nowrap">
                        {formatShortDate(item.offering_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-600">
                          {item.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f5f5f5] text-[#1a1a1a] border border-[#858a93]">
                            {PAYMENT_METHOD_SHORT_LABELS[item.payment_method || 'efectivo'] || 'Efectivo'}
                          </span>
                          <span
                            className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              (item.fund_account || 'caja_efectivo') === 'caja_efectivo'
                                ? 'bg-amber-100 text-amber-950 border-amber-600'
                                : (item.fund_account || 'caja_efectivo') === 'cuenta_bancaria'
                                ? 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]'
                                : 'bg-[#f6e6ef] text-[#7a2f5a] border-[#ae4a84]'
                            }`}
                          >
                            {FUND_ACCOUNT_SHORT_LABELS[item.fund_account || 'caja_efectivo'] || 'Caja'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.person ? (
                          <span className="font-bold text-[#1a1a1a]">
                            {item.person.first_name} {item.person.last_name}
                          </span>
                        ) : (
                          <span className="italic text-[#4a4f57] text-xs">Anónimo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#4a4f57] max-w-xs truncate">
                        {item.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-800 whitespace-nowrap">
                        +{formatCurrency(Number(item.amount))}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          aria-label={`Eliminar ofrenda de ${formatCurrency(Number(item.amount))}`}
                          className="p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[#4a4f57] hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Eliminar ofrenda"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
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
