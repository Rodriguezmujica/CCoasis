import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../types/persons';
import { CalendarDays, Shield } from 'lucide-react';
import {
  InicioUrgentAnnouncements,
  InicioNextEventCard,
  InicioMyShiftsCard,
  InicioAdminSection,
  InicioTeacherSection,
  InicioStudentSection,
  InicioTreasurySection,
  InicioNormalAnnouncements,
} from '../components/inicio';
import { useInicioDashboard } from '../lib/useInicioDashboard';

type RoleSectionId = 'all' | 'admin' | 'maestro' | 'alumno' | 'tesoreria';

export const InicioView: React.FC = () => {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const isTesorero = roles.includes('tesorero');
  const isMaestro = roles.includes('maestro');
  const isAlumno = roles.includes('alumno');
  const canViewTreasury = isAdmin || isTesorero;

  const [selectedSection, setSelectedSection] = useState<RoleSectionId>('all');

  // Secciones de rol visibles para este usuario (sin duplicados: admin + tesorero ve Tesorería una sola vez)
  const visibleRoleSections = useMemo(() => {
    const sections: { id: Exclude<RoleSectionId, 'all'>; label: string }[] = [];
    if (isAdmin) sections.push({ id: 'admin', label: 'Administración' });
    if (isMaestro) sections.push({ id: 'maestro', label: 'Maestro' });
    if (isAlumno) sections.push({ id: 'alumno', label: 'Alumno' });
    if (canViewTreasury) sections.push({ id: 'tesoreria', label: 'Tesorería' });
    return sections;
  }, [isAdmin, isMaestro, isAlumno, canViewTreasury]);

  const hasMultipleRoleSections = visibleRoleSections.length >= 2;
  const activeFilter: RoleSectionId =
    selectedSection === 'all' || visibleRoleSections.some((s) => s.id === selectedSection)
      ? selectedSection
      : 'all';

  const showAdminSection = isAdmin && (activeFilter === 'all' || activeFilter === 'admin');
  const showTeacherSection = isMaestro && (activeFilter === 'all' || activeFilter === 'maestro');
  const showStudentSection = isAlumno && (activeFilter === 'all' || activeFilter === 'alumno');
  const showTreasurySection =
    canViewTreasury && (activeFilter === 'all' || activeFilter === 'tesoreria');

  // Fecha de hoy en formato amigable en español (ej: "Domingo, 8 de noviembre de 2026")
  const rawDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const todayFormatted = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  // Hook ligero del dashboard: consultas independientes con .limit()
  const {
    personName,
    isPersonLinked,
    isLoadingPerson,
    shifts: shiftsState,
    nextClass: nextClassState,
    pendingAssignments: pendingAssignmentsState,
    recentGrades: recentGradesState,
    teacherNextClass: teacherNextClassState,
    teacherPendingAttendance: teacherPendingAttendanceState,
    teacherPendingSubmissions: teacherPendingSubmissionsState,
    adminUnassignedEvents: adminUnassignedEventsState,
    adminExpiringAnnouncements: adminExpiringAnnouncementsState,
    adminNextEventRSVPs: adminNextEventRSVPsState,
  } = useInicioDashboard({ isAlumno, isMaestro, isAdmin });

  const displayName = personName || user?.email || 'Bienvenido';
  const isLinked = isPersonLinked === true;

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

      {/* 4. Mis turnos (para cualquier rol con ficha vinculada, máx 3) */}
      <InicioMyShiftsCard
        shifts={shiftsState.shifts}
        isLoading={shiftsState.isLoading}
        error={shiftsState.error}
        isPersonLinked={isPersonLinked}
        onRetry={shiftsState.refetch}
      />

      {/* Selector de chips por rol (solo visible si el usuario tiene 2 o más secciones de rol visibles) */}
      {hasMultipleRoleSections && (
        <div
          role="group"
          aria-label="Filtrar paneles por sección de rol"
          className="flex items-center gap-2 overflow-x-auto scrollbar-none touch-scroll py-1.5 px-1 -mx-1"
        >
          <button
            type="button"
            onClick={() => setSelectedSection('all')}
            aria-pressed={activeFilter === 'all'}
            className={`min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-colors whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center focus-oasis cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#0e7c86] text-white border-[#0e7c86] shadow-2xs'
                : 'bg-white text-[#1a1a1a] border-[#767b83] hover:bg-[#ebedef]'
            }`}
          >
            Todo
          </button>

          {visibleRoleSections.map((sec) => {
            const isSelected = activeFilter === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSection(sec.id)}
                aria-pressed={isSelected}
                className={`min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-colors whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center focus-oasis cursor-pointer ${
                  isSelected
                    ? 'bg-[#0e7c86] text-white border-[#0e7c86] shadow-2xs'
                    : 'bg-white text-[#1a1a1a] border-[#767b83] hover:bg-[#ebedef]'
                }`}
              >
                {sec.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 5. Tarjetas de su rol (apiladas con su título de sección por rol, sin pestañas y sin duplicados) */}
      {showAdminSection && (
        <InicioAdminSection
          unassignedEventsState={adminUnassignedEventsState}
          expiringAnnouncementsState={adminExpiringAnnouncementsState}
          nextEventRSVPsState={adminNextEventRSVPsState}
        />
      )}

      {showTeacherSection && (
        <InicioTeacherSection
          isPersonLinked={isPersonLinked}
          teacherNextClassState={teacherNextClassState}
          teacherPendingAttendanceState={teacherPendingAttendanceState}
          teacherPendingSubmissionsState={teacherPendingSubmissionsState}
        />
      )}

      {showStudentSection && (
        <InicioStudentSection
          isPersonLinked={isPersonLinked}
          nextClassState={nextClassState}
          pendingAssignmentsState={pendingAssignmentsState}
          recentGradesState={recentGradesState}
        />
      )}

      {showTreasurySection && <InicioTreasurySection />}

      {/* 6. Avisos normales de la congregación (orden móvil: más abajo, máx 3) */}
      <InicioNormalAnnouncements />
    </div>
  );
};
