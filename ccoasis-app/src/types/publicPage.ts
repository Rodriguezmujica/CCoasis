import { ChurchEventType } from './events';

/**
 * Categorías oficiales de la sección "Vida en Oasis" (public_news.category)
 */
export type PublicNewsCategory = 'Bautizos' | 'Comunidad' | 'Discipulado';

export const PUBLIC_NEWS_CATEGORIES: PublicNewsCategory[] = [
  'Bautizos',
  'Comunidad',
  'Discipulado',
];

export interface PublicNewsCategoryBadgeConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

export const PUBLIC_NEWS_CATEGORY_CONFIG: Record<
  PublicNewsCategory,
  PublicNewsCategoryBadgeConfig
> = {
  Bautizos: {
    label: 'Bautizos',
    badgeBg: 'bg-[#d9f7f8]',
    badgeText: 'text-[#0a5961]',
    badgeBorder: 'border-[#0e7c86]',
    dotColor: 'bg-[#0e7c86]',
  },
  Comunidad: {
    label: 'Comunidad',
    badgeBg: 'bg-[#f6e6ef]',
    badgeText: 'text-[#7a2f5a]',
    badgeBorder: 'border-[#ae4a84]',
    dotColor: 'bg-[#ae4a84]',
  },
  Discipulado: {
    label: 'Discipulado',
    badgeBg: 'bg-[#e3f5e9]',
    badgeText: 'text-[#14532d]',
    badgeBorder: 'border-[#2f7d4f]',
    dotColor: 'bg-[#2f7d4f]',
  },
};

/**
 * Columnas exactas de la vista pública `public.v_public_events`
 */
export interface PublicEventItem {
  id: string;
  title: string;
  event_type: ChurchEventType;
  start_time: string;
  end_time: string | null;
  location: string | null;
}

/**
 * Columnas exactas de la vista pública `public.v_public_site_settings`
 */
export interface PublicSiteSettings {
  id: number;
  slogan: string;
  hero_title: string;
  welcome_text: string;
  service_schedule: string;
  address: string;
  maps_url: string;
  whatsapp_url: string;
  contact_email: string;
  instagram_url: string;
  youtube_url: string;
  live_stream_url: string;
  updated_at: string;
}

/**
 * Campos completos de la tabla base `public.public_site_settings` (panel admin)
 */
export interface AdminPublicSiteSettings extends PublicSiteSettings {
  updated_by: string | null;
}

/**
 * Campos editables por el administrador en `public.public_site_settings` (id = 1)
 */
export interface PublicSiteSettingsUpdate {
  slogan?: string;
  hero_title?: string;
  welcome_text?: string;
  service_schedule?: string;
  address?: string;
  maps_url?: string;
  whatsapp_url?: string;
  contact_email?: string;
  instagram_url?: string;
  youtube_url?: string;
  live_stream_url?: string;
}

/**
 * Columnas exactas de la vista pública `public.v_public_news` más `image_url` resuelta
 */
export interface PublicNewsItem {
  id: string;
  title: string;
  category: PublicNewsCategory;
  event_date: string; // 'YYYY-MM-DD'
  summary: string;
  image_path: string;
  created_at: string;
  image_url?: string;
}

/**
 * Columnas completas de `public.public_news` para el panel de administración
 */
export interface AdminPublicNewsItem {
  id: string;
  title: string;
  category: PublicNewsCategory;
  event_date: string; // 'YYYY-MM-DD'
  summary: string;
  image_path: string;
  is_published: boolean;
  privacy_verified: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  image_url?: string;
}

/**
 * Datos de entrada para crear un recuerdo en `public.public_news`
 */
export interface CreatePublicNewsInput {
  title: string;
  category: PublicNewsCategory;
  event_date: string; // 'YYYY-MM-DD'
  summary: string;
  image_path: string;
  is_published?: boolean;
  privacy_verified: boolean;
}

/**
 * Datos de entrada para actualizar un recuerdo en `public.public_news`
 */
export interface UpdatePublicNewsInput {
  title?: string;
  category?: PublicNewsCategory;
  event_date?: string; // 'YYYY-MM-DD'
  summary?: string;
  image_path?: string;
  is_published?: boolean;
  privacy_verified: boolean;
}
