import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const toast = useMemo(
    () => ({
      success: (msg: string, duration?: number) => showToast(msg, 'success', duration),
      error: (msg: string, duration?: number) => showToast(msg, 'error', duration),
      warning: (msg: string, duration?: number) => showToast(msg, 'warning', duration),
      info: (msg: string, duration?: number) => showToast(msg, 'info', duration),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, toast, dismissToast }}>
      {children}

      {/* Contenedor flotante de notificaciones Toasts */}
      <div
        className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-5 sm:top-5 z-[9999] pointer-events-none flex flex-col gap-2.5 sm:max-w-md w-auto"
        aria-live="polite"
        role="region"
        aria-label="Notificaciones del sistema"
      >
        {toasts.map((item) => {
          const config = {
            success: {
              container: 'bg-emerald-50 border-emerald-200 text-emerald-950',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
            },
            error: {
              container: 'bg-rose-50 border-rose-200 text-rose-950',
              icon: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
            },
            warning: {
              container: 'bg-amber-50 border-amber-200 text-amber-950',
              icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
            },
            info: {
              container: 'bg-blue-50 border-blue-200 text-blue-950',
              icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
            },
          }[item.type];

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-lg backdrop-blur-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${config.container}`}
              role="status"
            >
              <div className="mt-0.5">{config.icon}</div>
              <div className="flex-1 text-sm font-medium leading-snug break-words">
                {item.message}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                className="p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 active:bg-black/10 transition-colors flex-shrink-0"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
};
