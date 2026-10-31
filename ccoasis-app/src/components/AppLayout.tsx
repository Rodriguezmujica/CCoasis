import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  admin: 'bg-[#f6e6ef] text-[#7a2f5a]',
  tesorero: 'bg-[#e3f5e9] text-[#14532d]',
  maestro: 'bg-[#fdf3d6] text-[#713f12]',
  alumno: 'bg-[#d9f7f8] text-[#0a5961]',
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

  const primaryRoleLabel =
    roles.length > 0 ? roles.map((r) => ROLE_LABELS[r] || r).join(', ') : 'Usuario';
  const mainRoleLabel = roles.includes('admin')
    ? 'Administrador'
    : roles.includes('tesorero')
    ? 'Tesorero'
    : roles.includes('maestro')
    ? 'Maestro'
    : roles[0]
    ? ROLE_LABELS[roles[0]] || roles[0]
    : 'Usuario';

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col md:grid md:grid-cols-[256px_minmax(0,1fr)] pb-20 md:pb-0">
        {/* Sidebar izquierdo en escritorio (256px fijos, fondo blanco como en la maqueta) */}
        <aside className="hidden md:flex md:flex-col md:w-[256px] md:max-w-[256px] min-w-0 bg-white border-r border-[#d4d7dc] min-h-screen">
          {/* a) Parte superior cian (#23d5da) con el logo /logo.png grande dentro de tarjeta blanca redondeada */}
          <div className="on-cyan bg-[#23d5da] text-[#1a1a1a] px-4 py-3.5 flex flex-col items-start gap-1.5">
            <Link
              to="/calendario"
              aria-label="Ir al inicio - Calendario"
              className="inline-block rounded-[10px]"
            >
              <img
                src="/logo.png"
                alt="Centro Cristiano Oasis"
                className="w-[164px] h-auto bg-white rounded-[10px] px-2.5 py-1.5 object-contain block"
              />
            </Link>
            <span className="text-xs font-bold text-[#1a1a1a]">Gestión Eclesial</span>
          </div>

          {/* b) Franja horizontal magenta (#ae4a84) con texto en blanco en mayúsculas */}
          <div className="on-magenta bg-[#ae4a84] text-white px-4 py-[7px] text-xs font-semibold flex items-center justify-between gap-2 min-w-0">
            <span className="uppercase tracking-wider font-bold whitespace-nowrap">
              GESTIÓN ECLESIAL
            </span>
            <span className="truncate text-[11px] font-medium" title={primaryRoleLabel}>
              {mainRoleLabel}
            </span>
          </div>

          {/* c) Tarjeta del usuario dentro del sidebar blanco (encuadre estricto dentro de los 256px) */}
          <div className="m-3 p-3 bg-[#f5f5f5] border border-[#d4d7dc] rounded-[12px] flex flex-col gap-2.5 min-w-0">
            <div className="flex items-center justify-between gap-1.5 text-xs font-medium min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <UserIcon className="w-4 h-4 text-[#4a4f57] flex-shrink-0" aria-hidden="true" />
                <span className="truncate text-[#1a1a1a] block min-w-0" title={user?.email}>
                  {user?.email}
                </span>
              </div>
              <div className="flex-shrink-0 -mr-1">
                <NotificationsBell />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 min-w-0">
              {roles.map((r) => (
                <span
                  key={r}
                  className={`inline-block text-[11px] font-semibold px-2.5 py-[3px] rounded-full max-w-full truncate ${
                    ROLE_COLORS[r] || 'bg-[#ebedef] text-[#1a1a1a]'
                  }`}
                >
                  {ROLE_LABELS[r] || r}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsSelfPasswordModalOpen(true)}
              className="w-full min-h-[44px] px-2.5 rounded-[10px] bg-white border border-[#767b83] hover:bg-[#ebedef] text-[#1a1a1a] text-[13px] font-semibold inline-flex items-center justify-center gap-2 transition-colors min-w-0"
            >
              <KeyRound className="w-4 h-4 text-[#1a1a1a] flex-shrink-0" aria-hidden="true" />
              <span className="truncate">Cambiar mi contraseña</span>
            </button>
          </div>

          {/* d) Lista de módulos sobre fondo blanco */}
          <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#4a4f57]">
            Módulos autorizados
          </div>
          <nav
            aria-label="Módulos"
            className="px-3 py-1 flex flex-col gap-1 flex-1 bg-white min-w-0"
          >
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    `min-h-[44px] px-3 rounded-[10px] text-sm flex items-center gap-3 border-l-4 transition-colors ${
                      isActive
                        ? 'bg-[#d9f7f8] text-[#0e7c86] font-bold border-l-[#0e7c86]'
                        : 'bg-white text-[#4a4f57] font-medium border-l-transparent hover:bg-[#ebedef] hover:text-[#1a1a1a]'
                    }`
                  }
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Pie del sidebar con botón Cerrar sesión sobre fondo blanco */}
          <div className="p-3 border-t border-[#d4d7dc] bg-white">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full min-h-[44px] px-3 rounded-[10px] text-sm font-medium text-[#4a4f57] hover:bg-[#ebedef] hover:text-[#1a1a1a] flex items-center gap-3 border-l-4 border-l-transparent transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* Cabecera superior móvil: cian (#23d5da) seguida de franja delgada magenta (#ae4a84) */}
        <div className="md:hidden sticky top-0 z-30">
          <header className="on-cyan bg-[#23d5da] text-[#1a1a1a] px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                to="/calendario"
                aria-label="Ir al inicio - Calendario"
                className="inline-flex rounded-[8px] flex-shrink-0"
              >
                <img
                  src="/logo.png"
                  alt="Centro Cristiano Oasis"
                  className="h-10 w-auto bg-white rounded-[8px] px-2 py-1 object-contain block"
                />
              </Link>
              <span className="text-xs font-semibold text-[#1a1a1a] truncate">
                Gestión Eclesial
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsSelfPasswordModalOpen(true)}
                title="Cambiar mi contraseña"
                aria-label="Cambiar mi contraseña"
                className="w-11 min-h-[44px] rounded-[10px] text-[#1a1a1a] hover:bg-black/10 inline-flex items-center justify-center transition-colors"
              >
                <KeyRound className="w-5 h-5" aria-hidden="true" />
              </button>
              <NotificationsBell />
              <button
                type="button"
                onClick={handleSignOut}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="w-11 min-h-[44px] rounded-[10px] text-[#1a1a1a] hover:bg-black/10 inline-flex items-center justify-center transition-colors"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Franja delgada magenta móvil */}
          <div className="on-magenta bg-[#ae4a84] text-white px-4 py-[7px] text-xs font-semibold flex items-center justify-between gap-2 min-w-0">
            <span className="truncate min-w-0">{user?.email}</span>
            <span className="flex-shrink-0" title={primaryRoleLabel}>
              Rol: {mainRoleLabel}
            </span>
          </div>
        </div>

        {/* Contenido principal */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Modal de cambio de contraseña propio */}
        <SelfChangePasswordModal
          isOpen={isSelfPasswordModalOpen}
          onClose={() => setIsSelfPasswordModalOpen(false)}
        />

        {/* Hoja móvil "Más módulos" (idéntica a la maqueta layout.html) */}
        {hasMore && isMoreMenuOpen && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 bottom-[64px] bg-[#1a1a1a]/55 z-40 flex items-end"
              onClick={() => setIsMoreMenuOpen(false)}
            >
              <div
                id="mobile-more-sheet"
                role="dialog"
                aria-modal="true"
                aria-label="Más módulos"
                className="bg-white w-full rounded-t-2xl p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.2)] grid gap-2 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <header className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold text-[#1a1a1a]">Más módulos</h2>
                  <button
                    type="button"
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="w-11 min-h-[44px] rounded-[10px] border border-[#767b83] bg-white text-[#4a4f57] hover:bg-[#ebedef] inline-flex items-center justify-center"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </header>

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
                      className={`flex items-center gap-3.5 min-h-[64px] px-3 py-2.5 border rounded-[12px] text-left transition-colors ${
                        isActive
                          ? 'bg-[#d9f7f8] border-[#0e7c86] text-[#0a5961]'
                          : 'bg-white border-[#d4d7dc] text-[#1a1a1a] hover:bg-[#ebedef]'
                      }`}
                    >
                      <span
                        className={`w-11 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                          isActive
                            ? 'bg-[#0e7c86] text-white'
                            : 'bg-[#ebedef] text-[#1a1a1a]'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <b className="block text-base font-bold text-[#1a1a1a]">{item.label}</b>
                        {item.description && (
                          <span className="block text-xs text-[#4a4f57] line-clamp-2">
                            {item.description}
                          </span>
                        )}
                      </span>
                      <ChevronRight
                        className="w-5 h-5 text-[#4a4f57] flex-shrink-0"
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Barra de navegación inferior móvil (fondo blanco con borde superior sutil e ítem activo en #0e7c86) */}
        <nav
          aria-label="Navegación móvil inferior"
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#d4d7dc] flex z-30 p-1 pb-[calc(4px+env(safe-area-inset-bottom))]"
        >
          {barItems.map((item) => {
            const IconComponent = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => {
                  const active = isActive || isPathActive(item.path);
                  return `flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-xs rounded-[10px] transition-colors ${
                    active
                      ? 'bg-[#d9f7f8] text-[#0e7c86] font-bold'
                      : 'text-[#4a4f57] font-medium hover:bg-[#ebedef]'
                  }`;
                }}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate max-w-full px-1">{item.label}</span>
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
              className={`flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-xs rounded-[10px] transition-colors ${
                isMoreActive || isMoreMenuOpen
                  ? 'bg-[#d9f7f8] text-[#0e7c86] font-bold'
                  : 'text-[#4a4f57] font-medium hover:bg-[#ebedef]'
              }`}
            >
              <MoreHorizontal className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>Más</span>
            </button>
          )}
        </nav>
      </div>
    </NotificationsProvider>
  );
};
