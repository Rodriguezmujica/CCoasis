import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Users,
  Award,
  Clock,
  CheckCircle2,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCourses } from '../lib/useCourses';
import { useCycles } from '../lib/useCycles';
import {
  Course,
  CourseFormData,
  CycleWithDetails,
  CycleFormData,
  CycleStatus,
  CYCLE_STATUS_OPTIONS,
  CYCLE_STATUS_COLORS,
} from '../types/courses';
import { CourseForm } from '../components/clases/CourseForm';
import { CycleForm } from '../components/clases/CycleForm';
import { DeleteConfirmDialog } from '../components/clases/DeleteConfirmDialog';

type Tab = 'ciclos' | 'cursos';

type ModalState =
  | { kind: 'closed' }
  | { kind: 'createCourse' }
  | { kind: 'editCourse'; course: Course }
  | { kind: 'deleteCourse'; course: Course }
  | { kind: 'createCycle' }
  | { kind: 'editCycle'; cycle: CycleWithDetails }
  | { kind: 'deleteCycle'; cycle: CycleWithDetails };

export const ClasesView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('ciclos');
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });

  // Data hooks
  const {
    courses,
    isLoading: isLoadingCourses,
    error: coursesError,
    searchQuery: coursesSearch,
    setSearchQuery: setCoursesSearch,
    refresh: refreshCourses,
    createCourse,
    updateCourse,
    softDeleteCourse,
  } = useCourses();

  const {
    cycles,
    teachers,
    isLoading: isLoadingCycles,
    error: cyclesError,
    statusFilter,
    setStatusFilter,
    courseFilter,
    setCourseFilter,
    searchQuery: cyclesSearch,
    setSearchQuery: setCyclesSearch,
    refresh: refreshCycles,
    createCycle,
    updateCycle,
    updateCycleStatus,
    softDeleteCycle,
  } = useCycles();

  // Handlers for Course actions
  const handleSaveCourse = async (data: CourseFormData) => {
    if (modal.kind === 'editCourse') {
      return updateCourse(modal.course.id, data);
    }
    return createCourse(data);
  };

  const handleConfirmDeleteCourse = async () => {
    if (modal.kind !== 'deleteCourse') return { ok: false, error: 'No seleccionado' };
    return softDeleteCourse(modal.course.id);
  };

  // Handlers for Cycle actions
  const handleSaveCycle = async (data: CycleFormData) => {
    if (modal.kind === 'editCycle') {
      return updateCycle(modal.cycle.id, data);
    }
    return createCycle(data);
  };

  const handleConfirmDeleteCycle = async () => {
    if (modal.kind !== 'deleteCycle') return { ok: false, error: 'No seleccionado' };
    return softDeleteCycle(modal.cycle.id);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString('es-ES');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header General */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Gestión de Clases y Discipulado
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Administra el catálogo de cursos formativos y la apertura de ciclos activos.
            </p>
          </div>
        </div>

        {/* Botón de acción principal adaptativo */}
        <div className="flex items-center gap-2">
          {activeTab === 'ciclos' ? (
            <button
              onClick={() => setModal({ kind: 'createCycle' })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Abrir Nuevo Ciclo</span>
            </button>
          ) : (
            <button
              onClick={() => setModal({ kind: 'createCourse' })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Curso</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de pestañas: Ciclos vs Cursos */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-4 sm:space-x-8" aria-label="Pestañas de Clases">
          <button
            onClick={() => setActiveTab('ciclos')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'ciclos'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Ciclos y Cohortes</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'ciclos' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {cycles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cursos')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'cursos'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Catálogo de Cursos</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'cursos' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {courses.length}
            </span>
          </button>
        </nav>
      </div>

      {/* ============================================================== */}
      {/* PESTAÑA: CICLOS Y COHORTES */}
      {/* ============================================================== */}
      {activeTab === 'ciclos' && (
        <div className="space-y-4">
          {/* Barra de filtros y búsqueda de ciclos */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={cyclesSearch}
                onChange={(e) => setCyclesSearch(e.target.value)}
                placeholder="Buscar por nombre de cohorte..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Filtro por estado */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as CycleStatus | 'todos')}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los estados</option>
                  {CYCLE_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por curso */}
              <div className="relative">
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los cursos</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recargar */}
              <button
                onClick={() => refreshCycles()}
                disabled={isLoadingCycles}
                className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                title="Actualizar lista de ciclos"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingCycles ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {cyclesError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Error al cargar ciclos:</p>
                <p>{cyclesError}</p>
              </div>
            </div>
          )}

          {/* Contenido Ciclos: Loading o Lista */}
          {isLoadingCycles ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Cargando ciclos...</p>
            </div>
          ) : cycles.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                No hay ciclos registrados
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                {cyclesSearch || statusFilter !== 'todos' || courseFilter !== 'todos'
                  ? 'No se encontraron ciclos con los filtros seleccionados.'
                  : 'Crea tu primer ciclo para comenzar a impartir clases y registrar asistencia.'}
              </p>
              {courses.length === 0 ? (
                <button
                  onClick={() => {
                    setActiveTab('cursos');
                    setModal({ kind: 'createCourse' });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Primero debes crear un Curso</span>
                </button>
              ) : (
                <button
                  onClick={() => setModal({ kind: 'createCycle' })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Nuevo Ciclo</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Tarjetas táctiles para móvil */}
              <div className="grid grid-cols-1 md:hidden gap-3">
                {cycles.map((cycle) => {
                  const isClosed = cycle.status === 'cerrado';
                  return (
                    <div
                      key={cycle.id}
                      className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${
                        isClosed ? 'border-slate-300 bg-slate-50/60' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                CYCLE_STATUS_COLORS[cycle.status]
                              }`}
                            >
                              {CYCLE_STATUS_OPTIONS.find((o) => o.value === cycle.status)?.label ||
                                cycle.status}
                            </span>
                            {isClosed && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                                <Lock className="w-3 h-3" /> Solo lectura
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 text-base mt-1">{cycle.name}</h3>
                          <p className="text-xs font-medium text-blue-600">
                            {cycle.course?.title || 'Curso sin título'}
                          </p>
                        </div>
                      </div>

                      {/* Detalles en móvil */}
                      <div className="space-y-1.5 text-xs text-slate-600 my-3 bg-white/80 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Maestro:{' '}
                            <strong className="text-slate-800">
                              {cycle.teacher
                                ? `${cycle.teacher.first_name} ${cycle.teacher.last_name}`
                                : 'No asignado'}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {formatDate(cycle.start_date)}{' '}
                            {cycle.end_date ? `hasta ${formatDate(cycle.end_date)}` : '(En curso)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Alumnos inscritos:{' '}
                            <strong className="text-slate-800">
                              {cycle.enrollments_count ?? 0}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Botón Gestión del Aula - Mobile First */}
                      <button
                        onClick={() => navigate(`/clases/ciclo/${cycle.id}`)}
                        className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Gestionar Aula ({cycle.enrollments_count ?? 0} alumnos)</span>
                      </button>

                      {/* Botones de acción móvil - Grandes y táctiles */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        {/* Selector rápido de estado */}
                        <div className="relative flex-1">
                          <select
                            value={cycle.status}
                            onChange={(e) =>
                              updateCycleStatus(cycle.id, e.target.value as CycleStatus)
                            }
                            className="w-full text-xs py-2 px-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
                          >
                            {CYCLE_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                Estado: {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => setModal({ kind: 'editCycle', cycle })}
                          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Editar ciclo"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setModal({ kind: 'deleteCycle', cycle })}
                          className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Archivar ciclo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tabla para pantallas de escritorio */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Ciclo / Cohorte</th>
                      <th className="px-4 py-3.5 font-semibold">Curso Base</th>
                      <th className="px-4 py-3.5 font-semibold">Maestro Asignado</th>
                      <th className="px-4 py-3.5 font-semibold">Fechas</th>
                      <th className="px-4 py-3.5 font-semibold">Estado</th>
                      <th className="px-4 py-3.5 font-semibold text-center">Inscritos</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cycles.map((cycle) => {
                      const isClosed = cycle.status === 'cerrado';
                      return (
                        <tr
                          key={cycle.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isClosed ? 'bg-slate-50/40 text-slate-600' : ''
                          }`}
                        >
                          <td className="px-5 py-4">
                            <button
                              onClick={() => navigate(`/clases/ciclo/${cycle.id}`)}
                              className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors flex items-center gap-1.5 group"
                              title="Abrir aula del ciclo"
                            >
                              <span>{cycle.name}</span>
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            {isClosed && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 mt-0.5">
                                <Lock className="w-3 h-3" /> Bloqueado por cierre
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-slate-700 font-medium">
                            {cycle.course?.title || '—'}
                          </td>
                          <td className="px-4 py-4 text-slate-700">
                            {cycle.teacher ? (
                              <div>
                                <div className="font-medium text-slate-800">
                                  {cycle.teacher.first_name} {cycle.teacher.last_name}
                                </div>
                                {cycle.teacher.email && (
                                  <div className="text-xs text-slate-400">
                                    {cycle.teacher.email}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-600 font-medium text-xs">
                                Sin maestro
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-slate-600 text-xs">
                            <div>Desde: {formatDate(cycle.start_date)}</div>
                            <div>Hasta: {formatDate(cycle.end_date)}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={cycle.status}
                                onChange={(e) =>
                                  updateCycleStatus(cycle.id, e.target.value as CycleStatus)
                                }
                                className={`text-xs py-1 px-2 rounded-lg font-semibold border ${
                                  CYCLE_STATUS_COLORS[cycle.status]
                                } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                              >
                                {CYCLE_STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                              {cycle.enrollments_count ?? 0}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => navigate(`/clases/ciclo/${cycle.id}`)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Gestionar Aula (asistencia, calificaciones y alumnos)"
                              >
                                <GraduationCap className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setModal({ kind: 'editCycle', cycle })}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Editar ciclo"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setModal({ kind: 'deleteCycle', cycle })}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Archivar ciclo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA: CATÁLOGO DE CURSOS */}
      {/* ============================================================== */}
      {activeTab === 'cursos' && (
        <div className="space-y-4">
          {/* Barra de búsqueda de cursos */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={coursesSearch}
                onChange={(e) => setCoursesSearch(e.target.value)}
                placeholder="Buscar por título o descripción del curso..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <button
              onClick={() => refreshCourses()}
              disabled={isLoadingCourses}
              className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 self-end sm:self-auto"
              title="Actualizar catálogo"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCourses ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Error Banner */}
          {coursesError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Error al cargar cursos:</p>
                <p>{coursesError}</p>
              </div>
            </div>
          )}

          {/* Loading o Lista de Cursos */}
          {isLoadingCourses ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Cargando cursos...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                No hay cursos en el catálogo
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                Define las materias y asignaturas de la iglesia con sus requisitos de aprobación y asistencia.
              </p>
              <button
                onClick={() => setModal({ kind: 'createCourse' })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Primer Curso</span>
              </button>
            </div>
          ) : (
            <>
              {/* Tarjetas de Cursos para Móvil */}
              <div className="grid grid-cols-1 md:hidden gap-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-base">{course.title}</h3>
                        {course.description && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 my-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          Aprobación: <strong>{course.passing_grade} pts</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          Asistencia: <strong>{course.min_attendance_pct}%</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setModal({ kind: 'editCourse', course })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => setModal({ kind: 'deleteCourse', course })}
                        className="py-2 px-3 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla de Cursos para Escritorio */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Título del Curso</th>
                      <th className="px-4 py-3.5 font-semibold">Descripción</th>
                      <th className="px-4 py-3.5 font-semibold text-center">Nota Mínima</th>
                      <th className="px-4 py-3.5 font-semibold text-center">Asistencia Mínima</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900">{course.title}</td>
                        <td className="px-4 py-4 text-slate-600 text-xs max-w-md">
                          {course.description || <span className="text-slate-400 italic">Sin descripción</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {course.passing_grade} pts
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {course.min_attendance_pct}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setModal({ kind: 'editCourse', course })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar curso"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setModal({ kind: 'deleteCourse', course })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Archivar curso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
      {/* MODALES Y DIÁLOGOS DE CONFIRMACIÓN */}
      {/* ============================================================== */}
      {/* Modal Curso (Crear / Editar) */}
      {(modal.kind === 'createCourse' || modal.kind === 'editCourse') && (
        <CourseForm
          course={modal.kind === 'editCourse' ? modal.course : null}
          onSave={handleSaveCourse}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}

      {/* Modal Ciclo (Crear / Editar) */}
      {(modal.kind === 'createCycle' || modal.kind === 'editCycle') && (
        <CycleForm
          cycle={modal.kind === 'editCycle' ? modal.cycle : null}
          courses={courses}
          teachers={teachers}
          onSave={handleSaveCycle}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}

      {/* Diálogo Soft-delete Curso */}
      {modal.kind === 'deleteCourse' && (
        <DeleteConfirmDialog
          title="Archivar Curso del Catálogo"
          itemName={modal.course.title}
          itemType="curso"
          extraWarning="Si existen ciclos históricos o en curso con este curso, los datos se preservarán pero no se podrá abrir nuevos ciclos con él."
          onConfirm={handleConfirmDeleteCourse}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}

      {/* Diálogo Soft-delete Ciclo */}
      {modal.kind === 'deleteCycle' && (
        <DeleteConfirmDialog
          title="Archivar Ciclo de Clases"
          itemName={modal.cycle.name}
          itemType="ciclo"
          extraWarning={
            modal.cycle.enrollments_count && modal.cycle.enrollments_count > 0
              ? `Este ciclo cuenta con ${modal.cycle.enrollments_count} alumnos vinculados. Se mantendrá el historial de notas y asistencias.`
              : undefined
          }
          onConfirm={handleConfirmDeleteCycle}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
    </div>
  );
};
