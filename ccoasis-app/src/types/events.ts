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
  is_public?: boolean;
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
  is_public?: boolean;
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
    colorClass: 'bg-[#0e7c86] text-white',
    badgeBg: 'bg-[#d9f7f8]',
    badgeText: 'text-[#0a5961]',
    badgeBorder: 'border-[#0e7c86]',
    dotColor: 'bg-[#0e7c86]',
    description: 'Servicio general dominical o entre semana',
  },
  oracion: {
    label: 'Reunión de Oración',
    colorClass: 'bg-[#ae4a84] text-white',
    badgeBg: 'bg-[#f6e6ef]',
    badgeText: 'text-[#7a2f5a]',
    badgeBorder: 'border-[#ae4a84]',
    dotColor: 'bg-[#ae4a84]',
    description: 'Vigilias, ayunos y tiempos congregacionales de clamor',
  },
  jovenes: {
    label: 'Jóvenes / Adolescentes',
    colorClass: 'bg-[#2f7d4f] text-white',
    badgeBg: 'bg-[#e3f5e9]',
    badgeText: 'text-[#14532d]',
    badgeBorder: 'border-[#2f7d4f]',
    dotColor: 'bg-[#2f7d4f]',
    description: 'Reuniones de jóvenes, dinámicas y discipulado juvenil',
  },
  especial: {
    label: 'Evento Especial',
    colorClass: 'bg-[#a8741a] text-white',
    badgeBg: 'bg-[#fdf3d6]',
    badgeText: 'text-[#713f12]',
    badgeBorder: 'border-[#a8741a]',
    dotColor: 'bg-[#a8741a]',
    description: 'Conferencias, aniversarios, campamentos o bautismos',
  },
  venta_verbena: {
    label: 'Actividad Pro-fondos',
    colorClass: 'bg-[#c0392b] text-white',
    badgeBg: 'bg-[#fdecec]',
    badgeText: 'text-[#9b1c1c]',
    badgeBorder: 'border-[#c0392b]',
    dotColor: 'bg-[#c0392b]',
    description: 'Ventas de comida, verbenas benéficas o bazares de apoyo',
  },
  otro: {
    label: 'Otra Actividad',
    colorClass: 'bg-[#5b6068] text-white',
    badgeBg: 'bg-[#ebedef]',
    badgeText: 'text-[#1a1a1a]',
    badgeBorder: 'border-[#5b6068]',
    dotColor: 'bg-[#5b6068]',
    description: 'Ensayos de alabanza, reuniones de líderes u otros',
  },
};
