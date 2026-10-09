import React, { useState, useEffect } from 'react';
import {
  Plus,
  ClipboardList,
  Pencil,
  Loader2,
  AlertCircle,
  Clock,
  Users,
} from 'lucide-react';
import { Assignment } from '../../types/classroom';
import { EnrollmentWithPerson } from '../../types/classroom';
import { useAssignments } from '../../lib/useAssignments';
import { AssignmentModal } from './AssignmentModal';
import { SubmissionsPanel } from './SubmissionsPanel';

interface AssignmentsTabProps {
  cycleId: string;
  isCycleClosed: boolean;
  enrollments: EnrollmentWithPerson[];
}

export const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
  cycleId,
  isCycleClosed,
  enrollments,
}) => {
  const {
    assignments,
    selectedAssignmentId,
    setSelectedAssignmentId,
    submissions,
    isLoading,
    isLoadingSubmissions,
    error,
    fetchSubmissionsForAssignment,
    createAssignment,
    updateAssignment,
    gradeSubmission,
    getSignedSubmissionUrl,
  } = useAssignments(cycleId, isCycleClosed);

  const [assignmentModal, setAssignmentModal] = useState<{
    isOpen: boolean;
    assignment: Assignment | null;
  }>({ isOpen: false, assignment: null });

  // Cargar entregas cuando cambia la tarea seleccionada
  useEffect(() => {
    if (selectedAssignmentId) {
      // Necesitamos los user_id de cada alumno para construir la URL firmada.
      // La consulta de enrollments en useClassroom no trae user_id de person,
      // así que hacemos el fetch con los enrollments que tenemos.
      fetchSubmissionsForAssignment(selectedAssignmentId, enrollments);
    }
  }, [selectedAssignmentId, fetchSubmissionsForAssignment, enrollments]);

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId) || null;

  const formatDueDate = (due: string | null) => {
    if (!due) return null;
    const d = new Date(due);
    const now = new Date();
    const isPast = d < now;
    return {
      text: d.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      isPast,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-slate-500">Cargando tareas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900 text-base">Tareas del Ciclo</h2>
          <p className="text-xs text-slate-500">
            Crea tareas con fecha límite y revisa las entregas de cada alumno.
          </p>
        </div>
        {!isCycleClosed && (
          <button
            onClick={() => setAssignmentModal({ isOpen: true, assignment: null })}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarea</span>
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado vacío */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-base mb-1">
            No hay tareas en este ciclo
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Crea la primera tarea con instrucciones y fecha límite para que los alumnos puedan entregarla.
          </p>
          {!isCycleClosed && (
            <button
              onClick={() => setAssignmentModal({ isOpen: true, assignment: null })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primera Tarea</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Lista de tareas */}
          <div className="space-y-2.5 lg:col-span-1">
            <div className="text-xs font-bold text-slate-500 px-1">
              Tareas ({assignments.length})
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {assignments.map((asgn) => {
                const isSelected = asgn.id === selectedAssignmentId;
                const dueDateInfo = formatDueDate(asgn.due_date);

                return (
                  <div
                    key={asgn.id}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedAssignmentId(asgn.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                          {asgn.title}
                        </h4>
                        {dueDateInfo && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                              dueDateInfo.isPast ? 'text-red-600' : 'text-slate-500'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {dueDateInfo.text}
                          </span>
                        )}
                        {asgn.instructions && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">{asgn.instructions}</p>
                        )}
                      </div>

                      {!isCycleClosed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignmentModal({ isOpen: true, assignment: asgn });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                          title="Editar tarea"
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

          {/* Columna derecha: Entregas de la tarea seleccionada */}
          <div className="lg:col-span-2">
            {selectedAssignment ? (
              <div className="space-y-4">
                {/* Cabecera de la tarea seleccionada */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-blue-900 text-sm">{selectedAssignment.title}</h3>
                  </div>
                  {selectedAssignment.instructions && (
                    <p className="text-xs text-blue-700 pl-6">{selectedAssignment.instructions}</p>
                  )}
                  {selectedAssignment.due_date && (
                    <p className="text-[11px] text-blue-600 pl-6 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Fecha límite:{' '}
                      {new Date(selectedAssignment.due_date).toLocaleString('es-ES', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                  <p className="text-[11px] text-blue-600 pl-6 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {enrollments.length} alumno{enrollments.length !== 1 ? 's' : ''} inscritos
                  </p>
                </div>

                {/* Panel de entregas */}
                <SubmissionsPanel
                  assignment={selectedAssignment}
                  submissions={submissions}
                  isLoadingSubmissions={isLoadingSubmissions}
                  onGetSignedUrl={getSignedSubmissionUrl}
                  onGrade={gradeSubmission}
                  onRefresh={() =>
                    fetchSubmissionsForAssignment(selectedAssignment.id, enrollments)
                  }
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                Selecciona una tarea de la lista para ver las entregas.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de tarea */}
      {assignmentModal.isOpen && (
        <AssignmentModal
          assignment={assignmentModal.assignment}
          isCycleClosed={isCycleClosed}
          onSave={async (data) => {
            if (assignmentModal.assignment) {
              return updateAssignment(assignmentModal.assignment.id, data);
            }
            return createAssignment(data);
          }}
          onClose={() => setAssignmentModal({ isOpen: false, assignment: null })}
        />
      )}
    </div>
  );
};
