import React, { useState } from 'react';
import {
  Plus,
  FileText,
  Link2,
  ExternalLink,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { ClassMaterial } from '../../types/classroom';
import { useMaterials } from '../../lib/useMaterials';
import { MaterialModal } from './MaterialModal';

interface MaterialsTabProps {
  cycleId: string;
  isCycleClosed: boolean;
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({ cycleId, isCycleClosed }) => {
  const {
    materials,
    isLoading,
    error,
    addLink,
    addFile,
    getSignedUrl,
    deleteMaterial,
  } = useMaterials(cycleId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Abrir archivo: genera URL firmada y abre en nueva pestaña
  const handleOpenFile = async (material: ClassMaterial) => {
    if (!material.file_url) return;
    setDownloadingId(material.id);
    setActionError(null);
    const { url, error: signErr } = await getSignedUrl(material.file_url);
    setDownloadingId(null);
    if (signErr || !url) {
      setActionError(signErr || 'No se pudo obtener el enlace de descarga.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Eliminar material con confirmación en dos pasos
  const handleDelete = async (material: ClassMaterial) => {
    if (confirmDeleteId !== material.id) {
      setConfirmDeleteId(material.id);
      return;
    }
    setConfirmDeleteId(null);
    setDeletingId(material.id);
    setActionError(null);
    const { ok, error: delErr } = await deleteMaterial(material);
    setDeletingId(null);
    if (!ok) setActionError(delErr || 'Error al eliminar el material.');
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const MaterialIcon = ({ material }: { material: ClassMaterial }) =>
    material.file_url ? (
      <FileText className="w-5 h-5 text-[#0e7c86]" />
    ) : (
      <Link2 className="w-5 h-5 text-emerald-700" />
    );

  const MaterialTypeBadge = ({ material }: { material: ClassMaterial }) =>
    material.file_url ? (
      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]">
        Archivo
      </span>
    ) : (
      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-600">
        Enlace
      </span>
    );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[#0e7c86] mr-2" />
        <span className="text-sm text-[#4a4f57]">Cargando materiales...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-[#1a1a1a] text-base">Materiales del Ciclo</h2>
          <p className="text-xs text-[#4a4f57]">
            Archivos y enlaces de apoyo para los alumnos inscritos en este ciclo.
          </p>
        </div>
        {!isCycleClosed && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0e7c86] text-white rounded-[12px] text-sm font-extrabold hover:bg-[#0a5961] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Material</span>
          </button>
        )}
      </div>

      {/* Error de acción */}
      {(error || actionError) && (
        <div className="flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{error || actionError}</span>
        </div>
      )}

      {/* Lista de materiales */}
      {materials.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#1a1a1a] text-base mb-1">
            No hay materiales añadidos
          </h3>
          <p className="text-xs text-[#4a4f57] max-w-sm mx-auto mb-4">
            Añade archivos (PDF, presentaciones, etc.) o enlaces web para que los alumnos puedan consultarlos.
          </p>
          {!isCycleClosed && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-[#0e7c86] text-white rounded-[12px] text-sm font-extrabold hover:bg-[#0a5961]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Añadir Primer Material</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((mat) => {
            const isDeleting = deletingId === mat.id;
            const isDownloading = downloadingId === mat.id;
            const awaitingConfirm = confirmDeleteId === mat.id;

            return (
              <div
                key={mat.id}
                className="bg-white rounded-3xl border border-[#d4d7dc] p-5 shadow-xs flex flex-col sm:flex-row sm:items-start gap-3"
              >
                {/* Icono */}
                <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-[#f5f5f5] border border-[#e5e7eb] flex items-center justify-center">
                  <MaterialIcon material={mat} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <MaterialTypeBadge material={mat} />
                    <span className="text-xs text-[#4a4f57]">{formatDate(mat.created_at)}</span>
                  </div>
                  <h4 className="font-extrabold text-[#1a1a1a] text-sm leading-snug">{mat.title}</h4>
                  {mat.description && (
                    <p className="text-xs text-[#4a4f57] line-clamp-2">{mat.description}</p>
                  )}
                  {mat.external_url && (
                    <p className="text-xs font-semibold text-[#ae4a84] truncate">{mat.external_url}</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {mat.file_url ? (
                    <button
                      onClick={() => handleOpenFile(mat)}
                      disabled={isDownloading}
                      aria-label={`Descargar archivo ${mat.title}`}
                      className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-[#0a5961] bg-[#d9f7f8] border border-[#0e7c86] rounded-xl hover:bg-[#c2f0f2] transition-colors disabled:opacity-60"
                      title="Descargar / abrir archivo"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Descargar</span>
                    </button>
                  ) : (
                    <a
                      href={mat.external_url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir enlace ${mat.title}`}
                      className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-emerald-950 bg-emerald-100 border border-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors"
                      title="Abrir enlace"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Abrir</span>
                    </a>
                  )}

                  {!isCycleClosed && (
                    <button
                      onClick={() => handleDelete(mat)}
                      disabled={isDeleting}
                      aria-label={awaitingConfirm ? `Confirmar eliminación de ${mat.title}` : `Eliminar material ${mat.title}`}
                      className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl transition-colors disabled:opacity-60 ${
                        awaitingConfirm
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'text-rose-700 bg-white border border-rose-300 hover:bg-rose-50'
                      }`}
                      title={awaitingConfirm ? 'Confirmar eliminación' : 'Eliminar material'}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {awaitingConfirm ? '¿Confirmar?' : 'Eliminar'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para añadir material */}
      {isModalOpen && (
        <MaterialModal
          onClose={() => setIsModalOpen(false)}
          onAddLink={addLink}
          onAddFile={addFile}
        />
      )}
    </div>
  );
};
