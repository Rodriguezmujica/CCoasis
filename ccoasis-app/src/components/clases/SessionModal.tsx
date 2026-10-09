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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {session ? 'Editar Sesión' : 'Nueva Sesión de Clase'}
              </h2>
              <p className="text-xs text-slate-500">Planificación de temas y asistencias</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Fecha de la Sesión *
            </label>
            <input
              type="date"
              required
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tema o Título *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Introducción al Evangelio de Juan"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descripción u Observaciones (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Notas pedagógicas, lecturas requeridas o resumen del tema..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{session ? 'Guardar Cambios' : 'Crear Sesión'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
