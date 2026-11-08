import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ROLE_LABELS } from '../types/persons';
import { CalendarDays, Sparkles, UserCheck, Shield } from 'lucide-react';

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
      {/* Cabecera de bienvenida con degradado Oasis */}
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

      {/* Tarjeta de preparación de la pantalla de inicio */}
      <section
        aria-label="Estado de la pantalla de inicio"
        className="bg-white rounded-[12px] border border-[#d4d7dc] p-6 sm:p-8 shadow-sm flex flex-col items-center text-center space-y-4"
      >
        <div
          className="w-14 h-14 rounded-2xl bg-[#d9f7f8] text-[#0e7c86] border border-[#0e7c86] flex items-center justify-center flex-shrink-0 shadow-xs"
          aria-hidden="true"
        >
          <Sparkles className="w-7 h-7" />
        </div>

        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-[#1a1a1a]">
            Estamos preparando tu inicio
          </h2>
          <p className="text-sm text-[#4a4f57] leading-relaxed">
            Muy pronto verás aquí un resumen personalizado con tus avisos importantes, el próximo culto con confirmación de asistencia, tus turnos asignados y el acceso a tus clases o tareas según tus roles en la congregación.
          </p>
        </div>

        <div className="pt-2 flex items-center gap-2 text-xs text-[#4a4f57]">
          <UserCheck className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
          <span>Fase 1 completada · Estructura base activa</span>
        </div>
      </section>
    </div>
  );
};
