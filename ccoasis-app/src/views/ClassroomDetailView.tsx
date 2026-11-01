import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Calendar,
  Award,
  BarChart3,
  Plus,
  Lock,
  Loader2,
  AlertCircle,
  Pencil,
  BookOpen,
  ClipboardList,
} from 'lucide-react';
import { useClassroom } from '../lib/useClassroom';
import {
  EnrollmentStatus,
  ENROLLMENT_STATUS_OPTIONS,
  ENROLLMENT_STATUS_COLORS,
  ClassSession,
  Evaluation,
} from '../types/classroom';
import { CYCLE_STATUS_OPTIONS, CYCLE_STATUS_COLORS } from '../types/courses';
import { EnrollmentModal } from '../components/clases/EnrollmentModal';
import { SessionModal } from '../components/clases/SessionModal';
import { AttendanceSheet } from '../components/clases/AttendanceSheet';
import { EvaluationModal } from '../components/clases/EvaluationModal';
import { GradingSheet } from '../components/clases/GradingSheet';
import { AcademicSummaryTab } from '../components/clases/AcademicSummaryTab';
import { MaterialsTab } from '../components/clases/MaterialsTab';
import { AssignmentsTab } from '../components/clases/AssignmentsTab';


type ClassroomTab = 'alumnos' | 'sesiones' | 'evaluaciones' | 'materiales' | 'tareas' | 'resumen';

export const ClassroomDetailView: React.FC = () => {
  const { id: cycleId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ClassroomTab>('alumnos');

  // Modales
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [sessionModal, setSessionModal] = useState<{
    isOpen: boolean;
    session: ClassSession | null;
  }>({ isOpen: false, session: null });
  const [evaluationModal, setEvaluationModal] = useState<{
    isOpen: boolean;
    evaluation: Evaluation | null;
  }>({ isOpen: false, evaluation: null });

  const {
    cycle,
    enrollments,
    candidatePersons,
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    sessionAttendance,
    evaluations,
    selectedEvaluationId,
    setSelectedEvaluationId,
    evaluationGrades,
    academicSummary,
    isLoading,
    error,
    refreshSummary,
    enrollPerson,
    updateEnrollmentStatus,
    createSession,
    updateSession,
    saveAttendance,
    createEvaluation,
    updateEvaluation,
    saveGrades,
  } = useClassroom(cycleId || '');

  const isCycleClosed = cycle?.status === 'cerrado';

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;
  const selectedEvaluation = evaluations.find((e) => e.id === selectedEvaluationId) || null;

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#0e7c86] animate-spin mb-3" />
        <p className="text-sm text-[#4a4f57] font-medium">Cargando aula del ciclo...</p>
      </div>
    );
  }

  if (error || !cycle) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <button
          onClick={() => navigate('/clases')}
          className="min-h-[44px] inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#0e7c86] hover:bg-[#d9f7f8]/70 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Clases</span>
        </button>
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-red-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>No se pudo cargar la información del ciclo</span>
          </div>
          <p className="text-sm">{error || 'El ciclo no existe o fue eliminado.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Botón Volver y Cabecera Destacada del Ciclo (#0a5961) */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/clases')}
          className="min-h-[40px] inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold text-[#0e7c86] hover:bg-[#d9f7f8]/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo de Clases</span>
        </button>

        <div className="bg-[#0a5961] text-white rounded-3xl p-5 sm:p-6 shadow-sm on-magenta flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                  CYCLE_STATUS_COLORS[cycle.status]
                }`}
              >
                {CYCLE_STATUS_OPTIONS.find((o) => o.value === cycle.status)?.label || cycle.status}
              </span>
              <span className="text-xs font-bold text-white bg-white/15 border border-white/25 px-2.5 py-0.5 rounded-full">
                {cycle.course?.title || 'Curso sin título'}
              </span>
              {isCycleClosed && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 bg-white/90 px-2.5 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Solo lectura
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {cycle.name}
            </h1>

            <p className="text-xs sm:text-sm text-white/90 flex items-center gap-2 flex-wrap">
              <span>
                Maestro:{' '}
                <strong className="text-white font-extrabold">
                  {cycle.teacher
                    ? `${cycle.teacher.first_name} ${cycle.teacher.last_name}`
                    : 'Sin asignar'}
                </strong>
              </span>
              <span className="text-white/60">•</span>
              <span>
                Inicio: {new Date(cycle.start_date).toLocaleDateString('es-ES')}
                {cycle.end_date && ` — Fin: ${new Date(cycle.end_date).toLocaleDateString('es-ES')}`}
              </span>
            </p>
          </div>

          {/* Estadísticas rápidas / badges */}
          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <div className="px-3.5 py-2 bg-white/12 rounded-2xl border border-white/25 text-center min-w-[82px]">
              <div className="text-sm font-extrabold text-white">
                {enrollments.length}
              </div>
              <div className="text-[11px] font-semibold text-white/85">Alumnos</div>
            </div>
            <div className="px-3.5 py-2 bg-white/12 rounded-2xl border border-white/25 text-center min-w-[82px]">
              <div className="text-sm font-extrabold text-white">{sessions.length}</div>
              <div className="text-[11px] font-semibold text-white/85">Sesiones</div>
            </div>
            <div className="px-3.5 py-2 bg-white/12 rounded-2xl border border-white/25 text-center min-w-[82px]">
              <div className="text-sm font-extrabold text-white">{evaluations.length}</div>
              <div className="text-[11px] font-semibold text-white/85">Evaluaciones</div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner de bloqueo si el ciclo está cerrado */}
      {isCycleClosed && (
        <div className="p-4 bg-white border border-[#d4d7dc] rounded-3xl text-[#1a1a1a] text-xs sm:text-sm flex items-start gap-3 shadow-xs">
          <Lock className="w-5 h-5 text-[#4a4f57] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold">Ciclo Cerrado — Modo Solo Lectura</p>
            <p className="text-xs text-[#4a4f57] mt-0.5">
              Este ciclo se encuentra cerrado. Para preservar la integridad del historial académico,
              las sesiones, registros de asistencia, evaluaciones y calificaciones se encuentran bloqueadas.
            </p>
          </div>
        </div>
      )}

      {/* Selector de Pestañas Internas del Ciclo */}
      <div className="border-b border-[#d4d7dc]">
        <nav className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-0.5" aria-label="Secciones del Aula">
          <button
            onClick={() => setActiveTab('alumnos')}
            className={`min-h-[44px] py-2.5 px-3.5 border-b-[3px] text-xs sm:text-sm flex items-center gap-2 rounded-t-xl whitespace-nowrap transition-colors ${
              activeTab === 'alumnos'
                ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
                : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Alumnos</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                activeTab === 'alumnos'
                  ? 'bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]'
                  : 'bg-[#eef0f3] text-[#4a4f57]'
              }`}
            >
              {enrollments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sesiones')}
            className={`min-h-[44px] py-2.5 px-3.5 border-b-[3px] text-xs sm:text-sm flex items-center gap-2 rounded-t-xl whitespace-nowrap transition-colors ${
              activeTab === 'sesiones'
                ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
                : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Sesiones y Asistencia</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                activeTab === 'sesiones'
                  ? 'bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]'
                  : 'bg-[#eef0f3] text-[#4a4f57]'
              }`}
            >
              {sessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('evaluaciones')}
            className={`min-h-[44px] py-2.5 px-3.5 border-b-[3px] text-xs sm:text-sm flex items-center gap-2 rounded-t-xl whitespace-nowrap transition-colors ${
              activeTab === 'evaluaciones'
                ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
                : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Evaluaciones y Calificaciones</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                activeTab === 'evaluaciones'
                  ? 'bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]'
                  : 'bg-[#eef0f3] text-[#4a4f57]'
              }`}
            >
              {evaluations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('materiales')}
            className={`min-h-[44px] py-2.5 px-3.5 border-b-[3px] text-xs sm:text-sm flex items-center gap-2 rounded-t-xl whitespace-nowrap transition-colors ${
              activeTab === 'materiales'
                ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
                : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Materiales</span>
          </button>

          <button
            onClick={() => setActiveTab('tareas')}
            className={`min-h-[44px] py-2.5 px-3.5 border-b-[3px] text-xs sm:text-sm flex items-center gap-2 rounded-t-xl whitespace-nowrap transition-colors ${
              activeTab === 'tareas'
                ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
                : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Tareas</span>
          </button>

          <button
            onClick={() => setActiveTab('resumen')}
            className={`min-h-[44px] py-2.5 px-3.5 border-b-[3px] text-xs sm:text-sm flex items-center gap-2 rounded-t-xl whitespace-nowrap transition-colors ${
              activeTab === 'resumen'
                ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
                : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Resumen Académico</span>
          </button>
        </nav>
      </div>


      {/* ============================================================== */}
      {/* 1. SECCIÓN: ALUMNOS / INSCRIPCIONES */}
      {/* ============================================================== */}
      {activeTab === 'alumnos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-[#1a1a1a] text-base">
                Alumnos Inscritos ({enrollments.length}/12)
              </h2>
              <p className="text-xs text-[#4a4f57]">
                Alumnos que forman parte activa de este ciclo. Máximo recomendado: 12 personas.
              </p>
            </div>

            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0e7c86] text-white rounded-[12px] text-sm font-extrabold hover:bg-[#0a5961] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Inscribir Alumno</span>
            </button>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-[#1a1a1a] text-base mb-1">
                No hay alumnos inscritos en este ciclo
              </h3>
              <p className="text-xs text-[#4a4f57] max-w-sm mx-auto mb-4">
                Inscribe miembros activos o visitas para comenzar a registrar su asistencia y evaluaciones.
              </p>
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-[#0e7c86] text-white rounded-[12px] text-sm font-extrabold hover:bg-[#0a5961]"
              >
                <Plus className="w-4 h-4" />
                <span>Inscribir Primer Alumno</span>
              </button>
            </div>
          ) : (
            <>
              {/* Tarjetas táctiles para móvil */}
              <div className="grid grid-cols-1 md:hidden gap-3.5">
                {enrollments.map((e) => (
                  <div
                    key={e.id}
                    className="bg-white rounded-3xl border border-[#d4d7dc] p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                          {e.person.first_name[0]}
                          {e.person.last_name[0]}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#1a1a1a] text-sm">
                            {e.person.first_name} {e.person.last_name}
                          </div>
                          {e.person.email && (
                            <div className="text-xs text-[#4a4f57]">{e.person.email}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e5e7eb]">
                      <span className="text-xs text-[#4a4f57] font-bold">Estado:</span>
                      <select
                        value={e.status}
                        onChange={(evt) =>
                          updateEnrollmentStatus(e.id, evt.target.value as EnrollmentStatus)
                        }
                        aria-label={`Cambiar estado de inscripción de ${e.person.first_name} ${e.person.last_name}`}
                        className={`min-h-[44px] text-base font-extrabold py-1.5 px-3 rounded-xl border ${
                          ENROLLMENT_STATUS_COLORS[e.status]
                        } focus:outline-none focus:ring-2 focus:ring-[#ae4a84]`}
                      >
                        {ENROLLMENT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla de escritorio */}
              <div className="hidden md:block bg-white rounded-3xl border border-[#d4d7dc] shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f5f5f5] text-[#4a4f57] border-b border-[#d4d7dc] text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 font-extrabold">Alumno</th>
                      <th className="px-4 py-3.5 font-extrabold">Contacto</th>
                      <th className="px-4 py-3.5 font-extrabold">Estado Congregacional</th>
                      <th className="px-4 py-3.5 font-extrabold text-center">Estado de Inscripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {enrollments.map((e) => (
                      <tr key={e.id} className="hover:bg-[#f5f5f5]/70 transition-colors">
                        <td className="px-5 py-4 font-extrabold text-[#1a1a1a]">
                          {e.person.first_name} {e.person.last_name}
                        </td>
                        <td className="px-4 py-4 text-xs text-[#4a4f57]">
                          <div className="font-medium text-[#1a1a1a]">{e.person.email || '—'}</div>
                          {e.person.phone && <div>{e.person.phone}</div>}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border ${
                              e.person.status === 'activo'
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-600'
                                : 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]'
                            }`}
                          >
                            {e.person.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <select
                            value={e.status}
                            onChange={(evt) =>
                              updateEnrollmentStatus(e.id, evt.target.value as EnrollmentStatus)
                            }
                            aria-label={`Cambiar estado de inscripción de ${e.person.first_name} ${e.person.last_name}`}
                            className={`min-h-[40px] text-xs font-extrabold py-1.5 px-3 rounded-xl border ${
                              ENROLLMENT_STATUS_COLORS[e.status]
                            } focus:outline-none focus:ring-2 focus:ring-[#ae4a84]`}
                          >
                            {ENROLLMENT_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SECCIÓN: SESIONES Y ASISTENCIA */}
      {/* ============================================================== */}
      {activeTab === 'sesiones' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-[#1a1a1a] text-base">
                Sesiones y Registro de Asistencia
              </h2>
              <p className="text-xs text-[#4a4f57]">
                Selecciona una sesión para registrar la asistencia de los alumnos con botones táctiles.
              </p>
            </div>

            {!isCycleClosed && (
              <button
                onClick={() => setSessionModal({ isOpen: true, session: null })}
                className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0e7c86] text-white rounded-[12px] text-sm font-extrabold hover:bg-[#0a5961] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Sesión</span>
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-[#1a1a1a] text-base mb-1">
                No hay sesiones planificadas
              </h3>
              <p className="text-xs text-[#4a4f57] max-w-sm mx-auto mb-4">
                Crea una sesión de clase con fecha y tema para comenzar a pasar lista.
              </p>
              {!isCycleClosed && (
                <button
                  onClick={() => setSessionModal({ isOpen: true, session: null })}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-[#0e7c86] text-white rounded-[12px] text-sm font-extrabold hover:bg-[#0a5961]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primera Sesión</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna Izquierda: Lista de Sesiones */}
              <div className="space-y-2.5 lg:col-span-1">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#4a4f57] px-1">
                  <span>Sesiones registradas ({sessions.length})</span>
                </div>

                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {sessions.map((sess) => {
                    const isSelected = sess.id === selectedSessionId;
                    return (
                      <div
                        key={sess.id}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#d9f7f8]/70 border-[#0e7c86] shadow-xs'
                            : 'bg-white border-[#d4d7dc] hover:border-[#0e7c86]'
                        }`}
                        onClick={() => setSelectedSessionId(sess.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-extrabold text-[#0e7c86] block">
                              {new Date(sess.session_date).toLocaleDateString('es-ES')}
                            </span>
                            <h4 className="font-extrabold text-[#1a1a1a] text-xs sm:text-sm truncate mt-0.5">
                              {sess.topic}
                            </h4>
                            {sess.description && (
                              <p className="text-[11px] text-[#4a4f57] line-clamp-1 mt-0.5">
                                {sess.description}
                              </p>
                            )}
                          </div>

                          {!isCycleClosed && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSessionModal({ isOpen: true, session: sess });
                              }}
                              aria-label={`Editar sesión ${sess.topic}`}
                              className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-[#4a4f57] hover:text-[#0e7c86] hover:bg-white transition-colors flex items-center justify-center"
                              title="Editar fecha o tema"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna Derecha: Hoja de Asistencia de la Sesión seleccionada */}
              <div className="lg:col-span-2">
                {selectedSession ? (
                  <AttendanceSheet
                    session={selectedSession}
                    enrollments={enrollments}
                    existingAttendance={sessionAttendance}
                    isCycleClosed={isCycleClosed}
                    onSave={saveAttendance}
                  />
                ) : (
                  <div className="bg-white rounded-3xl border border-[#d4d7dc] p-8 text-center text-[#4a4f57] text-xs">
                    Selecciona una sesión de la lista para pasar lista.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SECCIÓN: EVALUACIONES Y CALIFICACIONES */}
      {/* ============================================================== */}
      {activeTab === 'evaluaciones' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-[#1a1a1a] text-base">
                Evaluaciones y Calificaciones
              </h2>
              <p className="text-xs text-[#4a4f57]">
                Define evaluaciones y califica a los alumnos validando que la nota no exceda el máximo.
              </p>
            </div>

            {!isCycleClosed && (
              <button
                onClick={() => setEvaluationModal({ isOpen: true, evaluation: null })}
                className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0e7c86] text-white rounded-[12px] text-sm font-extrabold hover:bg-[#0a5961] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Evaluación</span>
              </button>
            )}
          </div>

          {evaluations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-[#1a1a1a] text-base mb-1">
                No hay evaluaciones registradas
              </h3>
              <p className="text-xs text-[#4a4f57] max-w-sm mx-auto mb-4">
                Crea una evaluación (examen, ensayo, tarea calificada) con su puntaje máximo.
              </p>
              {!isCycleClosed && (
                <button
                  onClick={() => setEvaluationModal({ isOpen: true, evaluation: null })}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-[#0e7c86] text-white rounded-[12px] text-sm font-extrabold hover:bg-[#0a5961]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primera Evaluación</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna Izquierda: Lista de Evaluaciones */}
              <div className="space-y-2.5 lg:col-span-1">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#4a4f57] px-1">
                  <span>Evaluaciones del Ciclo ({evaluations.length})</span>
                </div>

                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                  {evaluations.map((ev) => {
                    const isSelected = ev.id === selectedEvaluationId;
                    return (
                      <div
                        key={ev.id}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#d9f7f8]/70 border-[#0e7c86] shadow-xs'
                            : 'bg-white border-[#d4d7dc] hover:border-[#0e7c86]'
                        }`}
                        onClick={() => setSelectedEvaluationId(ev.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold text-amber-950 bg-amber-100 border border-amber-600 px-2 py-0.5 rounded-full">
                                Máx: {ev.max_score} pts
                              </span>
                              {ev.due_date && (
                                <span className="text-[11px] text-[#4a4f57]">
                                  {new Date(ev.due_date).toLocaleDateString('es-ES')}
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-[#1a1a1a] text-xs sm:text-sm truncate mt-1.5">
                              {ev.title}
                            </h4>
                            {ev.description && (
                              <p className="text-[11px] text-[#4a4f57] line-clamp-1 mt-0.5">
                                {ev.description}
                              </p>
                            )}
                          </div>

                          {!isCycleClosed && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEvaluationModal({ isOpen: true, evaluation: ev });
                              }}
                              aria-label={`Editar evaluación ${ev.title}`}
                              className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-[#4a4f57] hover:text-[#0e7c86] hover:bg-white transition-colors flex items-center justify-center"
                              title="Editar evaluación"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna Derecha: Hoja de Calificaciones */}
              <div className="lg:col-span-2">
                {selectedEvaluation ? (
                  <GradingSheet
                    evaluation={selectedEvaluation}
                    enrollments={enrollments}
                    existingGrades={evaluationGrades}
                    isCycleClosed={isCycleClosed}
                    onSave={saveGrades}
                  />
                ) : (
                  <div className="bg-white rounded-3xl border border-[#d4d7dc] p-8 text-center text-[#4a4f57] text-xs">
                    Selecciona una evaluación para ver o asignar calificaciones.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. SECCIÓN: MATERIALES */}
      {/* ============================================================== */}
      {activeTab === 'materiales' && cycleId && (
        <MaterialsTab cycleId={cycleId} isCycleClosed={isCycleClosed} />
      )}

      {/* ============================================================== */}
      {/* 6. SECCIÓN: TAREAS */}
      {/* ============================================================== */}
      {activeTab === 'tareas' && cycleId && (
        <AssignmentsTab
          cycleId={cycleId}
          isCycleClosed={isCycleClosed}
          enrollments={enrollments}
        />
      )}

      {/* ============================================================== */}
      {/* 7. SECCIÓN: RESUMEN ACADÉMICO */}
      {/* ============================================================== */}
      {activeTab === 'resumen' && (
        <AcademicSummaryTab
          summaryList={academicSummary}
          enrollments={enrollments}
          courseCriteria={
            cycle.course
              ? {
                  title: cycle.course.title,
                  passing_grade: cycle.course.passing_grade,
                  min_attendance_pct: cycle.course.min_attendance_pct,
                }
              : null
          }
          onRefresh={refreshSummary}
        />
      )}


      {/* ============================================================== */}
      {/* MODALES */}
      {/* ============================================================== */}
      {/* Modal Inscribir Alumno */}
      {isEnrollModalOpen && (
        <EnrollmentModal
          candidates={candidatePersons}
          enrolledPersonIds={enrollments.map((e) => e.person_id)}
          onEnroll={enrollPerson}
          onClose={() => setIsEnrollModalOpen(false)}
        />
      )}

      {/* Modal Sesión */}
      {sessionModal.isOpen && (
        <SessionModal
          session={sessionModal.session}
          onSave={async (data) => {
            if (sessionModal.session) {
              return updateSession(sessionModal.session.id, data);
            }
            return createSession(data);
          }}
          onClose={() => setSessionModal({ isOpen: false, session: null })}
        />
      )}

      {/* Modal Evaluación */}
      {evaluationModal.isOpen && (
        <EvaluationModal
          evaluation={evaluationModal.evaluation}
          onSave={async (data) => {
            if (evaluationModal.evaluation) {
              return updateEvaluation(evaluationModal.evaluation.id, data);
            }
            return createEvaluation(data);
          }}
          onClose={() => setEvaluationModal({ isOpen: false, evaluation: null })}
        />
      )}
    </div>
  );
};
