import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  FileText,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardEmptyState } from './DashboardEmptyState';
import { DashboardErrorState } from './DashboardErrorState';
import {
  StudentNextClassItem,
  StudentPendingAssignmentItem,
  StudentGradeItem,
  formatSessionDate,
  formatDueDate,
  formatGradeDate,
} from '../../lib/useInicioDashboard';

export interface InicioStudentSectionProps {
  isPersonLinked: boolean | null;
  nextClassState: {
    nextClass: StudentNextClassItem | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
  pendingAssignmentsState: {
    assignments: StudentPendingAssignmentItem[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
  recentGradesState: {
    grades: StudentGradeItem[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
}

export const InicioStudentSection: React.FC<InicioStudentSectionProps> = ({
  isPersonLinked,
  nextClassState,
  pendingAssignmentsState,
  recentGradesState,
}) => {
  const {
    nextClass,
    isLoading: isLoadingClass,
    error: errorClass,
    refetch: refetchClass,
  } = nextClassState;

  const {
    assignments,
    isLoading: isLoadingAssignments,
    error: errorAssignments,
    refetch: refetchAssignments,
  } = pendingAssignmentsState;

  const {
    grades,
    isLoading: isLoadingGrades,
    error: errorGrades,
    refetch: refetchGrades,
  } = recentGradesState;

  return (
    <section aria-labelledby="seccion-alumno-title" className="space-y-4 pt-2">
      {/* Cabecera de la Sección Alumno */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#d4d7dc]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[8px] bg-[#0e7c86] text-white flex items-center justify-center flex-shrink-0 shadow-2xs"
            aria-hidden="true"
          >
            <GraduationCap className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2
              id="seccion-alumno-title"
              className="text-lg sm:text-xl font-extrabold text-[#1a1a1a] tracking-tight"
            >
              Alumno
            </h2>
            <p className="text-xs text-[#4a4f57]">
              Tus clases, tareas pendientes y calificaciones
            </p>
          </div>
        </div>

        <Link
          to="/mis-clases"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px] transition-colors"
          aria-label="Ir a la sección Mis clases"
        >
          <span>Ir a Mis clases</span>
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
            <p className="font-bold text-[#1a1a1a]">Ficha de alumno no vinculada</p>
            <p className="text-[#4a4f57] leading-relaxed">
              Tu cuenta tiene el rol de alumno pero aún no está vinculada a una ficha de estudiante
              en la congregación. Pídele al administrador o maestro que la vincule para ver tus
              clases, tareas y notas.
            </p>
          </div>
        </div>
      )}

      {/* Tarjeta 1: Próxima clase */}
      <DashboardCard
        icon={<BookOpen className="w-5 h-5 text-[#0e7c86]" />}
        title="Próxima clase"
        subtitle="Sesión más cercana en tus ciclos activos"
        action={{ label: 'Ver todo', to: '/mis-clases' }}
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
            description="Vincula tu cuenta a tu ficha de alumno para consultar tu cronograma de clases."
            action={{ label: 'Ir a Mis clases', to: '/mis-clases' }}
          />
        ) : !nextClass ? (
          <DashboardEmptyState
            icon={<BookOpen className="w-5 h-5 text-[#4a4f57]" />}
            title="Sin clases programadas"
            description="No tienes sesiones próximas programadas en tus ciclos formativos activos."
            action={{ label: 'Ir a Mis clases', to: '/mis-clases' }}
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

            {/* Botón de acción hacia el aula */}
            <div className="pt-1">
              <Link
                to="/mis-clases"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-[10px] bg-[#0e7c86] hover:bg-[#0a5961] active:bg-[#08474e] text-white text-xs font-bold transition-all shadow-xs gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#0e7c86] focus:ring-offset-2"
                aria-label="Abrir aula en Mis clases"
              >
                <span>Abrir aula en Mis clases</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Tarjeta 2: Tareas pendientes */}
      <DashboardCard
        icon={<FileText className="w-5 h-5 text-[#0e7c86]" />}
        title="Tareas pendientes"
        subtitle="Actividades pendientes de entrega en tus ciclos activos"
        action={{ label: 'Ver todo', to: '/mis-clases' }}
        badge={
          assignments.length > 0 ? (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fdecec] text-[#9b1c1c] border border-[#9b1c1c]/20">
              {assignments.length} {assignments.length === 1 ? 'pendiente' : 'pendientes'}
            </span>
          ) : undefined
        }
      >
        {isLoadingAssignments ? (
          <DashboardSkeleton lines={3} hasHeader={false} className="border-none p-0" />
        ) : errorAssignments ? (
          <DashboardErrorState
            title="No se pudieron cargar las tareas"
            message={errorAssignments}
            onRetry={refetchAssignments}
          />
        ) : isPersonLinked === false ? (
          <DashboardEmptyState
            icon={<FileText className="w-5 h-5 text-[#4a4f57]" />}
            title="Sin tareas disponibles"
            description="Vincula tu cuenta a tu ficha de alumno para gestionar tus tareas y entregas."
            action={{ label: 'Ir a Mis clases', to: '/mis-clases' }}
          />
        ) : assignments.length === 0 ? (
          <DashboardEmptyState
            icon={<CheckCircle2 className="w-5 h-5 text-[#0e7c86]" />}
            title="¡Al día con tus tareas!"
            description="No tienes tareas pendientes por entregar en tus ciclos formativos activos."
            action={{ label: 'Ver mis clases', to: '/mis-clases' }}
          />
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const isOverdue = assignment.dueDate
                ? new Date(assignment.dueDate).getTime() < Date.now()
                : false;

              return (
                <div
                  key={assignment.id}
                  className="p-3.5 rounded-[10px] bg-white border border-[#d4d7dc] hover:border-[#0e7c86]/40 transition-colors shadow-2xs space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#0a5961] bg-[#d9f7f8] px-2 py-0.5 rounded-full border border-[#0e7c86]/20">
                      {assignment.courseTitle}
                    </span>
                    <span className="text-[11px] text-[#4a4f57]">
                      Ciclo: {assignment.cycleName}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#1a1a1a] leading-snug">
                      {assignment.title}
                    </h4>
                    {assignment.instructions && (
                      <p className="text-xs text-[#4a4f57] line-clamp-2 mt-0.5 leading-relaxed">
                        {assignment.instructions}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock
                        className={`w-3.5 h-3.5 flex-shrink-0 ${
                          isOverdue ? 'text-[#9b1c1c]' : 'text-[#0e7c86]'
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={
                          isOverdue ? 'font-bold text-[#9b1c1c]' : 'text-[#4a4f57] font-medium'
                        }
                      >
                        Límite: {formatDueDate(assignment.dueDate)}
                        {isOverdue && ' · Plazo vencido'}
                      </span>
                    </div>

                    <Link
                      to="/mis-clases"
                      className="inline-flex items-center justify-center min-h-[44px] px-3 py-1.5 rounded-[8px] bg-[#f5f5f5] hover:bg-[#ebedef] border border-[#d4d7dc] text-xs font-semibold text-[#1a1a1a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0e7c86]"
                      aria-label={`Entregar tarea ${assignment.title}`}
                    >
                      <span>Entregar</span>
                    </Link>
                  </div>
                </div>
              );
            })}

            <div className="pt-1 text-center sm:text-right">
              <Link
                to="/mis-clases"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px]"
              >
                <span>Ver todas las tareas en Mis clases &rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* Tarjeta 3: Últimas notas */}
      <DashboardCard
        icon={<Award className="w-5 h-5 text-[#0e7c86]" />}
        title="Últimas notas"
        subtitle="Calificaciones recientes de tus evaluaciones"
        action={{ label: 'Ver todo', to: '/mis-clases' }}
      >
        {isLoadingGrades ? (
          <DashboardSkeleton lines={3} hasHeader={false} className="border-none p-0" />
        ) : errorGrades ? (
          <DashboardErrorState
            title="No se pudieron cargar las calificaciones"
            message={errorGrades}
            onRetry={refetchGrades}
          />
        ) : isPersonLinked === false ? (
          <DashboardEmptyState
            icon={<Award className="w-5 h-5 text-[#4a4f57]" />}
            title="Sin calificaciones disponibles"
            description="Vincula tu cuenta a tu ficha de alumno para consultar tu expediente y notas."
            action={{ label: 'Ir a Mis clases', to: '/mis-clases' }}
          />
        ) : grades.length === 0 ? (
          <DashboardEmptyState
            icon={<Award className="w-5 h-5 text-[#4a4f57]" />}
            title="Sin notas registradas"
            description="Aún no tienes calificaciones registradas en tus evaluaciones académicas."
            action={{ label: 'Ver mis clases', to: '/mis-clases' }}
          />
        ) : (
          <div className="space-y-3">
            {grades.map((grade) => {
              const pct =
                grade.maxScore > 0 ? (grade.score / grade.maxScore) * 100 : 0;
              const isApproved = pct >= 70;

              return (
                <div
                  key={grade.id}
                  className="p-3.5 rounded-[10px] bg-white border border-[#d4d7dc] hover:border-[#0e7c86]/40 transition-colors shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-[#1a1a1a] truncate leading-tight">
                      {grade.evaluationTitle}
                    </p>
                    <p className="text-xs text-[#4a4f57] truncate">
                      {grade.courseTitle} · {grade.cycleName}
                    </p>
                    {grade.notes && (
                      <p className="text-[11px] text-[#4a4f57] italic line-clamp-1">
                        Nota del maestro: {grade.notes}
                      </p>
                    )}
                    <p className="text-[11px] text-[#767b83]">
                      Registrada el {formatGradeDate(grade.createdAt)}
                    </p>
                  </div>

                  {/* Puntuación y porcentaje */}
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`inline-block px-3 py-1.5 rounded-[8px] font-extrabold text-sm border ${
                        isApproved
                          ? 'bg-[#e3f5e9] text-[#14532d] border-[#14532d]/20'
                          : 'bg-[#fdecec] text-[#9b1c1c] border-[#9b1c1c]/20'
                      }`}
                    >
                      {grade.score} / {grade.maxScore}
                    </span>
                    <p className="text-[11px] text-[#767b83] font-semibold mt-0.5">
                      {Math.round(pct)}%
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="pt-1 text-center sm:text-right">
              <Link
                to="/mis-clases"
                className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-xs font-semibold text-[#0e7c86] hover:text-[#0a5961] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0e7c86] rounded-[8px]"
              >
                <span>Ver todas las notas en Mis clases &rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </DashboardCard>
    </section>
  );
};
