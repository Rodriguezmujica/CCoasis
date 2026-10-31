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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#d4d7dc]">
        {/* Header */}
        <div className="oasis-title-gradient on-magenta px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-white flex-shrink-0" />
            <div>
              <h2 className="font-extrabold text-white text-2xl leading-tight">
                {evaluation ? 'Editar Evaluación' : 'Nueva Evaluación'}
              </h2>
              <p className="text-xs text-white/90">Examen, ensayo o actividad calificada</p>
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
              Título de la Evaluación *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Examen Parcial o Ensayo de Doctrina"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-base text-[#1a1a1a] placeholder:text-[#4a4f57] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
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
                className="w-full min-h-[44px] px-3.5 py-2 text-base text-[#1a1a1a] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] bg-white"
              />
              <span className="text-[11px] text-[#4a4f57]">Por defecto: 100</span>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                Fecha Límite
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-base text-[#1a1a1a] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
              Descripción o Criterios (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Instrucciones o rúbrica de calificación..."
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
              <span>{evaluation ? 'Guardar Cambios' : 'Crear Evaluación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
