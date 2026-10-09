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
      <FileText className="w-5 h-5 text-blue-600" />
    ) : (
      <Link2 className="w-5 h-5 text-emerald-600" />
    );

  const MaterialTypeBadge = ({ material }: { material: ClassMaterial }) =>
    material.file_url ? (
      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
        Archivo
      </span>
    ) : (
      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
        Enlace
      </span>
    );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-slate-500">Cargando materiales...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900 text-base">Materiales del Ciclo</h2>
          <p className="text-xs text-slate-500">
            Archivos y enlaces de apoyo para los alumnos inscritos en este ciclo.
          </p>
        </div>
        {!isCycleClosed && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Material</span>
          </button>
        )}
      </div>

      {/* Error de acción */}
      {(error || actionError) && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error || actionError}</span>
        </div>
      )}

      {/* Lista de materiales */}
      {materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-base mb-1">
            No hay materiales añadidos
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Añade archivos (PDF, presentaciones, etc.) o enlaces web para que los alumnos puedan consultarlos.
          </p>
          {!isCycleClosed && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Primer Material</span>
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
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-start gap-3"
              >
                {/* Icono */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <MaterialIcon material={mat} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <MaterialTypeBadge material={mat} />
                    <span className="text-[10px] text-slate-400">{formatDate(mat.created_at)}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{mat.title}</h4>
                  {mat.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{mat.description}</p>
                  )}
                  {mat.external_url && (
                    <p className="text-[11px] text-blue-500 truncate">{mat.external_url}</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {mat.file_url ? (
                    <button
                      onClick={() => handleOpenFile(mat)}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-60"
                      title="Descargar / abrir archivo"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">Descargar</span>
                    </button>
                  ) : (
                    <a
                      href={mat.external_url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                      title="Abrir enlace"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Abrir</span>
                    </a>
                  )}

                  {!isCycleClosed && (
                    <button
                      onClick={() => handleDelete(mat)}
                      disabled={isDeleting}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-60 ${
                        awaitingConfirm
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'text-slate-500 bg-slate-50 hover:bg-red-50 hover:text-red-600'
                      }`}
                      title={awaitingConfirm ? 'Confirmar eliminación' : 'Eliminar material'}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
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
