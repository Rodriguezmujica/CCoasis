import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAvailableNavItems, getMobileNavItems } from '../config/navigation';
import { ROLE_LABELS } from '../types/persons';
import {
  LogOut,
  User as UserIcon,
  KeyRound,
  MoreHorizontal,
  X,
  ChevronRight,
} from 'lucide-react';
import { NotificationsBell } from './notifications/NotificationsBell';
import { NotificationsProvider } from '../context/NotificationsContext';
import { SelfChangePasswordModal } from './SelfChangePasswordModal';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  tesorero: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  maestro: 'bg-amber-100 text-amber-700 border-amber-200',
  alumno: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const AppLayout: React.FC = () => {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSelfPasswordModalOpen, setIsSelfPasswordModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Navegación para escritorio (todos los módulos permitidos)
  const navItems = getAvailableNavItems(roles);

  // Navegación para móvil (particionada si hay más de 4 módulos)
  const { barItems, moreItems, hasMore } = getMobileNavItems(roles);

  // Comprueba si una ruta está activa (incluyendo subrutas)
  const isPathActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Si el usuario se encuentra actualmente en alguna de las rutas de "Más", resaltar activo
  const isMoreActive = hasMore && moreItems.some((item) => isPathActive(item.path));

  // Cerrar el menú "Más" al cambiar de ruta
  useEffect(() => {
    setIsMoreMenuOpen(false);
  }, [location.pathname]);

  // Cerrar el menú "Más" al pulsar Escape
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoreMenuOpen]);

  // Evitar scroll del fondo mientras el Bottom Sheet esté abierto
  useEffect(() => {
    if (isMoreMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMoreMenuOpen]);

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
          <div className="flex flex-wrap gap-1.5 mb-2.5">
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
          <button
            onClick={() => setIsSelfPasswordModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 hover:text-blue-600 border border-slate-200 transition-colors shadow-2xs"
            title="Cambiar mi contraseña"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Cambiar mi contraseña</span>
          </button>
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
          <button
            onClick={() => setIsSelfPasswordModalOpen(true)}
            title="Cambiar mi contraseña"
            aria-label="Cambiar mi contraseña"
            className="flex items-center gap-1 p-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 border border-slate-200 transition-colors"
          >
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Clave</span>
          </button>
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

      {/* Modal de cambio de contraseña propio */}
      <SelfChangePasswordModal
        isOpen={isSelfPasswordModalOpen}
        onClose={() => setIsSelfPasswordModalOpen(false)}
      />

      {/* Modal / Bottom Sheet "Más" */}
      {hasMore && isMoreMenuOpen && (
        <div className="md:hidden">
          {/* Fondo semitransparente oscuro (cerrar al tocar fuera) */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 animate-fade-in"
            onClick={() => setIsMoreMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Panel inferior (Bottom Sheet) */}
          <div
            id="mobile-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Más módulos de navegación"
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 max-h-[85vh] flex flex-col animate-slide-up pb-6"
          >
            {/* Tirador táctil superior */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

            {/* Cabecera del panel */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900">Más módulos</h2>
                <p className="text-xs text-slate-500">Selecciona una sección para acceder</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-2 -mr-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Cerrar menú de más módulos"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de módulos secundarios en tarjetas grandes táctiles */}
            <div className="overflow-y-auto px-4 py-3 space-y-2.5 max-h-[60vh]">
              {moreItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = isPathActive(item.path);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-blue-50/90 border-blue-300 text-blue-900 shadow-xs ring-1 ring-blue-400'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 active:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base leading-snug ${
                            isActive ? 'font-bold text-blue-950' : 'font-semibold text-slate-900'
                          }`}
                        >
                          {item.label}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            Activo
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 leading-normal">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <ChevronRight
                      className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-slate-400'}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Barra de navegación inferior móvil fija (Bottom Nav) */}
      <nav
        aria-label="Navegación móvil inferior"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 shadow-lg"
      >
        <div className="flex items-center justify-around px-1 py-1.5 max-w-lg mx-auto">
          {barItems.map((item) => {
            const IconComponent = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => {
                  const active = isActive || isPathActive(item.path);
                  return `flex flex-col items-center justify-center py-1 px-1 rounded-lg text-xs transition-colors flex-1 min-w-0 ${
                    active
                      ? 'text-blue-600 font-bold'
                      : 'text-slate-500 hover:text-slate-900 font-medium'
                  }`;
                }}
              >
                <IconComponent className="w-5 h-5 mb-0.5 flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px] leading-tight truncate max-w-full text-center">
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {hasMore && (
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              aria-expanded={isMoreMenuOpen}
              aria-controls="mobile-more-sheet"
              aria-label="Más módulos y opciones"
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg text-xs transition-colors flex-1 min-w-0 ${
                isMoreActive || isMoreMenuOpen
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <MoreHorizontal className="w-5 h-5 mb-0.5 flex-shrink-0" />
                {isMoreActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-1 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"
                  />
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] leading-tight truncate max-w-full text-center">
                Más
              </span>
            </button>
          )}
        </div>
      </nav>
    </div>
  </NotificationsProvider>
);
};
