import { ChurchEvent } from './events';

export interface EventHeadcount {
  id: string;
  event_id: string;
  adults_count: number;
  children_count: number;
  visitors_count: number;
  total_count: number;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  // Opcional para vistas agregadas/join
  event?: ChurchEvent;
}

export interface HeadcountFormData {
  adults_count: number;
  children_count: number;
  visitors_count: number;
  notes?: string;
}

export interface HeadcountMonthSummary {
  month: number; // 0-11
  year: number;
  totalEventsWithAttendance: number;
  totalAttendees: number;
  averageAttendance: number;
  totalAdults: number;
  totalChildren: number;
  totalVisitors: number;
  highestEvent: {
    title: string;
    date: string;
    total: number;
  } | null;
}
