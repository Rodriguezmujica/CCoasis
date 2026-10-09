import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { Assignment } from '../../types/classroom';

interface AssignmentModalProps {
  assignment: Assignment | null; // null = crear nuevo
  isCycleClosed: boolean;
  onSave: (data: {
    title: string;
    instructions?: string;
    due_date?: string | null;
  }) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  assignment,
  isCycleClosed,
  onSave,
  onClose,
}) => {
  const isEditing = assignment !== null;

  const [title, setTitle] = useState(assignment?.title || '');
  const [instructions, setInstructions] = useState(assignment?.instructions || '');
  const [dueDate, setDueDate] = useState(
    assignment?.due_date
      ? assignment.due_date.slice(0, 16) // "YYYY-MM-DDTHH:mm"
      : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setTitle(assignment?.title || '');
    setInstructions(assignment?.instructions || '');
    setDueDate(
      assignment?.due_date ? assignment.due_date.slice(0, 16) : ''
    );
    setErrorMsg(null);
  }, [assignment]);

  const isValid = title.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSaving || isCycleClosed) return;
    setErrorMsg(null);
    setIsSaving(true);

    const result = await onSave({
      title: title.trim(),
      instructions: instructions.trim() || undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });

    setIsSaving(false);
    if (result.ok) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Error al guardar la tarea.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="font-black text-slate-900 text-base">
            {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {isCycleClosed && (
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>El ciclo está cerrado. No se pueden modificar las tareas.</span>
            </div>
          )}

          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Título de la tarea <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Ensayo sobre el libro de Marcos"
              maxLength={200}
              disabled={isCycleClosed}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
              required
            />
          </div>

          {/* Instrucciones */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Instrucciones <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe qué deben entregar los alumnos y cómo..."
              rows={4}
              maxLength={2000}
              disabled={isCycleClosed}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Fecha límite */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Fecha límite <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isCycleClosed}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            {!isCycleClosed && (
              <button
                type="submit"
                disabled={!isValid || isSaving}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Guardar cambios' : 'Crear Tarea'}</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
