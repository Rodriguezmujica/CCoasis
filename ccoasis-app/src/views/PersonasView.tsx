import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Phone,
  Mail,
  ChevronDown,
  Users,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { usePersons } from '../lib/usePersons';
import {
  Person,
  PersonFormData,
  PersonStatus,
  PERSON_STATUS_OPTIONS,
  PERSON_STATUS_COLORS,
} from '../types/persons';
import { PersonForm } from '../components/personas/PersonForm';
import { PersonUserLinkPanel } from '../components/personas/PersonUserLinkPanel';
import { DeletePersonConfirm } from '../components/personas/DeletePersonConfirm';

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; person: Person }
  | { kind: 'delete'; person: Person }
  | { kind: 'detail'; person: Person };

export const PersonasView: React.FC = () => {
  const {
    persons,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    refresh,
    createPerson,
    updatePerson,
    softDeletePerson,
    linkPersonToUser,
    getPersonUserLink,
    addUserRole,
    removeUserRole,
  } = usePersons();

  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSave = async (data: PersonFormData) => {
    if (modal.kind === 'edit') {
      return updatePerson(modal.person.id, data);
    }
    return createPerson(data);
  };

  const statusLabel = (s: PersonStatus | 'todos') =>
    s === 'todos' ? 'Todos los estados' : PERSON_STATUS_OPTIONS.find((o) => o.value === s)?.label || s;

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 md:py-6 md:px-8 space-y-4">
      {/* Cabecera Principal: icono Oasis #0e7c86 + título con degradado + subtítulo #4a4f57 y botón Nueva persona */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-[12px] bg-[#0e7c86] flex items-center justify-center text-white flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[25px] leading-[1.2] font-extrabold oasis-text-gradient">
              Personas
            </h1>
            <p className="text-sm text-[#4a4f57]">
              {isLoading ? 'Cargando...' : `${persons.length} registro${persons.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModal({ kind: 'create' })}
          className="w-full sm:w-auto min-h-[44px] px-[18px] rounded-[10px] text-base font-semibold text-white bg-[#0e7c86] hover:bg-[#0a5961] inline-flex items-center justify-center gap-2 transition-colors"
        >
          <UserPlus className="w-5 h-5 flex-shrink-0" />
          <span>Nueva persona</span>
        </button>
      </div>

      {/* Barra de búsqueda y filtro en tarjeta blanca rounded-3xl */}
      <div className="bg-white rounded-3xl border border-[#d4d7dc] p-4 flex flex-col sm:flex-row gap-3">
        {/* Campo de búsqueda (16px text-base, min-h-[44px], borde #858a93) */}
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4a4f57] pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o apellido..."
            aria-label="Buscar por nombre o apellido"
            className="w-full min-h-[44px] pl-11 pr-3 py-2 rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder:text-[#5b6068] bg-white focus:outline-none focus:ring-2 focus:ring-[#0e7c86] transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de estado */}
          <div className="relative flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-expanded={isFilterOpen}
              aria-label="Filtrar por estado"
              className="w-full sm:min-w-[220px] min-h-[44px] px-4 py-2 rounded-xl border border-[#858a93] text-base font-medium text-[#1a1a1a] hover:bg-[#ebedef] bg-white transition-colors inline-flex items-center justify-between gap-2"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Filter className="w-5 h-5 text-[#4a4f57] flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{statusLabel(statusFilter)}</span>
              </span>
              <ChevronDown
                className={`w-5 h-5 text-[#4a4f57] flex-shrink-0 transition-transform ${
                  isFilterOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>
            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-30 bg-white border border-[#d4d7dc] rounded-2xl shadow-lg py-1.5 min-w-[220px]">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('todos');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full min-h-[44px] text-left px-4 py-2 text-base hover:bg-[#ebedef] flex items-center ${
                      statusFilter === 'todos'
                        ? 'font-bold text-[#0e7c86] bg-[#d9f7f8]/50'
                        : 'text-[#1a1a1a]'
                    }`}
                  >
                    Todos los estados
                  </button>
                  {PERSON_STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full min-h-[44px] text-left px-4 py-2 text-base hover:bg-[#ebedef] flex items-center ${
                        statusFilter === opt.value
                          ? 'font-bold text-[#0e7c86] bg-[#d9f7f8]/50'
                          : 'text-[#1a1a1a]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Botón Actualizar (44×44 px) */}
          <button
            type="button"
            onClick={refresh}
            title="Actualizar"
            aria-label="Actualizar"
            className="w-11 min-h-[44px] rounded-xl border border-[#858a93] bg-white text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-[#ebedef] inline-flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#fdecec] border border-rose-300 text-[#9b1c1c] text-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#0e7c86] animate-spin" />
        </div>
      )}

      {/* Estado vacío */}
      {!isLoading && persons.length === 0 && (
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center">
          <div className="w-14 h-14 bg-[#ebedef] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-[#4a4f57]" />
          </div>
          <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">Sin resultados</h3>
          <p className="text-sm text-[#4a4f57]">
            {searchQuery || statusFilter !== 'todos'
              ? 'No se encontraron personas con los filtros aplicados.'
              : 'Aún no hay personas registradas. Crea la primera.'}
          </p>
        </div>
      )}

      {/* ── Tabla en escritorio (oculta en móvil) ── */}
      {!isLoading && persons.length > 0 && (
        <div className="hidden md:block bg-white rounded-3xl border border-[#d4d7dc] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#d4d7dc] bg-[#ebedef]">
                  <th className="text-left px-4 py-3 font-bold text-[#1a1a1a]">Nombre</th>
                  <th className="text-left px-4 py-3 font-bold text-[#1a1a1a]">Contacto</th>
                  <th className="text-left px-4 py-3 font-bold text-[#1a1a1a]">Estado</th>
                  <th className="text-left px-4 py-3 font-bold text-[#1a1a1a]">F. Nacimiento</th>
                  <th className="text-right px-4 py-3 font-bold text-[#1a1a1a]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4d7dc]">
                {persons.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[#fafafa] cursor-pointer transition-colors"
                    onClick={() => setModal({ kind: 'detail', person: p })}
                  >
                    <td className="px-4 py-2.5 align-middle">
                      <div className="font-semibold text-base text-[#1a1a1a]">
                        {p.first_name} {p.last_name}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <div className="space-y-0.5">
                        {p.email && (
                          <div className="flex items-center gap-2 text-[#4a4f57]">
                            <Mail className="w-4 h-4 text-[#4a4f57] flex-shrink-0" />
                            <span className="truncate max-w-[220px]">{p.email}</span>
                          </div>
                        )}
                        {p.phone && (
                          <div className="flex items-center gap-2 text-[#4a4f57]">
                            <Phone className="w-4 h-4 text-[#4a4f57] flex-shrink-0" />
                            <span>{p.phone}</span>
                          </div>
                        )}
                        {!p.email && !p.phone && <span className="text-[#4a4f57]">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-middle">
                      <span
                        className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${PERSON_STATUS_COLORS[p.status]}`}
                      >
                        {PERSON_STATUS_OPTIONS.find((o) => o.value === p.status)?.label || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 align-middle text-[#4a4f57]">
                      {formatDate(p.birth_date)}
                    </td>
                    <td className="px-4 py-2.5 align-middle text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({ kind: 'edit', person: p });
                          }}
                          title="Editar"
                          aria-label={`Editar a ${p.first_name} ${p.last_name}`}
                          className="w-11 min-h-[44px] rounded-[10px] text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-[#ebedef] inline-flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({ kind: 'delete', person: p });
                          }}
                          title="Eliminar"
                          aria-label={`Eliminar a ${p.first_name} ${p.last_name}`}
                          className="w-11 min-h-[44px] rounded-[10px] text-[#4a4f57] hover:text-[#9b1c1c] hover:bg-[#fdecec] inline-flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tarjetas en móvil (ocultas en escritorio) ── */}
      {!isLoading && persons.length > 0 && (
        <div className="md:hidden space-y-3">
          {persons.map((p) => (
            <article
              key={p.id}
              className="bg-white rounded-3xl border border-[#d4d7dc] p-4 grid gap-2 active:bg-[#fafafa] cursor-pointer transition-colors"
              onClick={() => setModal({ kind: 'detail', person: p })}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#1a1a1a] mb-1.5">
                    {p.first_name} {p.last_name}
                  </h3>
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${PERSON_STATUS_COLORS[p.status]}`}
                  >
                    {PERSON_STATUS_OPTIONS.find((o) => o.value === p.status)?.label || p.status}
                  </span>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModal({ kind: 'edit', person: p });
                    }}
                    className="w-11 min-h-[44px] rounded-[10px] text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-[#ebedef] inline-flex items-center justify-center transition-colors"
                    aria-label={`Editar a ${p.first_name} ${p.last_name}`}
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModal({ kind: 'delete', person: p });
                    }}
                    className="w-11 min-h-[44px] rounded-[10px] text-[#4a4f57] hover:text-[#9b1c1c] hover:bg-[#fdecec] inline-flex items-center justify-center transition-colors"
                    aria-label={`Eliminar a ${p.first_name} ${p.last_name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {(p.email || p.phone) && (
                <div className="space-y-1 text-sm text-[#4a4f57]">
                  {p.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#4a4f57] flex-shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                  {p.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#4a4f57] flex-shrink-0" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* ── Modal de Detalle de Persona y Vinculación de Cuenta ── */}
      {modal.kind === 'detail' && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#1a1a1a]/55 p-4 overflow-y-auto"
          onClick={() => setModal({ kind: 'closed' })}
        >
          <div
            className="bg-[#f5f5f5] rounded-3xl shadow-2xl border border-[#d4d7dc] w-full max-w-2xl my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera con degradado Oasis y título en 24px negrita blanca */}
            <div className="oasis-title-gradient on-magenta px-6 py-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                {modal.person.first_name} {modal.person.last_name}
              </h2>
              <button
                type="button"
                onClick={() => setModal({ kind: 'closed' })}
                className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-white hover:bg-white/20 inline-flex items-center justify-center transition-colors"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido en tarjetas blancas redondeadas sobre #f5f5f5 */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Barra de estado y acciones rápidas */}
              <div className="bg-white rounded-3xl border border-[#d4d7dc] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4a4f57]">
                    Estado:
                  </span>
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${PERSON_STATUS_COLORS[modal.person.status]}`}
                  >
                    {PERSON_STATUS_OPTIONS.find((o) => o.value === modal.person.status)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModal({ kind: 'edit', person: modal.person })}
                    className="min-h-[44px] px-4 rounded-xl text-sm font-semibold text-[#1a1a1a] bg-white hover:bg-[#ebedef] border border-[#858a93] inline-flex items-center gap-2 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-[#0e7c86]" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ kind: 'delete', person: modal.person })}
                    className="min-h-[44px] px-4 rounded-xl text-sm font-semibold text-[#9b1c1c] bg-[#fdecec] hover:bg-rose-200/70 border border-rose-300 inline-flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>

              {/* Ficha de datos personales */}
              <div className="bg-white rounded-3xl border border-[#d4d7dc] p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-[#4a4f57] mb-0.5">
                      Correo electrónico
                    </span>
                    <span className="text-[#1a1a1a] font-medium">
                      {modal.person.email || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#4a4f57] mb-0.5">
                      Teléfono
                    </span>
                    <span className="text-[#1a1a1a] font-medium">
                      {modal.person.phone || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#4a4f57] mb-0.5">
                      Fecha de nacimiento
                    </span>
                    <span className="text-[#1a1a1a] font-medium">
                      {formatDate(modal.person.birth_date)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#4a4f57] mb-0.5">
                      Fecha de bautismo
                    </span>
                    <span className="text-[#1a1a1a] font-medium">
                      {formatDate(modal.person.baptism_date)}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs font-semibold text-[#4a4f57] mb-0.5">
                      Dirección
                    </span>
                    <span className="text-[#1a1a1a] font-medium">
                      {modal.person.address || '—'}
                    </span>
                  </div>
                  {modal.person.notes && (
                    <div className="sm:col-span-2">
                      <span className="block text-xs font-semibold text-[#4a4f57] mb-0.5">
                        Notas
                      </span>
                      <span className="text-[#1a1a1a] whitespace-pre-wrap">
                        {modal.person.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acceso a la app (vincular usuario + roles) */}
              <PersonUserLinkPanel
                person={modal.person}
                linkPersonToUser={linkPersonToUser}
                getPersonUserLink={getPersonUserLink}
                addUserRole={addUserRole}
                removeUserRole={removeUserRole}
                onLinked={refresh}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Crear / Editar Persona ── */}
      {(modal.kind === 'create' || modal.kind === 'edit') && (
        <PersonForm
          person={modal.kind === 'edit' ? modal.person : null}
          onSave={handleSave}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}

      {/* ── Modal Confirmación de Eliminación ── */}
      {modal.kind === 'delete' && (
        <DeletePersonConfirm
          person={modal.person}
          onConfirm={softDeletePerson}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
    </div>
  );
};
