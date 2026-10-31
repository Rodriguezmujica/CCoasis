import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCheck,
  AlertCircle,
  Loader2,
  Lock,
  Award,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import {
  Evaluation,
  EnrollmentWithPerson,
  GradeRecord,
} from '../../types/classroom';

interface GradingSheetProps {
  evaluation: Evaluation;
  enrollments: EnrollmentWithPerson[];
  existingGrades: GradeRecord[];
  isCycleClosed: boolean;
  onSave: (
    evaluationId: string,
    gradesList: { enrollment_id: string; score: number; notes?: string }[]
  ) => Promise<{ ok: boolean; error?: string }>;
}

export const GradingSheet: React.FC<GradingSheetProps> = ({
  evaluation,
  enrollments,
  existingGrades,
  isCycleClosed,
  onSave,
}) => {
  // enrollment_id -> { scoreStr: string, notes: string }
  const [gradesData, setGradesData] = useState<
    Record<string, { scoreStr: string; notes: string }>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, { scoreStr: string; notes: string }> = {};

    enrollments.forEach((e) => {
      const found = existingGrades.find((g) => g.enrollment_id === e.id);
      if (found) {
        initial[e.id] = {
          scoreStr: found.score.toString(),
          notes: found.notes || '',
        };
      } else {
        initial[e.id] = {
          scoreStr: '',
          notes: '',
        };
      }
    });

    setGradesData(initial);
    setSaveSuccess(false);
    setError(null);
  }, [evaluation.id, enrollments, existingGrades]);

  const handleScoreChange = (enrollmentId: string, val: string) => {
    if (isCycleClosed) return;
    setGradesData((prev) => ({
      ...prev,
      [enrollmentId]: {
        scoreStr: val,
        notes: prev[enrollmentId]?.notes || '',
      },
    }));
    setSaveSuccess(false);
  };

  const handleNotesChange = (enrollmentId: string, val: string) => {
    if (isCycleClosed) return;
    setGradesData((prev) => ({
      ...prev,
      [enrollmentId]: {
        scoreStr: prev[enrollmentId]?.scoreStr || '',
        notes: val,
      },
    }));
    setSaveSuccess(false);
  };

  // Validaciones en tiempo real
  const getValidationError = (scoreStr: string): string | null => {
    if (scoreStr.trim() === '') return null;
    const num = parseFloat(scoreStr);
    if (isNaN(num)) return 'Introduce un número válido.';
    if (num < 0) return 'La nota no puede ser menor a 0.';
    if (num > evaluation.max_score) {
      return `La nota no puede superar el máximo (${evaluation.max_score}).`;
    }
    return null;
  };

  // Hay algún error en las notas ingresadas actualmente?
  const hasErrors = Object.values(gradesData).some(
    (item) => getValidationError(item.scoreStr) !== null
  );

  const handleSave = async () => {
    if (isCycleClosed) {
      setError('No se pueden modificar calificaciones de un ciclo cerrado.');
      return;
    }

    if (hasErrors) {
      setError(`Revisa las notas ingresadas: todas deben estar entre 0 y ${evaluation.max_score}.`);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    // Solo guardamos los alumnos que tienen nota ingresada
    const payload: { enrollment_id: string; score: number; notes?: string }[] = [];
    for (const e of enrollments) {
      const data = gradesData[e.id];
      if (data && data.scoreStr.trim() !== '') {
        const scoreNum = parseFloat(data.scoreStr);
        if (!isNaN(scoreNum)) {
          payload.push({
            enrollment_id: e.id,
            score: scoreNum,
            notes: data.notes?.trim() || undefined,
          });
        }
      }
    }

    if (payload.length === 0) {
      setIsSaving(false);
      setError('No se ha introducido ninguna calificación para guardar.');
      return;
    }

    const res = await onSave(evaluation.id, payload);
    setIsSaving(false);

    if (!res.ok) {
      setError(res.error || 'Error al guardar las calificaciones.');
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#d4d7dc] overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
      {/* Cabecera de la evaluación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#e5e7eb]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-950 bg-amber-100 border border-amber-600 px-2.5 py-0.5 rounded-full">
              <Award className="w-3.5 h-3.5 text-amber-800" />
              Puntaje Máximo: {evaluation.max_score} pts
            </span>
            {evaluation.due_date && (
              <span className="inline-flex items-center gap-1 text-xs text-[#4a4f57]">
                <Calendar className="w-3.5 h-3.5 text-[#0e7c86]" />
                Fecha límite: {new Date(evaluation.due_date).toLocaleDateString('es-ES')}
              </span>
            )}
            {isCycleClosed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> Solo lectura
              </span>
            )}
          </div>
          <h3 className="text-lg font-extrabold text-[#1a1a1a] mt-1">{evaluation.title}</h3>
          {evaluation.description && (
            <p className="text-xs text-[#4a4f57] mt-0.5">{evaluation.description}</p>
          )}
        </div>

        {!isCycleClosed && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || hasErrors}
            className="min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0e7c86] text-white rounded-xl text-xs font-extrabold hover:bg-[#0a5961] disabled:opacity-50 transition-colors shadow-sm self-start sm:self-auto"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Guardar Calificaciones</span>
          </button>
        )}
      </div>

      {/* Alerta si el ciclo está cerrado */}
      {isCycleClosed && (
        <div className="p-3.5 bg-slate-100 border border-[#d4d7dc] rounded-2xl text-[#1a1a1a] text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#4a4f57] flex-shrink-0" />
          <span>
            <strong>Ciclo Cerrado:</strong> Las calificaciones están protegidas contra modificaciones.
          </span>
        </div>
      )}

      {/* Mensajes de error o confirmación */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 text-xs font-semibold flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>Calificaciones guardadas correctamente.</span>
        </div>
      )}

      {/* Lista / Rejilla de alumnos para ingresar notas */}
      {enrollments.length === 0 ? (
        <div className="p-8 border border-dashed border-[#d4d7dc] rounded-2xl text-center text-[#4a4f57] text-sm">
          No hay alumnos inscritos en este ciclo para calificar.
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => {
            const person = enrollment.person;
            const item = gradesData[enrollment.id] || { scoreStr: '', notes: '' };
            const validationErr = getValidationError(item.scoreStr);

            return (
              <div
                key={enrollment.id}
                className={`p-4 rounded-2xl border transition-all ${
                  validationErr
                    ? 'border-red-400 bg-red-50/30'
                    : item.scoreStr
                    ? 'border-[#0e7c86]/50 bg-[#d9f7f8]/20'
                    : 'border-[#d4d7dc] bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Info del alumno */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                      {person.first_name[0]}
                      {person.last_name[0]}
                    </div>
                    <div>
                      <div className="font-extrabold text-[#1a1a1a] text-sm">
                        {person.first_name} {person.last_name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#4a4f57]">
                        {person.email && <span>{person.email}</span>}
                        <span className="font-semibold">Estado: {enrollment.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Input de nota con validación (0 <= nota <= max_score) */}
                  <div className="flex items-center gap-3 sm:w-72">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-extrabold text-[#1a1a1a] whitespace-nowrap">
                          Nota:
                        </label>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            disabled={isCycleClosed}
                            min={0}
                            max={evaluation.max_score}
                            step="any"
                            aria-label={`Nota de ${person.first_name} ${person.last_name}`}
                            placeholder={`0 - ${evaluation.max_score}`}
                            value={item.scoreStr}
                            onChange={(e) => handleScoreChange(enrollment.id, e.target.value)}
                            className={`w-full min-h-[44px] text-base font-extrabold px-3 py-2 rounded-xl border text-center focus:outline-none focus:ring-2 focus-oasis bg-white disabled:bg-slate-100 disabled:text-slate-500 ${
                              validationErr
                                ? 'border-red-500 focus:ring-red-500 text-red-700 bg-red-50/40'
                                : 'border-[#858a93] focus:ring-[#ae4a84] text-[#1a1a1a]'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-extrabold text-[#4a4f57]">
                          / {evaluation.max_score}
                        </span>
                      </div>

                      {validationErr && (
                        <p className="text-xs text-red-600 font-bold mt-1">
                          {validationErr}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comentarios u observaciones del maestro */}
                <div className="mt-3 pt-3 border-t border-[#e5e7eb] space-y-1.5">
                  <label
                    htmlFor={`notes-${enrollment.id}`}
                    className="flex items-center gap-1.5 text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#0e7c86]" />
                    <span>Comentarios / Observaciones del profesor</span>
                  </label>
                  <input
                    id={`notes-${enrollment.id}`}
                    type="text"
                    disabled={isCycleClosed}
                    placeholder="Comentarios u observaciones pedagógicas para este alumno..."
                    value={item.notes}
                    onChange={(e) => handleNotesChange(enrollment.id, e.target.value)}
                    aria-label={`Comentarios u observaciones del profesor para ${person.first_name} ${person.last_name}`}
                    className="w-full min-h-[44px] text-base text-[#1a1a1a] placeholder:text-[#4a4f57] px-3.5 py-2 border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] focus-oasis bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botón guardar para móvil */}
      {!isCycleClosed && enrollments.length > 0 && (
        <div className="pt-2 sm:hidden flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || hasErrors}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-[#0e7c86] text-white rounded-xl text-sm font-extrabold hover:bg-[#0a5961] disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Guardar Calificaciones</span>
          </button>
        </div>
      )}
    </div>
  );
};
