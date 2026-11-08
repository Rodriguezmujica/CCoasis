import React, { useRef, useState } from 'react';
import { X, ImagePlus, Loader2, AlertCircle, Trash2, Star } from 'lucide-react';
import {
  AdminPublicNewsItem,
  CreatePublicNewsInput,
  MAX_PUBLIC_NEWS_IMAGES,
  PUBLIC_NEWS_CATEGORIES,
  PublicNewsCategory,
} from '../../../types/publicPage';
import { getPublicMediaUrl } from '../../../lib/publicPageSecurity';
import { resolveNewsImages } from '../../../lib/usePublicWelcomeData';

interface NewsFormModalProps {
  item: AdminPublicNewsItem | null; // null = nuevo recuerdo
  saving: boolean;
  uploading: boolean;
  onUploadMany: (
    files: File[],
    currentCount: number
  ) => Promise<{
    ok: boolean;
    uploaded: { imagePath: string; publicUrl: string }[];
    error?: string;
  }>;
  onSubmit: (input: CreatePublicNewsInput) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

const PRIVACY_TEXT =
  'Confirmo que cuento con el consentimiento para publicar esta fotografía y, en caso de aparecer menores de edad, con la autorización expresa de sus padres o tutores legales (RGPD).';

const inputClass =
  'w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#858a93] bg-white text-base text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#0e7c86]';
const labelClass = 'block text-sm font-bold text-[#1a1a1a] mb-1';

export const NewsFormModal: React.FC<NewsFormModalProps> = ({
  item,
  saving,
  uploading,
  onUploadMany,
  onSubmit,
  onClose,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(item?.title || '');
  const [category, setCategory] = useState<PublicNewsCategory>(item?.category || 'Comunidad');
  const [eventDate, setEventDate] = useState(item?.event_date || new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState(item?.summary || '');
  const [photos, setPhotos] = useState<{ path: string; url: string }[]>(() => {
    if (!item) return [];
    const r = resolveNewsImages(item);
    return r.image_paths.map((path) => ({ path, url: getPublicMediaUrl(path) }));
  });
  const [isPublished, setIsPublished] = useState(item ? item.is_published : true);
  const [privacyVerified, setPrivacyVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setError(null);
    const res = await onUploadMany(files, photos.length);
    if (res.uploaded.length > 0) {
      setPhotos((prev) =>
        [
          ...prev,
          ...res.uploaded.map((u) => ({ path: u.imagePath, url: u.publicUrl || getPublicMediaUrl(u.imagePath) })),
        ].slice(0, MAX_PUBLIC_NEWS_IMAGES)
      );
    }
    if (res.error) setError(res.error);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const makeCover = (index: number) => {
    setPhotos((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (photos.length === 0) return setError('Debes subir al menos una fotografía (JPG, PNG o WebP de hasta 5 MB).');
    if (!title.trim()) return setError('El título es obligatorio.');
    if (!eventDate) return setError('La fecha del evento es obligatoria.');
    if (!summary.trim()) return setError('La crónica o historia es obligatoria.');
    if (privacyVerified !== true) {
      return setError('Debes marcar la casilla de consentimiento y privacidad para guardar.');
    }
    const paths = photos.map((p) => p.path);
    const res = await onSubmit({
      title,
      category,
      event_date: eventDate,
      summary,
      image_path: paths[0],
      image_paths: paths,
      is_published: isPublished,
      privacy_verified: privacyVerified,
    });
    if (!res.ok) setError(res.error || 'No se pudo guardar el recuerdo.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="news-modal-title"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#d4d7dc]">
        <div className="sticky top-0 z-10 px-5 py-4 bg-white border-b border-[#d4d7dc] flex items-center justify-between gap-3">
          <h2 id="news-modal-title" className="text-xl font-extrabold text-[#1a1a1a]">
            {item ? 'Editar recuerdo' : 'Nuevo recuerdo'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-11 h-11 rounded-xl border border-[#858a93] bg-white hover:bg-[#f5f5f5] inline-flex items-center justify-center text-[#1a1a1a]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
          <div>
            <span className={labelClass}>
              Fotografías ({photos.length}/{MAX_PUBLIC_NEWS_IMAGES})
            </span>
            {photos.length === 0 ? (
              <div className="aspect-video w-full rounded-xl border border-[#d4d7dc] bg-[#f5f5f5] flex items-center justify-center">
                <span className="text-sm text-[#4a4f57] px-4 text-center">Aún no hay imágenes</span>
              </div>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {photos.map((photo, index) => (
                  <li
                    key={photo.path}
                    className="rounded-xl border border-[#d4d7dc] bg-white overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-video bg-[#f5f5f5]">
                      {photo.url && (
                        <img
                          src={photo.url}
                          alt={`Foto ${index + 1} del recuerdo`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {index === 0 && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#1a1a1a]/85 text-white text-xs font-bold">
                          Portada
                        </span>
                      )}
                    </div>
                    <div className="flex">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => makeCover(index)}
                          aria-label={`Usar la foto ${index + 1} como portada`}
                          className="flex-1 min-h-[44px] px-1 text-xs font-bold text-[#0a5961] hover:bg-[#d9f7f8] inline-flex items-center justify-center gap-1"
                        >
                          <Star className="w-4 h-4" aria-hidden="true" />
                          <span>Portada</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        aria-label={`Quitar la foto ${index + 1}`}
                        className="flex-1 min-h-[44px] px-1 text-xs font-bold text-rose-950 hover:bg-rose-50 inline-flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        <span>Quitar</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFiles}
              className="sr-only"
              aria-label="Seleccionar imágenes"
            />
            <button
              type="button"
              disabled={uploading || photos.length >= MAX_PUBLIC_NEWS_IMAGES}
              onClick={() => fileRef.current?.click()}
              className="mt-2 w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#0e7c86] bg-white hover:bg-[#d9f7f8] text-[#0a5961] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="w-5 h-5" aria-hidden="true" />}
              <span>{uploading ? 'Optimizando y subiendo...' : photos.length > 0 ? 'Añadir más fotos' : 'Elegir fotos'}</span>
            </button>
            <p className="text-xs text-[#4a4f57] mt-1">
              Puedes subir hasta 5 fotos por recuerdo. Se optimizan automáticamente para ahorrar espacio.
            </p>
          </div>

          <div>
            <label htmlFor="n-title" className={labelClass}>Título</label>
            <input id="n-title" type="text" maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="n-cat" className={labelClass}>Categoría</label>
              <select id="n-cat" value={category} onChange={(e) => setCategory(e.target.value as PublicNewsCategory)} className={inputClass}>
                {PUBLIC_NEWS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="n-date" className={labelClass}>Fecha del evento</label>
              <input id="n-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="n-summary" className={labelClass}>Crónica / Historia</label>
            <textarea id="n-summary" rows={5} maxLength={2000} value={summary} onChange={(e) => setSummary(e.target.value)} className={inputClass} />
          </div>

          <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              role="switch"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-6 h-6 accent-[#0e7c86] shrink-0"
            />
            <span className="text-sm font-bold text-[#1a1a1a]">Publicar inmediatamente</span>
          </label>

          <label className="flex items-start gap-3 min-h-[44px] p-3 rounded-xl border-2 border-[#ae4a84] bg-[#f6e6ef] cursor-pointer">
            <input
              type="checkbox"
              checked={privacyVerified}
              onChange={(e) => setPrivacyVerified(e.target.checked)}
              aria-required="true"
              className="w-6 h-6 mt-0.5 accent-[#ae4a84] shrink-0"
            />
            <span className="text-sm text-[#1a1a1a] leading-snug">{PRIVACY_TEXT}</span>
          </label>

          {error && (
            <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-600 text-rose-950 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2 rounded-xl border border-[#858a93] bg-white hover:bg-[#f5f5f5] font-bold text-[#1a1a1a]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="min-h-[44px] px-6 py-2 rounded-xl bg-[#0e7c86] hover:bg-[#0a5961] text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
              <span>{saving ? 'Guardando...' : 'Guardar recuerdo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
