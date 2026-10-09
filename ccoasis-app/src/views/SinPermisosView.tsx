import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultPathForRoles } from '../config/navigation';
import { ShieldAlert, AlertCircle, LogOut, ArrowRight, UserCheck } from 'lucide-react';

export const SinPermisosView: React.FC = () => {
  const { user, roles, error, isLoading, signOut } = useAuth();

  // Mientras loading sea true, muestra "Cargando..." y no redirijas
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 text-sm font-medium">Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario ni sesión activa, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const defaultPath = getDefaultPathForRoles(roles);
  const hasAuthorizedModules = roles.length > 0 && defaultPath !== '/sin-permisos';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 text-center">
        {/* Icono de estado */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            error
              ? 'bg-rose-50 text-rose-600'
              : 'bg-amber-50 text-amber-600'
          }`}
        >
          {error ? <AlertCircle className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">
          {error ? 'Error al consultar roles' : 'Sin permisos de acceso'}
        </h1>

        <div className="text-xs text-slate-500 mb-4 flex items-center justify-center gap-1.5">
          <UserCheck className="w-4 h-4 text-slate-400" />
          <span>Sesión iniciada como: <strong className="text-slate-700">{user.email}</strong></span>
        </div>

        {/* 5. Si la consulta de roles falla, guarda el error y muéstralo en /sin-permisos */}
        {error ? (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-left">
            <p className="text-xs font-semibold text-rose-800 mb-1">Detalle del error en la base de datos:</p>
            <p className="text-xs text-rose-700 font-mono break-all">{error}</p>
            <p className="text-[11px] text-rose-600 mt-2">
              Verifica los permisos de la tabla <code>user_roles</code> o las políticas RLS en Supabase.
            </p>
          </div>
        ) : roles.length === 0 ? (
          <p className="text-sm text-slate-600 mb-6">
            Tu cuenta no tiene roles asignados en el sistema (tabla <code>user_roles</code>).
            Contacta a un administrador para que active tus permisos correspondientes.
          </p>
        ) : (
          <div className="mb-6">
            <p className="text-sm text-slate-600 mb-3">
              Tus roles actuales ({roles.join(', ')}) no tienen permiso para acceder a la ruta solicitada.
            </p>
            {hasAuthorizedModules && (
              <Link
                to={defaultPath}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
              >
                <span>Ir a mi módulo asignado</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

        {/* Botón de Cerrar sesión (nunca redirige a "/") */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
