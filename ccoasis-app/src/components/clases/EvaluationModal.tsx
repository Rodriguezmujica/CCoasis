import React, { useState, useEffect } from 'react';
import { X, Award, AlertCircle, Loader2 } from 'lucide-react';
import { Evaluation } from '../../types/classroom';

interface EvaluationModalProps {
  evaluation: Evaluation | null;
  onSave: (data: {
    title: string;
    description?: string;
    max_score: number;
    due_date?: string | null;
  }) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  evaluation,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [dueDate, setDueDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (evaluation) {
      setTitle(evaluation.title);
      setDescription(evaluation.description || '');
      setMaxScore(evaluation.max_score);
      setDueDate(evaluation.due_date || '');
    } else {
      setTitle('');
      setDescription('');
      setMaxScore(100);
      setDueDate('');
    }
  }, [evaluation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, indica el título de la evaluación.');
      return;
    }
    if (isNaN(maxScore) || maxScore <= 0) {
      setError('El puntaje máximo debe ser un número mayor que 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      max_score: Number(maxScore),
      due_date: dueDate || null,
    });

    if (!res.ok) {
      setError(res.error || 'Ocurrió un error al guardar la evaluación.');
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
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {evaluation ? 'Editar Evaluación' : 'Nueva Evaluación'}
              </h2>
              <p className="text-xs text-slate-500">Examen, ensayo o actividad calificada</p>
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
              Título de la Evaluación *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Examen Parcial o Ensayo de Doctrina"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Puntaje Máximo *
              </label>
              <input
                type="number"
                required
                min={1}
                max={1000}
                step="any"
                value={maxScore}
                onChange={(e) => setMaxScore(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <span className="text-[10px] text-slate-400">Por defecto: 100</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fecha Límite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descripción o Criterios (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Instrucciones o rúbrica de calificación..."
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
              <span>{evaluation ? 'Guardar Cambios' : 'Crear Evaluación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
