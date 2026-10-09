import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Person, PersonFormData, EMPTY_PERSON_FORM, PERSON_STATUS_OPTIONS } from '../../types/persons';

interface PersonFormProps {
  person: Person | null; // null = create mode
  onSave: (data: PersonFormData) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export const PersonForm: React.FC<PersonFormProps> = ({ person, onSave, onClose }) => {
  const isEditing = Boolean(person);
  const [form, setForm] = useState<PersonFormData>(EMPTY_PERSON_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (person) {
      setForm({
        first_name: person.first_name,
        last_name: person.last_name,
        email: person.email || '',
        phone: person.phone || '',
        birth_date: person.birth_date || '',
        baptism_date: person.baptism_date || '',
        address: person.address || '',
        status: person.status,
        notes: person.notes || '',
      });
    } else {
      setForm(EMPTY_PERSON_FORM);
    }
    setErrors({});
    setServerError(null);
  }, [person]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.first_name.trim()) newErrors.first_name = 'El nombre es obligatorio.';
    if (!form.last_name.trim()) newErrors.last_name = 'El apellido es obligatorio.';

    if (form.baptism_date && form.birth_date && form.baptism_date < form.birth_date) {
      newErrors.baptism_date = 'La fecha de bautismo no puede ser anterior a la de nacimiento.';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'El correo electrónico no es válido.';
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
      setServerError(result.error || 'Error desconocido.');
    }
    setIsSaving(false);
  };

  const updateField = (field: keyof PersonFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (serverError) setServerError(null);
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-slate-900">
            {isEditing ? 'Editar persona' : 'Nueva persona'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server error banner */}
        {serverError && (
          <div className="mx-6 mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                className={inputClass('first_name')}
                placeholder="Ej: María"
                autoFocus
              />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Apellido *</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                className={inputClass('last_name')}
                placeholder="Ej: García"
              />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
            </div>
          </div>

          {/* Email y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={inputClass('email')}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={inputClass('phone')}
                placeholder="+34 600 123 456"
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de nacimiento</label>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => updateField('birth_date', e.target.value)}
                className={inputClass('birth_date')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de bautismo</label>
              <input
                type="date"
                value={form.baptism_date}
                onChange={(e) => updateField('baptism_date', e.target.value)}
                className={inputClass('baptism_date')}
              />
              {errors.baptism_date && <p className="text-xs text-red-500 mt-1">{errors.baptism_date}</p>}
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              className={inputClass('address')}
              placeholder="Calle, número, ciudad..."
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className={inputClass('status')}
            >
              {PERSON_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className={inputClass('notes')}
              rows={3}
              placeholder="Observaciones internas..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 border border-slate-300 transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear persona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
