export type AnnouncementPriority = 'normal' | 'importante' | 'urgente';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  is_active: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AnnouncementFormData {
  title: string;
  message: string;
  priority: AnnouncementPriority;
  is_active: boolean;
  expires_at: string | null;
}

export interface PriorityBadgeConfig {
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  accentBg: string;
  accentText: string;
  bannerGradient: string;
  iconColor: string;
  dotColor: string;
}

export const ANNOUNCEMENT_PRIORITIES: AnnouncementPriority[] = [
  'normal',
  'importante',
  'urgente',
];

export const PRIORITY_CONFIG: Record<AnnouncementPriority, PriorityBadgeConfig> = {
  normal: {
    label: 'Aviso General',
    shortLabel: 'Normal',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    cardBorder: 'border-blue-200',
    accentBg: 'bg-blue-100',
    accentText: 'text-blue-800',
    bannerGradient: 'from-blue-600 via-indigo-600 to-blue-700',
    iconColor: 'text-blue-600',
    dotColor: 'bg-blue-500',
  },
  importante: {
    label: 'Aviso Importante',
    shortLabel: 'Importante',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    cardBorder: 'border-amber-300',
    accentBg: 'bg-amber-100',
    accentText: 'text-amber-900',
    bannerGradient: 'from-amber-600 via-orange-600 to-amber-700',
    iconColor: 'text-amber-600',
    dotColor: 'bg-amber-500',
  },
  urgente: {
    label: 'Aviso Urgente',
    shortLabel: 'Urgente',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-300',
    cardBorder: 'border-rose-400',
    accentBg: 'bg-rose-100',
    accentText: 'text-rose-900',
    bannerGradient: 'from-rose-600 via-red-600 to-rose-700',
    iconColor: 'text-rose-600',
    dotColor: 'bg-rose-500',
  },
};
