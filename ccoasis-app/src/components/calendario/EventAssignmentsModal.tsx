import React, { useState, useEffect } from 'react';
import {
  ChurchEventAssignment,
  ChurchEventRoleType,
  CHURCH_ROLES_CONFIG,
} from '../../types/assignments';
import { useEventAssignments } from '../../lib/useEventAssignments';
import {
  Users,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Mic,
  BookOpen,
  Music,
  HeartHandshake,
  Sparkles,
  Sliders,
  Calendar,
  Clock,
  Info,
  Search,
} from 'lucide-react';
import { ChurchEvent } from '../../types/events';
import { formatEventFriendlyDate, formatEventTime } from '../../lib/useEvents';

interface EventAssignmentsModalProps {
  event: ChurchEvent;
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
  onAssignmentsUpdated?: () => void;
}

export const getRoleIcon = (roleType: ChurchEventRoleType, className: string = 'w-4 h-4') => {
  switch (roleType) {
    case 'predicacion':
      return <Mic className={className} />;
    case 'direccion':
      return <BookOpen className={className} />;
    case 'alabanza':
      return <Music className={className} />;
    case 'ujier':
      return <HeartHandshake className={className} />;
    case 'ninos':
      return <Sparkles className={className} />;
    case 'sonido':
      return <Sliders className={className} />;
    default:
      return <Users className={className} />;
  }
};

const ORDERED_ROLE_KEYS: ChurchEventRoleType[] = [
  'predicacion',
  'direccion',
  'alabanza',
  'ujier',
  'ninos',
  'sonido',
];

export const EventAssignmentsModal: React.FC<EventAssignmentsModalProps> = ({
  event,
  isAdmin,
  isOpen,
  onClose,
  onAssignmentsUpdated,
}) => {
  const {
    assignments,
    activePersons,
    loading,
    actionLoading,
    error,
    refetch,
    fetchActivePersons,
    assignPerson,
    removeAssignment,
    clearError,
  } = useEventAssignments(event.id);

  // Modo de añadir servidor
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<ChurchEventRoleType>('predicacion');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [personSearch, setPersonSearch] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Confirmación de desasignación
  const [assignmentToDelete, setAssignmentToDelete] = useState<ChurchEventAssignment | null>(null);

  useEffect(() => {
    if (isOpen) {
      refetch();
      if (isAdmin) {
        fetchActivePersons();
      }
    }
  }, [isOpen, isAdmin, refetch, fetchActivePersons]);

  if (!isOpen) return null;

  // Filtrar personas por búsqueda de texto
  const filteredPersons = activePersons.filter((p) => {
    if (!personSearch.trim()) return true;
    const term = personSearch.toLowerCase();
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(term) || (p.email && p.email.toLowerCase().includes(term));
  });

  const handleOpenAdd = (defaultRole?: ChurchEventRoleType) => {
    if (defaultRole) {
      setSelectedRole(defaultRole);
    }
    setPersonSearch('');
    setSelectedPersonId(activePersons.length > 0 ? activePersons[0].id : '');
    setNotes('');
    clearError();
    setIsAdding(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) return;

    const ok = await assignPerson({
      event_id: event.id,
      person_id: selectedPersonId,
      role_type: selectedRole,
      notes: notes.trim(),
    });

    if (ok) {
      setIsAdding(false);
      setNotes('');
      setPersonSearch('');
      if (onAssignmentsUpdated) onAssignmentsUpdated();
    }
  };

  const handleConfirmRemove = async () => {
    if (!assignmentToDelete) return;
    const ok = await removeAssignment(assignmentToDelete.id);
    if (ok) {
      setAssignmentToDelete(null);
      if (onAssignmentsUpdated) {
        onAssignmentsUpdated();
      }
    }
  };

  // Agrupar asignaciones por rol
  const assignmentsByRole = ORDERED_ROLE_KEYS.reduce((acc, role) => {
    acc[role] = assignments.filter((a) => a.role_type === role);
    return acc;
  }, {} as Record<ChurchEventRoleType, typeof assignments>);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-5 sm:p-6 space-y-5 my-6 max-h-[90vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Programa del Culto y Turnos
              </h3>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {event.title}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                {formatEventFriendlyDate(event.start_time)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {formatEventTime(event.start_time)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-50 transition-colors"
            title="Cerrar modal"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-2 text-rose-800 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-rose-500 hover:text-rose-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Formulario rápido para añadir servidor (Solo Admin) */}
        {isAdmin && isAdding && (
          <form
            onSubmit={handleSaveAssignment}
            className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Asignar servidor al turno
              </h4>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Selector de Rol */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rol de servicio *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as ChurchEventRoleType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  {ORDERED_ROLE_KEYS.map((rk) => (
                    <option key={rk} value={rk}>
                      {CHURCH_ROLES_CONFIG[rk].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Persona con buscador */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Persona de la iglesia *
                </label>
                
                {/* Campo de búsqueda opcional */}
                <div className="relative mb-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={personSearch}
                    onChange={(e) => {
                      const term = e.target.value;
                      setPersonSearch(term);
                      const matching = activePersons.filter((p) => {
                        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
                        return fullName.includes(term.toLowerCase());
                      });
                      if (matching.length > 0 && !matching.some((m) => m.id === selectedPersonId)) {
                        setSelectedPersonId(matching[0].id);
                      }
                    }}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <select
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  {filteredPersons.length === 0 ? (
                    <option value="" disabled>
                      No se encontraron personas
                    </option>
                  ) : (
                    <>
                      <option value="" disabled>
                        Selecciona un servidor ({filteredPersons.length} disponibles)...
                      </option>
                      {filteredPersons.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} ({p.status})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Detalle o Tema (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Mensaje: 'Viviendo por Fe' o Líder de alabanza"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold transition-colors min-h-[40px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={actionLoading || !selectedPersonId}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 min-h-[40px] disabled:opacity-50"
              >
                {actionLoading && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>Confirmar asignación</span>
              </button>
            </div>
          </form>
        )}

        {/* Lista de Roles y Servidores */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500 font-medium">Cargando turnos de servidores...</p>
            </div>
          ) : assignments.length === 0 && !isAdding ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                Aún no se han asignado servidores para esta reunión
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isAdmin
                  ? 'Como administrador, puedes organizar el programa asignando predicador, director, alabanza, ujieres y más.'
                  : 'El liderazgo de la congregación publicará el programa con los turnos próximamente.'}
              </p>
              {isAdmin && (
                <button
                  onClick={() => handleOpenAdd()}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow transition-colors min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Asignar primer servidor</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {ORDERED_ROLE_KEYS.map((roleKey) => {
                const roleConfig = CHURCH_ROLES_CONFIG[roleKey];
                const list = assignmentsByRole[roleKey] || [];

                return (
                  <div
                    key={roleKey}
                    className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5"
                  >
                    {/* Encabezado del Rol */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg border ${roleConfig.badgeBg} ${roleConfig.badgeText} ${roleConfig.badgeBorder}`}
                        >
                          {getRoleIcon(roleKey, 'w-4 h-4')}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {roleConfig.label}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {list.length} {list.length === 1 ? 'asignado' : 'asignados'}
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => handleOpenAdd(roleKey)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-semibold transition-colors flex items-center gap-1 min-h-[36px]"
                          title={`Asignar a ${roleConfig.shortLabel}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Añadir</span>
                        </button>
                      )}
                    </div>

                    {/* Personas en este Rol */}
                    {list.length === 0 ? (
                      <p className="text-xs text-slate-400 italic pl-1">
                        Sin asignar
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {list.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {item.person
                                  ? `${item.person.first_name} ${item.person.last_name}`
                                  : 'Persona no identificada'}
                              </p>
                              {item.notes && (
                                <p className="text-[11px] text-slate-500 truncate" title={item.notes}>
                                  {item.notes}
                                </p>
                              )}
                            </div>

                            {isAdmin && (
                              <button
                                onClick={() => setAssignmentToDelete(item)}
                                disabled={actionLoading}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                                title="Quitar de este turno"
                                aria-label="Quitar de este turno"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal simple de confirmación para quitar servidor */}
        {assignmentToDelete && (
          <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 animate-scaleUp">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-50 rounded-xl">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">¿Quitar del turno?</h4>
                  <p className="text-xs text-slate-500">Confirmación de desasignación</p>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                ¿Estás seguro de quitar a{' '}
                <strong className="text-slate-900">
                  {assignmentToDelete.person
                    ? `${assignmentToDelete.person.first_name} ${assignmentToDelete.person.last_name}`
                    : 'este servidor'}
                </strong>{' '}
                del rol de{' '}
                <strong className="text-slate-900">
                  {CHURCH_ROLES_CONFIG[assignmentToDelete.role_type]?.label || assignmentToDelete.role_type}
                </strong>?
              </p>

              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignmentToDelete(null)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemove}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
                >
                  {actionLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Sí, quitar servidor</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pie de modal */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Turnos visibles para toda la congregación.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors min-h-[40px]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
export default EventAssignmentsModal;
