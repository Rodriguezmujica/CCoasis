import React from 'react';
import { Eye, EyeOff, Pencil, Archive, Plus, Loader2, CalendarDays } from 'lucide-react';
import {
  AdminPublicNewsItem,
  PUBLIC_NEWS_CATEGORY_CONFIG,
} from '../../../types/publicPage';

export const PUBLIC_VISIBLE_CARDS = 6;

interface NewsAdminListProps {
  items: AdminPublicNewsItem[];
  loading: boolean;
  busy: boolean;
  onNew: () => void;
  onEdit: (item: AdminPublicNewsItem) => void;
  onToggle: (item: AdminPublicNewsItem) => void;
  onArchive: (item: AdminPublicNewsItem) => void;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

const actionBtn =
  'min-h-[44px] px-3.5 py-2 rounded-xl border border-[#858a93] bg-white hover:bg-[#f5f5f5] text-[#1a1a1a] text-sm font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors';

export const NewsAdminList: React.FC<NewsAdminListProps> = ({
  items,
  loading,
  busy,
  onNew,
  onEdit,
  onToggle,
  onArchive,
}) => {
  // Las primeras 6 publicadas (mismo orden que la página pública) son las visibles.
  const visibleIds = new Set(
    items.filter((i) => i.is_published).slice(0, PUBLIC_VISIBLE_CARDS).map((i) => i.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-[#4a4f57]">
          La página pública muestra las {PUBLIC_VISIBLE_CARDS} últimas tarjetas publicadas.
        </p>
        <button
          type="button"
          onClick={onNew}
          className="min-h-[44px] px-5 py-2 rounded-xl bg-[#ae4a84] hover:bg-[#8f3b6b] text-white font-bold inline-flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>Nuevo Recuerdo</span>
        </button>
      </div>

      {loading ? (
        <div role="status" className="flex items-center gap-2 p-6 text-[#4a4f57]">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span>Cargando recuerdos...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#d4d7dc] rounded-2xl p-8 text-center text-[#4a4f57]">
          Todavía no hay recuerdos. Pulsa «Nuevo Recuerdo» para añadir el primero.
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const cat = PUBLIC_NEWS_CATEGORY_CONFIG[item.category];
            const isVisible = visibleIds.has(item.id);
            return (
              <li key={item.id} className="bg-white border border-[#d4d7dc] rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="aspect-video bg-[#f5f5f5]">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-[#4a4f57]">Sin imagen</div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.is_published ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-600">
                        {isVisible ? 'Publicado · visible' : 'Publicado · fuera de las 6'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-400">
                        Oculto
                      </span>
                    )}
                    {cat && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder}`}>
                        {cat.label}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-[#1a1a1a] leading-snug">{item.title}</h3>
                  <p className="text-xs text-[#4a4f57] inline-flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
                    {formatDate(item.event_date)}
                  </p>
                  <div className="mt-auto pt-2 grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
                    <button type="button" disabled={busy} onClick={() => onEdit(item)} className={actionBtn}>
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                      <span>Editar</span>
                    </button>
                    <button type="button" disabled={busy} onClick={() => onToggle(item)} className={actionBtn}>
                      {item.is_published ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                      <span>{item.is_published ? 'Ocultar' : 'Publicar'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onArchive(item)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-rose-600 bg-white hover:bg-rose-50 text-rose-900 text-sm font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors"
                    >
                      <Archive className="w-4 h-4" aria-hidden="true" />
                      <span>Archivar</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
