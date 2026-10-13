import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X, Trash2 } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'primary';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  // Manejo de la tecla Escape para accesibilidad
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Bloqueo de scroll en el body mientras el modal está abierto (evita saltos en iOS Safari)
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Configuración de estilo según la variante
  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100 text-red-600',
      icon: <Trash2 className="w-6 h-6" />,
      btnConfirm: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm focus:ring-red-500',
    },
    warning: {
      iconBg: 'bg-amber-100 text-amber-600',
      icon: <AlertTriangle className="w-6 h-6" />,
      btnConfirm: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-sm focus:ring-amber-500',
    },
    info: {
      iconBg: 'bg-blue-100 text-blue-600',
      icon: <Info className="w-6 h-6" />,
      btnConfirm: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm focus:ring-blue-500',
    },
    primary: {
      iconBg: 'bg-indigo-100 text-indigo-600',
      icon: <AlertCircle className="w-6 h-6" />,
      btnConfirm: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm focus:ring-indigo-500',
    },
  }[variant];

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (!isLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-5 sm:p-6 my-auto animate-in zoom-in-95 duration-150 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${variantStyles.iconBg}`}
          >
            {variantStyles.icon}
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <h3
              id="confirm-dialog-title"
              className="text-lg font-bold text-slate-900 leading-snug"
            >
              {title}
            </h3>
            <div className="text-sm text-slate-600 mt-2 leading-relaxed">
              {message}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Botones de acción accesibles y adaptados a móvil (min height 44px) */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 mt-6 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors border border-slate-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm();
            }}
            disabled={isLoading}
            className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${variantStyles.btnConfirm}`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
