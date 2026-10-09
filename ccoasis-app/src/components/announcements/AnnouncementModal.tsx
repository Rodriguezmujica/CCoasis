import React, { useState, useEffect } from 'react';
import {
  Announcement,
  AnnouncementFormData,
  AnnouncementPriority,
  ANNOUNCEMENT_PRIORITIES,
  PRIORITY_CONFIG,
} from '../../types/announcements';
import {
  X,
  Megaphone,
  AlertTriangle,
  AlertCircle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AnnouncementFormData) => Promise<{ success: boolean; error?: string }>;
  announcementToEdit?: Announcement | null;
  isLoading?: boolean;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  announcementToEdit,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [isActive, setIsActive] = useState(true);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (announcementToEdit) {
      setTitle(announcementToEdit.title);
      setMessage(announcementToEdit.message);
      setPriority(announcementToEdit.priority);
      setIsActive(announcementToEdit.is_active);

      if (announcementToEdit.expires_at) {
        setHasExpiration(true);
        // Formatear a formato compatible con <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
        const d = new Date(announcementToEdit.expires_at);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setExpirationDate(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
      } else {
        setHasExpiration(false);
        setExpirationDate('');
      }
    } else {
      // Valores por defecto para nuevo aviso
      setTitle('');
      setMessage('');
      setPriority('normal');
      setIsActive(true);
      setHasExpiration(false);
      setExpirationDate('');
    }
    setFormError(null);
  }, [announcementToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Por favor introduce un título para el aviso.');
      return;
    }

    if (!message.trim()) {
      setFormError('Por favor redacta el mensaje del aviso.');
      return;
    }

    let finalExpiresAt: string | null = null;
    if (hasExpiration && expirationDate) {
      const expDate = new Date(expirationDate);
      if (isNaN(expDate.getTime())) {
        setFormError('La fecha de caducidad no es válida.');
        return;
      }
      finalExpiresAt = expDate.toISOString();
    }

    const payload: AnnouncementFormData = {
      title: title.trim(),
      message: message.trim(),
      priority,
      is_active: isActive,
      expires_at: finalExpiresAt,
    };

    const res = await onSave(payload);
    if (res.success) {
      onClose();
    } else if (res.error) {
      setFormError(res.error);
    }
  };

  const getPriorityIcon = (p: AnnouncementPriority) => {
    switch (p) {
      case 'urgente':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'importante':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'normal':
      default:
        return <Megaphone className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-8 overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {announcementToEdit ? 'Editar Aviso' : 'Nuevo Aviso Parroquial'}
              </h2>
              <p className="text-xs text-slate-500">
                {announcementToEdit
                  ? 'Modifica los detalles del aviso oficial'
                  : 'Redacta un comunicado oficial para la congregación'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Selector de Prioridad */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nivel de Prioridad
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {ANNOUNCEMENT_PRIORITIES.map((p) => {
                const config = PRIORITY_CONFIG[p];
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      isSelected
                        ? `${config.cardBorder} ${config.badgeBg} ring-2 ring-offset-1 ${
                            p === 'urgente'
                              ? 'ring-rose-500'
                              : p === 'importante'
                              ? 'ring-amber-500'
                              : 'ring-blue-500'
                          }`
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex-shrink-0">{getPriorityIcon(p)}</div>
                    <div>
                      <p className={`text-xs font-bold ${isSelected ? config.badgeText : 'text-slate-800'}`}>
                        {config.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Título del Aviso <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Culto de Acción de Gracias este domingo..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              required
              maxLength={150}
            />
          </div>

          {/* Mensaje */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Mensaje / Comunicado <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe el mensaje completo para la congregación. Puedes detallar horarios, instrucciones o motivos de oración..."
              rows={4}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-normal resize-y"
              required
            />
          </div>

          {/* Fecha de Expiración Opcional */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="toggle-expiration"
                className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 select-none"
              >
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Fecha de caducidad automática</span>
              </label>
              <input
                id="toggle-expiration"
                type="checkbox"
                checked={hasExpiration}
                onChange={(e) => setHasExpiration(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {hasExpiration && (
              <div className="pt-2 border-t border-slate-200/60 animate-in fade-in duration-100">
                <p className="text-[11px] text-slate-500 mb-2">
                  El aviso dejará de mostrarse en la pantalla principal una vez superada esta fecha y hora:
                </p>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={hasExpiration}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Switch de Activo / Inactivo */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-xs font-bold text-slate-800">
                {isActive ? 'Publicar inmediatamente' : 'Guardar como inactivo'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isActive
                  ? 'Visible para todos los miembros mientras esté vigente'
                  : 'Solo visible en el panel de administración'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{announcementToEdit ? 'Actualizar aviso' : 'Publicar aviso'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
