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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Personas</h1>
              <p className="text-sm text-slate-500">
                {isLoading ? 'Cargando...' : `${persons.length} registro${persons.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setModal({ kind: 'create' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nueva persona</span>
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o apellido..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Status filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:border-slate-400 bg-white transition-colors w-full sm:w-auto justify-between"
          >
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="truncate">{statusLabel(statusFilter)}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          {isFilterOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsFilterOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px]">
                <button
                  onClick={() => { setStatusFilter('todos'); setIsFilterOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${statusFilter === 'todos' ? 'font-semibold text-blue-600' : 'text-slate-700'}`}
                >
                  Todos los estados
                </button>
                {PERSON_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setStatusFilter(opt.value); setIsFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${statusFilter === opt.value ? 'font-semibold text-blue-600' : 'text-slate-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Refresh */}
        <button
          onClick={refresh}
          title="Actualizar"
          className="p-2 rounded-lg border border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && persons.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Sin resultados</h3>
          <p className="text-sm text-slate-500">
            {searchQuery || statusFilter !== 'todos'
              ? 'No se encontraron personas con los filtros aplicados.'
              : 'Aún no hay personas registradas. Crea la primera.'}
          </p>
        </div>
      )}

      {/* ── Desktop Table (hidden on mobile) ── */}
      {!isLoading && persons.length > 0 && (
        <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Contacto</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">F. Nacimiento</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {persons.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => setModal({ kind: 'detail', person: p })}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {p.first_name} {p.last_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {p.email && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[200px]">{p.email}</span>
                          </div>
                        )}
                        {p.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{p.phone}</span>
                          </div>
                        )}
                        {!p.email && !p.phone && (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${PERSON_STATUS_COLORS[p.status]}`}>
                        {PERSON_STATUS_OPTIONS.find((o) => o.value === p.status)?.label || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(p.birth_date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setModal({ kind: 'edit', person: p }); }}
                          title="Editar"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setModal({ kind: 'delete', person: p }); }}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ── Mobile Cards (hidden on desktop) ── */}
      {!isLoading && persons.length > 0 && (
        <div className="md:hidden space-y-3">
          {persons.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 p-4 active:bg-slate-50 transition-colors"
              onClick={() => setModal({ kind: 'detail', person: p })}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {p.first_name} {p.last_name}
                  </h3>
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${PERSON_STATUS_COLORS[p.status]}`}>
                    {PERSON_STATUS_OPTIONS.find((o) => o.value === p.status)?.label || p.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setModal({ kind: 'edit', person: p }); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    aria-label="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setModal({ kind: 'delete', person: p }); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {(p.email || p.phone) && (
                <div className="space-y-1 text-sm text-slate-600">
                  {p.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                  {p.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Person Detail Drawer (click on row/card) ── */}
      {modal.kind === 'detail' && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto" onClick={() => setModal({ kind: 'closed' })}>
          <div
            className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white rounded-t-2xl border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {modal.person.first_name} {modal.person.last_name}
                </h2>
                <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 ${PERSON_STATUS_COLORS[modal.person.status]}`}>
                  {PERSON_STATUS_OPTIONS.find((o) => o.value === modal.person.status)?.label}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModal({ kind: 'edit', person: modal.person })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => setModal({ kind: 'delete', person: modal.person })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            </div>

            {/* Info grid */}
            <div className="p-6 space-y-5">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-0.5">Correo electrónico</span>
                    <span className="text-slate-900">{modal.person.email || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-0.5">Teléfono</span>
                    <span className="text-slate-900">{modal.person.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-0.5">Fecha de nacimiento</span>
                    <span className="text-slate-900">{formatDate(modal.person.birth_date)}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-0.5">Fecha de bautismo</span>
                    <span className="text-slate-900">{formatDate(modal.person.baptism_date)}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs font-medium text-slate-500 mb-0.5">Dirección</span>
                    <span className="text-slate-900">{modal.person.address || '—'}</span>
                  </div>
                  {modal.person.notes && (
                    <div className="sm:col-span-2">
                      <span className="block text-xs font-medium text-slate-500 mb-0.5">Notas</span>
                      <span className="text-slate-900 whitespace-pre-wrap">{modal.person.notes}</span>
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

      {/* ── Create / Edit Form Modal ── */}
      {(modal.kind === 'create' || modal.kind === 'edit') && (
        <PersonForm
          person={modal.kind === 'edit' ? modal.person : null}
          onSave={handleSave}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
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
