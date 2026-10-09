import React from 'react';
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

export const MisClasesView: React.FC = () => {
  const navigate = useNavigate();
  const { activeAnnouncements } = useAnnouncements();
  const {
    cycles,
    personName,
    isLinkedPerson,
    isLoading,
    error,
    refresh,
  } = useStudentClasses();

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Cargando tus ciclos formativos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Mis Clases
            </h1>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              Portal Miembro / Alumno
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {personName
              ? `Bienvenido/a, ${personName}. Consulta tus cursos, materiales y calificaciones.`
              : 'Portal de aprendizaje y seguimiento académico congregacional.'}
          </p>
        </div>

        <button
          onClick={() => refresh()}
          className="self-start sm:self-auto min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-2 shadow-2xs active:scale-95"
          title="Actualizar lista de clases"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Banner de Avisos y Anuncios Vigentes (Tablón Parroquial) */}
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
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Error al cargar información</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Caso: Usuario no vinculado a ficha de persona */}
      {isLinkedPerson === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">
            Cuenta pendiente de vincular
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Tu cuenta de usuario aún no ha sido enlazada con tu ficha de miembro o alumno en el sistema.
            Por favor, solicita al pastor o al administrador que vincule tu correo electrónico desde el módulo de Personas.
          </p>
        </div>
      )}

      {/* Caso: Usuario vinculado pero sin ciclos inscritos */}
      {isLinkedPerson === true && cycles.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">
            No estás inscrito en ningún ciclo formativo
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Actualmente no figuras como alumno en ciclos activos. Cuando el maestro o administrador te inscriba en un curso de discipulado o formación bíblica, aparecerá disponible aquí.
          </p>
        </div>
      )}

      {/* Listado de Tarjetas de Ciclos Inscritos (Mobile-First) */}
      {cycles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cycles.map((item) => {
            const { cycle, academicSummary, status: enrollStatus } = item;

            const cycleStatusLabel =
              CYCLE_STATUS_OPTIONS.find((s) => s.value === cycle.status)?.label ||
              cycle.status;
            const cycleStatusClass =
              CYCLE_STATUS_COLORS[cycle.status] ||
              'bg-slate-100 text-slate-700 border-slate-200';

            const enrollStatusLabel =
              ENROLLMENT_STATUS_OPTIONS.find((e) => e.value === enrollStatus)?.label ||
              enrollStatus;
            const enrollStatusClass =
              ENROLLMENT_STATUS_COLORS[enrollStatus as EnrollmentStatus] ||
              'bg-blue-100 text-blue-800 border-blue-200';

            const avgGrade = academicSummary ? academicSummary.average_grade : 0;
            const attPct = academicSummary ? academicSummary.attendance_percentage : 100;
            const passed = academicSummary ? academicSummary.passed : false;

            return (
              <div
                key={item.enrollment_id}
                onClick={() => navigate(`/mis-clases/ciclo/${cycle.id}`)}
                className="group cursor-pointer bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 active:scale-[0.99]"
              >
                {/* Cabecera de la tarjeta: Título del curso y estados */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {cycle.course?.title || 'Curso'}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${cycleStatusClass}`}
                      >
                        {cycleStatusLabel}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${enrollStatusClass}`}
                      >
                        {enrollStatusLabel}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors leading-tight">
                    {cycle.name}
                  </h3>

                  {cycle.course?.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {cycle.course.description}
                    </p>
                  )}
                </div>

                {/* Metadatos: Maestro y Fechas */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      {cycle.teacher
                        ? `${cycle.teacher.first_name} ${cycle.teacher.last_name}`
                        : 'Maestro asignado'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-right justify-end truncate">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
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
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {/* Nota Media */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Nota Media
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {avgGrade.toFixed(1)} / 100
                      </span>
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    {/* Asistencia */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Asistencia
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {attPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Indicador de resultado */}
                  <div className="flex items-center gap-2">
                    {passed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprobado</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-lg">
                        <span>En curso</span>
                      </span>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
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
