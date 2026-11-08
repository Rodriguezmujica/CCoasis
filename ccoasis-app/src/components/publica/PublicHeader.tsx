import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LayoutDashboard } from 'lucide-react';

interface PublicHeaderProps {
  hasSession: boolean;
  slogan: string;
}

const QUICK_LINKS = [
  { href: '#proximo-culto', label: 'Próximo culto' },
  { href: '#eventos', label: 'Eventos' },
  { href: '#horarios', label: 'Horarios' },
  { href: '#contacto', label: 'Contacto' },
  { href: '#instalar-app', label: 'Instalar App' },
];

export const PublicHeader: React.FC<PublicHeaderProps> = ({ hasSession, slogan }) => {
  const displaySlogan = slogan?.trim() || 'Oasis: un hogar de refugio';

  return (
    <header className="sticky top-0 z-30 shadow-sm">
      {/* Barra superior cian (#23d5da) con texto oscuro (#1a1a1a, 9.62:1) */}
      <div className="on-cyan bg-[#23d5da] text-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo e identidad */}
          <Link
            to="/bienvenida"
            aria-label="Centro Cristiano Oasis - Inicio de bienvenida"
            className="inline-flex items-center gap-2.5 min-w-0 rounded-[10px]"
          >
            <img
              src="/logo.png"
              alt="Logo Centro Cristiano Oasis"
              className="h-10 sm:h-11 w-auto bg-white rounded-[10px] px-2.5 py-1 object-contain flex-shrink-0 block"
            />
            <div className="min-w-0 leading-tight">
              <span className="block text-sm sm:text-base font-extrabold text-[#1a1a1a] truncate">
                Centro Cristiano Oasis
              </span>
              <span className="hidden sm:block text-xs font-semibold text-[#1a1a1a]">
                Madrid · Comunidad Cristiana
              </span>
            </div>
          </Link>

          {/* Acción derecha (altura >= 44px, contraste AA) */}
          <div className="flex-shrink-0">
            {hasSession ? (
              <Link
                to="/inicio"
                className="min-h-[44px] px-4 py-2 rounded-full bg-[#1a1a1a] hover:bg-[#303030] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>Ir a mi panel</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="min-h-[44px] px-4 py-2 rounded-full bg-[#1a1a1a] hover:bg-[#303030] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>Iniciar sesión</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Franja inferior magenta (#ae4a84) con texto blanco (#ffffff, 5.11:1) */}
      <div className="on-magenta bg-[#ae4a84] text-white">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
          <p className="text-xs sm:text-sm font-bold tracking-wide text-white truncate">
            {displaySlogan}
          </p>

          <nav
            aria-label="Secciones de la página de bienvenida"
            className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none -mx-1 px-1"
          >
            {QUICK_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="min-h-[44px] px-2.5 inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-white hover:bg-[#8f3b6b] rounded-[8px] whitespace-nowrap transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
