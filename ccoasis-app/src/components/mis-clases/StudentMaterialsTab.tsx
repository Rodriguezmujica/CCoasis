import React, { useState } from 'react';
import {
  FileText,
  Link2,
  ExternalLink,
  Download,
  Loader2,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { ClassMaterial } from '../../types/classroom';

interface StudentMaterialsTabProps {
  materials: ClassMaterial[];
  onGetSignedUrl: (bucket: 'materials' | 'assignments', filePath: string) => Promise<{
    url: string | null;
    error?: string;
  }>;
}

export const StudentMaterialsTab: React.FC<StudentMaterialsTabProps> = ({
  materials,
  onGetSignedUrl,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadFile = async (material: ClassMaterial) => {
    if (!material.file_url) return;
    setDownloadingId(material.id);
    setDownloadError(null);

    const { url, error } = await onGetSignedUrl('materials', material.file_url);
    setDownloadingId(null);

    if (error || !url) {
      setDownloadError(error || 'No se pudo generar el enlace de descarga para este archivo.');
      return;
    }

    // Abrir URL firmada en nueva pestaña para visualizar/descargar
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (materials.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#d4d7dc] p-8 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#d9f7f8] border border-[#0e7c86]/30 flex items-center justify-center mx-auto text-[#0e7c86]">
          <BookOpen className="w-6 h-6" />
        </div>
        <h4 className="font-extrabold text-[#1a1a1a] text-base">Sin materiales publicados aún</h4>
        <p className="text-xs sm:text-sm text-[#4a4f57] max-w-md mx-auto">
          El maestro de este ciclo aún no ha compartido guías, documentos ni enlaces de estudio. Cuando se publiquen, aparecerán aquí.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {materials.map((item) => {
          const isFile = Boolean(item.file_url);
          const isLink = Boolean(item.external_url);

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-[#d4d7dc] p-5 flex flex-col justify-between hover:border-[#0e7c86] transition-all shadow-xs gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        isFile
                          ? 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]'
                          : 'bg-emerald-100 text-emerald-950 border-emerald-600'
                      }`}
                    >
                      {isFile ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <Link2 className="w-5 h-5" />
                      )}
                    </span>
                    <span
                      className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        isFile
                          ? 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]'
                          : 'bg-emerald-100 text-emerald-950 border-emerald-600'
                      }`}
                    >
                      {isFile ? 'Archivo adjunto' : 'Enlace web'}
                    </span>
                  </div>

                  <span className="text-xs text-[#4a4f57]">
                    {new Date(item.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                <h4 className="font-extrabold text-[#1a1a1a] text-sm sm:text-base leading-snug">
                  {item.title}
                </h4>

                {item.description && (
                  <p className="text-xs text-[#4a4f57] whitespace-pre-wrap leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Botón de acción táctil */}
              <div className="pt-3 border-t border-[#e5e7eb]">
                {isFile && (
                  <button
                    onClick={() => handleDownloadFile(item)}
                    disabled={downloadingId === item.id}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#0e7c86] hover:bg-[#0a5961] text-white active:scale-98 transition-all shadow-xs"
                  >
                    {downloadingId === item.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando enlace de descarga...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Descargar material</span>
                      </>
                    )}
                  </button>
                )}

                {isLink && (
                  <a
                    href={item.external_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-100 hover:bg-emerald-200 text-emerald-950 active:scale-98 transition-all border border-emerald-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir enlace externo</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
