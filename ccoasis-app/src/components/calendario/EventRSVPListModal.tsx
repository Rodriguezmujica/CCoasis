import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChurchEvent } from '../../types/events';
import { ChurchEventRSVP, RSVPStatus, RSVP_STATUS_CONFIG } from '../../types/rsvps';
import { formatEventFriendlyDate, formatEventTime } from '../../lib/useEvents';
import {
  Users,
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  HelpCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  CalendarCheck,
  Phone,
} from 'lucide-react';

interface EventRSVPListModalProps {
  event: ChurchEvent;
  isOpen: boolean;
  onClose: () => void;
}

function formatRSVPDate(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const EventRSVPListModal: React.FC<EventRSVPListModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  const [rsvps, setRsvps] = useState<ChurchEventRSVP[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | RSVPStatus>('todos');

  useEffect(() => {
    if (!isOpen || !event?.id) return;

    let isSubscribed = true;
    setLoading(true);
    setError(null);

    const loadRSVPs = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('church_event_rsvps')
          .select(`
            id,
            event_id,
            person_id,
            status,
            guests,
            created_at,
            updated_at,
            person:persons (
              id,
              first_name,
              last_name,
              phone
            )
          `)
          .eq('event_id', event.id)
          .order('created_at', { ascending: false });

        if (fetchErr) throw fetchErr;

        if (isSubscribed) {
          // Cast de PostgREST join (person puede venir como objeto o arreglo de 1)
          const formatted = (data || []).map((row: any) => {
            const p = Array.isArray(row.person) ? row.person[0] : row.person;
            return {
              ...row,
              person: p || null,
            };
          });
          setRsvps(formatted as ChurchEventRSVP[]);
        }
      } catch (err: any) {
        console.error('Error al cargar lista de confirmaciones:', err);
        if (isSubscribed) {
          setError(err?.message || 'Error al consultar las confirmaciones');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadRSVPs();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, event?.id]);

  if (!isOpen) return null;

  // Totales y cálculos
  const confirmedList = rsvps.filter((r) => r.status === 'asistire');
  const maybeList = rsvps.filter((r) => r.status === 'quizas');
  const notAttendingList = rsvps.filter((r) => r.status === 'no_asistire');

  const totalConfirmed = confirmedList.length;
  const totalMaybe = maybeList.length;
  const totalNotAttending = notAttendingList.length;

  const totalGuests = rsvps
    .filter((r) => r.status === 'asistire' || r.status === 'quizas')
    .reduce((sum, r) => sum + (r.guests || 0), 0);

  const totalExpectedPeople = totalConfirmed + totalGuests;

  // Filtrado para visualización
  const filteredRsvps = rsvps.filter((r) => {
    if (filter === 'todos') return true;
    return r.status === filter;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 sm:p-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                Lista de Confirmados (RSVP)
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                {event.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors"
              title="Cerrar"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-blue-100">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatEventFriendlyDate(event.start_time)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatEventTime(event.start_time)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tarjetas de Resumen Total */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Confirmados</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{totalConfirmed}</div>
            <div className="text-[10px] text-slate-500">miembros</div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-blue-600 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Invitados</span>
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{totalGuests}</div>
            <div className="text-[10px] text-slate-500">acompañantes</div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Esperado</span>
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-900">{totalExpectedPeople}</div>
            <div className="text-[10px] text-indigo-600 font-medium">personas en total</div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Quizás / No</span>
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {totalMaybe} <span className="text-sm font-semibold text-slate-400">/ {totalNotAttending}</span>
            </div>
            <div className="text-[10px] text-slate-500">duda / cancelaron</div>
          </div>
        </div>

        {/* Pestañas de Filtrado */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-1.5 border-b border-slate-100 flex-shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filter === 'todos'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({rsvps.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('asistire')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filter === 'asistire'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Asistirán ({totalConfirmed})
          </button>
          <button
            type="button"
            onClick={() => setFilter('quizas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filter === 'quizas'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Quizás ({totalMaybe})
          </button>
          <button
            type="button"
            onClick={() => setFilter('no_asistire')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filter === 'no_asistire'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            No asistirán ({totalNotAttending})
          </button>
        </div>

        {/* Lista de Personas Confirmadas */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-500 text-xs font-medium">
                Cargando lista de personas que han confirmado...
              </p>
            </div>
          ) : filteredRsvps.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-slate-700 text-sm font-semibold">
                No hay registros en esta categoría
              </p>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                {rsvps.length === 0
                  ? 'Aún ningún miembro ha registrado su confirmación para esta actividad.'
                  : 'No hay respuestas para el filtro seleccionado.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRsvps.map((rsvp) => {
                const p = rsvp.person;
                const fullName = p
                  ? `${p.first_name} ${p.last_name}`
                  : 'Persona sin nombre';
                const statusMeta = RSVP_STATUS_CONFIG[rsvp.status];

                return (
                  <div
                    key={rsvp.id}
                    className="p-3 sm:p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors shadow-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{fullName}</span>
                        {p?.phone && (
                          <a
                            href={`tel:${p.phone}`}
                            className="text-[11px] text-slate-400 hover:text-blue-600 inline-flex items-center gap-0.5"
                            title={`Llamar a ${p.phone}`}
                          >
                            <Phone className="w-3 h-3" />
                            <span>{p.phone}</span>
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Confirmó el {formatRSVPDate(rsvp.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {/* Insignia de Estado */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}
                      >
                        {rsvp.status === 'asistire' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        {rsvp.status === 'quizas' && (
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        {rsvp.status === 'no_asistire' && (
                          <XCircle className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{statusMeta.shortLabel}</span>
                      </span>

                      {/* Invitados */}
                      {rsvp.status !== 'no_asistire' && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                            rsvp.guests > 0
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>
                            {rsvp.guests > 0
                              ? `+${rsvp.guests} ${rsvp.guests === 1 ? 'invitado' : 'invitados'}`
                              : 'Sin invitados'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 active:bg-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
