import React, { useState } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Download,
  Award,
  Loader2,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { Assignment, AssignmentSubmission } from '../../types/classroom';
import { SubmitAssignmentModal } from './SubmitAssignmentModal';

interface StudentAssignmentsTabProps {
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  onSubmitAssignment: (
    assignmentId: string,
    params: {
      comments?: string;
      file?: File | null;
      existingFileUrl?: string | null;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  onRemoveSubmission: (assignmentId: string) => Promise<{ ok: boolean; error?: string }>;
  onGetSignedUrl: (bucket: 'materials' | 'assignments', filePath: string) => Promise<{
    url: string | null;
    error?: string;
  }>;
}

export const StudentAssignmentsTab: React.FC<StudentAssignmentsTabProps> = ({
  assignments,
  submissions,
  onSubmitAssignment,
  onRemoveSubmission,
  onGetSignedUrl,
}) => {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [downloadingFilePath, setDownloadingFilePath] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const submissionsMap = new Map<string, AssignmentSubmission>(
    submissions.map((s) => [s.assignment_id, s])
  );

  const handleDownloadSubmissionFile = async (filePath: string) => {
    setDownloadingFilePath(filePath);
    setDownloadError(null);

    const { url, error } = await onGetSignedUrl('assignments', filePath);
    setDownloadingFilePath(null);

    if (error || !url) {
      setDownloadError(error || 'No se pudo generar el enlace para descargar tu entrega.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#d4d7dc] p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#d9f7f8] border border-[#0e7c86]/30 flex items-center justify-center mx-auto text-[#0e7c86]">
          <ClipboardList className="w-6 h-6" />
        </div>
        <h4 className="font-extrabold text-[#1a1a1a] text-base">Sin tareas asignadas</h4>
        <p className="text-xs sm:text-sm text-[#4a4f57] max-w-md mx-auto">
          Por el momento no hay tareas pendientes en este ciclo. Consulta periódicamente por nuevos trabajos prácticos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {downloadError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{downloadError}</span>
        </div>
      )}

      <div className="space-y-4">
        {assignments.map((assignment) => {
          const submission = submissionsMap.get(assignment.id) || null;
          const isSubmitted = Boolean(submission);
          const isGraded = Boolean(submission && (submission.grade !== null || submission.feedback));

          const isOverdue = assignment.due_date
            ? new Date(assignment.due_date) < new Date()
            : false;

          return (
            <div
              key={assignment.id}
              className="bg-white rounded-3xl border border-[#d4d7dc] p-5 hover:border-[#0e7c86] transition-all shadow-xs space-y-4"
            >
              {/* Encabezado de la tarea */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                      isSubmitted
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-600'
                        : 'bg-amber-100 text-amber-950 border-amber-600'
                    }`}
                  >
                    {isSubmitted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Entregada</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pendiente</span>
                      </>
                    )}
                  </span>

                  {/* Indicador de plazo */}
                  {assignment.due_date ? (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-950 border-rose-600'
                          : 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {isOverdue ? 'Plazo vencido' : 'A tiempo'} · Límite:{' '}
                      {new Date(assignment.due_date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  ) : (
                    <span className="text-xs text-[#4a4f57]">Sin fecha límite</span>
                  )}
                </div>

                {isGraded && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] px-2.5 py-1 rounded-full">
                    <Award className="w-3.5 h-3.5" />
                    <span>Calificada</span>
                  </div>
                )}
              </div>

              {/* Título e instrucciones */}
              <div>
                <h4 className="font-extrabold text-[#1a1a1a] text-base sm:text-lg mb-1.5">
                  {assignment.title}
                </h4>
                {assignment.instructions && (
                  <p className="text-xs sm:text-sm text-[#4a4f57] whitespace-pre-wrap leading-relaxed bg-[#f5f5f5] p-3.5 rounded-2xl border border-[#e5e7eb]">
                    {assignment.instructions}
                  </p>
                )}
              </div>

              {/* Resumen de la entrega realizada por el alumno */}
              {submission && (
                <div className="p-4 rounded-2xl bg-[#f5f5f5] border border-[#d4d7dc] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-[#4a4f57] font-semibold">
                    <span>
                      Entregado el{' '}
                      {new Date(submission.submitted_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {submission.comments && (
                    <div className="text-[#1a1a1a]">
                      <span className="font-extrabold text-[#1a1a1a] block mb-1">
                        Tu comentario:
                      </span>
                      <p className="italic bg-white p-2.5 rounded-xl border border-[#d4d7dc]">
                        &quot;{submission.comments}&quot;
                      </p>
                    </div>
                  )}

                  {submission.file_url && (
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-[#1a1a1a]">
                        <FileText className="w-4 h-4 text-[#0e7c86]" />
                        <span className="font-bold">Archivo adjuntado</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadSubmissionFile(submission.file_url!)}
                        disabled={downloadingFilePath === submission.file_url}
                        className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold text-[#0a5961] bg-[#d9f7f8] hover:bg-[#c2f0f2] border border-[#0e7c86] transition-colors"
                      >
                        {downloadingFilePath === submission.file_url ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Descargar mi entrega</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sección de calificación y retroalimentación del maestro (SOLO LECTURA) */}
              {isGraded && (
                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Evaluación y comentarios del maestro"
                  className="p-4 rounded-2xl bg-[#d9f7f8]/60 border border-[#0e7c86] space-y-2.5 focus-oasis"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-extrabold text-[#0a5961] uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#0e7c86]" />
                      Evaluación del maestro (Solo lectura)
                    </span>
                    {submission && submission.grade !== null && (
                      <span className="text-sm font-extrabold bg-white text-[#0a5961] px-3 py-1 rounded-xl border border-[#0e7c86] shadow-xs">
                        Nota: {submission.grade} ptos
                      </span>
                    )}
                  </div>

                  {submission?.feedback && (
                    <div className="text-xs text-[#1a1a1a] bg-white p-3 rounded-xl border border-[#0e7c86]/50 leading-relaxed">
                      <div className="flex items-center gap-1 text-[#0a5961] font-extrabold mb-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Comentarios del maestro:</span>
                      </div>
                      <p className="italic">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Botón de acción para entregar o modificar */}
              <div className="pt-2 flex justify-end">
                {isGraded ? (
                  <span className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]">
                    <Lock className="w-4 h-4" />
                    <span>Calificada — entrega bloqueada</span>
                  </span>
                ) : (
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(assignment)}
                  className={`focus-oasis w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 active:scale-98 transition-all ${
                    isSubmitted
                      ? 'bg-[#f5f5f5] hover:bg-slate-200 text-[#1a1a1a] border border-[#858a93]'
                      : 'bg-[#0e7c86] hover:bg-[#0a5961] text-white shadow-sm'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{isSubmitted ? 'Modificar mi entrega' : 'Entregar tarea'}</span>
                </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de entrega */}
      {selectedAssignment && (
        <SubmitAssignmentModal
          assignment={selectedAssignment}
          submission={submissionsMap.get(selectedAssignment.id) || null}
          isOpen={Boolean(selectedAssignment)}
          onClose={() => setSelectedAssignment(null)}
          onSubmit={async (params) => {
            return await onSubmitAssignment(selectedAssignment.id, params);
          }}
          onRemove={async () => onRemoveSubmission(selectedAssignment.id)}
          onDownloadFile={handleDownloadSubmissionFile}
          isDownloadingFile={Boolean(downloadingFilePath)}
        />
      )}
    </div>
  );
};
