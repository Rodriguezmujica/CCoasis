import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  BarChart3,
  Calendar,
  User,
  GraduationCap,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useStudentClassroom } from '../lib/useStudentClassroom';
import { StudentMaterialsTab } from '../components/mis-clases/StudentMaterialsTab';
import { StudentAssignmentsTab } from '../components/mis-clases/StudentAssignmentsTab';
import { StudentProgressTab } from '../components/mis-clases/StudentProgressTab';
import { CYCLE_STATUS_OPTIONS, CYCLE_STATUS_COLORS } from '../types/courses';
import { ENROLLMENT_STATUS_OPTIONS, ENROLLMENT_STATUS_COLORS, EnrollmentStatus } from '../types/classroom';

type Tab = 'materiales' | 'tareas' | 'progreso';

export const StudentClassroomDetailView: React.FC = () => {
  const { id: cycleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('materiales');

  const {
    cycle,
    enrollmentStatus,
    materials,
    assignments,
    submissions,
    sessions,
    attendance,
    evaluations,
    grades,
    academicSummary,
    isLoading,
    error,
    refresh,
    getSignedUrl,
    submitAssignment,
  } = useStudentClassroom(cycleId || '');

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Cargando aula virtual...</p>
      </div>
    );
  }

  if (error || !cycle) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
        <button
          onClick={() => navigate('/mis-clases')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Mis clases</span>
        </button>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">
            No se pudo acceder a este ciclo
          </h3>
          <p className="text-sm text-rose-700 max-w-md mx-auto">
            {error || 'El ciclo no existe o no estás inscrito en él.'}
          </p>
          <button
            onClick={() => refresh()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }

  const cycleStatusLabel =
    CYCLE_STATUS_OPTIONS.find((s) => s.value === cycle.status)?.label || cycle.status;
  const cycleStatusClass =
    CYCLE_STATUS_COLORS[cycle.status] || 'bg-slate-100 text-slate-700 border-slate-200';

  const enrollStatusLabel =
    ENROLLMENT_STATUS_OPTIONS.find((e) => e.value === enrollmentStatus)?.label ||
    enrollmentStatus ||
    'Inscrito';
  const enrollStatusClass =
    (enrollmentStatus && ENROLLMENT_STATUS_COLORS[enrollmentStatus as EnrollmentStatus]) ||
    'bg-blue-100 text-blue-800 border-blue-200';

  const pendingAssignmentsCount = assignments.filter((a) => {
    return !submissions.some((s) => s.assignment_id === a.id);
  }).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Botón de retroceso */}
      <div>
        <button
          onClick={() => navigate('/mis-clases')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Mis clases</span>
        </button>
      </div>

      {/* Cabecera del Ciclo */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              {cycle.course?.title || 'Curso de Discipulado'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {cycle.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${cycleStatusClass}`}
            >
              {cycleStatusLabel}
            </span>
            <span
              className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${enrollStatusClass}`}
            >
              Estado: {enrollStatusLabel}
            </span>
          </div>
        </div>

        {/* Metadatos: Maestro, Fechas y Criterios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Maestro</span>
              <span className="font-semibold text-slate-800">
                {cycle.teacher
                  ? `${cycle.teacher.first_name} ${cycle.teacher.last_name}`
                  : 'Maestro asignado'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Período</span>
              <span className="font-semibold text-slate-800">
                {new Date(cycle.start_date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {cycle.end_date
                  ? ` - ${new Date(cycle.end_date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : ' (En curso)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Criterio aprobación</span>
              <span className="font-semibold text-slate-800">
                Nota mín. {cycle.course?.passing_grade ?? 70} · Asistencia {cycle.course?.min_attendance_pct ?? 75}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por Pestañas (Mobile-First, grandes y táctiles) */}
      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        <button
          onClick={() => setActiveTab('materiales')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'materiales'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Contenido y Materiales</span>
          <span className="text-[11px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-semibold text-slate-700">
            {materials.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tareas')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'tareas'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Tareas</span>
          {pendingAssignmentsCount > 0 ? (
            <span className="text-[11px] px-2 py-0.2 bg-amber-500 text-white rounded-full font-bold">
              {pendingAssignmentsCount}
            </span>
          ) : (
            <span className="text-[11px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-semibold text-slate-700">
              {assignments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('progreso')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'progreso'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Mi Progreso</span>
          {academicSummary?.passed && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* Contenido de la pestaña activa */}
      <div>
        {activeTab === 'materiales' && (
          <StudentMaterialsTab
            materials={materials}
            onGetSignedUrl={getSignedUrl}
          />
        )}

        {activeTab === 'tareas' && (
          <StudentAssignmentsTab
            assignments={assignments}
            submissions={submissions}
            onSubmitAssignment={submitAssignment}
            onGetSignedUrl={getSignedUrl}
          />
        )}

        {activeTab === 'progreso' && (
          <StudentProgressTab
            sessions={sessions}
            attendance={attendance}
            evaluations={evaluations}
            grades={grades}
            summary={academicSummary}
            courseCriteria={cycle.course}
          />
        )}
      </div>
    </div>
  );
};
