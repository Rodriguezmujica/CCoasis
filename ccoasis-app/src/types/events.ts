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
    colorClass: 'bg-blue-500 text-white',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-500',
    description: 'Servicio general dominical o entre semana',
  },
  oracion: {
    label: 'Reunión de Oración',
    colorClass: 'bg-purple-500 text-white',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    dotColor: 'bg-purple-500',
    description: 'Vigilias, ayunos y tiempos congregacionales de clamor',
  },
  jovenes: {
    label: 'Jóvenes / Adolescentes',
    colorClass: 'bg-emerald-500 text-white',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    description: 'Reuniones de jóvenes, dinámicas y discipulado juvenil',
  },
  especial: {
    label: 'Evento Especial',
    colorClass: 'bg-amber-500 text-white',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
    description: 'Conferencias, aniversarios, campamentos o bautismos',
  },
  venta_verbena: {
    label: 'Actividad Pro-fondos',
    colorClass: 'bg-rose-500 text-white',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    dotColor: 'bg-rose-500',
    description: 'Ventas de comida, verbenas benéficas o bazares de apoyo',
  },
  otro: {
    label: 'Otra Actividad',
    colorClass: 'bg-slate-500 text-white',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    dotColor: 'bg-slate-500',
    description: 'Ensayos de alabanza, reuniones de líderes u otros',
  },
};
