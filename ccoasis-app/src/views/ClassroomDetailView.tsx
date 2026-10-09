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
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Cargando aula del ciclo...</p>
      </div>
    );
  }

  if (error || !cycle) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <button
          onClick={() => navigate('/clases')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Clases</span>
        </button>
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 space-y-2">
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Botón Volver y Cabecera del Ciclo */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/clases')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo de Clases</span>
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  CYCLE_STATUS_COLORS[cycle.status]
                }`}
              >
                {CYCLE_STATUS_OPTIONS.find((o) => o.value === cycle.status)?.label || cycle.status}
              </span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {cycle.course?.title || 'Curso sin título'}
              </span>
              {isCycleClosed && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                  <Lock className="w-3 h-3" /> Solo lectura
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {cycle.name}
            </h1>

            <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
              <span>
                Maestro:{' '}
                <strong className="text-slate-800">
                  {cycle.teacher
                    ? `${cycle.teacher.first_name} ${cycle.teacher.last_name}`
                    : 'Sin asignar'}
                </strong>
              </span>
              <span>•</span>
              <span>
                Inicio: {new Date(cycle.start_date).toLocaleDateString('es-ES')}
                {cycle.end_date && ` — Fin: ${new Date(cycle.end_date).toLocaleDateString('es-ES')}`}
              </span>
            </p>
          </div>

          {/* Estadísticas rápidas / badges */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[76px]">
              <div className="text-xs font-bold text-slate-900">
                {enrollments.length} <span className="text-slate-400 font-normal">/ 12</span>
              </div>
              <div className="text-[10px] text-slate-500">Alumnos</div>
            </div>
            <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[76px]">
              <div className="text-xs font-bold text-slate-900">{sessions.length}</div>
              <div className="text-[10px] text-slate-500">Sesiones</div>
            </div>
            <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[76px]">
              <div className="text-xs font-bold text-slate-900">{evaluations.length}</div>
              <div className="text-[10px] text-slate-500">Evaluaciones</div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner de bloqueo si el ciclo está cerrado */}
      {isCycleClosed && (
        <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl text-slate-700 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
          <Lock className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Ciclo Cerrado — Modo Solo Lectura</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Este ciclo se encuentra cerrado. Para preservar la integridad del historial académico,
              las sesiones, registros de asistencia, evaluaciones y calificaciones se encuentran bloqueadas.
            </p>
          </div>
        </div>
      )}

      {/* Selector de Pestañas Internas del Ciclo */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto pb-1" aria-label="Secciones del Aula">
          <button
            onClick={() => setActiveTab('alumnos')}
            className={`py-3 px-2 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'alumnos'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Alumnos</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'alumnos' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {enrollments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sesiones')}
            className={`py-3 px-2 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'sesiones'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Sesiones y Asistencia</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'sesiones' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {sessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('evaluaciones')}
            className={`py-3 px-2 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'evaluaciones'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Evaluaciones y Calificaciones</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'evaluaciones'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {evaluations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('materiales')}
            className={`py-3 px-2 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'materiales'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Materiales</span>
          </button>

          <button
            onClick={() => setActiveTab('tareas')}
            className={`py-3 px-2 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'tareas'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Tareas</span>
          </button>

          <button
            onClick={() => setActiveTab('resumen')}
            className={`py-3 px-2 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'resumen'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
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
              <h2 className="font-bold text-slate-900 text-base">
                Alumnos Inscritos ({enrollments.length}/12)
              </h2>
              <p className="text-xs text-slate-500">
                Alumnos que forman parte activa de este ciclo. Máximo recomendado: 12 personas.
              </p>
            </div>

            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Inscribir Alumno</span>
            </button>
          </div>

          {enrollments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 text-base mb-1">
                No hay alumnos inscritos en este ciclo
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Inscribe miembros activos o visitas para comenzar a registrar su asistencia y evaluaciones.
              </p>
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Inscribir Primer Alumno</span>
              </button>
            </div>
          ) : (
            <>
              {/* Tarjetas táctiles para móvil */}
              <div className="grid grid-cols-1 md:hidden gap-3">
                {enrollments.map((e) => (
                  <div
                    key={e.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {e.person.first_name[0]}
                          {e.person.last_name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {e.person.first_name} {e.person.last_name}
                          </div>
                          {e.person.email && (
                            <div className="text-[11px] text-slate-400">{e.person.email}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-500 font-medium">Estado:</span>
                      <select
                        value={e.status}
                        onChange={(evt) =>
                          updateEnrollmentStatus(e.id, evt.target.value as EnrollmentStatus)
                        }
                        className={`text-xs font-semibold py-1 px-2.5 rounded-xl border ${
                          ENROLLMENT_STATUS_COLORS[e.status]
                        }`}
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
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Alumno</th>
                      <th className="px-4 py-3.5 font-semibold">Contacto</th>
                      <th className="px-4 py-3.5 font-semibold">Estado Congregacional</th>
                      <th className="px-4 py-3.5 font-semibold text-center">Estado de Inscripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {e.person.first_name} {e.person.last_name}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600">
                          <div>{e.person.email || '—'}</div>
                          {e.person.phone && <div className="text-slate-400">{e.person.phone}</div>}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                              e.person.status === 'activo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
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
                            className={`text-xs font-bold py-1 px-3 rounded-xl border ${
                              ENROLLMENT_STATUS_COLORS[e.status]
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
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
              <h2 className="font-bold text-slate-900 text-base">
                Sesiones y Registro de Asistencia
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona una sesión para registrar la asistencia de los alumnos con botones táctiles.
              </p>
            </div>

            {!isCycleClosed && (
              <button
                onClick={() => setSessionModal({ isOpen: true, session: null })}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Sesión</span>
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 text-base mb-1">
                No hay sesiones planificadas
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Crea una sesión de clase con fecha y tema para comenzar a pasar lista.
              </p>
              {!isCycleClosed && (
                <button
                  onClick={() => setSessionModal({ isOpen: true, session: null })}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
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
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <span>Sesiones registradas ({sessions.length})</span>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {sessions.map((sess) => {
                    const isSelected = sess.id === selectedSessionId;
                    return (
                      <div
                        key={sess.id}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedSessionId(sess.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-blue-700 block">
                              {new Date(sess.session_date).toLocaleDateString('es-ES')}
                            </span>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {sess.topic}
                            </h4>
                            {sess.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
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
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar fecha o tema"
                            >
                              <Pencil className="w-3.5 h-3.5" />
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
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
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
              <h2 className="font-bold text-slate-900 text-base">
                Evaluaciones y Calificaciones
              </h2>
              <p className="text-xs text-slate-500">
                Define evaluaciones y califica a los alumnos validando que la nota no exceda el máximo.
              </p>
            </div>

            {!isCycleClosed && (
              <button
                onClick={() => setEvaluationModal({ isOpen: true, evaluation: null })}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Evaluación</span>
              </button>
            )}
          </div>

          {evaluations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 text-base mb-1">
                No hay evaluaciones registradas
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Crea una evaluación (examen, ensayo, tarea calificada) con su puntaje máximo.
              </p>
              {!isCycleClosed && (
                <button
                  onClick={() => setEvaluationModal({ isOpen: true, evaluation: null })}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
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
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <span>Evaluaciones del Ciclo ({evaluations.length})</span>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {evaluations.map((ev) => {
                    const isSelected = ev.id === selectedEvaluationId;
                    return (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedEvaluationId(ev.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.2 rounded-md">
                                Máx: {ev.max_score} pts
                              </span>
                              {ev.due_date && (
                                <span className="text-[10px] text-slate-400">
                                  {new Date(ev.due_date).toLocaleDateString('es-ES')}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate mt-1">
                              {ev.title}
                            </h4>
                            {ev.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
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
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar evaluación"
                            >
                              <Pencil className="w-3.5 h-3.5" />
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
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
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
