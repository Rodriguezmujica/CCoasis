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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#d4d7dc] w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        {/* Cabecera */}
        <div className="oasis-title-gradient on-magenta flex items-center justify-between px-6 py-4 rounded-t-3xl sticky top-0 z-10">
          <h2 className="font-extrabold text-white text-2xl">Añadir Material</h2>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-white hover:bg-white/15 transition-colors flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Selector de modo */}
          <div className="flex rounded-xl border border-[#858a93] overflow-hidden bg-[#f5f5f5]">
            <button
              type="button"
              onClick={() => { setMode('enlace'); setErrorMsg(null); }}
              className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-extrabold transition-colors ${
                mode === 'enlace'
                  ? 'bg-[#0e7c86] text-white shadow-sm'
                  : 'text-[#4a4f57] hover:bg-white'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Enlace web</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('archivo'); setErrorMsg(null); }}
              className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-extrabold transition-colors ${
                mode === 'archivo'
                  ? 'bg-[#0e7c86] text-white shadow-sm'
                  : 'text-[#4a4f57] hover:bg-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Subir archivo</span>
            </button>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#1a1a1a]">
              Título <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Introducción al módulo 1"
              maxLength={200}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-base text-[#1a1a1a] placeholder:text-[#4a4f57] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84]"
              required
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#1a1a1a]">
              Descripción <span className="text-[#4a4f57] font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del material..."
              rows={2}
              maxLength={500}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-base text-[#1a1a1a] placeholder:text-[#4a4f57] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84] resize-none"
            />
          </div>

          {/* Campo específico según modo */}
          {mode === 'enlace' ? (
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#1a1a1a]">
                URL del enlace <span className="text-red-600">*</span>
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full min-h-[44px] px-3.5 py-2.5 text-base text-[#1a1a1a] placeholder:text-[#4a4f57] border border-[#858a93] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ae4a84]"
                required={mode === 'enlace'}
              />
              <p className="text-xs text-[#4a4f57]">
                El enlace se abre directamente en el navegador. No se sube ningún archivo.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#1a1a1a]">
                Archivo <span className="text-red-600">*</span>
              </label>
              <div
                className="border-2 border-dashed border-[#858a93] rounded-2xl p-6 text-center cursor-pointer hover:border-[#0e7c86] hover:bg-[#d9f7f8]/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-[#0e7c86] mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-bold text-[#1a1a1a] break-all">{selectedFile.name}</p>
                    <p className="text-xs text-[#4a4f57] mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-[#1a1a1a] font-bold">Toca para seleccionar un archivo</p>
                    <p className="text-xs text-[#4a4f57] mt-1">PDF, Word, PPT, imágenes... máx. {MAX_MB} MB</p>
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
            <div className="flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2 border-t border-[#e5e7eb]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-[#858a93] text-sm font-bold text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid || isSaving}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-[#0e7c86] text-white text-sm font-extrabold hover:bg-[#0a5961] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
