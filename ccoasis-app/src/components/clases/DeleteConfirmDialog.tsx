import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmDialogProps {
  title: string;
  itemName: string;
  itemType: 'curso' | 'ciclo';
  extraWarning?: string;
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  title,
  itemName,
  itemType,
  extraWarning,
  onConfirm,
  onClose,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    const result = await onConfirm();
    if (result.ok) {
      onClose();
    } else {
      setError(result.error || 'Error al archivar.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl border border-[#d4d7dc] w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="oasis-title-gradient on-magenta flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-white flex-shrink-0" />
            <h3 className="text-2xl font-extrabold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-white hover:bg-white/15 transition-colors flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[#1a1a1a]">
            ¿Estás seguro de archivar el {itemType} <strong>&quot;{itemName}&quot;</strong>?
          </p>
          <p className="text-xs text-[#4a4f57]">
            Se realizará un archivado seguro (soft-delete). Los datos históricos se conservan pero ya no se mostrarán en la lista activa.
          </p>
          {extraWarning && (
            <p className="text-xs text-amber-950 bg-amber-100 p-3 rounded-xl border border-amber-600 font-semibold">
              {extraWarning}
            </p>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2 border-t border-[#e5e7eb]">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold text-[#1a1a1a] hover:bg-[#f5f5f5] border border-[#858a93] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-extrabold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Archivando...' : 'Archivar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
