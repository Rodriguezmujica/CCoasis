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
  KeyRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUsers } from '../lib/useUsers';
import { useAuth } from '../context/AuthContext';
import { AppUser, ROLE_BADGE_STYLES } from '../types/users';
import { AppRole } from '../types/auth';
import { PERSON_STATUS_COLORS, PERSON_STATUS_OPTIONS, ROLE_LABELS } from '../types/persons';
import { CreateUserModal } from '../components/usuarios/CreateUserModal';
import { ManageRolesModal } from '../components/usuarios/ManageRolesModal';
import { AdminResetPasswordModal } from '../components/usuarios/AdminResetPasswordModal';

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
    updateUserPassword,
    addUserRole,
    removeUserRole,
  } = useUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'todos'>('todos');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserForRoles, setSelectedUserForRoles] = useState<AppUser | null>(null);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<AppUser | null>(null);
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
          className={`p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in ${
            globalBanner.type === 'success'
              ? 'bg-emerald-100 border border-emerald-600 text-emerald-950'
              : 'bg-rose-50 border border-rose-600 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-3">
            {globalBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-800 flex-shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0" aria-hidden="true" />
            )}
            <span className="text-sm font-bold">{globalBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setGlobalBanner(null)}
            className="text-xs font-extrabold underline ml-4 px-2 py-1 min-h-[36px] hover:opacity-80"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-[12px] bg-[#0e7c86] flex items-center justify-center text-white shadow-sm shrink-0"
            aria-hidden="true"
          >
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[24px] sm:text-[25px] font-extrabold oasis-text-gradient tracking-tight leading-tight">
              Gestión de Usuarios
            </h1>
            <p className="text-sm text-[#4a4f57] mt-0.5">
              {isLoading
                ? 'Cargando cuentas...'
                : `${users.length} cuenta${users.length !== 1 ? 's' : ''} de acceso en el sistema`}
            </p>
          </div>
        </div>

        {/* Botones de acción (mobile-first) */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <Link
            to="/auditoria"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] bg-white hover:bg-[#f5f5f5] text-[#1a1a1a] font-bold text-sm transition-colors shadow-sm"
            title="Ver registros de auditoría"
          >
            <ShieldAlert className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
            <span>Auditoría</span>
          </Link>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            aria-label="Actualizar lista de usuarios"
            className="p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#858a93] bg-white hover:bg-[#f5f5f5] text-[#1a1a1a] transition-colors shadow-sm disabled:opacity-50"
            title="Refrescar lista"
          >
            <RefreshCw
              className={`w-5 h-5 ${isLoading ? 'animate-spin text-[#0e7c86]' : 'text-[#4a4f57]'}`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold text-white bg-[#0e7c86] hover:bg-[#0a5961] shadow-sm transition-all"
          >
            <UserPlus className="w-5 h-5" aria-hidden="true" />
            <span>+ Crear Usuario</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-3xl border border-[#d4d7dc] p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4a4f57]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, apellido, correo o rol..."
            aria-label="Buscar usuarios"
            className="w-full pl-11 pr-4 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder-[#4a4f57]/70 focus:outline-none focus:border-[#0e7c86] bg-white"
          />
        </div>

        {/* Selector de Rol */}
        <div className="w-full sm:w-auto">
          <select
            aria-label="Filtrar por rol"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as AppRole | 'todos')}
            className="w-full sm:w-auto px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] text-base font-medium text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] focus:outline-none focus:border-[#0e7c86]"
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
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-600 text-rose-950 text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-700" aria-hidden="true" />
            <div>
              <p className="font-bold">Error al cargar usuarios</p>
              <p className="text-xs text-rose-900 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refresh()}
            className="px-3.5 py-2 min-h-[44px] rounded-xl bg-rose-100 hover:bg-rose-200 border border-rose-600 text-xs font-bold text-rose-950 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido Principal */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#4a4f57] space-y-3 bg-white rounded-3xl border border-[#d4d7dc]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0e7c86]" />
          <p className="text-sm font-medium">Cargando directorio de usuarios...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#d9f7f8] flex items-center justify-center mx-auto text-[#0e7c86]">
            <Users className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1a1a1a]">
              {searchQuery || roleFilter !== 'todos'
                ? 'No se encontraron usuarios coincidentes'
                : 'No hay usuarios registrados'}
            </h3>
            <p className="text-sm text-[#4a4f57] mt-1 max-w-sm mx-auto">
              {searchQuery || roleFilter !== 'todos'
                ? 'Prueba a cambiar los términos de búsqueda o a seleccionar otro filtro de rol.'
                : 'Pulsa el botón "+ Crear Usuario" para dar de alta la primera cuenta de acceso.'}
            </p>
          </div>
          {(searchQuery || roleFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('todos');
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold text-[#0a5961] bg-[#d9f7f8] hover:bg-[#aaeif0] border border-[#0e7c86] transition-colors"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Vista Móvil / Tablet: Tarjetas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {filteredUsers.map((user) => {
              const isSelf = user.userId === currentAuthUser?.id;

              return (
                <div
                  key={user.userId}
                  className="bg-white rounded-3xl border border-[#d4d7dc] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Bar: Avatar + Nombre + Estado */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-[#d9f7f8] border border-[#0e7c86] flex items-center justify-center font-extrabold text-[#0a5961] text-sm shrink-0">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-[#1a1a1a] leading-tight text-base truncate">
                              {user.firstName} {user.lastName}
                            </h3>
                            {isSelf && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] uppercase tracking-wider">
                                Tú
                              </span>
                            )}
                          </div>

                          {user.status && (
                            <span
                              className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border mt-1 ${
                                PERSON_STATUS_COLORS[user.status] ||
                                'bg-slate-100 text-slate-800 border-slate-400'
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
                    <div className="space-y-1.5 text-xs text-[#1a1a1a] bg-[#f5f5f5] p-3 rounded-2xl border border-[#e5e7eb]">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-4 h-4 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
                        <span className="truncate font-medium" title={user.email}>
                          {user.email}
                        </span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="w-4 h-4 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
                          <span className="font-medium">{user.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Badges de Roles */}
                    <div className="mt-3.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#4a4f57] mb-1.5">
                        Roles asignados
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.length === 0 ? (
                          <span className="text-xs font-bold text-rose-950 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-600">
                            Sin roles asignados
                          </span>
                        ) : (
                          user.roles.map((role) => (
                            <span
                              key={role}
                              className={`text-xs font-bold px-2.5 py-1 rounded-full border tracking-wide ${ROLE_BADGE_STYLES[role]}`}
                            >
                              {ROLE_LABELS[role] || role}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between gap-2 flex-wrap">
                    {user.personId ? (
                      <Link
                        to="/personas"
                        aria-label={`Ver ficha de ${user.firstName} ${user.lastName} en Personas`}
                        className="text-xs font-bold text-[#0e7c86] hover:text-[#0a5961] inline-flex items-center gap-1.5 py-2 px-2.5 min-h-[44px] rounded-xl hover:bg-[#d9f7f8]/50 transition-colors"
                        title="Ver en directorio de personas"
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        <span>Ficha</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-[#4a4f57] italic py-2">
                        Sin ficha
                      </span>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedUserForPassword(user)}
                        aria-label={`Cambiar contraseña de ${user.firstName} ${user.lastName}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] transition-colors"
                        title="Cambiar contraseña de usuario"
                      >
                        <KeyRound className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                        <span>Clave</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedUserForRoles(user)}
                        aria-label={`Gestionar roles de ${user.firstName} ${user.lastName}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold text-[#0a5961] bg-[#d9f7f8] hover:bg-[#aaeif0] border border-[#0e7c86] transition-colors"
                        title="Gestionar roles"
                      >
                        <Shield className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                        <span>Roles</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista Escritorio: Tabla en tarjeta redondeada */}
          <div className="hidden lg:block bg-white rounded-3xl border border-[#d4d7dc] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d4d7dc] bg-[#f5f5f5] text-xs font-bold uppercase tracking-wider text-[#4a4f57]">
                    <th className="py-3.5 px-5">Usuario</th>
                    <th className="py-3.5 px-4">Contacto</th>
                    <th className="py-3.5 px-4">Estado / Ficha</th>
                    <th className="py-3.5 px-4">Roles asignados</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] text-sm">
                  {filteredUsers.map((user) => {
                    const isSelf = user.userId === currentAuthUser?.id;

                    return (
                      <tr key={user.userId} className="hover:bg-[#f5f5f5]/60 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#d9f7f8] border border-[#0e7c86] flex items-center justify-center font-extrabold text-[#0a5961] text-sm shrink-0">
                              {getInitials(user.firstName, user.lastName)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#1a1a1a]">
                                  {user.firstName} {user.lastName}
                                </span>
                                {isSelf && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] uppercase tracking-wider">
                                    Tú
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-xs text-[#1a1a1a]">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Mail className="w-3.5 h-3.5 text-[#0e7c86] shrink-0" aria-hidden="true" />
                              <span>{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1.5 text-[#4a4f57]">
                                <Phone className="w-3.5 h-3.5 text-[#0e7c86] shrink-0" aria-hidden="true" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {user.status && (
                              <span
                                className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                  PERSON_STATUS_COLORS[user.status] ||
                                  'bg-slate-100 text-slate-800 border-slate-400'
                                }`}
                              >
                                {PERSON_STATUS_OPTIONS.find((o) => o.value === user.status)?.label ||
                                  user.status}
                              </span>
                            )}
                            {user.personId ? (
                              <Link
                                to="/personas"
                                aria-label={`Ver ficha de ${user.firstName} ${user.lastName} en Personas`}
                                className="text-xs font-bold text-[#0e7c86] hover:text-[#0a5961] inline-flex items-center gap-1 py-1.5 px-2 min-h-[36px] rounded-lg hover:bg-[#d9f7f8]/50 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Ficha</span>
                              </Link>
                            ) : (
                              <span className="text-xs text-[#4a4f57] italic">Sin ficha</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {user.roles.length === 0 ? (
                              <span className="text-xs font-bold text-rose-950 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-600">
                                Sin roles asignados
                              </span>
                            ) : (
                              user.roles.map((role) => (
                                <span
                                  key={role}
                                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border tracking-wide ${ROLE_BADGE_STYLES[role]}`}
                                >
                                  {ROLE_LABELS[role] || role}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedUserForPassword(user)}
                              aria-label={`Cambiar contraseña de ${user.firstName} ${user.lastName}`}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] transition-colors"
                              title="Cambiar contraseña de usuario"
                            >
                              <KeyRound className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                              <span>Cambiar contraseña</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedUserForRoles(user)}
                              aria-label={`Gestionar roles de ${user.firstName} ${user.lastName}`}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold text-[#0a5961] bg-[#d9f7f8] hover:bg-[#aaeif0] border border-[#0e7c86] transition-colors"
                              title="Gestionar roles"
                            >
                              <Shield className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                              <span>Gestionar roles</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
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

      {/* Modal de Cambiar Contraseña (Admin) */}
      <AdminResetPasswordModal
        isOpen={Boolean(selectedUserForPassword)}
        onClose={() => setSelectedUserForPassword(null)}
        user={selectedUserForPassword}
        onUpdatePassword={updateUserPassword}
        onSuccess={(msg) => {
          setGlobalBanner({
            type: 'success',
            message: `${msg} (${selectedUserForPassword?.email})`,
          });
          setTimeout(() => setGlobalBanner(null), 5000);
        }}
      />
    </div>
  );
};
