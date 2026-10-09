import React, { useState, useMemo } from 'react';
import { X, UserPlus, Search, AlertCircle, Loader2, Check } from 'lucide-react';
import {
  CandidatePerson,
  EnrollmentStatus,
  ENROLLMENT_STATUS_OPTIONS,
} from '../../types/classroom';

interface EnrollmentModalProps {
  candidates: CandidatePerson[];
  enrolledPersonIds: string[];
  onEnroll: (personId: string, status: EnrollmentStatus) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  candidates,
  enrolledPersonIds,
  onEnroll,
  onClose,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>('inscrito');
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtramos estrictamente: personas con estado 'activo' o 'visita' y que NO estén ya inscritas
  const availableCandidates = useMemo(() => {
    return candidates.filter(
      (c) =>
        ['activo', 'visita'].includes(c.status) &&
        !enrolledPersonIds.includes(c.id) &&
        (`${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
          (c.email && c.email.toLowerCase().includes(search.toLowerCase())))
    );
  }, [candidates, enrolledPersonIds, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) {
      setError('Por favor, selecciona una persona de la lista.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await onEnroll(selectedPersonId, enrollmentStatus);
    if (!res.ok) {
      setError(res.error || 'Ocurrió un error al procesar la inscripción.');
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
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Inscribir Alumno</h2>
              <p className="text-xs text-slate-500">Solo miembros activos o visitas</p>
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

          {/* Buscador de candidatos */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Buscar Persona
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por nombre o correo..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Lista de candidatos elegibles */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Seleccionar Alumno ({availableCandidates.length} disponibles)
            </label>

            {availableCandidates.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50 text-xs text-slate-500">
                {candidates.length === 0
                  ? 'No hay personas registradas en el directorio.'
                  : 'No hay más personas con estado "Activo" o "Visita" disponibles para inscribir en este ciclo.'}
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {availableCandidates.map((candidate) => {
                  const isSelected = selectedPersonId === candidate.id;
                  return (
                    <button
                      type="button"
                      key={candidate.id}
                      onClick={() => setSelectedPersonId(candidate.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-semibold truncate">
                          {candidate.first_name} {candidate.last_name}
                        </div>
                        {candidate.email && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {candidate.email}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            candidate.status === 'activo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {candidate.status}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Estado inicial de inscripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Estado de la inscripción
            </label>
            <select
              value={enrollmentStatus}
              onChange={(e) => setEnrollmentStatus(e.target.value as EnrollmentStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {ENROLLMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botones de acción */}
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
              disabled={isSubmitting || !selectedPersonId}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Inscribir en el ciclo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
