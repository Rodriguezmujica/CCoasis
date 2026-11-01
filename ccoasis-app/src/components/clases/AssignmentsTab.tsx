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
    deleteAssignment,
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
        <Loader2 className="w-6 h-6 animate-spin text-[#0e7c86] mr-2" />
        <span className="text-sm text-[#4a4f57]">Cargando tareas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-[#1a1a1a] text-base">Tareas del Ciclo</h2>
          <p className="text-xs text-[#4a4f57]">
            Crea tareas con fecha límite y revisa las entregas de cada alumno.
          </p>
        </div>
        {!isCycleClosed && (
          <button
            onClick={() => setAssignmentModal({ isOpen: true, assignment: null })}
            className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0e7c86] text-white rounded-[12px] text-sm font-extrabold hover:bg-[#0a5961] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva tarea</span>
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado vacío */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#1a1a1a] text-base mb-1">
            No hay tareas en este ciclo
          </h3>
          <p className="text-xs text-[#4a4f57] max-w-sm mx-auto mb-4">
            Crea la primera tarea con instrucciones y fecha límite para que los alumnos puedan entregarla.
          </p>
          {!isCycleClosed && (
            <button
              onClick={() => setAssignmentModal({ isOpen: true, assignment: null })}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 bg-[#0e7c86] text-white rounded-[12px] text-sm font-extrabold hover:bg-[#0a5961]"
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
            <div className="text-xs font-extrabold text-[#4a4f57] px-1">
              Tareas ({assignments.length})
            </div>
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {assignments.map((asgn) => {
                const isSelected = asgn.id === selectedAssignmentId;
                const dueDateInfo = formatDueDate(asgn.due_date);

                return (
                  <div
                    key={asgn.id}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#d9f7f8]/70 border-[#0e7c86] shadow-xs'
                        : 'bg-white border-[#d4d7dc] hover:border-[#0e7c86]'
                    }`}
                    onClick={() => setSelectedAssignmentId(asgn.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-extrabold text-[#1a1a1a] text-xs sm:text-sm leading-snug">
                          {asgn.title}
                        </h4>
                        {dueDateInfo && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                              dueDateInfo.isPast ? 'text-rose-700' : 'text-[#4a4f57]'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {dueDateInfo.text}
                          </span>
                        )}
                        {asgn.instructions && (
                          <p className="text-xs text-[#4a4f57] line-clamp-1">{asgn.instructions}</p>
                        )}
                      </div>

                      {!isCycleClosed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignmentModal({ isOpen: true, assignment: asgn });
                          }}
                          aria-label={`Editar tarea ${asgn.title}`}
                          className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-[#4a4f57] hover:text-[#0e7c86] hover:bg-white transition-colors flex-shrink-0 flex items-center justify-center"
                          title="Editar tarea"
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

          {/* Columna derecha: Entregas de la tarea seleccionada */}
          <div className="lg:col-span-2">
            {selectedAssignment ? (
              <div className="space-y-4">
                {/* Cabecera de la tarea seleccionada */}
                <div className="bg-[#d9f7f8]/60 border border-[#0e7c86] rounded-3xl p-5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-[#0e7c86]" />
                    <h3 className="font-extrabold text-[#0a5961] text-base">{selectedAssignment.title}</h3>
                  </div>
                  {selectedAssignment.instructions && (
                    <p className="text-xs text-[#1a1a1a] pl-7 leading-relaxed">{selectedAssignment.instructions}</p>
                  )}
                  {selectedAssignment.due_date && (
                    <p className="text-xs font-bold text-[#0a5961] pl-7 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Fecha límite:{' '}
                      {new Date(selectedAssignment.due_date).toLocaleString('es-ES', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-[#4a4f57] pl-7 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
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
              <div className="bg-white rounded-3xl border border-[#d4d7dc] p-8 text-center text-[#4a4f57] text-xs">
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
          onDelete={
            assignmentModal.assignment
              ? () => deleteAssignment(assignmentModal.assignment!.id)
              : undefined
          }
          onClose={() => setAssignmentModal({ isOpen: false, assignment: null })}
        />
      )}
    </div>
  );
};
