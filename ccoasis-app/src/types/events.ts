export type ChurchEventType = 
  | 'culto' 
  | 'oracion' 
  | 'jovenes' 
  | 'especial' 
  | 'venta_verbena' 
  | 'otro';

export interface ChurchEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: ChurchEventType;
  start_time: string; // ISO 8601 string timestamptz
  end_time: string | null; // ISO 8601 string timestamptz
  location: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ChurchEventFormData {
  title: string;
  description?: string;
  event_type: ChurchEventType;
  start_date: string; // 'YYYY-MM-DD'
  start_time_val: string; // 'HH:mm'
  end_date?: string; // 'YYYY-MM-DD'
  end_time_val?: string; // 'HH:mm'
  location?: string;
}

export interface EventTypeMetadata {
  label: string;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
}

export const EVENT_TYPES_CONFIG: Record<ChurchEventType, EventTypeMetadata> = {
  culto: {
    label: 'Culto General',
    colorClass: 'bg-blue-600 text-white',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-900',
    badgeBorder: 'border-blue-600',
    dotColor: 'bg-blue-600',
    description: 'Servicio general dominical o entre semana',
  },
  oracion: {
    label: 'Reunión de Oración',
    colorClass: 'bg-magenta-600 text-white',
    badgeBg: 'bg-magenta-100',
    badgeText: 'text-magenta-900',
    badgeBorder: 'border-magenta-600',
    dotColor: 'bg-magenta-600',
    description: 'Vigilias, ayunos y tiempos congregacionales de clamor',
  },
  jovenes: {
    label: 'Jóvenes / Adolescentes',
    colorClass: 'bg-emerald-700 text-white',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-600',
    dotColor: 'bg-emerald-600',
    description: 'Reuniones de jóvenes, dinámicas y discipulado juvenil',
  },
  especial: {
    label: 'Evento Especial',
    colorClass: 'bg-amber-700 text-white',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-600',
    dotColor: 'bg-amber-700',
    description: 'Conferencias, aniversarios, campamentos o bautismos',
  },
  venta_verbena: {
    label: 'Actividad Pro-fondos',
    colorClass: 'bg-rose-700 text-white',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-900',
    badgeBorder: 'border-rose-600',
    dotColor: 'bg-rose-600',
    description: 'Ventas de comida, verbenas benéficas o bazares de apoyo',
  },
  otro: {
    label: 'Otra Actividad',
    colorClass: 'bg-slate-600 text-white',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-900',
    badgeBorder: 'border-slate-500',
    dotColor: 'bg-slate-600',
    description: 'Ensayos de alabanza, reuniones de líderes u otros',
  },
};
