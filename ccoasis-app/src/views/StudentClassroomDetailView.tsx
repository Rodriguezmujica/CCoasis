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
    removeSubmission,
  } = useStudentClassroom(cycleId || '');

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#0e7c86] animate-spin mb-3" />
        <p className="text-sm text-[#4a4f57] font-medium">Cargando aula virtual...</p>
      </div>
    );
  }

  if (error || !cycle) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
        <button
          onClick={() => navigate('/mis-clases')}
          className="min-h-[44px] inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#0e7c86] hover:bg-[#d9f7f8]/70 font-extrabold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Mis clases</span>
        </button>

        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="text-base font-extrabold text-rose-950">
            No se pudo acceder a este ciclo
          </h3>
          <p className="text-sm text-rose-800 max-w-md mx-auto">
            {error || 'Este curso o ciclo ya no se encuentra disponible.'}
          </p>
          <button
            onClick={() => refresh()}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-rose-700 text-white rounded-xl text-xs font-extrabold hover:bg-rose-800 transition-colors"
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
    CYCLE_STATUS_COLORS[cycle.status] || 'bg-slate-100 text-slate-800 border-slate-400';

  const enrollStatusLabel =
    ENROLLMENT_STATUS_OPTIONS.find((e) => e.value === enrollmentStatus)?.label ||
    enrollmentStatus ||
    'Inscrito';
  const enrollStatusClass =
    (enrollmentStatus && ENROLLMENT_STATUS_COLORS[enrollmentStatus as EnrollmentStatus]) ||
    'bg-emerald-100 text-emerald-950 border-emerald-600';

  const pendingAssignmentsCount = assignments.filter((a) => {
    return !submissions.some((s) => s.assignment_id === a.id);
  }).length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 pb-24 md:pb-8">
      {/* Botón de retroceso */}
      <div>
        <button
          onClick={() => navigate('/mis-clases')}
          className="min-h-[40px] inline-flex items-center gap-2 text-xs font-extrabold text-[#0e7c86] px-3 py-1.5 rounded-xl hover:bg-[#d9f7f8]/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Mis clases</span>
        </button>
      </div>

      {/* Cabecera Destacada del Ciclo (#0a5961) */}
      <div className="bg-[#0a5961] text-white rounded-3xl p-5 sm:p-6 shadow-sm on-magenta space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-white/15 border border-white/25 px-2.5 py-0.5 rounded-full">
              <GraduationCap className="w-3.5 h-3.5" />
              {cycle.course?.title || 'Curso de Discipulado'}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {cycle.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded-full border ${cycleStatusClass}`}
            >
              {cycleStatusLabel}
            </span>
            <span
              className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded-full border ${enrollStatusClass}`}
            >
              Estado: {enrollStatusLabel}
            </span>
          </div>
        </div>

        {/* Metadatos: Maestro, Fechas y Criterios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/20 text-xs text-white/90">
          <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-2xl p-3">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white/75 block text-[10px] font-extrabold uppercase">Maestro</span>
              <span className="font-extrabold text-white">
                {cycle.teacher
                  ? `${cycle.teacher.first_name} ${cycle.teacher.last_name}`
                  : 'Maestro asignado'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-2xl p-3">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white/75 block text-[10px] font-extrabold uppercase">Período</span>
              <span className="font-extrabold text-white">
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

          <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-2xl p-3">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white/75 block text-[10px] font-extrabold uppercase">Criterio aprobación</span>
              <span className="font-extrabold text-white">
                Nota mín. {cycle.course?.passing_grade ?? 70} · Asistencia {cycle.course?.min_attendance_pct ?? 75}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por Pestañas (Mobile-First, grandes y táctiles) */}
      <div className="flex border-b border-[#d4d7dc] gap-1 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        <button
          onClick={() => setActiveTab('materiales')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm rounded-t-xl transition-all border-b-[3px] whitespace-nowrap ${
            activeTab === 'materiales'
              ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
              : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Contenido y Materiales</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'materiales'
                ? 'bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]'
                : 'bg-[#eef0f3] text-[#4a4f57]'
            }`}
          >
            {materials.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tareas')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm rounded-t-xl transition-all border-b-[3px] whitespace-nowrap ${
            activeTab === 'tareas'
              ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
              : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Tareas</span>
          {pendingAssignmentsCount > 0 ? (
            <span className="text-xs px-2 py-0.5 bg-amber-700 text-white rounded-full font-extrabold">
              {pendingAssignmentsCount}
            </span>
          ) : (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'tareas'
                  ? 'bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]'
                  : 'bg-[#eef0f3] text-[#4a4f57]'
              }`}
            >
              {assignments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('progreso')}
          className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm rounded-t-xl transition-all border-b-[3px] whitespace-nowrap ${
            activeTab === 'progreso'
              ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
              : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Mi Progreso</span>
          {academicSummary?.passed && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
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
            onRemoveSubmission={removeSubmission}
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
