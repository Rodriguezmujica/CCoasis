import React from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import {
  ClassSession,
  AttendanceRecord,
  Evaluation,
  GradeRecord,
  CycleAcademicSummary,
} from '../../types/classroom';

interface StudentProgressTabProps {
  sessions: ClassSession[];
  attendance: AttendanceRecord[];
  evaluations: Evaluation[];
  grades: GradeRecord[];
  summary: CycleAcademicSummary | null;
  courseCriteria: {
    title: string;
    passing_grade: number;
    min_attendance_pct: number;
  } | null;
}

export const StudentProgressTab: React.FC<StudentProgressTabProps> = ({
  sessions,
  attendance,
  evaluations,
  grades,
  summary,
  courseCriteria,
}) => {
  const passingGrade = courseCriteria?.passing_grade ?? 70;
  const minAttendance = courseCriteria?.min_attendance_pct ?? 75;

  const currentAverage = summary ? summary.average_grade : 0;
  const currentAttendancePct = summary ? summary.attendance_percentage : 100;
  const isPassed = summary ? summary.passed : false;

  // Mapa de asistencias por session_id
  const attendanceMap = new Map<string, AttendanceRecord>(
    attendance.map((a) => [a.session_id, a])
  );

  // Mapa de notas por evaluation_id
  const gradesMap = new Map<string, GradeRecord>(
    grades.map((g) => [g.evaluation_id, g])
  );

  // Contadores de asistencia
  const attendedCount = attendance.filter((a) => a.mark === 'presente').length;
  const absentCount = attendance.filter((a) => a.mark === 'ausente').length;
  const justifiedCount = attendance.filter((a) => a.mark === 'justificado').length;

  return (
    <div className="space-y-6">
      {/* Tarjeta de Resumen Global de Aprobación */}
      <div className="bg-white rounded-3xl border border-[#d4d7dc] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#e5e7eb] pb-4">
          <div>
            <span className="text-xs font-extrabold text-[#4a4f57] uppercase tracking-wider block">
              Estado de aprobación
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-[#1a1a1a]">
              Resumen Académico del Ciclo
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {isPassed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-extrabold text-xs bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]">
                <CheckCircle2 className="w-4 h-4 text-[#0e7c86]" />
                Aprobado (Cumple requisitos)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-extrabold text-xs bg-amber-100 text-amber-950 border border-amber-600">
                <AlertTriangle className="w-4 h-4 text-amber-800" />
                En curso / Pendiente de cumplimiento
              </span>
            )}
          </div>
        </div>

        {/* Indicadores Clave: Nota Media y Asistencia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Calificación Promedio */}
          <div className="p-4 rounded-2xl bg-[#f5f5f5] border border-[#d4d7dc] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#0e7c86]" />
                Nota promedio
              </span>
              <span className="text-xs font-bold text-[#4a4f57]">
                Mínimo exigido: {passingGrade} / 100
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a]">
                {currentAverage.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-[#4a4f57]">/ 100 ptos</span>
            </div>
            <div className="w-full bg-[#d4d7dc] rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentAverage >= passingGrade ? 'bg-[#0e7c86]' : 'bg-amber-600'
                }`}
                style={{ width: `${Math.min(currentAverage, 100)}%` }}
              />
            </div>
            <span className="text-xs text-[#4a4f57] block">
              {currentAverage >= passingGrade
                ? 'Supera la nota mínima establecida.'
                : 'Aún no alcanza el puntaje mínimo de aprobación.'}
            </span>
          </div>

          {/* Porcentaje de Asistencia */}
          <div className="p-4 rounded-2xl bg-[#f5f5f5] border border-[#d4d7dc] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                Asistencia acumulada
              </span>
              <span className="text-xs font-bold text-[#4a4f57]">
                Mínimo exigido: {minAttendance}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a]">
                {currentAttendancePct.toFixed(0)}%
              </span>
              <span className="text-xs text-[#4a4f57]">
                ({attendedCount} de {sessions.length} clases asistidas)
              </span>
            </div>
            <div className="w-full bg-[#d4d7dc] rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentAttendancePct >= minAttendance ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
                style={{ width: `${Math.min(currentAttendancePct, 100)}%` }}
              />
            </div>
            <span className="text-xs text-[#4a4f57] block">
              {currentAttendancePct >= minAttendance
                ? 'Cumple con el requisito mínimo de asistencia.'
                : 'Asistencia por debajo del requisito.'}
            </span>
          </div>
        </div>
      </div>

      {/* Sección 1: Desglose de Evaluaciones */}
      <div className="bg-white rounded-3xl border border-[#d4d7dc] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d9f7f8] text-[#0e7c86] border border-[#0e7c86] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#1a1a1a] text-sm sm:text-base">
                Evaluaciones y Calificaciones
              </h4>
              <p className="text-xs text-[#4a4f57]">
                Detalle de notas asignadas por el maestro
              </p>
            </div>
          </div>
        </div>

        {evaluations.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#4a4f57] text-center py-6">
            Aún no hay evaluaciones planificadas en este ciclo.
          </p>
        ) : (
          <div className="space-y-3">
            {evaluations.map((evaluation) => {
              const gradeRecord = gradesMap.get(evaluation.id);
              const hasScore = gradeRecord != null;
              const normalizedPct = hasScore
                ? evaluation.max_score > 0
                  ? (gradeRecord.score / evaluation.max_score) * 100
                  : 0
                : null;

              return (
                <div
                  key={evaluation.id}
                  className="p-4 rounded-2xl border border-[#d4d7dc] bg-[#f5f5f5]/60 hover:bg-[#f5f5f5] transition-colors flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#1a1a1a] text-sm">
                          {evaluation.title}
                        </span>
                        {evaluation.due_date && (
                          <span className="text-xs text-[#4a4f57]">
                            · {new Date(evaluation.due_date).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </div>
                      {evaluation.description && (
                        <p className="text-xs text-[#4a4f57]">{evaluation.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                      {hasScore ? (
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1.5 bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] px-3 py-1 rounded-xl text-sm font-extrabold">
                            <span>{gradeRecord.score}</span>
                            <span className="text-xs font-semibold text-[#0e7c86]">
                              / {evaluation.max_score}
                            </span>
                          </div>
                          {normalizedPct !== null && (
                            <span className="block text-[11px] text-[#4a4f57] mt-0.5">
                              {normalizedPct.toFixed(0)}% equivalente
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          Sin calificar aún
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pastilla / tarjeta accesible con el comentario del profesor */}
                  {gradeRecord?.notes && (
                    <div className="pt-3 border-t border-[#d4d7dc]/70">
                      <div
                        tabIndex={0}
                        role="region"
                        aria-label="Comentarios del profesor sobre tu evaluación"
                        className="p-3.5 bg-[#d9f7f8]/70 border border-[#0e7c86] rounded-2xl flex items-start gap-2.5 text-xs focus-oasis"
                      >
                        <div className="w-6 h-6 rounded-lg bg-[#0e7c86] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <span className="font-extrabold text-[#0a5961] uppercase tracking-wider block text-[11px]">
                            Comentarios / Observaciones del profesor:
                          </span>
                          <p className="text-[#1a1a1a] font-medium leading-relaxed italic">
                            &quot;{gradeRecord.notes}&quot;
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sección 2: Desglose de Asistencia por Sesión */}
      <div className="bg-white rounded-3xl border border-[#d4d7dc] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#e5e7eb] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#1a1a1a] text-sm sm:text-base">
                Historial de Asistencia por Clase
              </h4>
              <p className="text-xs text-[#4a4f57]">
                Registro de cada sesión realizada en el curso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-600 font-extrabold">
              {attendedCount} Presentes
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-950 border border-rose-600 font-extrabold">
              {absentCount} Ausentes
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-600 font-extrabold">
              {justifiedCount} Justificados
            </span>
          </div>
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#4a4f57] text-center py-6">
            Aún no se han programado sesiones para este ciclo.
          </p>
        ) : (
          <div className="divide-y divide-[#e5e7eb]">
            {sessions.map((session, idx) => {
              const record = attendanceMap.get(session.id);
              const mark = record?.mark || null;

              return (
                <div
                  key={session.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 hover:bg-[#f5f5f5]/70 px-3 rounded-2xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86] text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-extrabold text-[#1a1a1a] text-sm">
                        {session.topic}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#4a4f57] pl-8">
                      <span>
                        {new Date(session.session_date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      {session.description && (
                        <span>· {session.description}</span>
                      )}
                    </div>
                    {record?.notes && (
                      <p className="text-xs text-[#1a1a1a] pl-8 italic">
                        Observación: &quot;{record.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="pl-8 sm:pl-0 flex-shrink-0">
                    {mark === 'presente' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                        Presente
                      </span>
                    )}

                    {mark === 'ausente' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-950 border border-rose-600">
                        <XCircle className="w-3.5 h-3.5 text-rose-800" />
                        Ausente
                      </span>
                    )}

                    {mark === 'justificado' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-950 border border-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-800" />
                        Justificado
                      </span>
                    )}

                    {!mark && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
