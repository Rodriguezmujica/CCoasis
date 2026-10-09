import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { Assignment, AssignmentSubmission } from '../../types/classroom';

interface SubmitAssignmentModalProps {
  assignment: Assignment;
  submission: AssignmentSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    comments?: string;
    file?: File | null;
    existingFileUrl?: string | null;
  }) => Promise<{ ok: boolean; error?: string }>;
  onDownloadFile: (filePath: string) => Promise<void>;
  isDownloadingFile: boolean;
}

export const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({
  assignment,
  submission,
  isOpen,
  onClose,
  onSubmit,
  onDownloadFile,
  isDownloadingFile,
}) => {
  const [comments, setComments] = useState<string>(submission?.comments || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Comprobar fecha límite
  const isOverdue = assignment.due_date
    ? new Date(assignment.due_date) < new Date()
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim() && !selectedFile && !submission?.file_url) {
      setError('Debes añadir un comentario o adjuntar un archivo para entregar tu tarea.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await onSubmit({
      comments: comments.trim(),
      file: selectedFile,
      existingFileUrl: submission?.file_url || null,
    });

    setIsSubmitting(false);

    if (res.ok) {
      onClose();
    } else {
      setError(res.error || 'No se pudo registrar la entrega de la tarea.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Límite razonable de tamaño por archivo: 20MB
      if (file.size > 20 * 1024 * 1024) {
        setError('El archivo supera el límite recomendado de 20 MB.');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 my-auto">
        {/* Cabecera del modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
              {submission ? 'Modificar entrega' : 'Nueva entrega'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
              {assignment.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Información de la tarea */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Alerta de fecha límite */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {assignment.due_date ? (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border ${
                  isOverdue
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {isOverdue ? 'Plazo vencido: ' : 'Fecha límite: '}
                {new Date(assignment.due_date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <Calendar className="w-3.5 h-3.5" />
                Sin fecha límite estricta
              </span>
            )}

            {submission && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ya entregada el{' '}
                {new Date(submission.submitted_at).toLocaleDateString('es-ES')}
              </span>
            )}
          </div>

          {/* Instrucciones de la tarea */}
          {assignment.instructions && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700">
              <span className="font-semibold text-slate-900 block mb-1">
                Instrucciones del maestro:
              </span>
              <p className="whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          )}

          {/* Calificación y feedback previo si ya existe */}
          {submission && (submission.grade !== null || submission.feedback) && (
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                Corrección del maestro (Solo lectura)
              </span>
              {submission.grade !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Calificación obtenida:</span>
                  <span className="text-sm font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-amber-200">
                    {submission.grade} ptos
                  </span>
                </div>
              )}
              {submission.feedback && (
                <div>
                  <span className="text-xs font-medium text-slate-600 block mb-0.5">
                    Comentarios del maestro:
                  </span>
                  <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-amber-200 italic">
                    "{submission.feedback}"
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario de entrega */}
          <form id="submission-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="comments"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Comentarios o respuesta escrita (opcional)
              </label>
              <textarea
                id="comments"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Escribe aquí tu respuesta, dudas o notas para el maestro..."
                className="w-full text-sm rounded-xl border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            {/* Archivo adjunto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Archivo adjunto (PDF, Word, imagen o documento)
              </label>

              {/* Si ya hay un archivo subido anteriormente */}
              {submission?.file_url && !selectedFile && (
                <div className="mb-2 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-700 truncate">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate">Archivo ya entregado</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDownloadFile(submission.file_url!)}
                    disabled={isDownloadingFile}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                  >
                    {isDownloadingFile ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Ver</span>
                  </button>
                </div>
              )}

              {/* Selector de nuevo archivo */}
              <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-blue-50/30 transition-colors">
                <input
                  type="file"
                  id="assignment-file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">
                    {selectedFile
                      ? selectedFile.name
                      : submission?.file_url
                      ? 'Toca para reemplazar el archivo'
                      : 'Toca para seleccionar un archivo'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedFile
                      ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                      : 'Formatos admitidos: PDF, Word, imágenes (máx 20MB)'}
                  </span>
                </div>
              </div>

              {selectedFile && (
                <div className="mt-2 flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <span className="truncate">Listo para subir: {selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-500 hover:text-rose-600 font-bold ml-2"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Acciones del pie de modal */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            form="submission-form"
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando entrega...</span>
              </>
            ) : (
              <span>{submission ? 'Guardar cambios' : 'Entregar tarea'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
