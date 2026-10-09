import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Mail,
  Phone,
  RefreshCw,
  Loader2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUsers } from '../lib/useUsers';
import { useAuth } from '../context/AuthContext';
import { AppUser, ROLE_BADGE_STYLES } from '../types/users';
import { AppRole } from '../types/auth';
import { PERSON_STATUS_COLORS, PERSON_STATUS_OPTIONS, ROLE_LABELS } from '../types/persons';
import { CreateUserModal } from '../components/usuarios/CreateUserModal';
import { ManageRolesModal } from '../components/usuarios/ManageRolesModal';

const ROLE_FILTER_OPTIONS: { value: AppRole | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos los roles' },
  { value: 'admin', label: 'Administradores' },
  { value: 'tesorero', label: 'Tesoreros' },
  { value: 'maestro', label: 'Maestros' },
  { value: 'alumno', label: 'Miembros / Alumnos' },
];

export const UsuariosView: React.FC = () => {
  const { user: currentAuthUser } = useAuth();
  const {
    users,
    unlinkedPersons,
    isLoading,
    error,
    refresh,
    createUser,
    addUserRole,
    removeUserRole,
  } = useUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'todos'>('todos');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<AppUser | null>(null);
  const [globalBanner, setGlobalBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole =
        roleFilter === 'todos' || u.roles.includes(roleFilter);

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roles.some((r) => r.toLowerCase().includes(q));

      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchQuery]);

  const handleCreateUserSubmit = async (payload: any) => {
    const res = await createUser(payload);
    if (res.ok) {
      setGlobalBanner({
        type: 'success',
        message: `Usuario ${payload.email} creado correctamente con roles asignados.`,
      });
      setTimeout(() => setGlobalBanner(null), 5000);
    }
    return res;
  };

  const getInitials = (first: string, last: string) => {
    const f = first.charAt(0) || '';
    const l = last.charAt(0) || '';
    return (f + l).toUpperCase() || 'U';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner de notificación global */}
      {globalBanner && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in ${
            globalBanner.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {globalBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{globalBanner.message}</span>
          </div>
          <button
            onClick={() => setGlobalBanner(null)}
            className="text-xs font-semibold underline ml-4 hover:opacity-75"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Gestión de Usuarios
            </h1>
            <p className="text-sm text-slate-500">
              {isLoading
                ? 'Cargando cuentas...'
                : `${users.length} cuenta${users.length !== 1 ? 's' : ''} de acceso`}
            </p>
          </div>
        </div>

        {/* Botones de acción (mobile-first) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Link
            to="/auditoria"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors shadow-sm"
            title="Ver registros de auditoría"
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Auditoría</span>
          </Link>
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm disabled:opacity-50"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-5 h-5" />
            <span>Crear nuevo usuario</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, apellido, correo o rol..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Selector de Rol */}
        <div className="w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AppRole | 'todos')}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ROLE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error de carga */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-semibold">Error al cargar usuarios</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => refresh()}
            className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-xs font-semibold text-rose-800 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido Principal */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Cargando directorio de usuarios...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {searchQuery || roleFilter !== 'todos'
                ? 'No se encontraron usuarios coincidentes'
                : 'No hay usuarios registrados'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || roleFilter !== 'todos'
                ? 'Prueba a cambiar los términos de búsqueda o a seleccionar otro filtro de rol.'
                : 'Pulsa el botón "Crear nuevo usuario" para dar de alta la primera cuenta de acceso.'}
            </p>
          </div>
          {(searchQuery || roleFilter !== 'todos') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('todos');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const isSelf = user.userId === currentAuthUser?.id;

            return (
              <div
                key={user.userId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Avatar + Nombre + Estado */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shadow-inner">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 leading-tight text-base">
                            {user.firstName} {user.lastName}
                          </h3>
                          {isSelf && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wider">
                              Tú
                            </span>
                          )}
                        </div>

                        {user.status && (
                          <span
                            className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                              PERSON_STATUS_COLORS[user.status] || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {PERSON_STATUS_OPTIONS.find((o) => o.value === user.status)?.label ||
                              user.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Datos de contacto */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate" title={user.email}>
                        {user.email}
                      </span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Badges de Roles */}
                  <div className="mt-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Roles asignados
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.length === 0 ? (
                        <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Sin roles asignados
                        </span>
                      ) : (
                        user.roles.map((role) => (
                          <span
                            key={role}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border tracking-wide ${ROLE_BADGE_STYLES[role]}`}
                          >
                            {ROLE_LABELS[role] || role}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {user.personId ? (
                    <Link
                      to="/personas"
                      className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                      title="Ver en directorio de personas"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ficha vinculada</span>
                    </Link>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      Sin ficha personal
                    </span>
                  )}

                  <button
                    onClick={() => setSelectedUserForRoles(user)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors ml-auto"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Gestionar roles</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Crear Usuario */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        unlinkedPersons={unlinkedPersons}
        onSubmit={handleCreateUserSubmit}
      />

      {/* Modal de Gestionar Roles */}
      <ManageRolesModal
        isOpen={Boolean(selectedUserForRoles)}
        onClose={() => setSelectedUserForRoles(null)}
        user={selectedUserForRoles}
        onAddRole={addUserRole}
        onRemoveRole={removeUserRole}
        onRolesUpdated={refresh}
      />
    </div>
  );
};
