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

                {/* Formulario de calificación */}
                {isBeingGraded && gradingForm ? (
                  <div className="pt-3 border-t border-[#d4d7dc] space-y-3">
                    <p className="text-xs font-extrabold text-[#0e7c86]">Calificar entrega</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="sm:w-32">
                        <label className="text-xs text-[#1a1a1a] font-bold block mb-1">
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
                          className="w-full min-h-[44px] px-3 py-2 text-base text-[#1a1a1a] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-[#1a1a1a] font-bold block mb-1">
                          Retroalimentación
                        </label>
                        <textarea
                          value={gradingForm.feedback}
                          onChange={(e) =>
                            setGradingForm((f) => f && ({ ...f, feedback: e.target.value }))
                          }
                          rows={2}
                          placeholder="Comentarios para el alumno..."
                          className="w-full min-h-[44px] px-3 py-2 text-base text-[#1a1a1a] placeholder:text-[#4a4f57] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] resize-none"
                        />
                      </div>
                    </div>

                    {gradingForm.error && (
                      <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {gradingForm.error}
                      </div>
                    )}

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setGradingForm(null)}
                        disabled={gradingForm.isSaving}
                        className="flex-1 min-h-[44px] py-2 text-xs font-bold text-[#1a1a1a] border border-[#858a93] rounded-xl hover:bg-[#f5f5f5] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveGrade}
                        disabled={gradingForm.isSaving}
                        className="flex-1 min-h-[44px] py-2 text-xs font-extrabold text-white bg-[#0e7c86] rounded-xl hover:bg-[#0a5961] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {gradingForm.isSaving ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /><span>Guardando...</span></>
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
