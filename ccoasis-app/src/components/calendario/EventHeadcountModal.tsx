import React, { useState, useEffect } from 'react';
import { ChurchEvent } from '../../types/events';
import { EventHeadcount, HeadcountFormData } from '../../types/headcount';
import { formatEventFriendlyDate, formatEventTime } from '../../lib/useEvents';
import {
  Users,
  X,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  FileText,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface EventHeadcountModalProps {
  event: ChurchEvent;
  currentHeadcount?: EventHeadcount;
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventId: string, formData: HeadcountFormData) => Promise<boolean>;
  onDelete?: (eventId: string) => Promise<boolean>;
  actionLoading?: boolean;
}

export const EventHeadcountModal: React.FC<EventHeadcountModalProps> = ({
  event,
  currentHeadcount,
  isOpen,
  onClose,
  onSave,
  onDelete,
  actionLoading = false,
}) => {
  const [adults, setAdults] = useState<number>(0);
  const [children, setChildren] = useState<number>(0);
  const [visitors, setVisitors] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Inicializar campos con datos existentes o 0
  useEffect(() => {
    if (currentHeadcount) {
      setAdults(currentHeadcount.adults_count);
      setChildren(currentHeadcount.children_count);
      setVisitors(currentHeadcount.visitors_count);
      setNotes(currentHeadcount.notes || '');
    } else {
      setAdults(0);
      setChildren(0);
      setVisitors(0);
      setNotes('');
    }
    setLocalError(null);
    setIsDeleting(false);
  }, [currentHeadcount, isOpen]);

  if (!isOpen) return null;

  const totalCalculado = adults + children + visitors;

  const handleAdjust = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number
  ) => {
    setter((prev) => Math.max(0, prev + delta));
  };

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    valStr: string
  ) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val < 0) {
      setter(0);
    } else {
      setter(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (totalCalculado === 0 && !notes.trim()) {
      setLocalError('Ingresa al menos 1 persona en el conteo congregacional.');
      return;
    }

    const success = await onSave(event.id, {
      adults_count: adults,
      children_count: children,
      visitors_count: visitors,
      notes,
    });

    if (success) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm(
      '¿Deseas eliminar el registro de asistencia de este culto?'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    const success = await onDelete(event.id);
    setIsDeleting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera con datos del evento */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 sm:p-6 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                Conteo de Culto
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                {event.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors"
              title="Cerrar"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-blue-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatEventFriendlyDate(event.start_time)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatEventTime(event.start_time)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Banner de Total Congregacional Dinámico */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
              Total Congregacional
            </span>
            <span className="text-xs text-slate-500">
              Suma calculada en tiempo real
            </span>
          </div>
          <div className="flex items-baseline gap-1 bg-white px-4 py-2 rounded-2xl border border-blue-200 shadow-sm">
            <span className="text-3xl font-extrabold text-blue-900 tracking-tight">
              {totalCalculado}
            </span>
            <span className="text-xs font-bold text-slate-500">asistentes</span>
          </div>
        </div>

        {/* Formulario de Conteo Táctil */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {localError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{localError}</span>
            </div>
          )}

          {/* Selector 1: ADULTOS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-slate-700" />
                <label
                  htmlFor="adults_count"
                  className="font-bold text-slate-900 text-sm sm:text-base"
                >
                  Adultos
                </label>
              </div>
              <p className="text-xs text-slate-500">Miembros y asistentes adultos</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjust(setAdults, -1)}
                className="w-11 h-11 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Restar 1"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                id="adults_count"
                type="number"
                min="0"
                value={adults}
                onChange={(e) => handleInputChange(setAdults, e.target.value)}
                className="w-16 h-11 text-center font-extrabold text-lg sm:text-xl text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAdjust(setAdults, 1)}
                className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Sumar 1"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Selector 2: NIÑOS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <label
                  htmlFor="children_count"
                  className="font-bold text-slate-900 text-sm sm:text-base"
                >
                  Niños
                </label>
              </div>
              <p className="text-xs text-slate-500">Bebés, párvulos y escuela bíblica</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjust(setChildren, -1)}
                className="w-11 h-11 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Restar 1"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                id="children_count"
                type="number"
                min="0"
                value={children}
                onChange={(e) => handleInputChange(setChildren, e.target.value)}
                className="w-16 h-11 text-center font-extrabold text-lg sm:text-xl text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAdjust(setChildren, 1)}
                className="w-11 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-lg flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Sumar 1"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Selector 3: VISITAS / NUEVOS */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <label
                  htmlFor="visitors_count"
                  className="font-bold text-slate-900 text-sm sm:text-base"
                >
                  Visitas / Nuevos
                </label>
              </div>
              <p className="text-xs text-slate-500">Personas por primera o segunda vez</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjust(setVisitors, -1)}
                className="w-11 h-11 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Restar 1"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                id="visitors_count"
                type="number"
                min="0"
                value={visitors}
                onChange={(e) => handleInputChange(setVisitors, e.target.value)}
                className="w-16 h-11 text-center font-extrabold text-lg sm:text-xl text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAdjust(setVisitors, 1)}
                className="w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-lg flex items-center justify-center transition-all shadow-sm active:scale-95"
                title="Sumar 1"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Campo de Notas / Observaciones */}
          <div className="space-y-1.5">
            <label
              htmlFor="headcount_notes"
              className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Observaciones / Detalles del culto (opcional)</span>
            </label>
            <textarea
              id="headcount_notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Llovió fuertemente, culto especial misionero, 2 reconciliaciones..."
              className="w-full text-sm rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            {currentHeadcount && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading || isDeleting}
                className="w-full sm:w-auto px-4 py-3 text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[48px]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar conteo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 active:bg-slate-100 transition-colors min-h-[48px]"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              {actionLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Check className="w-5 h-5" />
              )}
              <span>{currentHeadcount ? 'Actualizar Asistencia' : 'Guardar Asistencia'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
