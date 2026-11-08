import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { logAuditEvent } from './useAuditLogs';
import {
  AdminPublicNewsItem,
  AdminPublicSiteSettings,
  CreatePublicNewsInput,
  MAX_PUBLIC_NEWS_IMAGES,
  PUBLIC_NEWS_CATEGORIES,
  PublicSiteSettingsUpdate,
  UpdatePublicNewsInput,
} from '../types/publicPage';
import {
  getPublicMediaUrl,
  isSafePublicUrl,
  sanitizePlainText,
} from './publicPageSecurity';
import { DEFAULT_PUBLIC_SITE_SETTINGS, resolveNewsImages } from './usePublicWelcomeData';
import { compressImage } from './imageCompression';

const MAX_PUBLIC_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_PUBLIC_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const URL_FIELD_LABELS: Record<
  keyof Pick<
    PublicSiteSettingsUpdate,
    'maps_url' | 'whatsapp_url' | 'instagram_url' | 'youtube_url' | 'live_stream_url'
  >,
  string
> = {
  maps_url: 'enlace de Google Maps (Cómo llegar)',
  whatsapp_url: 'enlace de WhatsApp',
  instagram_url: 'enlace de Instagram',
  youtube_url: 'enlace de YouTube',
  live_stream_url: 'enlace de transmisión en vivo',
};

function parseAdminPublicPageError(error: any, fallbackMessage: string): string {
  const msg: string = error?.message || error?.details || String(error || '');

  if (msg.includes('row-level security') || msg.includes('violates row-level security')) {
    return 'No tienes permisos de administrador para gestionar el contenido de la página pública.';
  }
  if (msg.includes('privacy_verified')) {
    return 'Debes confirmar que cuentas con el permiso de imagen y privacidad (especialmente si aparecen menores) antes de guardar este recuerdo.';
  }
  if (msg.includes('category')) {
    return 'La categoría seleccionada no es válida. Elige Bautizos, Comunidad o Discipulado.';
  }
  if (msg.includes('JWT') || msg.includes('auth')) {
    return 'Tu sesión ha expirado o no es válida. Por favor, vuelve a iniciar sesión.';
  }
  return msg || fallbackMessage;
}

/**
 * Valida en el cliente un archivo de imagen antes de subirlo al bucket `public-media`.
 */
export function validatePublicMediaFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Debes seleccionar un archivo de imagen.' };
  }

  if (!ALLOWED_PUBLIC_IMAGE_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato de imagen no permitido. Usa únicamente archivos JPG, PNG o WebP.',
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'El archivo de imagen está vacío.' };
  }

  if (file.size > MAX_PUBLIC_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'La imagen supera el tamaño máximo permitido de 5 MB. Por favor, redúcela antes de subirla.',
    };
  }

  return { valid: true };
}

/**
 * Normaliza la galería: recorta espacios, elimina vacíos/duplicados.
 * Si no hay `image_paths`, usa `[image_path]`. La primera ruta es la portada.
 */
function normalizeGalleryPaths(paths?: string[], fallbackPath?: string): string[] {
  const source = paths && paths.length > 0 ? paths : fallbackPath ? [fallbackPath] : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of source) {
    const t = (p || '').trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

/**
 * Construye un nombre de archivo seguro `<timestamp>-<nombre-seguro>` para `public-media`.
 */
function buildSafePublicMediaPath(originalName: string, extension?: string): string {
  const baseName = (originalName || 'imagen.jpg').replace(/\.[^.]*$/, '') || 'recuerdo';
  const cleaned = (extension ? `${baseName}.${extension}` : originalName || 'imagen.jpg')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_.-]+|[_.-]+$/g, '')
    .toLowerCase();

  const safeBase = cleaned || 'recuerdo.jpg';
  const uniq = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${uniq}-${safeBase}`;
}

/**
 * Hook de administración de la página pública y la sección "Vida en Oasis" (exclusivo para rol `admin`).
 */
export function usePublicPageAdmin(enabled: boolean = true) {
  const [settings, setSettings] = useState<AdminPublicSiteSettings>({
    ...DEFAULT_PUBLIC_SITE_SETTINGS,
    updated_by: null,
  });
  const [newsItems, setNewsItems] = useState<AdminPublicNewsItem[]>([]);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [loadingNews, setLoadingNews] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 1. Leer configuración completa de public_site_settings (id = 1)
  const fetchAdminSettings = useCallback(async () => {
    if (!enabled) {
      setLoadingSettings(false);
      return;
    }

    setLoadingSettings(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('public_site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (mountedRef.current) {
        if (data) {
          setSettings(data as AdminPublicSiteSettings);
        } else {
          setSettings({
            ...DEFAULT_PUBLIC_SITE_SETTINGS,
            updated_by: null,
          });
        }
      }
    } catch (err: any) {
      console.error('Error al leer public_site_settings (admin):', err);
      if (mountedRef.current) {
        setError(
          parseAdminPublicPageError(
            err,
            'No se pudo cargar la configuración de la página pública.'
          )
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoadingSettings(false);
      }
    }
  }, [enabled]);

  // 2. Actualizar configuración de public_site_settings (id = 1) validando todas las URLs con isSafePublicUrl
  const updateSiteSettings = useCallback(
    async (
      input: PublicSiteSettingsUpdate
    ): Promise<{ ok: boolean; error?: string }> => {
      setActionLoading(true);
      setError(null);
      try {
        // Validar todas las URLs presentes en el payload antes de guardar
        const urlKeys = Object.keys(URL_FIELD_LABELS) as Array<keyof typeof URL_FIELD_LABELS>;
        for (const key of urlKeys) {
          const val = input[key];
          if (val !== undefined && !isSafePublicUrl(val)) {
            const label = URL_FIELD_LABELS[key];
            const msg = `El ${label} no es válido. Debe comenzar por https:// o http:// (o dejarse vacío).`;
            setError(msg);
            return { ok: false, error: msg };
          }
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const payload: Record<string, any> = {
          id: 1,
          updated_by: user?.id || null,
        };

        if (input.slogan !== undefined) {
          const cleanSlogan = sanitizePlainText(input.slogan, 140);
          payload.slogan = cleanSlogan || DEFAULT_PUBLIC_SITE_SETTINGS.slogan;
        }
        if (input.hero_title !== undefined) {
          const cleanHero = sanitizePlainText(input.hero_title, 160);
          payload.hero_title = cleanHero || DEFAULT_PUBLIC_SITE_SETTINGS.hero_title;
        }
        if (input.welcome_text !== undefined) {
          payload.welcome_text = sanitizePlainText(input.welcome_text, 2000);
        }
        if (input.service_schedule !== undefined) {
          payload.service_schedule = sanitizePlainText(input.service_schedule, 1000);
        }
        if (input.address !== undefined) {
          payload.address = sanitizePlainText(input.address, 400);
        }
        if (input.contact_email !== undefined) {
          payload.contact_email = sanitizePlainText(input.contact_email, 200);
        }
        if (input.maps_url !== undefined) {
          payload.maps_url = input.maps_url.trim();
        }
        if (input.whatsapp_url !== undefined) {
          payload.whatsapp_url = input.whatsapp_url.trim();
        }
        if (input.instagram_url !== undefined) {
          payload.instagram_url = input.instagram_url.trim();
        }
        if (input.youtube_url !== undefined) {
          payload.youtube_url = input.youtube_url.trim();
        }
        if (input.live_stream_url !== undefined) {
          payload.live_stream_url = input.live_stream_url.trim();
        }

        const { data: updatedData, error: upsertErr } = await supabase
          .from('public_site_settings')
          .upsert(payload, { onConflict: 'id' })
          .select('*')
          .single();

        if (upsertErr) throw upsertErr;

        if (mountedRef.current && updatedData) {
          setSettings(updatedData as AdminPublicSiteSettings);
        }

        void logAuditEvent('UPDATE', 'public_site_settings', '1', {
          updated_fields: Object.keys(input),
        });

        return { ok: true };
      } catch (err: any) {
        console.error('Error al actualizar public_site_settings:', err);
        const msg = parseAdminPublicPageError(
          err,
          'No se pudo guardar la configuración de la página pública.'
        );
        if (mountedRef.current) {
          setError(msg);
        }
        return { ok: false, error: msg };
      } finally {
        if (mountedRef.current) {
          setActionLoading(false);
        }
      }
    },
    []
  );

  // 3. Listar recuerdos en public_news (incluyendo no publicados, excluyendo deleted_at IS NOT NULL)
  const fetchAdminNews = useCallback(async () => {
    if (!enabled) {
      setLoadingNews(false);
      return;
    }

    setLoadingNews(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('public_news')
        .select('*')
        .is('deleted_at', null)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      if (mountedRef.current) {
        const items: AdminPublicNewsItem[] = ((data as AdminPublicNewsItem[]) || []).map(
          (row) => ({
            ...row,
            ...resolveNewsImages(row),
          })
        );
        setNewsItems(items);
      }
    } catch (err: any) {
      console.error('Error al listar public_news (admin):', err);
      if (mountedRef.current) {
        setError(
          parseAdminPublicPageError(
            err,
            'No se pudieron cargar los recuerdos de Vida en Oasis.'
          )
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoadingNews(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    void fetchAdminSettings();
    void fetchAdminNews();
  }, [fetchAdminSettings, fetchAdminNews]);

  // 4. Subir imagen al bucket 'public-media' validando cliente (<= 5 MB, JPEG/PNG/WebP)
  const uploadPublicMediaImage = useCallback(
    async (
      file: File
    ): Promise<{ ok: boolean; imagePath?: string; publicUrl?: string; error?: string }> => {
      const validation = validatePublicMediaFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Archivo de imagen no válido.');
        return { ok: false, error: validation.error };
      }

      setUploadingImage(true);
      setError(null);
      try {
        // Compresión automática (máx. 1600 px, WebP 0.82 / JPEG 0.85) antes de subir
        const compressed = await compressImage(file);
        const filePath = buildSafePublicMediaPath(file.name, compressed.extension);

        const { error: uploadErr } = await supabase.storage
          .from('public-media')
          .upload(filePath, compressed.blob, {
            cacheControl: '3600',
            contentType: compressed.mimeType,
            upsert: false,
          });

        if (uploadErr) {
          throw uploadErr;
        }

        const publicUrl = getPublicMediaUrl(filePath);
        return {
          ok: true,
          imagePath: filePath,
          publicUrl,
        };
      } catch (err: any) {
        console.error('Error al subir imagen a public-media:', err);
        const msg = parseAdminPublicPageError(
          err,
          'No se pudo subir la imagen al almacenamiento público.'
        );
        if (mountedRef.current) {
          setError(msg);
        }
        return { ok: false, error: msg };
      } finally {
        if (mountedRef.current) {
          setUploadingImage(false);
        }
      }
    },
    []
  );

  // 4b. Subir varias imágenes (máx. 5 por recuerdo en total), cada una comprimida antes de subir
  const uploadPublicMediaImages = useCallback(
    async (
      files: File[],
      currentCount: number = 0
    ): Promise<{
      ok: boolean;
      uploaded: { imagePath: string; publicUrl: string }[];
      error?: string;
    }> => {
      const remaining = MAX_PUBLIC_NEWS_IMAGES - currentCount;
      if (files.length === 0) {
        return { ok: false, uploaded: [], error: 'No se seleccionó ninguna imagen.' };
      }
      if (remaining <= 0) {
        const msg = `Ya tienes ${MAX_PUBLIC_NEWS_IMAGES} fotos en este recuerdo. Quita alguna para añadir otra.`;
        setError(msg);
        return { ok: false, uploaded: [], error: msg };
      }

      const selected = files.slice(0, remaining);
      const notices: string[] = [];
      if (files.length > remaining) {
        notices.push(
          `Solo se pueden tener ${MAX_PUBLIC_NEWS_IMAGES} fotos por recuerdo; se ignoraron ${files.length - remaining}.`
        );
      }

      const uploaded: { imagePath: string; publicUrl: string }[] = [];
      for (const file of selected) {
        const res = await uploadPublicMediaImage(file);
        if (res.ok && res.imagePath) {
          uploaded.push({ imagePath: res.imagePath, publicUrl: res.publicUrl || '' });
        } else {
          notices.push(`${file.name}: ${res.error || 'no se pudo subir.'}`);
        }
      }

      const message = notices.length > 0 ? notices.join(' ') : undefined;
      if (message && mountedRef.current) setError(message);
      return { ok: uploaded.length > 0, uploaded, error: message };
    },
    [uploadPublicMediaImage]
  );

  // 5. Crear recuerdo en public_news (exige privacy_verified === true)
  const createPublicNews = useCallback(
    async (
      input: CreatePublicNewsInput
    ): Promise<{ ok: boolean; item?: AdminPublicNewsItem; error?: string }> => {
      if (input.privacy_verified !== true) {
        const privacyMsg =
          'Debes marcar la casilla obligatoria confirmando que cuentas con el permiso de imagen y privacidad (especialmente si aparecen menores) antes de publicar este recuerdo.';
        setError(privacyMsg);
        return { ok: false, error: privacyMsg };
      }

      const cleanTitle = sanitizePlainText(input.title, 160);
      const cleanSummary = sanitizePlainText(input.summary, 2000);
      const cleanImagePaths = normalizeGalleryPaths(input.image_paths, input.image_path);
      const cleanImagePath = cleanImagePaths[0] || '';

      if (cleanImagePaths.length > MAX_PUBLIC_NEWS_IMAGES) {
        const msg = `Un recuerdo admite como máximo ${MAX_PUBLIC_NEWS_IMAGES} fotos.`;
        setError(msg);
        return { ok: false, error: msg };
      }
      if (!cleanTitle) {
        const msg = 'El título del recuerdo es obligatorio.';
        setError(msg);
        return { ok: false, error: msg };
      }

      if (!PUBLIC_NEWS_CATEGORIES.includes(input.category)) {
        const msg = 'Selecciona una categoría válida (Bautizos, Comunidad o Discipulado).';
        setError(msg);
        return { ok: false, error: msg };
      }

      if (!input.event_date) {
        const msg = 'La fecha del recuerdo es obligatoria.';
        setError(msg);
        return { ok: false, error: msg };
      }

      if (!cleanSummary) {
        const msg = 'La crónica o resumen del recuerdo es obligatorio.';
        setError(msg);
        return { ok: false, error: msg };
      }

      if (!cleanImagePath) {
        const msg = 'Debes subir o indicar una fotografía para este recuerdo.';
        setError(msg);
        return { ok: false, error: msg };
      }

      setActionLoading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const insertPayload = {
          title: cleanTitle,
          category: input.category,
          event_date: input.event_date,
          summary: cleanSummary,
          image_path: cleanImagePath,
          image_paths: cleanImagePaths,
          is_published: input.is_published ?? true,
          privacy_verified: true,
          created_by: user?.id || null,
        };

        const { data: created, error: insertErr } = await supabase
          .from('public_news')
          .insert(insertPayload)
          .select('*')
          .single();

        if (insertErr) throw insertErr;

        void logAuditEvent('CREATE', 'public_news', created?.id || null, {
          title: cleanTitle,
          category: input.category,
          event_date: input.event_date,
          is_published: insertPayload.is_published,
          privacy_verified: true,
        });

        await fetchAdminNews();

        const enrichedItem: AdminPublicNewsItem = {
          ...(created as AdminPublicNewsItem),
          ...resolveNewsImages(created as AdminPublicNewsItem),
        };

        return { ok: true, item: enrichedItem };
      } catch (err: any) {
        console.error('Error al crear recuerdo en public_news:', err);
        const msg = parseAdminPublicPageError(
          err,
          'No se pudo guardar el recuerdo en Vida en Oasis.'
        );
        if (mountedRef.current) {
          setError(msg);
        }
        return { ok: false, error: msg };
      } finally {
        if (mountedRef.current) {
          setActionLoading(false);
        }
      }
    },
    [fetchAdminNews]
  );

  // 6. Editar recuerdo existente en public_news (exige privacy_verified === true)
  const updatePublicNews = useCallback(
    async (
      id: string,
      input: UpdatePublicNewsInput
    ): Promise<{ ok: boolean; error?: string }> => {
      if (input.privacy_verified !== true) {
        const privacyMsg =
          'Debes mantener verificada la casilla de permiso de imagen y privacidad (especialmente si aparecen menores) para guardar los cambios.';
        setError(privacyMsg);
        return { ok: false, error: privacyMsg };
      }

      const updatePayload: Record<string, any> = {
        privacy_verified: true,
      };

      if (input.title !== undefined) {
        const cleanTitle = sanitizePlainText(input.title, 160);
        if (!cleanTitle) {
          const msg = 'El título del recuerdo no puede quedar vacío.';
          setError(msg);
          return { ok: false, error: msg };
        }
        updatePayload.title = cleanTitle;
      }

      if (input.category !== undefined) {
        if (!PUBLIC_NEWS_CATEGORIES.includes(input.category)) {
          const msg = 'Selecciona una categoría válida (Bautizos, Comunidad o Discipulado).';
          setError(msg);
          return { ok: false, error: msg };
        }
        updatePayload.category = input.category;
      }

      if (input.event_date !== undefined) {
        if (!input.event_date) {
          const msg = 'La fecha del recuerdo es obligatoria.';
          setError(msg);
          return { ok: false, error: msg };
        }
        updatePayload.event_date = input.event_date;
      }

      if (input.summary !== undefined) {
        const cleanSummary = sanitizePlainText(input.summary, 2000);
        if (!cleanSummary) {
          const msg = 'La crónica o resumen del recuerdo no puede quedar vacío.';
          setError(msg);
          return { ok: false, error: msg };
        }
        updatePayload.summary = cleanSummary;
      }

      if (input.image_paths !== undefined || input.image_path !== undefined) {
        const cleanImagePaths = normalizeGalleryPaths(input.image_paths, input.image_path);
        if (cleanImagePaths.length === 0) {
          const msg = 'La imagen del recuerdo es obligatoria.';
          setError(msg);
          return { ok: false, error: msg };
        }
        if (cleanImagePaths.length > MAX_PUBLIC_NEWS_IMAGES) {
          const msg = `Un recuerdo admite como máximo ${MAX_PUBLIC_NEWS_IMAGES} fotos.`;
          setError(msg);
          return { ok: false, error: msg };
        }
        updatePayload.image_paths = cleanImagePaths;
        updatePayload.image_path = cleanImagePaths[0];
      }

      if (input.is_published !== undefined) {
        updatePayload.is_published = Boolean(input.is_published);
      }

      setActionLoading(true);
      setError(null);
      try {
        const { error: updateErr } = await supabase
          .from('public_news')
          .update(updatePayload)
          .eq('id', id);

        if (updateErr) throw updateErr;

        void logAuditEvent('UPDATE', 'public_news', id, {
          updated_fields: Object.keys(updatePayload),
        });

        await fetchAdminNews();
        return { ok: true };
      } catch (err: any) {
        console.error('Error al actualizar recuerdo en public_news:', err);
        const msg = parseAdminPublicPageError(
          err,
          'No se pudo actualizar el recuerdo en Vida en Oasis.'
        );
        if (mountedRef.current) {
          setError(msg);
        }
        return { ok: false, error: msg };
      } finally {
        if (mountedRef.current) {
          setActionLoading(false);
        }
      }
    },
    [fetchAdminNews]
  );

  // 7. Publicar u ocultar un recuerdo en public_news
  const togglePublishPublicNews = useCallback(
    async (
      id: string,
      nextPublishedState: boolean
    ): Promise<{ ok: boolean; error?: string }> => {
      setActionLoading(true);
      setError(null);
      try {
        const { error: updateErr } = await supabase
          .from('public_news')
          .update({ is_published: nextPublishedState })
          .eq('id', id);

        if (updateErr) throw updateErr;

        void logAuditEvent('UPDATE', 'public_news', id, {
          is_published: nextPublishedState,
        });

        await fetchAdminNews();
        return { ok: true };
      } catch (err: any) {
        console.error('Error al cambiar visibilidad de recuerdo en public_news:', err);
        const msg = parseAdminPublicPageError(
          err,
          'No se pudo cambiar el estado de publicación del recuerdo.'
        );
        if (mountedRef.current) {
          setError(msg);
        }
        return { ok: false, error: msg };
      } finally {
        if (mountedRef.current) {
          setActionLoading(false);
        }
      }
    },
    [fetchAdminNews]
  );

  // 8. Archivar recuerdo con soft-delete (deleted_at = new Date().toISOString())
  const archivePublicNews = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      setActionLoading(true);
      setError(null);
      try {
        const itemToArchive = newsItems.find((item) => item.id === id);

        const { error: archiveErr } = await supabase
          .from('public_news')
          .update({
            deleted_at: new Date().toISOString(),
            is_published: false,
          })
          .eq('id', id);

        if (archiveErr) throw archiveErr;

        void logAuditEvent('ARCHIVE', 'public_news', id, {
          title: itemToArchive?.title,
          category: itemToArchive?.category,
          mode: 'soft-delete',
        });

        await fetchAdminNews();
        return { ok: true };
      } catch (err: any) {
        console.error('Error al archivar recuerdo en public_news:', err);
        const msg = parseAdminPublicPageError(
          err,
          'No se pudo archivar el recuerdo seleccionado.'
        );
        if (mountedRef.current) {
          setError(msg);
        }
        return { ok: false, error: msg };
      } finally {
        if (mountedRef.current) {
          setActionLoading(false);
        }
      }
    },
    [fetchAdminNews, newsItems]
  );

  return {
    settings,
    newsItems,
    loadingSettings,
    loadingNews,
    actionLoading,
    uploadingImage,
    error,
    clearError,
    refetchSettings: fetchAdminSettings,
    refetchNews: fetchAdminNews,
    updateSiteSettings,
    uploadPublicMediaImage,
    uploadPublicMediaImages,
    createPublicNews,
    updatePublicNews,
    togglePublishPublicNews,
    archivePublicNews,
  };
}
