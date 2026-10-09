import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  CheckCheck,
  AlertCircle,
  Loader2,
  Lock,
  MessageSquare,
} from 'lucide-react';
import {
  ClassSession,
  EnrollmentWithPerson,
  AttendanceRecord,
  AttendanceMark,
  ATTENDANCE_MARK_STYLES,
} from '../../types/classroom';

interface AttendanceSheetProps {
  session: ClassSession;
  enrollments: EnrollmentWithPerson[];
  existingAttendance: AttendanceRecord[];
  isCycleClosed: boolean;
  onSave: (
    sessionId: string,
    records: { person_id: string; mark: AttendanceMark; notes?: string }[]
  ) => Promise<{ ok: boolean; error?: string }>;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  session,
  enrollments,
  existingAttendance,
  isCycleClosed,
  onSave,
}) => {
  // Estado local de marcas de asistencia: personId -> { mark, notes }
  const [marks, setMarks] = useState<Record<string, { mark: AttendanceMark; notes: string }>>({});
  const [showNotes, setShowNotes] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar marcas al cambiar de sesión o de registros existentes
  useEffect(() => {
    const initial: Record<string, { mark: AttendanceMark; notes: string }> = {};
    const notesVisibility: Record<string, boolean> = {};

    enrollments.forEach((e) => {
      const found = existingAttendance.find((a) => a.person_id === e.person_id);
      if (found) {
        initial[e.person_id] = {
          mark: found.mark,
          notes: found.notes || '',
        };
        if (found.notes) {
          notesVisibility[e.person_id] = true;
        }
      } else {
        // Por defecto ausente si no está guardado aún
        initial[e.person_id] = {
          mark: 'ausente',
          notes: '',
        };
      }
    });

    setMarks(initial);
    setShowNotes(notesVisibility);
    setSaveSuccess(false);
    setError(null);
  }, [session.id, enrollments, existingAttendance]);

  const handleMarkChange = (personId: string, mark: AttendanceMark) => {
    if (isCycleClosed) return;
    setMarks((prev) => ({
      ...prev,
      [personId]: {
        mark,
        notes: prev[personId]?.notes || '',
      },
    }));
    setSaveSuccess(false);
  };

  const handleNotesChange = (personId: string, notes: string) => {
    if (isCycleClosed) return;
    setMarks((prev) => ({
      ...prev,
      [personId]: {
        mark: prev[personId]?.mark || 'ausente',
        notes,
      },
    }));
    setSaveSuccess(false);
  };

  const handleMarkAll = (newMark: AttendanceMark) => {
    if (isCycleClosed) return;
    setMarks((prev) => {
      const next = { ...prev };
      enrollments.forEach((e) => {
        next[e.person_id] = {
          mark: newMark,
          notes: prev[e.person_id]?.notes || '',
        };
      });
      return next;
    });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (isCycleClosed) {
      setError('No se puede guardar asistencia porque este ciclo está cerrado.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    const records = enrollments.map((e) => ({
      person_id: e.person_id,
      mark: marks[e.person_id]?.mark || 'ausente',
      notes: marks[e.person_id]?.notes || undefined,
    }));

    const res = await onSave(session.id, records);
    setIsSaving(false);

    if (!res.ok) {
      setError(res.error || 'Error al guardar la asistencia.');
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  // Contadores rápidos para la sesión
  const counts = {
    presentes: enrollments.filter((e) => marks[e.person_id]?.mark === 'presente').length,
    ausentes: enrollments.filter((e) => marks[e.person_id]?.mark === 'ausente').length,
    justificados: enrollments.filter((e) => marks[e.person_id]?.mark === 'justificado').length,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-4 sm:p-6">
      {/* Encabezado de la sesión seleccionada */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {new Date(session.session_date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {isCycleClosed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" /> Solo lectura
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">{session.topic}</h3>
          {session.description && (
            <p className="text-xs text-slate-500 mt-0.5">{session.description}</p>
          )}
        </div>

        {/* Resumen rápido de la sesión */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            {counts.presentes} Presentes
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-semibold border border-rose-200">
            {counts.ausentes} Ausentes
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold border border-amber-200">
            {counts.justificados} Justificados
          </span>
        </div>
      </div>

      {/* Alerta si el ciclo está cerrado */}
      {isCycleClosed && (
        <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span>
            <strong>Ciclo Cerrado:</strong> La asistencia de esta sesión está bloqueada y no se puede modificar.
          </span>
        </div>
      )}

      {/* Mensajes de error o éxito */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Asistencia guardada correctamente en la base de datos.</span>
        </div>
      )}

      {/* Botones de acción rápida por lote (Mobile y Escritorio) */}
      {!isCycleClosed && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll('presente')}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              Marcar todos Presentes
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ausente')}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Marcar todos Ausentes
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Guardar Asistencia</span>
          </button>
        </div>
      )}

      {/* Lista de alumnos para toma de asistencia */}
      {enrollments.length === 0 ? (
        <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500 text-sm">
          No hay alumnos inscritos en este ciclo para tomar asistencia.
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => {
            const person = enrollment.person;
            const currentMark = marks[person.id]?.mark || 'ausente';
            const currentNotes = marks[person.id]?.notes || '';
            const isNoteOpen = showNotes[person.id] || false;

            return (
              <div
                key={enrollment.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  currentMark === 'presente'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : currentMark === 'justificado'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Info del alumno */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {person.first_name[0]}
                      {person.last_name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {person.first_name} {person.last_name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        {person.email && <span>{person.email}</span>}
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                            enrollment.status === 'retirado'
                              ? 'bg-rose-100 text-rose-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {enrollment.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botones táctiles grandes de Asistencia (Mobile First: min-h 44px) */}
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                    {/* Botón Presente */}
                    <button
                      type="button"
                      disabled={isCycleClosed}
                      onClick={() => handleMarkChange(person.id, 'presente')}
                      className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                        currentMark === 'presente'
                          ? ATTENDANCE_MARK_STYLES.presente.active
                          : ATTENDANCE_MARK_STYLES.presente.inactive
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Presente</span>
                    </button>

                    {/* Botón Ausente */}
                    <button
                      type="button"
                      disabled={isCycleClosed}
                      onClick={() => handleMarkChange(person.id, 'ausente')}
                      className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                        currentMark === 'ausente'
                          ? ATTENDANCE_MARK_STYLES.ausente.active
                          : ATTENDANCE_MARK_STYLES.ausente.inactive
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Ausente</span>
                    </button>

                    {/* Botón Justificado */}
                    <button
                      type="button"
                      disabled={isCycleClosed}
                      onClick={() => handleMarkChange(person.id, 'justificado')}
                      className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                        currentMark === 'justificado'
                          ? ATTENDANCE_MARK_STYLES.justificado.active
                          : ATTENDANCE_MARK_STYLES.justificado.inactive
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>Justificado</span>
                    </button>

                    {/* Botón para alternar nota opcional */}
                    {!isCycleClosed && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowNotes((prev) => ({ ...prev, [person.id]: !prev[person.id] }))
                        }
                        className={`hidden sm:flex p-2.5 rounded-xl border transition-colors ${
                          currentNotes
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'border-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Añadir nota de asistencia"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Campo de notas / justificación */}
                {(isNoteOpen || currentNotes) && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                    <input
                      type="text"
                      disabled={isCycleClosed}
                      placeholder="Observación o motivo de justificación..."
                      value={currentNotes}
                      onChange={(e) => handleNotesChange(person.id, e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Botón flotante o inferior para guardar en móvil */}
      {!isCycleClosed && enrollments.length > 0 && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Guardar Asistencia de la Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
};
