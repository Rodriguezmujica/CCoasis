import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface DashboardErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
}

export const DashboardErrorState: React.FC<DashboardErrorStateProps> = ({
  title = 'No se pudo cargar',
  message = 'Ocurrió un problema al obtener los datos. Por favor, intenta de nuevo.',
  onRetry,
  isRetrying = false,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`p-4 sm:p-5 rounded-[12px] bg-[#fdecec] border border-[#f5c2c2] text-[#9b1c1c] flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-start gap-3 text-left w-full sm:w-auto">
        <div
          className="w-9 h-9 rounded-[10px] bg-[#fbdada] text-[#9b1c1c] flex items-center justify-center flex-shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-[#9b1c1c]">{title}</p>
          <p className="text-xs text-[#9b1c1c]/90 leading-relaxed">{message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-[10px] bg-[#9b1c1c] hover:bg-[#801717] active:bg-[#681111] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#9b1c1c] focus:ring-offset-2"
        aria-label="Reintentar carga de información"
      >
        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span>{isRetrying ? 'Reintentando...' : 'Reintentar'}</span>
      </button>
    </div>
  );
};
