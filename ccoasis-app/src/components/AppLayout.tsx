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
  admin: 'bg-magenta-100 text-magenta-800 border-magenta-600',
  tesorero: 'bg-emerald-100 text-emerald-800 border-emerald-600',
  maestro: 'bg-amber-100 text-amber-800 border-amber-600',
  alumno: 'bg-blue-100 text-blue-800 border-blue-600',
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
      <div className="min-h-screen bg-app-bg flex flex-col md:flex-row pb-20 md:pb-0">
        {/* Sidebar para pantallas medianas y grandes (PC) */}
        <aside className="hidden md:flex md:w-64 md:flex-col bg-brand-magenta border-r border-slate-200 flex-shrink-0 min-h-screen">
          {/* Cabecera superior cian (#23d5da) con texto oscuro (#1a1a1a, ratio 9.62:1) */}
          <div className="bg-brand-cyan text-ink on-cyan p-4 border-b border-black/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl px-2.5 py-1.5 shadow-2xs flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="Centro Cristiano Oasis" className="h-9 w-auto object-contain" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-ink text-sm block leading-tight">CC Oasis</span>
                <p className="text-xs font-semibold text-ink">Gestión Eclesial</p>
              </div>
            </div>

            {/* Tarjeta blanca redondeada del usuario autenticado sobre la cabecera cian */}
            <div className="p-3 bg-white rounded-2xl border border-black/10 shadow-2xs space-y-2.5 text-ink">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <UserIcon className="w-4 h-4 text-ink-muted flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs text-ink font-semibold truncate" title={user?.email}>
                    {user?.email}
                  </span>
                </div>
                <NotificationsBell />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <span
                    key={r}
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      ROLE_COLORS[r] || 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    {ROLE_LABELS[r] || r}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsSelfPasswordModalOpen(true)}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-ink bg-slate-50 hover:bg-slate-100 border border-control transition-colors"
                title="Cambiar mi contraseña"
              >
                <KeyRound className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                <span>Cambiar mi contraseña</span>
              </button>
            </div>
          </div>

          {/* Barra de navegación / menú con fondo magenta (#ae4a84) y texto/iconos blancos (#ffffff, 5.11:1) */}
          <nav
            aria-label="Menú principal"
            className="on-magenta flex-1 px-3 py-4 space-y-1.5 bg-brand-magenta text-white"
          >
            <div className="px-3 py-1.5 text-[11px] font-bold text-white uppercase tracking-wider">
              Módulos autorizados
            </div>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    `min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm transition-colors ${
                      isActive
                        ? 'bg-white text-ink font-extrabold shadow-sm'
                        : 'text-white font-semibold hover:bg-magenta-700'
                    }`
                  }
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Botón de Cerrar Sesión dentro de la barra magenta */}
          <div className="on-magenta p-3 border-t border-white/20 bg-brand-magenta">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-white hover:bg-magenta-700 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* Header móvil: fondo cian (#23d5da) con logo y texto oscuro (#1a1a1a, ratio 9.62:1) */}
        <header className="md:hidden bg-brand-cyan text-ink on-cyan border-b border-black/10 sticky top-0 z-30 px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-white rounded-xl px-2 py-1 shadow-2xs flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="Centro Cristiano Oasis" className="h-8 w-auto object-contain" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-ink text-sm block leading-tight truncate">
                CC Oasis
              </span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {roles.map((r) => (
                  <span
                    key={r}
                    className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white text-ink border border-black/15"
                  >
                    {ROLE_LABELS[r] || r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsSelfPasswordModalOpen(true)}
              title="Cambiar mi contraseña"
              aria-label="Cambiar mi contraseña"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold text-ink hover:bg-black/10 transition-colors"
            >
              <KeyRound className="w-5 h-5 text-ink" aria-hidden="true" />
              <span className="hidden sm:inline">Clave</span>
            </button>
            <NotificationsBell />
            <button
              type="button"
              onClick={handleSignOut}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold text-ink hover:bg-black/10 transition-colors"
            >
              <LogOut className="w-5 h-5 text-ink" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
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
              className="fixed bottom-0 left-0 right-0 z-50 bg-app-bg rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[85vh] flex flex-col animate-slide-up overflow-hidden pb-6"
            >
              {/* Cabecera con degradado exclusivo para título grande en negrita blanca (>= 24px) */}
              <div className="oasis-title-gradient on-magenta px-5 pt-3 pb-4 flex-shrink-0">
                <div className="w-12 h-1.5 bg-white/50 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-extrabold text-white leading-tight">
                    Más módulos
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center rounded-xl text-white hover:bg-white/20 transition-colors"
                    aria-label="Cerrar menú de más módulos"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Lista de módulos secundarios en tarjetas blancas con esquinas muy redondeadas sobre #f5f5f5 */}
              <div className="overflow-y-auto px-4 py-4 space-y-3 max-h-[60vh]">
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
                      className={`w-full min-h-[64px] flex items-center gap-3.5 p-4 rounded-3xl border text-left transition-all ${
                        isActive
                          ? 'bg-white border-2 border-primary text-ink shadow-sm ring-2 ring-primary/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-ink hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isActive
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-primary-soft text-primary-ink'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" aria-hidden="true" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-ink leading-snug">
                            {item.label}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-magenta text-white px-2.5 py-0.5 rounded-full">
                              Activo
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-ink-muted mt-0.5 line-clamp-1 leading-normal">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <ChevronRight
                        className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-ink-muted'}`}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Barra de navegación inferior móvil fija (Bottom Nav): fondo magenta (#ae4a84) con texto e iconos blancos (#ffffff, 5.11:1) */}
        <nav
          aria-label="Navegación móvil inferior"
          className="md:hidden on-magenta fixed bottom-0 left-0 right-0 bg-brand-magenta text-white border-t border-white/20 z-30 shadow-lg"
        >
          <div className="flex items-center justify-around px-1.5 py-1.5 max-w-lg mx-auto gap-1">
            {barItems.map((item) => {
              const IconComponent = item.icon;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => {
                    const active = isActive || isPathActive(item.path);
                    return `min-h-[48px] min-w-[44px] flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl text-xs transition-colors flex-1 ${
                      active
                        ? 'bg-white text-ink font-extrabold shadow-xs'
                        : 'text-white hover:bg-magenta-700 font-semibold'
                    }`;
                  }}
                >
                  <IconComponent className="w-5 h-5 mb-0.5 flex-shrink-0" aria-hidden="true" />
                  <span className="text-[11px] leading-tight truncate max-w-full text-center">
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
                className={`min-h-[48px] min-w-[44px] flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl text-xs transition-colors flex-1 ${
                  isMoreActive || isMoreMenuOpen
                    ? 'bg-white text-ink font-extrabold shadow-xs'
                    : 'text-white hover:bg-magenta-700 font-semibold'
                }`}
              >
                <div className="relative">
                  <MoreHorizontal className="w-5 h-5 mb-0.5 flex-shrink-0" aria-hidden="true" />
                  {isMoreActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-white"
                    />
                  )}
                </div>
                <span className="text-[11px] leading-tight truncate max-w-full text-center">
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
