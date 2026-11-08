import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ExternalLink, AlertCircle } from 'lucide-react';
import { usePublicPageAdmin } from '../lib/usePublicPageAdmin';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { AdminPublicNewsItem, CreatePublicNewsInput } from '../types/publicPage';
import { SiteSettingsForm } from '../components/publica/admin/SiteSettingsForm';
import { NewsAdminList } from '../components/publica/admin/NewsAdminList';
import { NewsFormModal } from '../components/publica/admin/NewsFormModal';

type TabId = 'settings' | 'news';

export const PaginaPublicaAdminView: React.FC = () => {
  const admin = usePublicPageAdmin(true);
  const toast = useToast().toast;
  const { confirm } = useConfirm();
  const [tab, setTab] = useState<TabId>('settings');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPublicNewsItem | null>(null);

  const openNew = () => {
    admin.clearError();
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (item: AdminPublicNewsItem) => {
    admin.clearError();
    setEditing(item);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (input: CreatePublicNewsInput) => {
    const res = editing
      ? await admin.updatePublicNews(editing.id, input)
      : await admin.createPublicNews(input);
    if (res.ok) {
      toast.success(editing ? 'Recuerdo actualizado.' : 'Recuerdo creado.');
      closeModal();
    }
    return res;
  };

  const handleToggle = async (item: AdminPublicNewsItem) => {
    const res = await admin.togglePublishPublicNews(item.id, !item.is_published);
    if (res.ok) toast.success(item.is_published ? 'Recuerdo oculto.' : 'Recuerdo publicado.');
    else toast.error(res.error || 'No se pudo cambiar la visibilidad.');
  };

  const handleArchive = async (item: AdminPublicNewsItem) => {
    const ok = await confirm({
      title: 'Archivar recuerdo',
      message: `«${item.title}» dejará de mostrarse en la página pública y desaparecerá de esta lista.`,
      confirmText: 'Archivar',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await admin.archivePublicNews(item.id);
    if (res.ok) toast.success('Recuerdo archivado.');
    else toast.error(res.error || 'No se pudo archivar.');
  };

  const tabClass = (active: boolean) =>
    `min-h-[44px] flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${
      active
        ? 'bg-[#0e7c86] text-white border-[#0e7c86]'
        : 'bg-white text-[#1a1a1a] border-[#858a93] hover:bg-[#f5f5f5]'
    }`;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-[12px] bg-[#0e7c86] flex items-center justify-center text-white shadow-sm shrink-0"
            aria-hidden="true"
          >
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[24px] sm:text-[25px] font-extrabold oasis-text-gradient tracking-tight leading-tight">
              Página Pública y Vida en Oasis
            </h1>
            <p className="text-sm text-[#4a4f57] mt-0.5">
              Edita lo que ve cualquier visitante sin iniciar sesión.
            </p>
          </div>
        </div>
        <Link
          to="/bienvenida"
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#ae4a84] hover:bg-[#8f3b6b] text-white font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <ExternalLink className="w-5 h-5" aria-hidden="true" />
          <span>Ver página pública (/bienvenida)</span>
        </Link>
      </div>

      {admin.error && (
        <div role="alert" className="flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-600 text-rose-950 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{admin.error}</span>
        </div>
      )}

      <div role="tablist" aria-label="Secciones de la página pública" className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          role="tab"
          id="tab-settings"
          aria-selected={tab === 'settings'}
          aria-controls="panel-settings"
          onClick={() => setTab('settings')}
          className={tabClass(tab === 'settings')}
        >
          Portada, Horarios y Contacto
        </button>
        <button
          type="button"
          role="tab"
          id="tab-news"
          aria-selected={tab === 'news'}
          aria-controls="panel-news"
          onClick={() => setTab('news')}
          className={tabClass(tab === 'news')}
        >
          Momentos: Vida en Oasis
        </button>
      </div>

      {tab === 'settings' ? (
        <div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings">
          <SiteSettingsForm
            settings={admin.settings}
            loading={admin.loadingSettings}
            saving={admin.actionLoading}
            onSave={admin.updateSiteSettings}
          />
        </div>
      ) : (
        <div role="tabpanel" id="panel-news" aria-labelledby="tab-news">
          <NewsAdminList
            items={admin.newsItems}
            loading={admin.loadingNews}
            busy={admin.actionLoading}
            onNew={openNew}
            onEdit={openEdit}
            onToggle={handleToggle}
            onArchive={handleArchive}
          />
        </div>
      )}

      {modalOpen && (
        <NewsFormModal
          item={editing}
          saving={admin.actionLoading}
          uploading={admin.uploadingImage}
          onUploadMany={admin.uploadPublicMediaImages}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
