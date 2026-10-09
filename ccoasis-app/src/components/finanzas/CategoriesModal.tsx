import React, { useState } from 'react';
import { X, Tags, Plus, Trash2, Loader2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { TransactionCategory, CategoryType } from '../../types/finances';

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
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al crear categoría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat: TransactionCategory) => {
    const confirm = window.confirm(
      `¿Seguro que deseas eliminar la categoría "${cat.name}"?\n(Solo se puede eliminar si no tiene ofrendas o gastos asociados).`
    );
    if (!confirm) return;

    setError(null);
    setDeletingId(cat.id);
    try {
      const res = await onDeleteCategory(cat.id);
      if (!res.ok) {
        setError(res.error || 'No se pudo eliminar la categoría.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar categoría.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Gestión de Categorías</h2>
              <p className="text-xs text-slate-500">Categorías contables para ingresos y egresos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mensajes de error o éxito */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              {successMsg}
            </div>
          )}

          {/* Formulario para crear nueva categoría */}
          <form onSubmit={handleCreate} className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Crear nueva categoría
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="Nombre de la categoría..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CategoryType)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="gasto">Gasto</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Crear</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Filtros de la lista */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Categorías existentes ({categories.length})
              </span>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveFilter('todas')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeFilter === 'todas'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('ingreso')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeFilter === 'ingreso'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Ingresos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('gasto')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeFilter === 'gasto'
                      ? 'bg-white text-rose-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Gastos
                </button>
              </div>
            </div>

            {/* Listado de categorías */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No hay categorías en esta sección.
                </div>
              ) : (
                filteredCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {c.type === 'ingreso' ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400 capitalize">Tipo: {c.type}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c.id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar categoría"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
