import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Calendar,
  User,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useStudentClasses } from '../lib/useStudentClasses';
import { CYCLE_STATUS_OPTIONS, CYCLE_STATUS_COLORS } from '../types/courses';
import { ENROLLMENT_STATUS_OPTIONS, ENROLLMENT_STATUS_COLORS, EnrollmentStatus } from '../types/classroom';
import { useAnnouncements } from '../lib/useAnnouncements';
import { AnnouncementsBanner } from '../components/announcements/AnnouncementsBanner';

type MisClasesTab = 'activos' | 'historial';

export const MisClasesView: React.FC = () => {
  const navigate = useNavigate();
  const { activeAnnouncements } = useAnnouncements();
  const [activeTab, setActiveTab] = useState<MisClasesTab>('activos');
  const {
    cycles,
    personName,
    isLinkedPerson,
    isLoading,
    error,
    refresh,
  } = useStudentClasses();

  const isCycleFinished = (item: (typeof cycles)[0]) =>
    item.cycle.status === 'cerrado' || item.status === 'completado';

  const activeCycles = useMemo(
    () => cycles.filter((c) => !isCycleFinished(c)),
    [cycles]
  );

  const finishedCycles = useMemo(
    () => cycles.filter((c) => isCycleFinished(c)),
    [cycles]
  );

  const displayedCycles = activeTab === 'activos' ? activeCycles : finishedCycles;

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#0e7c86] animate-spin mb-3" />
        <p className="text-sm text-[#4a4f57] font-medium">Cargando tus ciclos formativos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 pb-24 md:pb-8">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[12px] bg-[#0e7c86] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[25px] leading-[1.2] font-extrabold oasis-text-gradient tracking-tight">
                Mis Clases
              </h1>
              <span className="text-xs bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] font-extrabold px-2.5 py-0.5 rounded-full">
                Portal Miembro / Alumno
              </span>
            </div>
            <p className="text-[14px] text-[#4a4f57] mt-0.5">
              {personName
                ? `Bienvenido/a, ${personName}. Consulta tus cursos, materiales y calificaciones.`
                : 'Portal de aprendizaje y seguimiento académico congregacional.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => refresh()}
          aria-label="Actualizar lista de clases"
          className="self-start sm:self-auto min-h-[44px] px-4 py-2 rounded-[12px] text-xs font-extrabold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] transition-colors flex items-center gap-2 shadow-2xs active:scale-95"
          title="Actualizar lista de clases"
        >
          <RefreshCw className="w-4 h-4 text-[#0e7c86]" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Banner de Anuncios Especiales Vigentes */}
      {activeAnnouncements.length > 0 && (
        <AnnouncementsBanner
          announcements={activeAnnouncements}
          isAdmin={false}
          onOpenCreate={() => {}}
          onOpenManager={() => {}}
          onOpenEdit={() => {}}
        />
      )}

      {/* Alerta de error si ocurrió alguno */}
      {error && (
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Error al cargar información</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Caso: Usuario no vinculado a ficha de persona */}
      {isLinkedPerson === false && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-300">
            <User className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-[#1a1a1a] text-base sm:text-lg">
            Cuenta pendiente de vincular
          </h3>
          <p className="text-xs sm:text-sm text-[#4a4f57] max-w-md mx-auto leading-relaxed">
            Tu cuenta de usuario aún no ha sido enlazada con tu ficha de miembro o alumno en el sistema.
            Por favor, solicita al pastor o al administrador que vincule tu correo electrónico desde el módulo de Personas.
          </p>
        </div>
      )}

      {/* Caso: Usuario vinculado pero sin ciclos inscritos */}
      {isLinkedPerson === true && cycles.length === 0 && !error && (
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#d9f7f8] text-[#0e7c86] border border-[#0e7c86]/30 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-[#1a1a1a] text-base sm:text-lg">
            No estás inscrito en ningún ciclo formativo
          </h3>
          <p className="text-xs sm:text-sm text-[#4a4f57] max-w-md mx-auto leading-relaxed">
            Actualmente no figuras como alumno en ciclos activos. Cuando el maestro o administrador te inscriba en un curso de discipulado o formación bíblica, aparecerá disponible aquí.
          </p>
        </div>
      )}

      {/* Selector de pestañas: En Curso / Activos vs Finalizados / Historial */}
      {isLinkedPerson === true && cycles.length > 0 && (
        <div className="border-b border-[#d4d7dc]">
          <nav className="flex gap-2 overflow-x-auto pb-0.5" aria-label="Pestañas de Mis Clases">
            <button
              onClick={() => setActiveTab('activos')}
              className={`min-h-[44px] py-2.5 px-4 border-b-[3px] text-xs sm:text-sm flex items-center gap-2 rounded-t-xl whitespace-nowrap transition-colors ${
                activeTab === 'activos'
                  ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
                  : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>En Curso / Activos</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                  activeTab === 'activos'
                    ? 'bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]'
                    : 'bg-[#eef0f3] text-[#4a4f57]'
                }`}
              >
                {activeCycles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('historial')}
              className={`min-h-[44px] py-2.5 px-4 border-b-[3px] text-xs sm:text-sm flex items-center gap-2 rounded-t-xl whitespace-nowrap transition-colors ${
                activeTab === 'historial'
                  ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
                  : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Finalizados / Historial</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                  activeTab === 'historial'
                    ? 'bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]'
                    : 'bg-[#eef0f3] text-[#4a4f57]'
                }`}
              >
                {finishedCycles.length}
              </span>
            </button>
          </nav>
        </div>
      )}

      {/* Estado vacío por pestaña cuando hay ciclos pero ninguno en la pestaña activa */}
      {isLinkedPerson === true && cycles.length > 0 && displayedCycles.length === 0 && (
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-8 text-center space-y-3 shadow-xs">
          {activeTab === 'activos' ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#d9f7f8] text-[#0e7c86] flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#1a1a1a] text-base sm:text-lg">
                No tienes ciclos en curso actualmente
              </h3>
              <p className="text-xs sm:text-sm text-[#4a4f57] max-w-md mx-auto leading-relaxed">
                {finishedCycles.length > 0
                  ? 'Todos tus ciclos formativos han concluido o han sido completados. Puedes consultar tus notas y entregas en la pestaña de Historial.'
                  : 'Cuando el maestro o administrador te inscriba en un nuevo ciclo, aparecerá disponible aquí.'}
              </p>
              {finishedCycles.length > 0 && (
                <button
                  onClick={() => setActiveTab('historial')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] hover:bg-[#c2f0f2] rounded-xl text-xs font-extrabold transition-colors"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Ver ciclos finalizados ({finishedCycles.length})</span>
                </button>
              )}
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#4a4f57] flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-[#1a1a1a] text-base sm:text-lg">
                Sin ciclos en el historial todavía
              </h3>
              <p className="text-xs sm:text-sm text-[#4a4f57] max-w-md mx-auto leading-relaxed">
                Los ciclos que concluyan normalmente con estado cerrado o con tu formación completada se archivarán aquí para que puedas consultar tus notas y certificados pasados.
              </p>
              {activeCycles.length > 0 && (
                <button
                  onClick={() => setActiveTab('activos')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] hover:bg-[#c2f0f2] rounded-xl text-xs font-extrabold transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Ver mis clases activas ({activeCycles.length})</span>
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Listado de Tarjetas de Ciclos Inscritos (Mobile-First) */}
      {displayedCycles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedCycles.map((item) => {
            const { cycle, academicSummary, status: enrollStatus } = item;
            const isFinished = isCycleFinished(item);

            const cycleStatusLabel =
              CYCLE_STATUS_OPTIONS.find((s) => s.value === cycle.status)?.label ||
              cycle.status;
            const cycleStatusClass =
              CYCLE_STATUS_COLORS[cycle.status] ||
              'bg-slate-100 text-slate-800 border-slate-400';

            const enrollStatusLabel =
              ENROLLMENT_STATUS_OPTIONS.find((e) => e.value === enrollStatus)?.label ||
              enrollStatus;
            const enrollStatusClass =
              ENROLLMENT_STATUS_COLORS[enrollStatus as EnrollmentStatus] ||
              'bg-emerald-100 text-emerald-950 border-emerald-600';

            const avgGrade = academicSummary ? academicSummary.average_grade : 0;
            const attPct = academicSummary ? academicSummary.attendance_percentage : 100;
            const passed = academicSummary ? academicSummary.passed : false;

            return (
              <div
                key={item.enrollment_id}
                onClick={() => navigate(`/mis-clases/ciclo/${cycle.id}`)}
                className={`group cursor-pointer bg-white rounded-3xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 active:scale-[0.99] ${
                  isFinished
                    ? 'border-[#d4d7dc] hover:border-[#858a93]'
                    : 'border-[#d4d7dc] hover:border-[#0e7c86]'
                }`}
              >
                {/* Cabecera de la tarjeta: Título del curso y estados */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-[#0e7c86] uppercase tracking-wider flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {cycle.course?.title || 'Curso'}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${cycleStatusClass}`}
                      >
                        {cycleStatusLabel}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${enrollStatusClass}`}
                      >
                        {enrollStatusLabel}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-[#1a1a1a] text-lg group-hover:text-[#0e7c86] transition-colors leading-tight">
                    {cycle.name}
                  </h3>

                  {cycle.course?.description && (
                    <p className="text-xs text-[#4a4f57] line-clamp-2 leading-relaxed">
                      {cycle.course.description}
                    </p>
                  )}
                </div>

                {/* Metadatos: Maestro y Fechas */}
                <div className="pt-3 border-t border-[#e5e7eb] grid grid-cols-2 gap-2 text-xs text-[#4a4f57]">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0" />
                    <span className="truncate font-semibold text-[#1a1a1a]">
                      {cycle.teacher
                        ? `${cycle.teacher.first_name} ${cycle.teacher.last_name}`
                        : 'Maestro asignado'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-right justify-end truncate">
                    <Calendar className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0" />
                    <span className="truncate">
                      {new Date(cycle.start_date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Resumen rápido de avance (Asistencia, Nota Media y Aprobación) */}
                <div className="p-3.5 bg-[#f5f5f5] rounded-2xl border border-[#e5e7eb] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3.5">
                    {/* Nota Media */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-[#4a4f57] uppercase block">
                        Nota Media
                      </span>
                      <span className="font-extrabold text-[#1a1a1a] text-sm">
                        {avgGrade.toFixed(1)} / 100
                      </span>
                    </div>

                    <div className="w-px h-7 bg-[#d4d7dc]" />

                    {/* Asistencia */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-[#4a4f57] uppercase block">
                        Asistencia
                      </span>
                      <span className="font-extrabold text-[#1a1a1a] text-sm">
                        {attPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Indicador de resultado */}
                  <div className="flex items-center gap-2">
                    {passed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0a5961] bg-[#d9f7f8] border border-[#0e7c86] px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprobado</span>
                      </span>
                    ) : isFinished ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-800 bg-slate-200 border border-slate-400 px-2.5 py-0.5 rounded-full">
                        <span>Finalizado</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-950 bg-emerald-100 border border-emerald-600 px-2.5 py-0.5 rounded-full">
                        <span>En curso</span>
                      </span>
                    )}

                    <ChevronRight className="w-4 h-4 text-[#4a4f57] group-hover:text-[#0e7c86] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
