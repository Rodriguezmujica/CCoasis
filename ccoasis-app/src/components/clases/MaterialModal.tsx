import React, { useState, useRef } from 'react';
import {
  X,
  Link2,
  Upload,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface MaterialModalProps {
  onClose: () => void;
  onAddLink: (params: {
    title: string;
    description?: string;
    external_url: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onAddFile: (
    file: File,
    params: { title: string; description?: string }
  ) => Promise<{ ok: boolean; error?: string }>;
}

type MaterialMode = 'enlace' | 'archivo';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.mp4,.zip';
const MAX_MB = 50;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export const MaterialModal: React.FC<MaterialModalProps> = ({
  onClose,
  onAddLink,
  onAddFile,
}) => {
  const [mode, setMode] = useState<MaterialMode>('enlace');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValid =
    title.trim().length > 0 &&
    (mode === 'enlace'
      ? externalUrl.trim().length > 0
      : selectedFile !== null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_BYTES) {
      setErrorMsg(`El archivo supera el límite de ${MAX_MB} MB.`);
      setSelectedFile(null);
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSaving) return;
    setErrorMsg(null);
    setIsSaving(true);

    let result: { ok: boolean; error?: string };

    if (mode === 'enlace') {
      result = await onAddLink({
        title: title.trim(),
        description: description.trim() || undefined,
        external_url: externalUrl.trim(),
      });
    } else {
      result = await onAddFile(selectedFile!, {
        title: title.trim(),
        description: description.trim() || undefined,
      });
    }

    setIsSaving(false);

    if (result.ok) {
      onClose();
    } else {
      setErrorMsg(result.error || 'Error al guardar el material.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="font-black text-slate-900 text-base">Añadir Material</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Selector de modo */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            <button
              type="button"
              onClick={() => { setMode('enlace'); setErrorMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                mode === 'enlace'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Enlace web</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('archivo'); setErrorMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                mode === 'archivo'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Subir archivo</span>
            </button>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Introducción al módulo 1"
              maxLength={200}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Descripción <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del material..."
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Campo específico según modo */}
          {mode === 'enlace' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                URL del enlace <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={mode === 'enlace'}
              />
              <p className="text-[11px] text-slate-400">
                El enlace se abre directamente en el navegador. No se sube ningún archivo.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Archivo <span className="text-red-500">*</span>
              </label>
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-800 break-all">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Toca para seleccionar un archivo</p>
                    <p className="text-[11px] text-slate-400 mt-1">PDF, Word, PPT, imágenes... máx. {MAX_MB} MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isSaving}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'archivo' ? 'Subiendo...' : 'Guardando...'}</span>
                </>
              ) : (
                <span>{mode === 'archivo' ? 'Subir archivo' : 'Guardar enlace'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
