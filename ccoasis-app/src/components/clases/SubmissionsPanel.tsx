import React, { useState } from 'react';
import {
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Star,
  MessageSquare,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { SubmissionWithPerson, Assignment } from '../../types/classroom';

interface SubmissionsPanelProps {
  assignment: Assignment;
  submissions: SubmissionWithPerson[];
  isLoadingSubmissions: boolean;
  onGetSignedUrl: (filePath: string) => Promise<{ url: string | null; error?: string }>;
  onGrade: (
    submissionId: string,
    enrollmentId: string,
    assignmentId: string,
    grade: number | null,
    feedback: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onRefresh: () => void;
}

interface CriterionState {
  id: string;
  label: string;
  description: string;
  score: number;
  max: number;
}

interface GradeFormState {
  submissionId: string;
  enrollmentId: string;
  grade: string;
  maxScore: number;
  criteria: CriterionState[];
  feedback: string;
  isSaving: boolean;
  error: string | null;
}

const getCriteriaForScale = (maxScore: number, existingGrade: number | null): CriterionState[] => {
  if (maxScore === 10) {
    if (existingGrade !== null) {
      const p = Math.min(2, Math.max(0, Math.round(existingGrade * 0.2 * 10) / 10));
      const pr = Math.min(3, Math.max(0, Math.round(existingGrade * 0.3 * 10) / 10));
      const c = Math.min(5, Math.max(0, Math.round((existingGrade - p - pr) * 10) / 10));
      return [
        { id: 'puntualidad', label: 'Puntualidad', description: 'Entrega en plazo y compromiso', score: p, max: 2 },
        { id: 'presentacion', label: 'Presentación', description: 'Orden, legibilidad y formato', score: pr, max: 3 },
        { id: 'contenido', label: 'Contenido / Estructura', description: 'Profundidad y desarrollo completo', score: c, max: 5 },
      ];
    }
    return [
      { id: 'puntualidad', label: 'Puntualidad', description: 'Entrega en plazo y compromiso', score: 2, max: 2 },
      { id: 'presentacion', label: 'Presentación', description: 'Orden, legibilidad y formato', score: 3, max: 3 },
      { id: 'contenido', label: 'Contenido / Estructura', description: 'Profundidad y desarrollo completo', score: 5, max: 5 },
    ];
  } else if (maxScore === 100) {
    if (existingGrade !== null) {
      const p = Math.min(20, Math.max(0, Math.round(existingGrade * 0.2)));
      const pr = Math.min(30, Math.max(0, Math.round(existingGrade * 0.3)));
      const c = Math.min(50, Math.max(0, Math.round(existingGrade - p - pr)));
      return [
        { id: 'puntualidad', label: 'Puntualidad', description: 'Entrega en plazo y compromiso', score: p, max: 20 },
        { id: 'presentacion', label: 'Presentación', description: 'Orden, legibilidad y formato', score: pr, max: 30 },
        { id: 'contenido', label: 'Contenido / Estructura', description: 'Profundidad y desarrollo completo', score: c, max: 50 },
      ];
    }
    return [
      { id: 'puntualidad', label: 'Puntualidad', description: 'Entrega en plazo y compromiso', score: 20, max: 20 },
      { id: 'presentacion', label: 'Presentación', description: 'Orden, legibilidad y formato', score: 30, max: 30 },
      { id: 'contenido', label: 'Contenido / Estructura', description: 'Profundidad y desarrollo completo', score: 50, max: 50 },
    ];
  } else {
    const pMax = Math.max(1, Math.round(maxScore * 0.2));
    const prMax = Math.max(1, Math.round(maxScore * 0.3));
    const cMax = Math.max(1, maxScore - pMax - prMax);
    const ratio = existingGrade !== null ? Math.min(1, Math.max(0, existingGrade / maxScore)) : 1;
    return [
      { id: 'puntualidad', label: 'Puntualidad', description: 'Entrega en plazo y compromiso', score: Math.round(pMax * ratio * 10) / 10, max: pMax },
      { id: 'presentacion', label: 'Presentación', description: 'Orden, legibilidad y formato', score: Math.round(prMax * ratio * 10) / 10, max: prMax },
      { id: 'contenido', label: 'Contenido / Estructura', description: 'Profundidad y desarrollo completo', score: Math.round(cMax * ratio * 10) / 10, max: cMax },
    ];
  }
};

export const SubmissionsPanel: React.FC<SubmissionsPanelProps> = ({
  assignment,
  submissions,
  isLoadingSubmissions,
  onGetSignedUrl,
  onGrade,
  onRefresh,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [gradingForm, setGradingForm] = useState<GradeFormState | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const submittedCount = submissions.filter((s) => s.submitted_at !== '').length;

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleDownload = async (sub: SubmissionWithPerson) => {
    if (!sub.file_url) return;
    setDownloadingId(sub.id);
    setDownloadError(null);
    const { url, error: signErr } = await onGetSignedUrl(sub.file_url);
    setDownloadingId(null);
    if (signErr || !url) {
      setDownloadError(signErr || 'No se pudo obtener el enlace.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openGradeForm = (sub: SubmissionWithPerson) => {
    const defaultMax = sub.grade !== null && sub.grade > 10 ? 100 : 10;
    const initialCriteria = getCriteriaForScale(defaultMax, sub.grade);
    setGradingForm({
      submissionId: sub.id,
      enrollmentId: sub.enrollment_id,
      grade: sub.grade !== null ? String(sub.grade) : '',
      maxScore: defaultMax,
      criteria: initialCriteria,
      feedback: sub.feedback || '',
      isSaving: false,
      error: null,
    });
  };

  const handleSwitchScale = (newMax: number) => {
    if (!gradingForm || gradingForm.maxScore === newMax) return;
    const currentGradeNum = gradingForm.grade !== '' ? parseFloat(gradingForm.grade) : null;
    let rescaledGrade = '';
    if (currentGradeNum !== null && !isNaN(currentGradeNum)) {
      const scaled = (currentGradeNum / gradingForm.maxScore) * newMax;
      rescaledGrade = String(Math.round(scaled * 100) / 100);
    }
    const newCriteria = getCriteriaForScale(
      newMax,
      rescaledGrade !== '' ? parseFloat(rescaledGrade) : null
    );
    setGradingForm({
      ...gradingForm,
      maxScore: newMax,
      criteria: newCriteria,
      grade: rescaledGrade,
      error: null,
    });
  };

  const handleAdjustCriterion = (criterionId: string, delta: number) => {
    setGradingForm((f) => {
      if (!f) return null;
      const nextCriteria = f.criteria.map((c) => {
        if (c.id !== criterionId) return c;
        const newScore = Math.min(c.max, Math.max(0, Math.round((c.score + delta) * 100) / 100));
        return { ...c, score: newScore };
      });
      const sum = nextCriteria.reduce((acc, c) => acc + c.score, 0);
      const clamped = Math.min(f.maxScore, Math.max(0, Math.round(sum * 100) / 100));
      return {
        ...f,
        criteria: nextCriteria,
        grade: String(clamped),
        error: null,
      };
    });
  };

  const handleAdjustTotalGrade = (delta: number) => {
    setGradingForm((f) => {
      if (!f) return null;
      const current = parseFloat(f.grade) || 0;
      const nextScore = Math.min(
        f.maxScore,
        Math.max(0, Math.round((current + delta) * 100) / 100)
      );
      return {
        ...f,
        grade: String(nextScore),
        error: null,
      };
    });
  };

  const handleAppendTraitsSummary = () => {
    setGradingForm((f) => {
      if (!f) return null;
      const breakdown = f.criteria
        .map((c) => `${c.label}: ${c.score}/${c.max} pts`)
        .join(', ');
      const note = `[Rasgos de entrega: ${breakdown} | Total sugerido: ${f.grade || '0'}/${f.maxScore} pts]`;
      const newFeedback = f.feedback.trim()
        ? `${f.feedback.trim()}\n\n${note}`
        : note;
      return {
        ...f,
        feedback: newFeedback,
      };
    });
  };

  const handleSaveGrade = async () => {
    if (!gradingForm) return;
    const gradeNum = gradingForm.grade !== '' ? parseFloat(gradingForm.grade) : null;
    if (gradeNum !== null) {
      if (isNaN(gradeNum) || gradeNum < 0) {
        setGradingForm((f) => f && ({ ...f, error: 'La calificación debe ser un número mayor o igual a 0.' }));
        return;
      }
      if (gradeNum > gradingForm.maxScore) {
        setGradingForm((f) => f && ({
          ...f,
          error: `La calificación no puede superar el puntaje máximo asignado (${gradingForm.maxScore} pts).`,
        }));
        return;
      }
    }

    setGradingForm((f) => f && ({ ...f, isSaving: true, error: null }));
    const result = await onGrade(
      gradingForm.submissionId,
      gradingForm.enrollmentId,
      assignment.id,
      gradeNum,
      gradingForm.feedback
    );
    if (result.ok) {
      setSavedIds((prev) => new Set(prev).add(gradingForm.submissionId));
      setGradingForm(null);
      onRefresh();
    } else {
      setGradingForm((f) => f && ({ ...f, isSaving: false, error: result.error || 'Error al guardar.' }));
    }
  };

  if (isLoadingSubmissions) {
    return (
      <div className="bg-white rounded-3xl border border-[#d4d7dc] p-8 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#0e7c86]" />
        <span className="text-sm text-[#4a4f57]">Cargando entregas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-extrabold text-[#4a4f57]">
          {submittedCount} de {submissions.length} alumnos han entregado
        </span>
        <div className="flex-1 h-2 bg-[#e5e7eb] rounded-full min-w-[60px] overflow-hidden">
          <div
            className="h-full bg-[#0e7c86] rounded-full transition-all"
            style={{ width: `${submissions.length > 0 ? (submittedCount / submissions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Error de descarga */}
      {downloadError && (
        <div className="flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Lista de entregas */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-8 text-center text-[#4a4f57] text-xs">
          No hay alumnos inscritos para mostrar entregas.
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const hasSubmitted = sub.submitted_at !== '';
            const isPending = sub.id.startsWith('pending_');
            const isBeingGraded = gradingForm?.submissionId === sub.id;
            const justSaved = savedIds.has(sub.id);

            return (
              <div
                key={sub.id}
                className={`bg-white rounded-3xl border shadow-xs p-5 space-y-3 transition-colors ${
                  hasSubmitted ? 'border-[#d4d7dc]' : 'border-dashed border-[#858a93]'
                }`}
              >
                {/* Fila principal: alumno + estado */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                      {sub.person.first_name[0]}{sub.person.last_name[0]}
                    </div>
                    <div>
                      <div className="font-extrabold text-[#1a1a1a] text-sm">
                        {sub.person.first_name} {sub.person.last_name}
                      </div>
                      {sub.person.email && (
                        <div className="text-xs text-[#4a4f57]">{sub.person.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasSubmitted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-950 bg-emerald-100 border border-emerald-600 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Entregado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-950 bg-amber-100 border border-amber-600 px-2.5 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Si entregó: detalles */}
                {hasSubmitted && !isPending && (
                  <div className="pt-2 border-t border-[#e5e7eb] space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-[#4a4f57]">
                        Entregado el {formatDateTime(sub.submitted_at)}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Calificación actual */}
                        {sub.grade !== null && (
                          <span className="text-xs font-extrabold text-[#0a5961] bg-[#d9f7f8] border border-[#0e7c86] px-2.5 py-0.5 rounded-full">
                            Nota: {sub.grade}
                          </span>
                        )}

                        {/* Descarga de archivo adjunto */}
                        {sub.file_url && (
                          <button
                            onClick={() => handleDownload(sub)}
                            disabled={downloadingId === sub.id}
                            aria-label={`Descargar entrega de ${sub.person.first_name} ${sub.person.last_name}`}
                            className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-[#0a5961] bg-[#d9f7f8] border border-[#0e7c86] rounded-xl hover:bg-[#c2f0f2] transition-colors disabled:opacity-60"
                          >
                            {downloadingId === sub.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>Descargar</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Texto de entrega */}
                    {sub.comments && (
                      <div className="flex items-start gap-2 text-xs text-[#1a1a1a] bg-[#f5f5f5] border border-[#e5e7eb] rounded-2xl p-3">
                        <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#0e7c86]" />
                        <p className="leading-relaxed line-clamp-3">{sub.comments}</p>
                      </div>
                    )}

                    {/* Feedback ya guardado */}
                    {sub.feedback && !isBeingGraded && (
                      <div className="flex items-start gap-2 text-xs text-[#0a5961] bg-[#d9f7f8]/60 border border-[#0e7c86] rounded-2xl p-3">
                        <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#0e7c86]" />
                        <p className="leading-relaxed font-medium">{sub.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Formulario interactivo de calificación con Rasgos de Entrega */}
                {isBeingGraded && gradingForm ? (
                  <div className="pt-4 border-t border-[#d4d7dc] space-y-4">
                    {/* Bloque interactivo de rasgos o criterios de entrega */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#f5f5f5] border border-[#d4d7dc] space-y-4">
                      {/* Cabecera del bloque de rasgos y selector de escala */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-[#d4d7dc]/70 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] flex items-center justify-center flex-shrink-0">
                            <Sliders className="w-4 h-4 text-[#0e7c86]" />
                          </div>
                          <div>
                            <h5 className="text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider">
                              Rasgos y Criterios de Entrega
                            </h5>
                            <p className="text-[11px] text-[#4a4f57]">
                              Ajusta puntos por criterio pedagógico
                            </p>
                          </div>
                        </div>

                        {/* Selector de escala / puntaje máximo */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                          <span className="text-[11px] font-extrabold text-[#4a4f57]">Escala:</span>
                          <button
                            type="button"
                            onClick={() => handleSwitchScale(10)}
                            className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-extrabold border transition-colors focus-oasis ${
                              gradingForm.maxScore === 10
                                ? 'bg-[#0e7c86] text-white border-[#0e7c86] shadow-xs'
                                : 'bg-white text-[#1a1a1a] border-[#d4d7dc] hover:bg-[#d9f7f8]'
                            }`}
                          >
                            10 pts
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchScale(100)}
                            className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-extrabold border transition-colors focus-oasis ${
                              gradingForm.maxScore === 100
                                ? 'bg-[#0e7c86] text-white border-[#0e7c86] shadow-xs'
                                : 'bg-white text-[#1a1a1a] border-[#d4d7dc] hover:bg-[#d9f7f8]'
                            }`}
                          >
                            100 pts
                          </button>
                        </div>
                      </div>

                      {/* Lista interactiva de criterios con botones táctiles compactos */}
                      <div className="space-y-2.5">
                        {gradingForm.criteria.map((c) => (
                          <div
                            key={c.id}
                            className="p-3.5 bg-white rounded-2xl border border-[#d4d7dc] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-[#1a1a1a]">{c.label}</span>
                                <span className="text-[11px] font-extrabold text-[#0a5961] bg-[#d9f7f8] border border-[#0e7c86] px-2.5 py-0.5 rounded-full">
                                  {c.score} / {c.max} pts
                                </span>
                              </div>
                              <p className="text-[11px] text-[#4a4f57]">{c.description}</p>
                            </div>

                            {/* Botones táctiles compactos de suma y resta por criterio */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleAdjustCriterion(c.id, -1)}
                                disabled={c.score <= 0}
                                aria-label={`Restar 1 punto a ${c.label}`}
                                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl text-xs font-extrabold border border-[#d4d7dc] bg-[#f5f5f5] text-[#1a1a1a] hover:bg-rose-50 hover:text-rose-900 hover:border-rose-300 disabled:opacity-40 transition-colors focus-oasis active:scale-95 flex items-center justify-center"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustCriterion(c.id, -0.5)}
                                disabled={c.score <= 0}
                                aria-label={`Restar 0.5 puntos a ${c.label}`}
                                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl text-xs font-extrabold border border-[#d4d7dc] bg-[#f5f5f5] text-[#1a1a1a] hover:bg-rose-50 hover:text-rose-900 hover:border-rose-300 disabled:opacity-40 transition-colors focus-oasis active:scale-95 flex items-center justify-center"
                              >
                                -0.5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustCriterion(c.id, 0.5)}
                                disabled={c.score >= c.max}
                                aria-label={`Sumar 0.5 puntos a ${c.label}`}
                                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl text-xs font-extrabold border border-[#d4d7dc] bg-[#f5f5f5] text-[#1a1a1a] hover:bg-emerald-50 hover:text-emerald-950 hover:border-emerald-300 disabled:opacity-40 transition-colors focus-oasis active:scale-95 flex items-center justify-center"
                              >
                                +0.5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustCriterion(c.id, 1)}
                                disabled={c.score >= c.max}
                                aria-label={`Sumar 1 punto a ${c.label}`}
                                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl text-xs font-extrabold border border-[#d4d7dc] bg-[#f5f5f5] text-[#1a1a1a] hover:bg-emerald-50 hover:text-emerald-950 hover:border-emerald-300 disabled:opacity-40 transition-colors focus-oasis active:scale-95 flex items-center justify-center"
                              >
                                +1
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recalculador y ajuste de nota total */}
                      <div className="pt-3 border-t border-[#d4d7dc]/70 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`grade-input-${sub.id}`}
                            className="block text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider"
                          >
                            Nota total sugerida
                          </label>
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              id={`grade-input-${sub.id}`}
                              type="number"
                              min={0}
                              max={gradingForm.maxScore}
                              step="any"
                              value={gradingForm.grade}
                              onChange={(e) =>
                                setGradingForm((f) =>
                                  f ? { ...f, grade: e.target.value, error: null } : null
                                )
                              }
                              placeholder={`0 - ${gradingForm.maxScore}`}
                              aria-label={`Calificación de ${sub.person.first_name} ${sub.person.last_name}`}
                              className="w-28 min-h-[44px] px-3 py-2 text-base font-extrabold text-[#1a1a1a] text-center border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] focus-oasis bg-white"
                            />
                            <span className="text-xs font-extrabold text-[#4a4f57]">
                              / {gradingForm.maxScore} pts
                            </span>

                            {/* Botones táctiles compactos de ajuste directo sobre la nota final */}
                            <div className="flex items-center gap-1 ml-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleAdjustTotalGrade(-1)}
                                aria-label="Restar 1 punto a la nota total"
                                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl text-xs font-extrabold border border-[#d4d7dc] bg-white text-[#1a1a1a] hover:bg-slate-100 transition-colors focus-oasis active:scale-95 flex items-center justify-center"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustTotalGrade(-0.5)}
                                aria-label="Restar 0.5 puntos a la nota total"
                                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl text-xs font-extrabold border border-[#d4d7dc] bg-white text-[#1a1a1a] hover:bg-slate-100 transition-colors focus-oasis active:scale-95 flex items-center justify-center"
                              >
                                -0.5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustTotalGrade(0.5)}
                                aria-label="Sumar 0.5 puntos a la nota total"
                                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl text-xs font-extrabold border border-[#d4d7dc] bg-white text-[#1a1a1a] hover:bg-slate-100 transition-colors focus-oasis active:scale-95 flex items-center justify-center"
                              >
                                +0.5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustTotalGrade(1)}
                                aria-label="Sumar 1 punto a la nota total"
                                className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl text-xs font-extrabold border border-[#d4d7dc] bg-white text-[#1a1a1a] hover:bg-slate-100 transition-colors focus-oasis active:scale-95 flex items-center justify-center"
                              >
                                +1
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Botón para insertar el resumen de rasgos en el feedback */}
                        <button
                          type="button"
                          onClick={handleAppendTraitsSummary}
                          className="min-h-[44px] px-3.5 py-2 text-xs font-extrabold text-[#0a5961] bg-[#d9f7f8] border border-[#0e7c86] rounded-xl hover:bg-[#c2f0f2] transition-colors focus-oasis flex items-center justify-center gap-1.5 self-start md:self-auto"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#0e7c86]" />
                          <span>Insertar rasgos en comentarios</span>
                        </button>
                      </div>
                    </div>

                    {/* Renglón de comentarios / retroalimentación personalizada */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`feedback-input-${sub.id}`}
                        className="flex items-center gap-1.5 text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#0e7c86]" />
                        <span>Comentarios / Retroalimentación para el alumno</span>
                      </label>
                      <textarea
                        id={`feedback-input-${sub.id}`}
                        value={gradingForm.feedback}
                        onChange={(e) =>
                          setGradingForm((f) =>
                            f ? { ...f, feedback: e.target.value } : null
                          )
                        }
                        rows={3}
                        placeholder="Escribe comentarios u observaciones pedagógicas para este alumno..."
                        aria-label={`Comentarios o retroalimentación para ${sub.person.first_name} ${sub.person.last_name}`}
                        className="w-full min-h-[88px] px-3.5 py-2.5 text-base text-[#1a1a1a] placeholder:text-[#4a4f57] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] focus-oasis bg-white resize-none"
                      />
                    </div>

                    {gradingForm.error && (
                      <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                        <span>{gradingForm.error}</span>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setGradingForm(null)}
                        disabled={gradingForm.isSaving}
                        className="flex-1 min-h-[44px] py-2.5 text-xs sm:text-sm font-bold text-[#1a1a1a] border border-[#858a93] rounded-xl hover:bg-[#f5f5f5] transition-colors focus-oasis"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveGrade}
                        disabled={gradingForm.isSaving}
                        className="flex-1 min-h-[44px] py-2.5 text-xs sm:text-sm font-extrabold text-white bg-[#0e7c86] rounded-xl hover:bg-[#0a5961] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm focus-oasis"
                      >
                        {gradingForm.isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <span>Guardar calificación</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Botón para abrir el formulario de calificación
                  <button
                    onClick={() => openGradeForm(sub)}
                    className={`w-full min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 text-xs font-extrabold rounded-xl border transition-colors ${
                      justSaved
                        ? 'border-emerald-600 text-emerald-950 bg-emerald-100 hover:bg-emerald-200'
                        : 'border-[#d4d7dc] text-[#1a1a1a] bg-[#f5f5f5] hover:bg-[#d9f7f8] hover:text-[#0a5961] hover:border-[#0e7c86]'
                    }`}
                  >
                    <Star className="w-4 h-4 text-[#0e7c86]" />
                    <span>
                      {sub.grade !== null || sub.feedback
                        ? 'Editar calificación / feedback'
                        : 'Calificar / añadir feedback'}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
