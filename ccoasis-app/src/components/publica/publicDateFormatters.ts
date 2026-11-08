const MADRID_TZ = 'Europe/Madrid';

/**
 * Formatea una fecha ISO a texto legible en español (ej. "Domingo 15 de noviembre")
 * en la zona horaria Europe/Madrid.
 */
export function formatPublicEventFullDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Fecha por confirmar';

    const formatted = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: MADRID_TZ,
    }).format(date);

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return 'Fecha por confirmar';
  }
}

/**
 * Formatea el rango de horas de un evento en Europe/Madrid (ej. "11:00 h" o "11:00 – 13:00 h").
 */
export function formatPublicEventTimeRange(
  startIso: string,
  endIso?: string | null
): string {
  try {
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) return 'Hora por confirmar';

    const timeFmt = new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: MADRID_TZ,
    });

    const startStr = timeFmt.format(start);

    if (endIso) {
      const end = new Date(endIso);
      if (!Number.isNaN(end.getTime())) {
        const endStr = timeFmt.format(end);
        return `${startStr} – ${endStr} h`;
      }
    }

    return `${startStr} h`;
  } catch {
    return 'Hora por confirmar';
  }
}

/**
 * Extrae el día numérico ("DD") y el mes abreviado en mayúsculas ("MES")
 * en la zona horaria Europe/Madrid para la insignia de fecha de cada tarjeta.
 */
export function getPublicEventDateBadge(isoString: string): {
  day: string;
  monthShort: string;
} {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return { day: '--', monthShort: '---' };
    }

    const day = new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      timeZone: MADRID_TZ,
    }).format(date);

    const monthRaw = new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      timeZone: MADRID_TZ,
    })
      .format(date)
      .replace('.', '')
      .toUpperCase();

    return {
      day,
      monthShort: monthRaw.slice(0, 3),
    };
  } catch {
    return { day: '--', monthShort: '---' };
  }
}

/**
 * Valida que una cadena tenga formato seguro de correo electrónico antes de construir un enlace `mailto:`.
 */
export function isSafeEmailAddress(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 160) return false;
  if (/[\u0000-\u001F\u007F\s<>"'`()]/.test(trimmed)) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
}

/**
 * Formatea una fecha `YYYY-MM-DD` o ISO de `public_news.event_date` en español
 * (ej. "8 de noviembre de 2026") sin desfases de zona horaria.
 */
export function formatPublicNewsDate(dateString: string): string {
  try {
    if (!dateString || typeof dateString !== 'string') {
      return 'Fecha por confirmar';
    }
    const trimmed = dateString.trim();
    if (!trimmed) return 'Fecha por confirmar';

    const isoCandidate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      ? `${trimmed}T12:00:00Z`
      : trimmed;

    const date = new Date(isoCandidate);
    if (Number.isNaN(date.getTime())) {
      return 'Fecha por confirmar';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: MADRID_TZ,
    }).format(date);
  } catch {
    return 'Fecha por confirmar';
  }
}
