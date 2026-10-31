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
  Archive,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
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
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const { confirm } = useConfirm();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('ciclos');
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });

  // Data hooks
  const {
    courses,
    isLoading: isLoadingCourses,
    error: coursesError,
    searchQuery: coursesSearch,
    setSearchQuery: setCoursesSearch,
    showArchived: showArchivedCourses,
    setShowArchived: setShowArchivedCourses,
    refresh: refreshCourses,
    createCourse,
    updateCourse,
    softDeleteCourse,
    restoreCourse,
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
    showArchived: showArchivedCycles,
    setShowArchived: setShowArchivedCycles,
    refresh: refreshCycles,
    createCycle,
    updateCycle,
    updateCycleStatus,
    softDeleteCycle,
    restoreCycle,
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

  const handleRestoreCourse = async (course: Course) => {
    const ok = await confirm({
      title: '¿Restaurar curso del catálogo?',
      message: `El curso "${course.title}" volverá a estar disponible en el catálogo activo para abrir nuevos ciclos formativos.`,
      confirmText: 'Sí, restaurar',
      cancelText: 'Cancelar',
      variant: 'primary',
    });
    if (!ok) return;

    const res = await restoreCourse(course.id);
    if (res.ok) {
      toast.success(`Curso "${course.title}" restaurado correctamente.`);
    } else {
      toast.error(res.error || 'No se pudo restaurar el curso.');
    }
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

  const handleRestoreCycle = async (cycle: CycleWithDetails) => {
    const ok = await confirm({
      title: '¿Restaurar ciclo de clases?',
      message: `El ciclo "${cycle.name}" volverá a estar activo y disponible para alumnos y maestros.`,
      confirmText: 'Sí, restaurar',
      cancelText: 'Cancelar',
      variant: 'primary',
    });
    if (!ok) return;

    const res = await restoreCycle(cycle.id);
    if (res.ok) {
      toast.success(`Ciclo "${cycle.name}" restaurado correctamente.`);
    } else {
      toast.error(res.error || 'No se pudo restaurar el ciclo.');
    }
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
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header General */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[12px] bg-[#0e7c86] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[25px] leading-[1.2] font-extrabold oasis-text-gradient tracking-tight">
              Gestión de Clases y Discipulado
            </h1>
            <p className="text-[14px] text-[#4a4f57] mt-0.5">
              Administra el catálogo de cursos formativos y la apertura de ciclos activos.
            </p>
          </div>
        </div>

        {/* Botón de acción principal adaptativo */}
        <div className="flex items-center gap-2">
          {activeTab === 'ciclos' ? (
            showArchivedCycles ? (
              <button
                onClick={() => setShowArchivedCycles(false)}
                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] shadow-2xs transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-[#4a4f57]" />
                <span>Ver Ciclos Activos</span>
              </button>
            ) : (
              <button
                onClick={() => setModal({ kind: 'createCycle' })}
                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-extrabold text-white bg-[#0e7c86] hover:bg-[#0a5961] shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuevo ciclo</span>
              </button>
            )
          ) : (
            showArchivedCourses ? (
              <button
                onClick={() => setShowArchivedCourses(false)}
                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] shadow-2xs transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-[#4a4f57]" />
                <span>Ver Cursos Activos</span>
              </button>
            ) : (
              <button
                onClick={() => setModal({ kind: 'createCourse' })}
                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-extrabold text-white bg-[#0e7c86] hover:bg-[#0a5961] shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Crear Nuevo Curso</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Selector de pestañas: Ciclos vs Cursos */}
      <div className="border-b border-[#d4d7dc]">
        <nav className="flex gap-2 overflow-x-auto pb-0.5" aria-label="Pestañas de Clases">
          <button
            onClick={() => setActiveTab('ciclos')}
            className={`min-h-[44px] py-2.5 px-4 border-b-[3px] text-sm flex items-center gap-2 rounded-t-xl whitespace-nowrap transition-colors ${
              activeTab === 'ciclos'
                ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
                : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Ciclos y Cohortes</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                activeTab === 'ciclos'
                  ? showArchivedCycles
                    ? 'bg-amber-100 text-amber-950 border border-amber-600'
                    : 'bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]'
                  : 'bg-[#eef0f3] text-[#4a4f57]'
              }`}
            >
              {cycles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cursos')}
            className={`min-h-[44px] py-2.5 px-4 border-b-[3px] text-sm flex items-center gap-2 rounded-t-xl whitespace-nowrap transition-colors ${
              activeTab === 'cursos'
                ? 'border-[#0e7c86] text-[#0e7c86] bg-[#d9f7f8]/50 font-extrabold'
                : 'border-transparent text-[#4a4f57] hover:text-[#1a1a1a] hover:bg-white/60 font-bold'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Catálogo de Cursos</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                activeTab === 'cursos'
                  ? showArchivedCourses
                    ? 'bg-amber-100 text-amber-950 border border-amber-600'
                    : 'bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]'
                  : 'bg-[#eef0f3] text-[#4a4f57]'
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
          <div className="bg-white rounded-3xl border border-[#d4d7dc] p-4 flex flex-col sm:flex-row gap-3 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4f57]" />
              <input
                type="text"
                value={cyclesSearch}
                onChange={(e) => setCyclesSearch(e.target.value)}
                placeholder="Buscar por nombre de cohorte..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder:text-[#4a4f57] focus:outline-none focus:ring-2 focus:ring-[#ae4a84] bg-white"
              />
            </div>

            {/* Filtro por estado */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as CycleStatus | 'todos')}
                  aria-label="Filtrar ciclos por estado"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#858a93] text-base font-medium text-[#1a1a1a] bg-white hover:border-[#4a4f57] focus:outline-none focus:ring-2 focus:ring-[#ae4a84]"
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
                  aria-label="Filtrar ciclos por curso"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#858a93] text-base font-medium text-[#1a1a1a] bg-white hover:border-[#4a4f57] focus:outline-none focus:ring-2 focus:ring-[#ae4a84]"
                >
                  <option value="todos">Todos los cursos</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro / Botón Ver archivados (solo admin) */}
              {isAdmin && (
                <button
                  onClick={() => setShowArchivedCycles(!showArchivedCycles)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    showArchivedCycles
                      ? 'bg-amber-100 border-amber-600 text-amber-950 hover:bg-amber-200 shadow-2xs'
                      : 'bg-white border-[#858a93] text-[#1a1a1a] hover:bg-[#f5f5f5]'
                  }`}
                  title={showArchivedCycles ? 'Volver a ciclos activos' : 'Ver ciclos archivados / eliminados'}
                >
                  {showArchivedCycles ? (
                    <>
                      <RotateCcw className="w-4 h-4 text-amber-900" />
                      <span>Ver activos</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 text-[#4a4f57]" />
                      <span>Ver archivados</span>
                    </>
                  )}
                </button>
              )}

              {/* Recargar */}
              <button
                onClick={() => refreshCycles()}
                disabled={isLoadingCycles}
                aria-label="Actualizar lista de ciclos"
                className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl border border-[#858a93] text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 flex items-center justify-center"
                title="Actualizar lista de ciclos"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingCycles ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Banner de modo archivado */}
          {showArchivedCycles && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-800 flex-shrink-0" />
                <span>
                  Visualizando <strong>ciclos archivados / eliminados</strong>. Pulsa &quot;Restaurar&quot; en cualquier ciclo para reactivarlo en el aula virtual.
                </span>
              </div>
              <button
                onClick={() => setShowArchivedCycles(false)}
                className="self-start sm:self-auto min-h-[40px] px-3.5 py-1.5 bg-amber-200 hover:bg-amber-300 font-bold rounded-xl text-amber-950 transition-colors"
              >
                Volver a ciclos activos
              </button>
            </div>
          )}

          {/* Error Banner */}
          {cyclesError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold">Error al cargar ciclos:</p>
                <p>{cyclesError}</p>
              </div>
            </div>
          )}

          {/* Contenido Ciclos: Loading o Lista */}
          {isLoadingCycles ? (
            <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center">
              <Loader2 className="w-8 h-8 text-[#0e7c86] animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#4a4f57]">Cargando ciclos...</p>
            </div>
          ) : cycles.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center">
              {showArchivedCycles ? (
                <>
                  <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-[#1a1a1a] mb-1">
                    No hay ciclos archivados
                  </h3>
                  <p className="text-sm text-[#4a4f57] max-w-md mx-auto mb-4">
                    La papelera de ciclos está vacía. Todos los ciclos registrados se encuentran activos.
                  </p>
                  <button
                    onClick={() => setShowArchivedCycles(false)}
                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#1a1a1a] bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Volver a ciclos activos</span>
                  </button>
                </>
              ) : (
                <>
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-[#1a1a1a] mb-1">
                    No hay ciclos registrados
                  </h3>
                  <p className="text-sm text-[#4a4f57] max-w-md mx-auto mb-4">
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
                      className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold text-white bg-[#0e7c86] hover:bg-[#0a5961]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Primero debes crear un Curso</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setModal({ kind: 'createCycle' })}
                      className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold text-white bg-[#0e7c86] hover:bg-[#0a5961]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Nuevo ciclo</span>
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {/* Tarjetas táctiles para móvil */}
              <div className="grid grid-cols-1 md:hidden gap-3.5">
                {cycles.map((cycle) => {
                  const isClosed = cycle.status === 'cerrado';
                  return (
                    <div
                      key={cycle.id}
                      className={`bg-white rounded-3xl border p-5 shadow-xs transition-all ${
                        isClosed ? 'border-[#d4d7dc] bg-slate-50/70' : 'border-[#d4d7dc]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                                CYCLE_STATUS_COLORS[cycle.status]
                              }`}
                            >
                              {CYCLE_STATUS_OPTIONS.find((o) => o.value === cycle.status)?.label ||
                                cycle.status}
                            </span>
                            {isClosed && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md">
                                <Lock className="w-3 h-3" /> Solo lectura
                              </span>
                            )}
                          </div>
                          <h3 className="font-extrabold text-[#1a1a1a] text-base mt-1.5">{cycle.name}</h3>
                          <p className="text-xs font-bold text-[#0e7c86]">
                            {cycle.course?.title || 'Curso sin título'}
                          </p>
                        </div>
                      </div>

                      {/* Detalles en móvil */}
                      <div className="space-y-1.5 text-xs text-[#4a4f57] my-3 bg-[#f5f5f5]/70 p-3 rounded-2xl border border-[#e5e7eb]">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[#0e7c86]" />
                          <span>
                            Maestro:{' '}
                            <strong className="text-[#1a1a1a]">
                              {cycle.teacher
                                ? `${cycle.teacher.first_name} ${cycle.teacher.last_name}`
                                : 'No asignado'}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#0e7c86]" />
                          <span>
                            {formatDate(cycle.start_date)}{' '}
                            {cycle.end_date ? `hasta ${formatDate(cycle.end_date)}` : '(En curso)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0e7c86]" />
                          <span>
                            Alumnos inscritos:{' '}
                            <strong className="text-[#1a1a1a]">
                              {cycle.enrollments_count ?? 0}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Botones de acción móvil - Grandes y táctiles */}
                      {showArchivedCycles ? (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          {cycle.deleted_at && (
                            <div className="text-xs text-rose-800 font-bold flex items-center gap-1.5">
                              <Archive className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Archivado el {formatDate(cycle.deleted_at)}</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleRestoreCycle(cycle)}
                            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-colors shadow-xs"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restaurar Ciclo</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Botón Gestión del Aula - Mobile First */}
                          <button
                            onClick={() => navigate(`/clases/ciclo/${cycle.id}`)}
                            className="w-full min-h-[44px] mb-3 flex items-center justify-center gap-2 py-2.5 px-3 bg-[#d9f7f8] hover:bg-[#c2f0f2] text-[#0a5961] border border-[#0e7c86] font-extrabold text-xs rounded-xl transition-colors"
                          >
                            <GraduationCap className="w-4 h-4" />
                            <span>Gestionar Aula ({cycle.enrollments_count ?? 0} alumnos)</span>
                          </button>

                          <div className="flex items-center gap-2 pt-2 border-t border-[#e5e7eb]">
                            {/* Selector rápido de estado */}
                            <div className="relative flex-1">
                              <select
                                value={cycle.status}
                                onChange={(e) =>
                                  updateCycleStatus(cycle.id, e.target.value as CycleStatus)
                                }
                                aria-label={`Cambiar estado del ciclo ${cycle.name}`}
                                className="w-full min-h-[44px] text-base py-2 px-3 rounded-xl border border-[#858a93] bg-white font-semibold text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#ae4a84]"
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
                              aria-label={`Editar ciclo ${cycle.name}`}
                              className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl border border-[#d4d7dc] text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors flex items-center justify-center"
                              title="Editar ciclo"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setModal({ kind: 'deleteCycle', cycle })}
                              aria-label={`Archivar ciclo ${cycle.name}`}
                              className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors flex items-center justify-center"
                              title="Archivar ciclo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tabla para pantallas de escritorio */}
              <div className="hidden md:block bg-white rounded-3xl border border-[#d4d7dc] shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f5f5f5] text-[#4a4f57] border-b border-[#d4d7dc] text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 font-extrabold">Ciclo / Cohorte</th>
                      <th className="px-4 py-3.5 font-extrabold">Curso Base</th>
                      <th className="px-4 py-3.5 font-extrabold">Maestro Asignado</th>
                      <th className="px-4 py-3.5 font-extrabold">Fechas</th>
                      <th className="px-4 py-3.5 font-extrabold">Estado</th>
                      <th className="px-4 py-3.5 font-extrabold text-center">Inscritos</th>
                      <th className="px-5 py-3.5 font-extrabold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {cycles.map((cycle) => {
                      const isClosed = cycle.status === 'cerrado';
                      return (
                        <tr
                          key={cycle.id}
                          className={`hover:bg-[#f5f5f5]/70 transition-colors ${
                            isClosed ? 'bg-slate-50/50 text-[#4a4f57]' : ''
                          }`}
                        >
                          <td className="px-5 py-4">
                            {showArchivedCycles ? (
                              <div>
                                <span className="font-extrabold text-[#1a1a1a]">{cycle.name}</span>
                                {cycle.deleted_at && (
                                  <span className="block text-[11px] font-bold text-rose-700 mt-0.5">
                                    Archivado el {formatDate(cycle.deleted_at)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => navigate(`/clases/ciclo/${cycle.id}`)}
                                  className="font-extrabold text-[#1a1a1a] hover:text-[#0e7c86] text-left transition-colors flex items-center gap-1.5 group"
                                  title="Abrir aula del ciclo"
                                >
                                  <span>{cycle.name}</span>
                                  <GraduationCap className="w-4 h-4 text-[#0e7c86] opacity-70 group-hover:opacity-100 transition-opacity" />
                                </button>
                                {isClosed && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4a4f57] mt-0.5">
                                    <Lock className="w-3 h-3" /> Bloqueado por cierre
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                          <td className="px-4 py-4 text-[#1a1a1a] font-semibold">
                            {cycle.course?.title || '—'}
                          </td>
                          <td className="px-4 py-4 text-[#1a1a1a]">
                            {cycle.teacher ? (
                              <div>
                                <div className="font-semibold text-[#1a1a1a]">
                                  {cycle.teacher.first_name} {cycle.teacher.last_name}
                                </div>
                                {cycle.teacher.email && (
                                  <div className="text-xs text-[#4a4f57]">
                                    {cycle.teacher.email}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-800 font-bold text-xs">
                                Sin maestro
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-[#4a4f57] text-xs">
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
                                aria-label={`Cambiar estado del ciclo ${cycle.name}`}
                                className={`min-h-[40px] text-xs py-1.5 px-2.5 rounded-xl font-extrabold border ${
                                  CYCLE_STATUS_COLORS[cycle.status]
                                } focus:outline-none focus:ring-2 focus:ring-[#ae4a84]`}
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
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-extrabold bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]">
                              {cycle.enrollments_count ?? 0}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {showArchivedCycles ? (
                              <button
                                onClick={() => handleRestoreCycle(cycle)}
                                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-600 text-emerald-950 text-xs font-extrabold rounded-xl transition-colors"
                                title="Restaurar ciclo"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restaurar</span>
                              </button>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => navigate(`/clases/ciclo/${cycle.id}`)}
                                  aria-label={`Gestionar aula del ciclo ${cycle.name}`}
                                  className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-[#0e7c86] hover:bg-[#d9f7f8] transition-colors flex items-center justify-center"
                                  title="Gestionar Aula (asistencia, calificaciones y alumnos)"
                                >
                                  <GraduationCap className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setModal({ kind: 'editCycle', cycle })}
                                  aria-label={`Editar ciclo ${cycle.name}`}
                                  className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-[#4a4f57] hover:text-[#0e7c86] hover:bg-[#d9f7f8]/60 transition-colors flex items-center justify-center"
                                  title="Editar ciclo"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setModal({ kind: 'deleteCycle', cycle })}
                                  aria-label={`Archivar ciclo ${cycle.name}`}
                                  className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-[#4a4f57] hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center justify-center"
                                  title="Archivar ciclo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
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
          <div className="bg-white rounded-3xl border border-[#d4d7dc] p-4 flex flex-col sm:flex-row gap-3 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4f57]" />
              <input
                type="text"
                value={coursesSearch}
                onChange={(e) => setCoursesSearch(e.target.value)}
                placeholder="Buscar por título o descripción del curso..."
                className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder:text-[#4a4f57] focus:outline-none focus:ring-2 focus:ring-[#ae4a84] bg-white"
              />
            </div>

            {/* Filtro / Botón Ver archivados (solo admin) */}
            {isAdmin && (
              <button
                onClick={() => setShowArchivedCourses(!showArchivedCourses)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-1.5 self-end sm:self-auto ${
                  showArchivedCourses
                    ? 'bg-amber-100 border-amber-600 text-amber-950 hover:bg-amber-200 shadow-2xs'
                    : 'bg-white border-[#858a93] text-[#1a1a1a] hover:bg-[#f5f5f5]'
                }`}
                title={showArchivedCourses ? 'Volver a cursos activos' : 'Ver cursos archivados / eliminados'}
              >
                {showArchivedCourses ? (
                  <>
                    <RotateCcw className="w-4 h-4 text-amber-900" />
                    <span>Ver activos</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 text-[#4a4f57]" />
                    <span>Ver archivados</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => refreshCourses()}
              disabled={isLoadingCourses}
              aria-label="Actualizar catálogo de cursos"
              className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl border border-[#858a93] text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 self-end sm:self-auto flex items-center justify-center"
              title="Actualizar catálogo"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCourses ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Banner de modo archivado */}
          {showArchivedCourses && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-800 flex-shrink-0" />
                <span>
                  Visualizando <strong>cursos del catálogo archivados / eliminados</strong>. Pulsa &quot;Restaurar&quot; para reactivar cualquier materia en el catálogo.
                </span>
              </div>
              <button
                onClick={() => setShowArchivedCourses(false)}
                className="self-start sm:self-auto min-h-[40px] px-3.5 py-1.5 bg-amber-200 hover:bg-amber-300 font-bold rounded-xl text-amber-950 transition-colors"
              >
                Volver a activos
              </button>
            </div>
          )}

          {/* Error Banner */}
          {coursesError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold">Error al cargar cursos:</p>
                <p>{coursesError}</p>
              </div>
            </div>
          )}

          {/* Loading o Lista de Cursos */}
          {isLoadingCourses ? (
            <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center">
              <Loader2 className="w-8 h-8 text-[#0e7c86] animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#4a4f57]">Cargando cursos...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center">
              {showArchivedCourses ? (
                <>
                  <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-[#1a1a1a] mb-1">
                    No hay cursos archivados
                  </h3>
                  <p className="text-sm text-[#4a4f57] max-w-md mx-auto mb-4">
                    La papelera de cursos está vacía. Todos los cursos del catálogo se encuentran activos.
                  </p>
                  <button
                    onClick={() => setShowArchivedCourses(false)}
                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#1a1a1a] bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Volver a cursos activos</span>
                  </button>
                </>
              ) : (
                <>
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-[#1a1a1a] mb-1">
                    No hay cursos en el catálogo
                  </h3>
                  <p className="text-sm text-[#4a4f57] max-w-md mx-auto mb-4">
                    Define las materias y asignaturas de la iglesia con sus requisitos de aprobación y asistencia.
                  </p>
                  <button
                    onClick={() => setModal({ kind: 'createCourse' })}
                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold text-white bg-[#0e7c86] hover:bg-[#0a5961]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Primer Curso</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Tarjetas de Cursos para Móvil */}
              <div className="grid grid-cols-1 md:hidden gap-3.5">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-3xl border border-[#d4d7dc] p-5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-extrabold text-[#1a1a1a] text-base">{course.title}</h3>
                        {course.description && (
                          <p className="text-xs text-[#4a4f57] mt-1 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 my-3 text-xs bg-[#f5f5f5]/70 p-3 rounded-2xl border border-[#e5e7eb]">
                      <div className="flex items-center gap-1.5 text-[#1a1a1a]">
                        <Award className="w-3.5 h-3.5 text-amber-700" />
                        <span>
                          Aprobación: <strong>{course.passing_grade} pts</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#1a1a1a]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>
                          Asistencia: <strong>{course.min_attendance_pct}%</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e5e7eb]">
                      {showArchivedCourses ? (
                        <div className="w-full space-y-2">
                          {course.deleted_at && (
                            <div className="text-xs text-rose-800 font-bold flex items-center gap-1.5">
                              <Archive className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Archivado el {formatDate(course.deleted_at)}</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleRestoreCourse(course)}
                            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-colors shadow-xs"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restaurar Curso</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setModal({ kind: 'editCourse', course })}
                            aria-label={`Editar curso ${course.title}`}
                            className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#d4d7dc] text-xs font-extrabold text-[#1a1a1a] hover:bg-[#f5f5f5]"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#0e7c86]" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => setModal({ kind: 'deleteCourse', course })}
                            aria-label={`Archivar curso ${course.title}`}
                            className="min-w-[44px] min-h-[44px] py-2 px-3 rounded-xl border border-rose-300 text-xs font-extrabold text-rose-700 hover:bg-rose-50 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla de Cursos para Escritorio */}
              <div className="hidden md:block bg-white rounded-3xl border border-[#d4d7dc] shadow-xs overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f5f5f5] text-[#4a4f57] border-b border-[#d4d7dc] text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5 font-extrabold">Título del Curso</th>
                      <th className="px-4 py-3.5 font-extrabold">Descripción</th>
                      <th className="px-4 py-3.5 font-extrabold text-center">Nota Mínima</th>
                      <th className="px-4 py-3.5 font-extrabold text-center">Asistencia Mínima</th>
                      <th className="px-5 py-3.5 font-extrabold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-[#f5f5f5]/70 transition-colors">
                        <td className="px-5 py-4 font-extrabold text-[#1a1a1a]">
                          {course.title}
                          {showArchivedCourses && course.deleted_at && (
                            <span className="block text-[11px] font-bold text-rose-700 mt-0.5">
                              Archivado el {formatDate(course.deleted_at)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-[#4a4f57] text-xs max-w-md">
                          {course.description || <span className="text-slate-400 italic">Sin descripción</span>}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-950 border border-amber-600">
                            {course.passing_grade} pts
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-600">
                            {course.min_attendance_pct}%
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {showArchivedCourses ? (
                            <button
                              onClick={() => handleRestoreCourse(course)}
                              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-600 text-emerald-950 text-xs font-extrabold rounded-xl transition-colors"
                              title="Restaurar curso"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restaurar</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setModal({ kind: 'editCourse', course })}
                                aria-label={`Editar curso ${course.title}`}
                                className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-[#4a4f57] hover:text-[#0e7c86] hover:bg-[#d9f7f8]/60 transition-colors flex items-center justify-center"
                                title="Editar curso"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setModal({ kind: 'deleteCourse', course })}
                                aria-label={`Archivar curso ${course.title}`}
                                className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-[#4a4f57] hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center justify-center"
                                title="Archivar curso"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
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
