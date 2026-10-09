export type NotificationType = 'info' | 'anuncio' | 'turno' | 'alerta';

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationTypeConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconColor: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  anuncio: {
    label: 'Aviso',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
  },
  turno: {
    label: 'Turno',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
  },
  alerta: {
    label: 'Alerta',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-700',
  },
  info: {
    label: 'Información',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
  },
};

/**
 * Convierte una fecha ISO a una descripción temporal relativa amigable en español.
 */
export function formatRelativeNotificationTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Hace un momento';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} min`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} h`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Ayer';
  }
  if (diffInDays < 7) {
    return `Hace ${diffInDays} días`;
  }

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}
