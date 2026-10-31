import React, { useState } from 'react';
import { X, Tags, Plus, Trash2, Loader2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { TransactionCategory, CategoryType } from '../../types/finances';
import { useConfirm } from '../../context/ConfirmContext';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: TransactionCategory[];
  onCreateCategory: (name: string, type: CategoryType) => Promise<{ ok: boolean; error?: string }>;
  onDeleteCategory: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
  onDeleteCategory,
}) => {
  const { confirm } = useConfirm();
  const [activeFilter, setActiveFilter] = useState<'todas' | 'ingreso' | 'gasto'>('todas');
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('ingreso');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => {
    if (activeFilter === 'todas') return true;
    return c.type === activeFilter;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Escribe el nombre de la categoría.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onCreateCategory(trimmed, type);
      if (!res.ok) {
        setError(res.error || 'Error al crear la categoría.');
      } else {
        setName('');
        setSuccessMsg(`Categoría "${trimmed}" creada correctamente.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al crear categoría.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat: TransactionCategory) => {
    const confirmed = await confirm({
      title: '¿Eliminar categoría?',
      message: (
        <div>
          <p>¿Seguro que deseas eliminar la categoría <strong>"{cat.name}"</strong>?</p>
          <p className="text-xs font-medium text-amber-950 bg-amber-100 p-2.5 rounded-xl border border-amber-600 mt-2">
            Solo se puede eliminar si no tiene ofrendas ni gastos asociados en el sistema. Esta acción es irreversible.
          </p>
        </div>
      ),
      confirmText: 'Eliminar categoría',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    setError(null);
    setDeletingId(cat.id);
    try {
      const res = await onDeleteCategory(cat.id);
      if (!res.ok) {
        setError(res.error || 'No se pudo eliminar la categoría.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar categoría.';
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[#d4d7dc] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-5 oasis-title-gradient on-magenta">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 text-white flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Tags className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Gestión de Categorías
              </h2>
              <p className="text-xs text-white font-medium mt-0.5">
                Categorías contables para ingresos y egresos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-white hover:bg-white/15 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mensajes de error o éxito */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-600 text-rose-950 text-sm font-medium flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-700" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-600 text-emerald-950 text-sm font-bold">
              {successMsg}
            </div>
          )}

          {/* Formulario para crear nueva categoría */}
          <form onSubmit={handleCreate} className="p-4 sm:p-5 bg-[#f5f5f5] border border-[#d4d7dc] rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
              Crear nueva categoría
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="Nombre de la categoría..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2.5 px-3.5 min-h-[44px] rounded-xl border border-[#858a93] text-[#1a1a1a] text-base placeholder-[#4a4f57]/70 focus:border-[#0e7c86] focus:outline-none bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  aria-label="Tipo de categoría"
                  value={type}
                  onChange={(e) => setType(e.target.value as CategoryType)}
                  className="w-full py-2.5 px-3 min-h-[44px] rounded-xl border border-[#858a93] text-[#1a1a1a] text-base focus:border-[#0e7c86] focus:outline-none bg-white"
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="w-full py-2.5 px-3 min-h-[44px] bg-[#0e7c86] hover:bg-[#0a5961] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span>Crear</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Filtros de la lista */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
                Categorías existentes ({categories.length})
              </span>
              <div className="flex bg-[#f5f5f5] border border-[#d4d7dc] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveFilter('todas')}
                  className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-bold transition-colors ${
                    activeFilter === 'todas'
                      ? 'bg-[#0e7c86] text-white shadow-sm'
                      : 'text-[#4a4f57] hover:text-[#1a1a1a]'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('ingreso')}
                  className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-bold transition-colors ${
                    activeFilter === 'ingreso'
                      ? 'bg-[#0e7c86] text-white shadow-sm'
                      : 'text-[#4a4f57] hover:text-[#1a1a1a]'
                  }`}
                >
                  Ingresos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('gasto')}
                  className={`px-3 py-1.5 min-h-[38px] rounded-lg text-xs font-bold transition-colors ${
                    activeFilter === 'gasto'
                      ? 'bg-[#0e7c86] text-white shadow-sm'
                      : 'text-[#4a4f57] hover:text-[#1a1a1a]'
                  }`}
                >
                  Gastos
                </button>
              </div>
            </div>

            {/* Listado de categorías */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-[#4a4f57] text-sm font-medium">
                  No hay categorías en esta sección.
                </div>
              ) : (
                filteredCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#d4d7dc] hover:border-[#858a93] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {c.type === 'ingreso' ? (
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-600 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4" aria-hidden="true" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-950 border border-rose-600 flex items-center justify-center shrink-0">
                          <TrendingDown className="w-4 h-4" aria-hidden="true" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-[#1a1a1a]">{c.name}</p>
                        <p className="text-xs text-[#4a4f57] capitalize">Tipo: {c.type}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c.id}
                      aria-label={`Eliminar categoría ${c.name}`}
                      className="p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[#4a4f57] hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Eliminar categoría"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#d4d7dc] bg-[#f5f5f5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 min-h-[44px] text-sm font-bold text-[#1a1a1a] bg-white hover:bg-[#ebedef] border border-[#858a93] rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
