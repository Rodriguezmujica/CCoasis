import React, { useState } from 'react';
import { X, HeartHandshake, Loader2, AlertCircle, PlusCircle } from 'lucide-react';
import { OfferingFormData, TransactionCategory } from '../../types/finances';
import { PersonOption } from '../../lib/useFinances';

interface OfferingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OfferingFormData) => Promise<{ ok: boolean; error?: string }>;
  categories: TransactionCategory[];
  persons: PersonOption[];
  onOpenCategories: () => void;
}

export const OfferingModal: React.FC<OfferingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  persons,
  onOpenCategories,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const incomeCategories = categories.filter((c) => c.type === 'ingreso');

  const [amount, setAmount] = useState<string>('');
  const [offeringDate, setOfferingDate] = useState<string>(todayStr);
  const [categoryId, setCategoryId] = useState<string>(
    incomeCategories.length > 0 ? incomeCategories[0].id : ''
  );
  const [personId, setPersonId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Por favor introduce un monto válido mayor que 0,00 €.');
      return;
    }

    if (!categoryId) {
      setError('Debes seleccionar una categoría de ingreso.');
      return;
    }

    if (!offeringDate) {
      setError('Indica la fecha de la ofrenda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        amount: numAmount,
        offering_date: offeringDate,
        category_id: categoryId,
        person_id: personId || null,
        notes,
      });

      if (!res.ok) {
        setError(res.error || 'Error al guardar la ofrenda.');
      } else {
        // Reset y cerrar
        setAmount('');
        setNotes('');
        setPersonId('');
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al guardar la ofrenda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registrar Ofrenda / Ingreso</h2>
              <p className="text-xs text-slate-500">Aporte congregacional en Euros (€)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Monto y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Monto (€) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-lg font-bold pl-3 pr-8 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                />
                <span className="absolute right-3 top-3 text-slate-400 font-bold">€</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Fecha <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={offeringDate}
                onChange={(e) => setOfferingDate(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Categoría de Ingreso <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenCategories}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nueva categoría</span>
              </button>
            </div>
            {incomeCategories.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
                <span>No hay categorías de ingreso creadas.</span>
                <button
                  type="button"
                  onClick={onOpenCategories}
                  className="font-bold underline ml-2"
                >
                  Crear una ahora
                </button>
              </div>
            ) : (
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none bg-white"
              >
                <option value="" disabled>
                  Selecciona una categoría...
                </option>
                {incomeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Donante (Opcional o Anónimo) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Donante / Miembro <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none bg-white"
            >
              <option value="">— Anónimo / No especificado —</option>
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.status})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Deja esta opción vacía si la ofrenda fue depositada de forma anónima.
            </p>
          </div>

          {/* Notas / Concepto */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Concepto o Notas adicionales <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Culto dominical mañana, transferencia con referencia X, etc."
              className="w-full py-2 px-3 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || incomeCategories.length === 0}
              className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar ofrenda</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
