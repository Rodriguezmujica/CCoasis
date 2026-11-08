import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from './supabase';
import {
  PublicEventItem,
  PublicNewsItem,
  PublicSiteSettings,
} from '../types/publicPage';
import {
  getPublicMediaUrl,
  isSafePublicUrl,
  sanitizePlainText,
} from './publicPageSecurity';

/**
 * Valores seguros por defecto para la configuración de la página pública (`id = 1`)
 */
export const DEFAULT_PUBLIC_SITE_SETTINGS: PublicSiteSettings = {
  id: 1,
  slogan: 'Oasis: un hogar de refugio',
  hero_title: 'Te esperamos este domingo',
  welcome_text: '',
  service_schedule: '',
  address: '',
  maps_url: '',
  whatsapp_url: '',
  contact_email: '',
  instagram_url: '',
  youtube_url: '',
  live_stream_url: '',
  updated_at: new Date(0).toISOString(),
};

export interface PublicSectionState {
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
}

/**
 * Normaliza y sanea la fila de `v_public_site_settings` aplicando valores por defecto seguros
 * si algún campo viene vacío o con una URL inválida.
 */
function normalizePublicSettings(raw: Partial<PublicSiteSettings> | null | undefined): PublicSiteSettings {
  if (!raw) {
    return { ...DEFAULT_PUBLIC_SITE_SETTINGS };
  }

  const cleanSlogan = sanitizePlainText(raw.slogan || '');
  const cleanHeroTitle = sanitizePlainText(raw.hero_title || '');
  const cleanWelcomeText = sanitizePlainText(raw.welcome_text || '');
  const cleanSchedule = sanitizePlainText(raw.service_schedule || '');
  const cleanAddress = sanitizePlainText(raw.address || '');
  const cleanEmail = sanitizePlainText(raw.contact_email || '');

  const safeUrl = (val?: string) => {
    const trimmed = (val || '').trim();
    return isSafePublicUrl(trimmed) ? trimmed : '';
  };

  return {
    id: 1,
    slogan: cleanSlogan || DEFAULT_PUBLIC_SITE_SETTINGS.slogan,
    hero_title: cleanHeroTitle || DEFAULT_PUBLIC_SITE_SETTINGS.hero_title,
    welcome_text: cleanWelcomeText,
    service_schedule: cleanSchedule,
    address: cleanAddress,
    maps_url: safeUrl(raw.maps_url),
    whatsapp_url: safeUrl(raw.whatsapp_url),
    contact_email: cleanEmail,
    instagram_url: safeUrl(raw.instagram_url),
    youtube_url: safeUrl(raw.youtube_url),
    live_stream_url: safeUrl(raw.live_stream_url),
    updated_at: raw.updated_at || DEFAULT_PUBLIC_SITE_SETTINGS.updated_at,
  };
}

function parsePublicQueryError(err: any, fallbackMessage: string): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Sin conexión a internet. Verifica tu red e inténtalo de nuevo.';
  }
  const msg: string = err?.message || err?.details || String(err || '');
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }
  return fallbackMessage;
}

/**
 * Hook de lectura pública para la página de bienvenida (`/`) y la sección "Vida en Oasis".
 *
 * - Funciona tanto sin sesión (`anon`) como con sesión (`authenticated`).
 * - No depende de `user_roles` ni bloquea el renderizado inicial.
 * - Carga en paralelo `v_public_site_settings`, `v_public_events` y `v_public_news`.
 * - Maneja estados de carga, error y `retry` independientes por cada sección.
 */
export function usePublicWelcomeData() {
  const [settings, setSettings] = useState<PublicSiteSettings>(DEFAULT_PUBLIC_SITE_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [events, setEvents] = useState<PublicEventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [news, setNews] = useState<PublicNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // a) Cargar v_public_site_settings (id = 1)
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const { data, error } = await supabase
        .from('v_public_site_settings')
        .select(
          'id, slogan, hero_title, welcome_text, service_schedule, address, maps_url, whatsapp_url, contact_email, instagram_url, youtube_url, live_stream_url, updated_at'
        )
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;

      if (mountedRef.current) {
        setSettings(normalizePublicSettings(data as Partial<PublicSiteSettings> | null));
      }
    } catch (err: any) {
      console.error('Error al cargar v_public_site_settings:', err);
      if (mountedRef.current) {
        setSettingsError(
          parsePublicQueryError(
            err,
            'No se pudo cargar la información de horarios y contacto.'
          )
        );
      }
    } finally {
      if (mountedRef.current) {
        setSettingsLoading(false);
      }
    }
  }, []);

  // b) Cargar v_public_events (ordenado por start_time ASC, limit 10)
  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError(null);
    try {
      const { data, error } = await supabase
        .from('v_public_events')
        .select('id, title, event_type, start_time, end_time, location')
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) throw error;

      if (mountedRef.current) {
        const sanitizedEvents: PublicEventItem[] = ((data as PublicEventItem[]) || []).map(
          (item) => ({
            ...item,
            title: sanitizePlainText(item.title),
            location: item.location ? sanitizePlainText(item.location) : null,
          })
        );
        setEvents(sanitizedEvents);
      }
    } catch (err: any) {
      console.error('Error al cargar v_public_events:', err);
      if (mountedRef.current) {
        setEventsError(
          parsePublicQueryError(
            err,
            'No se pudieron cargar los próximos eventos públicos.'
          )
        );
      }
    } finally {
      if (mountedRef.current) {
        setEventsLoading(false);
      }
    }
  }, []);

  // c) Cargar v_public_news (ordenado por event_date DESC, created_at DESC, limit 6)
  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const { data, error } = await supabase
        .from('v_public_news')
        .select('id, title, category, event_date, summary, image_path, created_at')
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      if (mountedRef.current) {
        const enrichedNews: PublicNewsItem[] = ((data as PublicNewsItem[]) || []).map(
          (item) => ({
            ...item,
            title: sanitizePlainText(item.title),
            summary: sanitizePlainText(item.summary),
            image_url: getPublicMediaUrl(item.image_path),
          })
        );
        setNews(enrichedNews);
      }
    } catch (err: any) {
      console.error('Error al cargar v_public_news:', err);
      if (mountedRef.current) {
        setNewsError(
          parsePublicQueryError(
            err,
            'No se pudieron cargar los recuerdos de Vida en Oasis.'
          )
        );
      }
    } finally {
      if (mountedRef.current) {
        setNewsLoading(false);
      }
    }
  }, []);

  // Carga inicial en paralelo sin bloquear entre secciones
  const refetchAll = useCallback(async () => {
    await Promise.allSettled([fetchSettings(), fetchEvents(), fetchNews()]);
  }, [fetchSettings, fetchEvents, fetchNews]);

  useEffect(() => {
    void refetchAll();
  }, [refetchAll]);

  // Próximo culto público (primer evento de tipo 'culto' o, en su defecto, el más próximo)
  const nextPublicCulto = useMemo<PublicEventItem | null>(() => {
    if (events.length === 0) return null;
    const firstCulto = events.find((ev) => ev.event_type === 'culto');
    return firstCulto || events[0];
  }, [events]);

  const upcomingPublicEvents = useMemo<PublicEventItem[]>(() => events, [events]);

  const settingsState: PublicSectionState = useMemo(
    () => ({
      loading: settingsLoading,
      error: settingsError,
      retry: fetchSettings,
    }),
    [settingsLoading, settingsError, fetchSettings]
  );

  const eventsState: PublicSectionState = useMemo(
    () => ({
      loading: eventsLoading,
      error: eventsError,
      retry: fetchEvents,
    }),
    [eventsLoading, eventsError, fetchEvents]
  );

  const newsState: PublicSectionState = useMemo(
    () => ({
      loading: newsLoading,
      error: newsError,
      retry: fetchNews,
    }),
    [newsLoading, newsError, fetchNews]
  );

  return {
    settings,
    nextPublicCulto,
    upcomingPublicEvents,
    news,
    settingsState,
    eventsState,
    newsState,
    refetchAll,
  };
}

/**
 * Hook ligero exclusivo para mostrar la sección "Vida en Oasis" dentro de `/inicio`.
 *
 * - Solo consulta `v_public_news` (limit 6) y `instagram_url` de `v_public_site_settings` (id = 1).
 * - Evita consultar `v_public_events` por duplicado cuando el usuario ya está en `/inicio`.
 */
export function usePublicNewsSectionData() {
  const [news, setNews] = useState<PublicNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [instagramUrl, setInstagramUrl] = useState<string>('');

  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchNewsAndInstagram = useCallback(async () => {
    setNewsLoading(true);
    setNewsError(null);

    try {
      const [newsResult, settingsResult] = await Promise.all([
        supabase
          .from('v_public_news')
          .select('id, title, category, event_date, summary, image_path, created_at')
          .order('event_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('v_public_site_settings')
          .select('id, instagram_url')
          .eq('id', 1)
          .maybeSingle(),
      ]);

      if (newsResult.error) throw newsResult.error;

      if (mountedRef.current) {
        const enrichedNews: PublicNewsItem[] = (
          (newsResult.data as PublicNewsItem[]) || []
        ).map((item) => ({
          ...item,
          title: sanitizePlainText(item.title),
          summary: sanitizePlainText(item.summary),
          image_url: getPublicMediaUrl(item.image_path),
        }));
        setNews(enrichedNews);

        const rawIg = (settingsResult.data as { instagram_url?: string } | null)?.instagram_url || '';
        const trimmedIg = rawIg.trim();
        setInstagramUrl(isSafePublicUrl(trimmedIg) ? trimmedIg : '');
      }
    } catch (err: any) {
      console.error('Error al cargar Vida en Oasis en /inicio:', err);
      if (mountedRef.current) {
        setNewsError(
          parsePublicQueryError(
            err,
            'No se pudieron cargar los recuerdos de Vida en Oasis.'
          )
        );
      }
    } finally {
      if (mountedRef.current) {
        setNewsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchNewsAndInstagram();
  }, [fetchNewsAndInstagram]);

  const newsState: PublicSectionState = useMemo(
    () => ({
      loading: newsLoading,
      error: newsError,
      retry: fetchNewsAndInstagram,
    }),
    [newsLoading, newsError, fetchNewsAndInstagram]
  );

  return {
    news,
    instagramUrl,
    newsState,
  };
}
