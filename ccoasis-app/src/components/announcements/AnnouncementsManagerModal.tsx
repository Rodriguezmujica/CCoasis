import React, { useState, useMemo } from 'react';
import {
  Announcement,
  AnnouncementPriority,
  PRIORITY_CONFIG,
} from '../../types/announcements';
import {
  formatAnnouncementDate,
  formatAnnouncementDateTime,
  isAnnouncementExpired,
} from '../../lib/useAnnouncements';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Megaphone,
  AlertTriangle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Calendar,
  Search,
} from 'lucide-react';

interface AnnouncementsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  onOpenCreate: () => void;
  onOpenEdit: (announcement: Announcement) => void;
  onToggleActive: (id: string, currentStatus: boolean) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export const AnnouncementsManagerModal: React.FC<AnnouncementsManagerModalProps> = ({
  isOpen,
  onClose,
  announcements,
  onOpenCreate,
  onOpenEdit,
  onToggleActive,
  onDelete,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive_or_expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const isExpired = isAnnouncementExpired(a.expires_at);
      const isEffectivelyActive = a.is_active && !isExpired;

      if (activeTab === 'active' && !isEffectivelyActive) return false;
      if (activeTab === 'inactive_or_expired' && isEffectivelyActive) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(query);
        const matchesMessage = a.message.toLowerCase().includes(query);
        return matchesTitle || matchesMessage;
      }

      return true;
    });
  }, [announcements, activeTab, searchQuery]);

  if (!isOpen) return null;

  const handleToggle = async (a: Announcement) => {
    setActionInProgressId(a.id);
    await onToggleActive(a.id, a.is_active);
    setActionInProgressId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAnnouncement) return;
    setActionInProgressId(deletingAnnouncement.id);
    const res = await onDelete(deletingAnnouncement.id);
    setActionInProgressId(null);
    if (res.success) {
      setDeletingAnnouncement(null);
    }
  };

  const getPriorityIcon = (p: AnnouncementPriority) => {
    switch (p) {
      case 'urgente':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'importante':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'normal':
      default:
        return <Megaphone className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-6 flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
          {/* Cabecera */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  Gestión de Avisos Parroquiales
                </h2>
                <p className="text-xs text-slate-500">
                  Tablón de anuncios oficiales, comunicados y alertas congregacionales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCreate}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo aviso</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Barra de Búsqueda y Botón móvil */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en avisos por título o contenido..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={onOpenCreate}
                className="sm:hidden inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Crear</span>
              </button>
            </div>

            {/* Pestañas de filtrado */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({announcements.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Vigentes ({announcements.filter((a) => a.is_active && !isAnnouncementExpired(a.expires_at)).length})
              </button>
              <button
                onClick={() => setActiveTab('inactive_or_expired')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'inactive_or_expired'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Inactivos o Caducados ({announcements.filter((a) => !a.is_active || isAnnouncementExpired(a.expires_at)).length})
              </button>
            </div>
          </div>

          {/* Listado de Anuncios */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {filteredAnnouncements.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <Megaphone className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No se encontraron avisos</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {searchQuery
                    ? 'Prueba a cambiar los términos de búsqueda.'
                    : 'Todavía no hay avisos creados en esta categoría. Puedes redactar uno nuevo con el botón superior.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={onOpenCreate}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Redactar primer aviso</span>
                  </button>
                )}
              </div>
            ) : (
              filteredAnnouncements.map((a) => {
                const priorityConfig = PRIORITY_CONFIG[a.priority];
                const expired = isAnnouncementExpired(a.expires_at);
                const isWorking = actionInProgressId === a.id;

                return (
                  <div
                    key={a.id}
                    className={`bg-white rounded-xl border p-4 sm:p-5 transition-all space-y-3 hover:shadow-sm ${
                      !a.is_active || expired
                        ? 'border-slate-200 opacity-80 bg-slate-50/40'
                        : `${priorityConfig.cardBorder}`
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                      {/* Cabecera del aviso */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Badge de Prioridad */}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${priorityConfig.badgeBg} ${priorityConfig.badgeText} ${priorityConfig.badgeBorder}`}
                          >
                            {getPriorityIcon(a.priority)}
                            <span>{priorityConfig.label}</span>
                          </span>

                          {/* Estado Activo / Inactivo */}
                          {a.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Activo</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              <span>Inactivo</span>
                            </span>
                          )}

                          {/* Caducado */}
                          {expired && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <Clock className="w-3 h-3 text-rose-500" />
                              <span>Caducado</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {a.title}
                        </h3>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-1.5 self-end sm:self-start">
                        {/* Toggle activo/inactivo */}
                        <button
                          onClick={() => handleToggle(a)}
                          disabled={isWorking}
                          title={a.is_active ? 'Desactivar aviso' : 'Activar aviso'}
                          className={`p-2 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1 min-h-[36px] ${
                            a.is_active
                              ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'border-slate-200 text-slate-600 bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {a.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          <span className="text-[11px] hidden md:inline">
                            {a.is_active ? 'Visible' : 'Oculto'}
                          </span>
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => onOpenEdit(a)}
                          disabled={isWorking}
                          title="Editar detalles"
                          className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors min-h-[36px] flex items-center gap-1 text-xs font-semibold"
                        >
                          <Edit2 className="w-4 h-4 text-slate-600" />
                          <span className="text-[11px] hidden md:inline">Editar</span>
                        </button>

                        {/* Archivar (soft delete) */}
                        <button
                          onClick={() => setDeletingAnnouncement(a)}
                          disabled={isWorking}
                          title="Archivar aviso"
                          className="p-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors min-h-[36px] flex items-center gap-1 text-xs font-semibold"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-[11px] hidden md:inline">Archivar</span>
                        </button>
                      </div>
                    </div>

                    {/* Mensaje */}
                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                      {a.message}
                    </p>

                    {/* Metadatos (creado, expiración) */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Publicado el {formatAnnouncementDate(a.created_at)}</span>
                      </div>
                      {a.expires_at ? (
                        <div
                          className={`flex items-center gap-1 font-medium ${
                            expired ? 'text-rose-600' : 'text-amber-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {expired ? 'Expiró:' : 'Caduca:'} {formatAnnouncementDateTime(a.expires_at)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">• Vigencia permanente</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pie de modal */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Total: {announcements.length} aviso{announcements.length !== 1 ? 's' : ''} registrado{announcements.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 active:bg-black text-white text-xs font-bold rounded-xl transition-colors"
            >
              Cerrar panel
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Archivado (Soft Delete) */}
      {deletingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                ¿Archivar este aviso parroquial?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                El aviso{' '}
                <strong className="text-slate-900">«{deletingAnnouncement.title}»</strong> se
                archivará y dejará de mostrarse a los miembros y en este listado. Podrás conservar
                el historial en la base de datos de forma segura.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAnnouncement(null)}
                disabled={isLoading}
                className="w-full sm:w-1/2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isLoading}
                className="w-full sm:w-1/2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span>Archivando...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, archivar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
