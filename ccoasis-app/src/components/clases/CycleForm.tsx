import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Calendar } from 'lucide-react';
import {
  CycleWithDetails,
  CycleFormData,
  EMPTY_CYCLE_FORM,
  CycleStatus,
  CYCLE_STATUS_OPTIONS,
  TeacherOption,
  Course,
} from '../../types/courses';

interface CycleFormProps {
  cycle: CycleWithDetails | null; // null = crear, CycleWithDetails = editar
  courses: Course[];
  teachers: TeacherOption[];
  onSave: (data: CycleFormData) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export const CycleForm: React.FC<CycleFormProps> = ({
  cycle,
  courses,
  teachers,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(cycle);
  const [form, setForm] = useState<CycleFormData>(EMPTY_CYCLE_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cycle) {
      setForm({
        course_id: cycle.course_id,
        teacher_id: cycle.teacher_id,
        name: cycle.name,
        start_date: cycle.start_date || '',
        end_date: cycle.end_date || '',
        status: cycle.status,
      });
    } else {
      setForm({
        ...EMPTY_CYCLE_FORM,
        course_id: courses.length > 0 ? courses[0].id : '',
        teacher_id: teachers.length > 0 ? teachers[0].id : '',
      });
    }
    setErrors({});
    setServerError(null);
  }, [cycle, courses, teachers]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'El nombre del ciclo o grupo es obligatorio.';
    }
    if (!form.course_id) {
      newErrors.course_id = 'Debes seleccionar un curso de base.';
    }
    if (!form.teacher_id) {
      newErrors.teacher_id = 'Debes asignar un maestro responsable.';
    }
    if (!form.start_date) {
      newErrors.start_date = 'La fecha de inicio es obligatoria.';
    }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      newErrors.end_date = 'La fecha de fin no puede ser anterior a la de inicio.';
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
      setServerError(result.error || 'Error al guardar el ciclo.');
    }
    setIsSaving(false);
  };

  const updateField = (field: keyof CycleFormData, value: any) => {
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Editar Ciclo' : 'Nuevo Ciclo de Clases'}
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

          {/* Nombre del ciclo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre de la cohorte o ciclo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Ej: Primavera 2026 - Grupo A"
              className={inputClass('name')}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Curso Base */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Curso formativo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.course_id}
                onChange={(e) => updateField('course_id', e.target.value)}
                className={inputClass('course_id')}
                disabled={courses.length === 0}
              >
                {courses.length === 0 ? (
                  <option value="">No hay cursos registrados. Crea uno primero.</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))
                )}
              </select>
            </div>
            {errors.course_id && <p className="mt-1 text-xs text-red-600">{errors.course_id}</p>}
          </div>

          {/* Maestro asignado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Maestro asignado <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.teacher_id}
                onChange={(e) => updateField('teacher_id', e.target.value)}
                className={inputClass('teacher_id')}
                disabled={teachers.length === 0}
              >
                {teachers.length === 0 ? (
                  <option value="">No hay personas disponibles para asignar.</option>
                ) : (
                  teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} {t.email ? `(${t.email})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
            {errors.teacher_id && <p className="mt-1 text-xs text-red-600">{errors.teacher_id}</p>}
            <p className="mt-1 text-xs text-slate-500">
              Cargado desde el directorio de Personas activas de la iglesia.
            </p>
          </div>

          {/* Fechas inicio y fin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha de inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => updateField('start_date', e.target.value)}
                className={inputClass('start_date')}
              />
              {errors.start_date && (
                <p className="mt-1 text-xs text-red-600">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha estimada de fin
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => updateField('end_date', e.target.value)}
                className={inputClass('end_date')}
              />
              {errors.end_date && (
                <p className="mt-1 text-xs text-red-600">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Estado del ciclo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estado inicial del ciclo
            </label>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value as CycleStatus)}
              className={inputClass('status')}
            >
              {CYCLE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {form.status === 'cerrado' && (
              <p className="mt-1 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Aviso: Un ciclo cerrado bloquea cambios en sesiones, asistencias y evaluaciones.
              </p>
            )}
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
              disabled={isSaving || courses.length === 0 || teachers.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear ciclo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
