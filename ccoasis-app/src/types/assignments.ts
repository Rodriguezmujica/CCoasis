export type ChurchEventRoleType = 
  | 'predicacion' 
  | 'direccion' 
  | 'alabanza' 
  | 'ujier' 
  | 'ninos' 
  | 'sonido';

export interface ChurchEventAssignment {
  id: string;
  event_id: string;
  person_id: string;
  role_type: ChurchEventRoleType;
  notes: string | null;
  created_at: string;
  person?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
  };
}

export interface ChurchEventAssignmentFormData {
  event_id: string;
  person_id: string;
  role_type: ChurchEventRoleType;
  notes?: string;
}

export interface ChurchRoleMetadata {
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconName: string;
  description: string;
}

export const CHURCH_ROLES_CONFIG: Record<ChurchEventRoleType, ChurchRoleMetadata> = {
  predicacion: {
    label: 'Predicación / Mensaje',
    shortLabel: 'Predicación',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    iconName: 'Mic',
    description: 'Pastor, predicador o expositor de la Palabra',
  },
  direccion: {
    label: 'Dirección del Culto',
    shortLabel: 'Dirección',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    iconName: 'BookOpen',
    description: 'Apertura, bienvenida y coordinación de la reunión',
  },
  alabanza: {
    label: 'Alabanza y Adoración',
    shortLabel: 'Alabanza',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    iconName: 'Music',
    description: 'Líder o equipo de ministración musical y alabanza',
  },
  ujier: {
    label: 'Ujieres / Recepción',
    shortLabel: 'Ujier',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    iconName: 'HeartHandshake',
    description: 'Recepción, acomodación, protocolo y recogida de ofrenda',
  },
  ninos: {
    label: 'Escuela Dominical / Niños',
    shortLabel: 'Niños',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    iconName: 'Sparkles',
    description: 'Maestros y cuidadores de la clase infantil',
  },
  sonido: {
    label: 'Sonido y Multimedia',
    shortLabel: 'Sonido',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    iconName: 'Sliders',
    description: 'Control de audio, micrófonos, proyección y transmisión',
  },
};
