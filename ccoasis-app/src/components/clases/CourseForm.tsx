import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, BookOpen } from 'lucide-react';
import { Course, CourseFormData, EMPTY_COURSE_FORM } from '../../types/courses';

interface CourseFormProps {
  course: Course | null; // null = crear, Course = editar
  onSave: (data: CourseFormData) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export const CourseForm: React.FC<CourseFormProps> = ({ course, onSave, onClose }) => {
  const isEditing = Boolean(course);
  const [form, setForm] = useState<CourseFormData>(EMPTY_COURSE_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title,
        description: course.description || '',
        passing_grade: course.passing_grade ?? 70,
        min_attendance_pct: course.min_attendance_pct ?? 75,
      });
    } else {
      setForm(EMPTY_COURSE_FORM);
    }
    setErrors({});
    setServerError(null);
  }, [course]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = 'El título del curso es obligatorio.';
    }

    if (isNaN(form.passing_grade) || form.passing_grade < 0 || form.passing_grade > 100) {
      newErrors.passing_grade = 'La nota mínima debe estar entre 0 y 100.';
    }

    if (isNaN(form.min_attendance_pct) || form.min_attendance_pct < 0 || form.min_attendance_pct > 100) {
      newErrors.min_attendance_pct = 'El porcentaje de asistencia debe estar entre 0 y 100.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setServerError(null);

    const result = await onSave(form);

    if (result.ok) {
      onClose();
    } else {
      setServerError(result.error || 'Error al guardar el curso.');
    }
    setIsSaving(false);
  };

  const updateField = (field: keyof CourseFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (serverError) setServerError(null);
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Editar Curso' : 'Nuevo Curso'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{serverError}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre / Título del curso <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Ej: Discipulado Nivel 1"
              className={inputClass('title')}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción o temario básico
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Breve descripción del propósito y contenido del curso..."
              className={inputClass('description')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nota mínima para aprobar (0-100) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.passing_grade}
                  onChange={(e) => updateField('passing_grade', parseFloat(e.target.value) || 0)}
                  className={inputClass('passing_grade')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  pts
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Por defecto: 70 pts</p>
              {errors.passing_grade && (
                <p className="mt-1 text-xs text-red-600">{errors.passing_grade}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Asistencia mínima (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.min_attendance_pct}
                  onChange={(e) => updateField('min_attendance_pct', parseFloat(e.target.value) || 0)}
                  className={inputClass('min_attendance_pct')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  %
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Por defecto: 75%</p>
              {errors.min_attendance_pct && (
                <p className="mt-1 text-xs text-red-600">{errors.min_attendance_pct}</p>
              )}
            </div>
          </div>

          {/* Action Buttons - Mobile friendly */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear curso'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
