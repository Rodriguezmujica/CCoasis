import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAvailableNavItems } from '../config/navigation';
import { ROLE_LABELS } from '../types/persons';
import { LogOut, User as UserIcon } from 'lucide-react';
import { NotificationsBell } from './notifications/NotificationsBell';
import { NotificationsProvider } from '../context/NotificationsContext';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  tesorero: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  maestro: 'bg-amber-100 text-amber-700 border-amber-200',
  alumno: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const AppLayout: React.FC = () => {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const navItems = getAvailableNavItems(roles);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Sidebar para pantallas medianas y grandes (PC) */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-slate-200 flex-shrink-0 min-h-screen">
        {/* Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">CC Oasis</h1>
            <p className="text-xs text-slate-500">Gestión Eclesial</p>
          </div>
        </div>

        {/* Perfil del usuario autenticado */}
        <div className="p-4 mx-3 my-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <UserIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="text-xs text-slate-700 font-medium truncate" title={user?.email}>
                {user?.email}
              </span>
            </div>
            <NotificationsBell />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <span
                key={r}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  ROLE_COLORS[r] || 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {ROLE_LABELS[r] || r}
              </span>
            ))}
          </div>
        </div>

        {/* Menú de navegación según roles */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Módulos autorizados
          </div>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Botón de Cerrar Sesión */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Header móvil */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm block leading-tight">CC Oasis</span>
            <div className="flex flex-wrap gap-1">
              {roles.map((r) => (
                <span
                  key={r}
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    ROLE_COLORS[r] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {ROLE_LABELS[r] || r}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <NotificationsBell />
          <button
            onClick={handleSignOut}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Barra de navegación inferior móvil (Bottom Nav) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 px-2 py-1.5 flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs transition-colors flex-1 ${
                  isActive
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`
              }
            >
              <IconComponent className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] leading-none truncate max-w-[70px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  </NotificationsProvider>
);
};
