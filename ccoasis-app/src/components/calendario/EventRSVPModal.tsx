import React, { useState, useEffect } from 'react';
import { ChurchEvent } from '../../types/events';
import { ChurchEventRSVP, RSVPFormData, RSVPStatus } from '../../types/rsvps';
import { formatEventFriendlyDate, formatEventTime } from '../../lib/useEvents';
import { useConfirm } from '../../context/ConfirmContext';
import {
  CalendarCheck,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Minus,
  Plus,
  Users,
  Calendar,
  Clock,
  MapPin,
  X,
  Trash2,
  AlertCircle,
  Check,
} from 'lucide-react';

interface EventRSVPModalProps {
  event: ChurchEvent;
  currentRSVP?: ChurchEventRSVP | null;
  personName?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventId: string, formData: RSVPFormData) => Promise<boolean>;
  onDelete?: (eventId: string) => Promise<boolean>;
  actionLoading?: boolean;
}

export const EventRSVPModal: React.FC<EventRSVPModalProps> = ({
  event,
  currentRSVP,
  personName,
  isOpen,
  onClose,
  onSave,
  onDelete,
  actionLoading = false,
}) => {
  const { confirm } = useConfirm();
  const [status, setStatus] = useState<RSVPStatus>('asistire');
  const [guests, setGuests] = useState<number>(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (currentRSVP) {
      setStatus(currentRSVP.status);
      setGuests(currentRSVP.guests || 0);
    } else {
      setStatus('asistire');
      setGuests(0);
    }
    setLocalError(null);
    setIsDeleting(false);
  }, [currentRSVP, isOpen]);

  if (!isOpen) return null;

  const handleAdjustGuests = (delta: number) => {
    setGuests((prev) => Math.min(10, Math.max(0, prev + delta)));
  };

  const handleGuestsInputChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val < 0) {
      setGuests(0);
    } else if (val > 10) {
      setGuests(10);
    } else {
      setGuests(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const success = await onSave(event.id, {
      status,
      guests: status === 'no_asistire' ? 0 : guests,
    });

    if (success) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = await confirm({
      title: '¿Cancelar confirmación de asistencia?',
      message: '¿Deseas cancelar y retirar tu confirmación de asistencia para este evento? Dejarás de figurar en la lista de confirmados.',
      confirmText: 'Retirar confirmación',
      cancelText: 'Volver',
      variant: 'danger',
    });
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
        {/* Cabecera del Evento */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 sm:p-6 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white uppercase tracking-wider">
                <CalendarCheck className="w-3.5 h-3.5" />
                {currentRSVP ? 'Modificar Confirmación' : 'Confirmar Asistencia'}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                {event.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading || isDeleting}
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

          {personName && (
            <div className="mt-2 text-[11px] text-blue-200 font-medium">
              Confirmando como: <span className="font-bold text-white">{personName}</span>
            </div>
          )}
        </div>

        {/* Formulario de Confirmación */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {localError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{localError}</span>
            </div>
          )}

          {/* Selector de Estado de Asistencia (3 opciones táctiles) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              ¿Asistirás a esta actividad? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Opción 1: Asistiré */}
              <button
                type="button"
                onClick={() => setStatus('asistire')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 min-h-[76px] ${
                  status === 'asistire'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      status === 'asistire' ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  {status === 'asistire' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm block leading-tight">Asistiré</span>
                  <span className="text-[11px] text-slate-500">Cuento con ir</span>
                </div>
              </button>

              {/* Opción 2: Quizás */}
              <button
                type="button"
                onClick={() => setStatus('quizas')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 min-h-[76px] ${
                  status === 'quizas'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <HelpCircle
                    className={`w-5 h-5 ${
                      status === 'quizas' ? 'text-amber-500' : 'text-slate-400'
                    }`}
                  />
                  {status === 'quizas' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm block leading-tight">Quizás</span>
                  <span className="text-[11px] text-slate-500">Por confirmar</span>
                </div>
              </button>

              {/* Opción 3: No asistiré */}
              <button
                type="button"
                onClick={() => setStatus('no_asistire')}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 min-h-[76px] ${
                  status === 'no_asistire'
                    ? 'border-slate-600 bg-slate-100 text-slate-900 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <XCircle
                    className={`w-5 h-5 ${
                      status === 'no_asistire' ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  />
                  {status === 'no_asistire' && (
                    <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm block leading-tight">No asistiré</span>
                  <span className="text-[11px] text-slate-500">No podré ir</span>
                </div>
              </button>
            </div>
          </div>

          {/* Selector de Invitados / Acompañantes (0 a 10) */}
          {status !== 'no_asistire' ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <label htmlFor="rsvp_guests" className="font-bold text-slate-900 text-sm">
                    Acompañantes / Invitados
                  </label>
                </div>
                <p className="text-xs text-slate-500 max-w-xs">
                  Personas adicionales o familiares que vendrán contigo (0 a 10).
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleAdjustGuests(-1)}
                  disabled={guests <= 0}
                  className="w-11 h-11 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-lg flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title="Restar 1 invitado"
                  aria-label="Restar 1 invitado"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  id="rsvp_guests"
                  type="number"
                  min="0"
                  max="10"
                  value={guests}
                  onChange={(e) => handleGuestsInputChange(e.target.value)}
                  className="w-16 h-11 text-center font-extrabold text-lg text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustGuests(1)}
                  disabled={guests >= 10}
                  className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white font-bold text-lg flex items-center justify-center transition-all shadow-sm active:scale-95"
                  title="Sumar 1 invitado"
                  aria-label="Sumar 1 invitado"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-slate-500" />
              <span>
                Gracias por avisar. La congregación tomará nota de que no podrás acompañarnos.
              </span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            {currentRSVP && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading || isDeleting}
                className="w-full sm:w-auto px-4 py-3 text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[48px]"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Cancelar confirmación</span>
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
              disabled={actionLoading || isDeleting}
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              {actionLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Check className="w-5 h-5" />
              )}
              <span>{currentRSVP ? 'Actualizar respuesta' : 'Guardar confirmación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
