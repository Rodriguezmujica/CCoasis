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

interface GradeFormState {
  submissionId: string;
  enrollmentId: string;
  grade: string;
  feedback: string;
  isSaving: boolean;
  error: string | null;
}

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
    setGradingForm({
      submissionId: sub.id,
      enrollmentId: sub.enrollment_id,
      grade: sub.grade !== null ? String(sub.grade) : '',
      feedback: sub.feedback || '',
      isSaving: false,
      error: null,
    });
  };

  const handleSaveGrade = async () => {
    if (!gradingForm) return;
    const gradeNum = gradingForm.grade !== '' ? parseFloat(gradingForm.grade) : null;
    if (gradeNum !== null && (isNaN(gradeNum) || gradeNum < 0)) {
      setGradingForm((f) => f && ({ ...f, error: 'La calificación debe ser un número mayor o igual a 0.' }));
      return;
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
      <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm text-slate-500">Cargando entregas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-slate-500">
          {submittedCount} de {submissions.length} alumnos han entregado
        </span>
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full min-w-[60px] overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${submissions.length > 0 ? (submittedCount / submissions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Error de descarga */}
      {downloadError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Lista de entregas */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
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
                className={`bg-white rounded-2xl border shadow-xs p-4 space-y-3 transition-colors ${
                  hasSubmitted ? 'border-slate-200' : 'border-dashed border-slate-300'
                }`}
              >
                {/* Fila principal: alumno + estado */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {sub.person.first_name[0]}{sub.person.last_name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {sub.person.first_name} {sub.person.last_name}
                      </div>
                      {sub.person.email && (
                        <div className="text-[11px] text-slate-400">{sub.person.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasSubmitted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Entregado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Si entregó: detalles */}
                {hasSubmitted && !isPending && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] text-slate-400">
                        Entregado el {formatDateTime(sub.submitted_at)}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Calificación actual */}
                        {sub.grade !== null && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            Nota: {sub.grade}
                          </span>
                        )}

                        {/* Descarga de archivo adjunto */}
                        {sub.file_url && (
                          <button
                            onClick={() => handleDownload(sub)}
                            disabled={downloadingId === sub.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-60"
                          >
                            {downloadingId === sub.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span>Descargar</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Texto de entrega */}
                    {sub.comments && (
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                        <p className="leading-relaxed line-clamp-3">{sub.comments}</p>
                      </div>
                    )}

                    {/* Feedback ya guardado */}
                    {sub.feedback && !isBeingGraded && (
                      <div className="flex items-start gap-1.5 text-xs text-blue-700 bg-blue-50 rounded-xl p-2.5">
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{sub.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Formulario de calificación */}
                {isBeingGraded && gradingForm ? (
                  <div className="pt-3 border-t border-blue-200 space-y-3">
                    <p className="text-xs font-bold text-blue-700">Calificar entrega</p>
                    <div className="flex gap-3">
                      <div className="w-28">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                          Calificación
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={gradingForm.grade}
                          onChange={(e) =>
                            setGradingForm((f) => f && ({ ...f, grade: e.target.value }))
                          }
                          placeholder="—"
                          className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                          Retroalimentación
                        </label>
                        <textarea
                          value={gradingForm.feedback}
                          onChange={(e) =>
                            setGradingForm((f) => f && ({ ...f, feedback: e.target.value }))
                          }
                          rows={2}
                          placeholder="Comentarios para el alumno..."
                          className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    </div>

                    {gradingForm.error && (
                      <div className="text-xs text-red-600 bg-red-50 rounded-xl p-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {gradingForm.error}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setGradingForm(null)}
                        disabled={gradingForm.isSaving}
                        className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveGrade}
                        disabled={gradingForm.isSaving}
                        className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {gradingForm.isSaving ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Guardando...</span></>
                        ) : (
                          'Guardar calificación'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Botón para abrir el formulario de calificación
                  <button
                    onClick={() => openGradeForm(sub)}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                      justSaved
                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        : 'border-slate-200 text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
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
