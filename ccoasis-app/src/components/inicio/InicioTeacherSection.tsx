import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileCheck2,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  UserCheck,
  User,
  Clock,
  Paperclip,
} from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardEmptyState } from './DashboardEmptyState';
import { DashboardErrorState } from './DashboardErrorState';
import {
  TeacherNextClassItem,
  TeacherPendingAttendanceItem,
  TeacherPendingSubmissionItem,
  formatSessionDate,
  formatDueDate,
} from '../../lib/useInicioDashboard';

export interface InicioTeacherSectionProps {
  isPersonLinked: boolean | null;
  teacherNextClassState: {
    nextClass: TeacherNextClassItem | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
  teacherPendingAttendanceState: {
    pendingSessions: TeacherPendingAttendanceItem[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
  teacherPendingSubmissionsState: {
    submissions: TeacherPendingSubmissionItem[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
}

export const InicioTeacherSection: React.FC<InicioTeacherSectionProps> = ({
  isPersonLinked,
  teacherNextClassState,
  teacherPendingAttendanceState,
  teacherPendingSubmissionsState,
}) => {
  const {
    nextClass,
    isLoading: isLoadingClass,
    error: errorClass,
    refetch: refetchClass,
  } = teacherNextClassState;

  const {
    pendingSessions,
    isLoading: isLoadingAttendance,
    error: errorAttendance,
    refetch: refetchAttendance,
  } = teacherPendingAttendanceState;

  const {
    submissions,
    isLoading: isLoadingSubmissions,
    error: errorSubmissions,
    refetch: refetchSubmissions,
  } = teacherPendingSubmissionsState;

  return (
    <section aria-labelledby="seccion-maestro-title" className="space-y-4 pt-2">
      {/* Cabecera de la Sección Maestro */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#d4d7dc]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[8px] bg-[#0e7c86] text-white flex items-center justify-center flex-shrink-0 shadow-2xs"
            aria-hidden="true"
          >
            <BookOpenCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2
              id="seccion-maestro-title"
              className="text-lg sm:text-xl font-extrabold text-[#1a1a1a] tracking-tight"
            >
              Maestro
            </h2>
            <p className="text-xs text-[#4a4f57]">
              Tus ciclos asignados, asistencia por registrar y entregas por evaluar
            </p>
          </div>
        </div>

        <Link
          to="/clases"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px] transition-colors"
          aria-label="Ir al módulo Clases"
        >
          <span>Ir a Clases</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Aviso amigable si la cuenta no tiene ficha vinculada en persons */}
      {isPersonLinked === false && (
        <div className="p-4 rounded-[10px] bg-[#f5f5f5] border border-[#d4d7dc] flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-[8px] bg-white border border-[#d4d7dc] text-[#767b83] flex items-center justify-center flex-shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <UserCheck className="w-4 h-4 text-[#0e7c86]" />
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-bold text-[#1a1a1a]">Ficha de maestro no vinculada</p>
            <p className="text-[#4a4f57] leading-relaxed">
              Tu cuenta tiene el rol de maestro pero aún no está vinculada a una ficha de persona en
              la congregación. Pídele a un administrador que la vincule para gestionar tus clases,
              asistencia y entregas de alumnos.
            </p>
          </div>
        </div>
      )}

      {/* Tarjeta 1: Próxima clase */}
      <DashboardCard
        icon={<BookOpen className="w-5 h-5 text-[#0e7c86]" />}
        title="Próxima clase"
        subtitle="Sesión más cercana en los ciclos que impartes"
        action={{ label: 'Ver todo', to: '/clases' }}
      >
        {isLoadingClass ? (
          <DashboardSkeleton lines={2} hasHeader={false} className="border-none p-0" />
        ) : errorClass ? (
          <DashboardErrorState
            title="No se pudo cargar la próxima clase"
            message={errorClass}
            onRetry={refetchClass}
          />
        ) : isPersonLinked === false ? (
          <DashboardEmptyState
            icon={<BookOpen className="w-5 h-5 text-[#4a4f57]" />}
            title="Sin información de clases"
            description="Vincula tu cuenta a tu ficha de maestro para consultar tu cronograma docente."
            action={{ label: 'Ir a Clases', to: '/clases' }}
          />
        ) : !nextClass ? (
          <DashboardEmptyState
            icon={<BookOpen className="w-5 h-5 text-[#4a4f57]" />}
            title="Sin clases próximas"
            description="No tienes sesiones futuras programadas en los ciclos que impartes actualmente."
            action={{ label: 'Ver ciclos formativos', to: '/clases' }}
          />
        ) : (
          <div className="p-3.5 sm:p-4 rounded-[10px] bg-white border border-[#d4d7dc] shadow-2xs space-y-3">
            {/* Curso y Ciclo */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#0a5961] bg-[#d9f7f8] px-2.5 py-0.5 rounded-full border border-[#0e7c86]/20">
                {nextClass.courseTitle}
              </span>
              <span className="text-xs text-[#4a4f57] font-medium">
                Ciclo: {nextClass.cycleName}
              </span>
            </div>

            {/* Tema de la sesión */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1a1a1a] leading-snug">
                {nextClass.topic}
              </h3>
              {nextClass.description && (
                <p className="text-xs sm:text-sm text-[#4a4f57] line-clamp-2 mt-1 leading-relaxed">
                  {nextClass.description}
                </p>
              )}
            </div>

            {/* Fecha de la sesión */}
            <div className="flex items-center gap-2 p-2.5 rounded-[8px] bg-[#f5f5f5] border border-[#d4d7dc] text-xs font-semibold text-[#1a1a1a]">
              <Calendar className="w-4 h-4 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
              <span>{formatSessionDate(nextClass.sessionDate)}</span>
            </div>

            {/* Botón de acción hacia el aula del ciclo */}
            <div className="pt-1">
              <Link
                to={`/clases/ciclo/${nextClass.cycleId}`}
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-[10px] bg-[#0e7c86] hover:bg-[#0a5961] active:bg-[#08474e] text-white text-xs font-bold transition-all shadow-xs gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0e7c86] focus:ring-offset-2"
                aria-label={`Gestionar ciclo ${nextClass.cycleName}`}
              >
                <span>Gestionar aula de clase</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Tarjeta 2: Asistencia por pasar */}
      <DashboardCard
        icon={<ClipboardCheck className="w-5 h-5 text-[#0e7c86]" />}
        title="Asistencia por pasar"
        subtitle="Sesiones concluidas de tus ciclos sin registro de asistencia"
        action={{ label: 'Ver todo', to: '/clases' }}
        badge={
          pendingSessions.length > 0 ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fdecec] text-[#9b1c1c] border border-[#9b1c1c]/20">
              {pendingSessions.length} {pendingSessions.length === 1 ? 'pendiente' : 'pendientes'}
            </span>
          ) : undefined
        }
      >
        {isLoadingAttendance ? (
          <DashboardSkeleton lines={3} hasHeader={false} className="border-none p-0" />
        ) : errorAttendance ? (
          <DashboardErrorState
            title="No se pudo cargar la asistencia pendiente"
            message={errorAttendance}
            onRetry={refetchAttendance}
          />
        ) : isPersonLinked === false ? (
          <DashboardEmptyState
            icon={<ClipboardCheck className="w-5 h-5 text-[#4a4f57]" />}
            title="Sin información de asistencia"
            description="Vincula tu cuenta a tu ficha de maestro para gestionar la asistencia de tus ciclos."
            action={{ label: 'Ir a Clases', to: '/clases' }}
          />
        ) : pendingSessions.length === 0 ? (
          <DashboardEmptyState
            icon={<CheckCircle2 className="w-5 h-5 text-[#0e7c86]" />}
            title="¡Asistencia al día!"
            description="No tienes sesiones pasadas pendientes de pasar lista en tus ciclos activos."
            action={{ label: 'Ver ciclos formativos', to: '/clases' }}
          />
        ) : (
          <div className="space-y-3">
            {pendingSessions.map((session) => (
              <div
                key={session.id}
                className="p-3.5 rounded-[10px] bg-white border border-[#d4d7dc] hover:border-[#0e7c86]/40 transition-colors shadow-2xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#0a5961] bg-[#d9f7f8] px-2 py-0.5 rounded-full border border-[#0e7c86]/20">
                    {session.courseTitle}
                  </span>
                  <span className="text-[11px] text-[#4a4f57]">
                    Ciclo: {session.cycleName}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#1a1a1a] leading-snug">
                    {session.topic}
                  </h4>
                  {session.description && (
                    <p className="text-xs text-[#4a4f57] line-clamp-1 mt-0.5 leading-relaxed">
                      {session.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
                    <span className="text-[#4a4f57] font-medium">
                      Sesión del {formatSessionDate(session.sessionDate)}
                    </span>
                  </div>

                  <Link
                    to={`/clases/ciclo/${session.cycleId}`}
                    className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-1.5 rounded-[8px] bg-[#0e7c86] hover:bg-[#0a5961] text-white text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0e7c86]"
                    aria-label={`Pasar lista en la sesión ${session.topic}`}
                  >
                    <span>Pasar lista</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}

            <div className="pt-1 text-center sm:text-right">
              <Link
                to="/clases"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px]"
              >
                <span>Ver todos los ciclos en Clases &rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Tarjeta 3: Entregas por revisar */}
      <DashboardCard
        icon={<FileCheck2 className="w-5 h-5 text-[#0e7c86]" />}
        title="Entregas por revisar"
        subtitle="Tareas con archivo entregado pendientes de calificación"
        action={{ label: 'Ver todo', to: '/clases' }}
        badge={
          submissions.length > 0 ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fdecec] text-[#9b1c1c] border border-[#9b1c1c]/20">
              {submissions.length} {submissions.length === 1 ? 'pendiente' : 'pendientes'}
            </span>
          ) : undefined
        }
      >
        {isLoadingSubmissions ? (
          <DashboardSkeleton lines={3} hasHeader={false} className="border-none p-0" />
        ) : errorSubmissions ? (
          <DashboardErrorState
            title="No se pudieron cargar las entregas por revisar"
            message={errorSubmissions}
            onRetry={refetchSubmissions}
          />
        ) : isPersonLinked === false ? (
          <DashboardEmptyState
            icon={<FileCheck2 className="w-5 h-5 text-[#4a4f57]" />}
            title="Sin entregas disponibles"
            description="Vincula tu cuenta a tu ficha de maestro para revisar las entregas de tus alumnos."
            action={{ label: 'Ir a Clases', to: '/clases' }}
          />
        ) : submissions.length === 0 ? (
          <DashboardEmptyState
            icon={<CheckCircle2 className="w-5 h-5 text-[#0e7c86]" />}
            title="¡Sin entregas pendientes!"
            description="No tienes tareas enviadas por alumnos pendientes de revisión en este momento."
            action={{ label: 'Ver ciclos formativos', to: '/clases' }}
          />
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-[10px] bg-white border border-[#d4d7dc] hover:border-[#0e7c86]/40 transition-colors shadow-2xs space-y-2"
              >
                {/* Curso y Ciclo */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#0a5961] bg-[#d9f7f8] px-2 py-0.5 rounded-full border border-[#0e7c86]/20">
                    {sub.courseTitle}
                  </span>
                  <span className="text-[11px] text-[#4a4f57]">
                    Ciclo: {sub.cycleName}
                  </span>
                </div>

                {/* Título de la tarea y alumno */}
                <div>
                  <h4 className="text-sm font-bold text-[#1a1a1a] leading-snug">
                    {sub.assignmentTitle}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-[#1a1a1a] font-medium">
                    <User className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
                    <span>Alumno: <strong className="font-bold">{sub.studentName}</strong></span>
                  </div>
                  {sub.comments && (
                    <p className="text-xs text-[#4a4f57] italic line-clamp-1 mt-1 bg-[#f5f5f5] p-1.5 rounded-[6px] border border-[#ebedef]">
                      &ldquo;{sub.comments}&rdquo;
                    </p>
                  )}
                </div>

                {/* Fecha de entrega y botón de calificación */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#ebedef]">
                  <div className="flex items-center gap-2 text-xs text-[#4a4f57]">
                    <Clock className="w-3.5 h-3.5 text-[#0e7c86] flex-shrink-0" aria-hidden="true" />
                    <span>Entregada: {formatDueDate(sub.submittedAt)}</span>
                    {sub.fileUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0a5961] bg-[#d9f7f8] px-2 py-0.5 rounded">
                        <Paperclip className="w-3 h-3" aria-hidden="true" />
                        Archivo adjunto
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/clases/ciclo/${sub.cycleId}`}
                    className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-1.5 rounded-[8px] bg-[#0e7c86] hover:bg-[#0a5961] text-white text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0e7c86]"
                    aria-label={`Calificar entrega de ${sub.studentName} en la tarea ${sub.assignmentTitle}`}
                  >
                    <span>Revisar entrega</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}

            <div className="pt-1 text-center sm:text-right">
              <Link
                to="/clases"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px]"
              >
                <span>Ver todas las tareas en Clases &rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </DashboardCard>
    </section>
  );
};
