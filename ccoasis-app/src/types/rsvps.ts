export type RSVPStatus = 'asistire' | 'quizas' | 'no_asistire';

export interface ChurchEventRSVP {
  id: string;
  event_id: string;
  person_id: string;
  status: RSVPStatus;
  guests: number;
  created_at: string;
  updated_at: string;
  person?: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string | null;
  } | null;
}

export interface RSVPFormData {
  status: RSVPStatus;
  guests: number;
}

export interface EventRSVPSummary {
  confirmed: number;
  maybe: number;
  guests: number;
}

export interface RSVPStatusMetadata {
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
}

export const RSVP_STATUS_CONFIG: Record<RSVPStatus, RSVPStatusMetadata> = {
  asistire: {
    label: 'Asistiré',
    shortLabel: 'Asistirá',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
    dotColor: 'bg-emerald-500',
    description: 'Ha confirmado asistencia',
  },
  quizas: {
    label: 'Quizás',
    shortLabel: 'Quizás',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    dotColor: 'bg-amber-500',
    description: 'En duda o por confirmar',
  },
  no_asistire: {
    label: 'No asistiré',
    shortLabel: 'No asistirá',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-300',
    dotColor: 'bg-slate-400',
    description: 'No podrá asistir',
  },
};
