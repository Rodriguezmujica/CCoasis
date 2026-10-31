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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#d4d7dc]">
        {/* Header */}
        <div className="oasis-title-gradient on-magenta px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-6 h-6 text-white flex-shrink-0" />
            <div>
              <h2 className="font-extrabold text-white text-2xl leading-tight">Inscribir Alumno</h2>
              <p className="text-xs text-white/90">Solo miembros activos o visitas</p>
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

          {/* Buscador de candidatos */}
          <div>
            <label className="block text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
              Buscar Persona
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4f57]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por nombre o correo..."
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2 text-base text-[#1a1a1a] placeholder:text-[#4a4f57] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] bg-white"
              />
            </div>
          </div>

          {/* Lista de candidatos elegibles */}
          <div>
            <label className="block text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
              Seleccionar Alumno ({availableCandidates.length} disponibles)
            </label>

            {availableCandidates.length === 0 ? (
              <div className="p-4 border border-dashed border-[#d4d7dc] rounded-2xl text-center bg-[#f5f5f5] text-xs text-[#4a4f57]">
                {candidates.length === 0
                  ? 'No hay personas registradas en el directorio.'
                  : 'No hay más personas con estado "Activo" o "Visita" disponibles para inscribir en este ciclo.'}
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-1.5 border border-[#d4d7dc] rounded-2xl p-2 bg-[#f5f5f5]/60">
                {availableCandidates.map((candidate) => {
                  const isSelected = selectedPersonId === candidate.id;
                  return (
                    <button
                      type="button"
                      key={candidate.id}
                      onClick={() => setSelectedPersonId(candidate.id)}
                      className={`w-full min-h-[44px] text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-[#d9f7f8] border-[#0e7c86] text-[#0a5961] shadow-xs font-bold'
                          : 'bg-white border-[#d4d7dc] hover:border-[#0e7c86] text-[#1a1a1a]'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-extrabold truncate">
                          {candidate.first_name} {candidate.last_name}
                        </div>
                        {candidate.email && (
                          <div className="text-[11px] text-[#4a4f57] truncate">
                            {candidate.email}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            candidate.status === 'activo'
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-600'
                              : 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]'
                          }`}
                        >
                          {candidate.status}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#0e7c86]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Estado inicial de inscripción */}
          <div>
            <label className="block text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
              Estado de la inscripción
            </label>
            <select
              value={enrollmentStatus}
              onChange={(e) => setEnrollmentStatus(e.target.value as EnrollmentStatus)}
              className="w-full min-h-[44px] px-3.5 py-2 text-base font-medium text-[#1a1a1a] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] bg-white"
            >
              {ENROLLMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botones de acción */}
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
              disabled={isSubmitting || !selectedPersonId}
              className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-[#0e7c86] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a5961] disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Inscribir en el ciclo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
