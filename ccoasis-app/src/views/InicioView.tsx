import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ROLE_LABELS } from '../types/persons';
import { CalendarDays, Shield } from 'lucide-react';
import {
  InicioUrgentAnnouncements,
  InicioNextEventCard,
  InicioNormalAnnouncements,
} from '../components/inicio';

export const InicioView: React.FC = () => {
  const { user, roles } = useAuth();
  const [displayName, setDisplayName] = useState<string>(user?.email || 'Bienvenido');
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [isLoadingPerson, setIsLoadingPerson] = useState<boolean>(true);

  // Fecha de hoy en formato amigable en español (ej: "Domingo, 8 de noviembre de 2026")
  const rawDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const todayFormatted = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    const loadPersonName = async () => {
      try {
        const { data, error } = await supabase
          .from('persons')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .maybeSingle();

        if (!isMounted) return;

        if (!error && data && data.first_name) {
          const fullName = `${data.first_name} ${data.last_name || ''}`.trim();
          setDisplayName(fullName);
          setIsLinked(true);
        } else {
          setDisplayName(user.email || 'Bienvenido');
          setIsLinked(false);
        }
      } catch (err) {
        console.warn('Nota al consultar ficha de persona para inicio:', err);
        if (isMounted) {
          setDisplayName(user.email || 'Bienvenido');
        }
      } finally {
        if (isMounted) {
          setIsLoadingPerson(false);
        }
      }
    };

    loadPersonName();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* 1. Cabecera de bienvenida con degradado Oasis */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#4a4f57] bg-white border border-[#d4d7dc] px-3 py-1.5 rounded-full shadow-xs">
            <CalendarDays className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
            <span>{todayFormatted}</span>
          </div>

          {/* Roles del usuario */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#4a4f57]" aria-hidden="true" />
            <span className="text-xs text-[#4a4f57] font-medium mr-1">Tus roles:</span>
            {roles.map((r) => (
              <span
                key={r}
                className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]/30"
              >
                {ROLE_LABELS[r] || r}
              </span>
            ))}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight oasis-text-gradient">
          ¡Hola, {isLoadingPerson ? '...' : displayName}!
        </h1>
        <p className="text-sm text-[#4a4f57]">
          {isLinked
            ? 'Bienvenido a tu portal personal en el Centro Cristiano Oasis.'
            : `Sesión iniciada con ${user?.email}.`}
        </p>
      </header>

      {/* 2. Avisos urgentes o importantes (orden móvil: arriba del todo, máx 3) */}
      <InicioUrgentAnnouncements />

      {/* 3. Próximo evento con confirmación de asistencia */}
      <InicioNextEventCard />

      {/* 4. Avisos normales de la congregación (orden móvil: abajo, máx 3) */}
      <InicioNormalAnnouncements />
    </div>
  );
};
