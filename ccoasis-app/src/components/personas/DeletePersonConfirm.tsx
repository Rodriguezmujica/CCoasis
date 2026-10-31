import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Person } from '../../types/persons';

interface DeletePersonConfirmProps {
  person: Person;
  onConfirm: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export const DeletePersonConfirm: React.FC<DeletePersonConfirmProps> = ({
  person,
  onConfirm,
  onClose,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    const result = await onConfirm(person.id);
    if (result.ok) {
      onClose();
    } else {
      setError(result.error || 'Error al eliminar.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a]/55 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-[#d4d7dc] w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="oasis-title-gradient on-magenta px-6 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-extrabold text-white leading-tight">
              Eliminar persona
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-white hover:bg-white/20 inline-flex items-center justify-center transition-colors"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[#4a4f57] leading-relaxed">
            ¿Estás seguro de que deseas eliminar a{' '}
            <strong className="text-[#1a1a1a]">
              {person.first_name} {person.last_name}
            </strong>
            ? La persona será marcada como eliminada y dejará de aparecer en el directorio.
          </p>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-[#fdecec] border border-rose-300 text-[#9b1c1c] text-sm"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-[#d4d7dc]">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-[#1a1a1a] bg-white hover:bg-[#ebedef] border border-[#858a93] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#9b1c1c] hover:bg-rose-900 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
