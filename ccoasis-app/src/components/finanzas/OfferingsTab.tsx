import React, { useState } from 'react';
import { Plus, HeartHandshake, User, Trash2, Loader2, Calendar, Tag } from 'lucide-react';
import { Offering } from '../../types/finances';
import { formatCurrency, formatShortDate } from '../../lib/useFinances';

interface OfferingsTabProps {
  offerings: Offering[];
  onOpenCreate: () => void;
  onDeleteOffering: (id: string) => Promise<{ ok: boolean; error?: string }>;
  isLoading: boolean;
}

export const OfferingsTab: React.FC<OfferingsTabProps> = ({
  offerings,
  onOpenCreate,
  onDeleteOffering,
  isLoading,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (offering: Offering) => {
    const donorText = offering.person
      ? `${offering.person.first_name} ${offering.person.last_name}`
      : 'anónima';
    const confirm = window.confirm(
      `¿Deseas eliminar la ofrenda de ${formatCurrency(offering.amount)} (${donorText}) del ${formatShortDate(
        offering.offering_date
      )}?`
    );
    if (!confirm) return;

    setDeletingId(offering.id);
    try {
      const res = await onDeleteOffering(offering.id);
      if (!res.ok) {
        alert(res.error || 'No se pudo eliminar la ofrenda.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de acción superior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-emerald-600" />
            <span>Ofrendas e Ingresos Registrados</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {offerings.length} {offerings.length === 1 ? 'registro' : 'registros'} en el periodo seleccionado
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-sm hover:shadow"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva ofrenda</span>
        </button>
      </div>

      {/* Estado de carga */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Cargando ofrendas...</p>
        </div>
      ) : offerings.length === 0 ? (
        /* Estado vacío */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">No hay ofrendas registradas</h4>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            No se han registrado ofrendas ni ingresos en el periodo seleccionado.
          </p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar primera ofrenda</span>
          </button>
        </div>
      ) : (
        <>
          {/* Vista Móvil: Tarjetas táctiles */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {offerings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                      <Tag className="w-3 h-3" />
                      {item.category?.name || 'General'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatShortDate(item.offering_date)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-emerald-700">
                      +{formatCurrency(Number(item.amount))}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {item.person ? (
                      <span className="font-semibold text-slate-800">
                        {item.person.first_name} {item.person.last_name}
                      </span>
                    ) : (
                      <span className="italic text-slate-500">Donante Anónimo</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs"
                    title="Eliminar ofrenda"
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
                    <th className="py-3.5 px-4">Donante</th>
                    <th className="py-3.5 px-4">Concepto / Notas</th>
                    <th className="py-3.5 px-4 text-right">Monto</th>
                    <th className="py-3.5 px-4 text-center w-16">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {offerings.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {formatShortDate(item.offering_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                          {item.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.person ? (
                          <span className="font-semibold text-slate-800">
                            {item.person.first_name} {item.person.last_name}
                          </span>
                        ) : (
                          <span className="italic text-slate-400 text-xs">Anónimo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {item.notes || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                        +{formatCurrency(Number(item.amount))}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar ofrenda"
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
