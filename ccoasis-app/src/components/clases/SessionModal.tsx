import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { ClassSession } from '../../types/classroom';

interface SessionModalProps {
  session: ClassSession | null;
  onSave: (data: {
    session_date: string;
    topic: string;
    description?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export const SessionModal: React.FC<SessionModalProps> = ({
  session,
  onSave,
  onClose,
}) => {
  const [sessionDate, setSessionDate] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setSessionDate(session.session_date);
      setTopic(session.topic);
      setDescription(session.description || '');
    } else {
      // Por defecto la fecha de hoy en formato YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      setSessionDate(today);
      setTopic('');
      setDescription('');
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionDate) {
      setError('Por favor, indica la fecha de la sesión.');
      return;
    }
    if (!topic.trim()) {
      setError('Por favor, introduce el tema o título de la sesión.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await onSave({
      session_date: sessionDate,
      topic: topic.trim(),
      description: description.trim() || undefined,
    });

    if (!res.ok) {
      setError(res.error || 'Ocurrió un error al guardar la sesión.');
      setIsSubmitting(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#d4d7dc]">
        {/* Header */}
        <div className="oasis-title-gradient on-magenta px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-white flex-shrink-0" />
            <div>
              <h2 className="font-extrabold text-white text-2xl leading-tight">
                {session ? 'Editar Sesión' : 'Nueva Sesión de Clase'}
              </h2>
              <p className="text-xs text-white/90">Planificación de temas y asistencias</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar"
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-white hover:bg-white/15 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
              Fecha de la Sesión *
            </label>
            <input
              type="date"
              required
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-base text-[#1a1a1a] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
              Tema o Título *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Introducción al Evangelio de Juan"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-base text-[#1a1a1a] placeholder:text-[#4a4f57] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
              Descripción u Observaciones (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Notas pedagógicas, lecturas requeridas o resumen del tema..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-base text-[#1a1a1a] placeholder:text-[#4a4f57] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] bg-white resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] px-4 py-2.5 text-sm font-bold text-[#1a1a1a] hover:bg-[#f5f5f5] border border-[#858a93] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-[#0e7c86] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a5961] disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{session ? 'Guardar Cambios' : 'Crear Sesión'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
