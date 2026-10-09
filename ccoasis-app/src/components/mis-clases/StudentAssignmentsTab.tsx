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
  onGetSignedUrl: (bucket: 'materials' | 'assignments', filePath: string) => Promise<{
    url: string | null;
    error?: string;
  }>;
}

export const StudentAssignmentsTab: React.FC<StudentAssignmentsTabProps> = ({
  assignments,
  submissions,
  onSubmitAssignment,
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <ClipboardList className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-slate-800 text-base">Sin tareas asignadas</h4>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Por el momento no hay tareas pendientes en este ciclo. Consulta periódicamente por nuevos trabajos prácticos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {downloadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
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
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 hover:border-slate-300 transition-all shadow-xs space-y-4"
            >
              {/* Encabezado de la tarea */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                      isSubmitted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
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
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                        isOverdue
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
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
                    <span className="text-[11px] text-slate-400">Sin fecha límite</span>
                  )}
                </div>

                {isGraded && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg">
                    <Award className="w-3.5 h-3.5" />
                    <span>Calificada</span>
                  </div>
                )}
              </div>

              {/* Título e instrucciones */}
              <div>
                <h4 className="font-bold text-slate-900 text-base sm:text-lg mb-1">
                  {assignment.title}
                </h4>
                {assignment.instructions && (
                  <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {assignment.instructions}
                  </p>
                )}
              </div>

              {/* Resumen de la entrega realizada por el alumno */}
              {submission && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
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
                    <div className="text-slate-700">
                      <span className="font-semibold text-slate-900 block mb-0.5">
                        Tu comentario:
                      </span>
                      <p className="italic bg-white p-2 rounded-lg border border-slate-200">
                        "{submission.comments}"
                      </p>
                    </div>
                  )}

                  {submission.file_url && (
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Archivo adjuntado</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadSubmissionFile(submission.file_url!)}
                        disabled={downloadingFilePath === submission.file_url}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 transition-colors"
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
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-600" />
                      Evaluación del maestro (Solo lectura)
                    </span>
                    {submission && submission.grade !== null && (
                      <span className="text-sm font-bold bg-white text-slate-900 px-3 py-0.5 rounded-lg border border-amber-300 shadow-xs">
                        Nota: {submission.grade} ptos
                      </span>
                    )}
                  </div>

                  {submission?.feedback && (
                    <div className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-amber-200 leading-relaxed">
                      <div className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
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
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(assignment)}
                  className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-98 transition-all ${
                    isSubmitted
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{isSubmitted ? 'Modificar mi entrega' : 'Entregar tarea'}</span>
                </button>
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
          onDownloadFile={handleDownloadSubmissionFile}
          isDownloadingFile={Boolean(downloadingFilePath)}
        />
      )}
    </div>
  );
};
