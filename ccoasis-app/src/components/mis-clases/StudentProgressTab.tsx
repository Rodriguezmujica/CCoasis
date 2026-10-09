import React from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Estado de aprobación
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Resumen Académico del Ciclo
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {isPassed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Aprobado (Cumple requisitos)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                En curso / Pendiente de cumplimiento
              </span>
            )}
          </div>
        </div>

        {/* Indicadores Clave: Nota Media y Asistencia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Calificación Promedio */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                Nota promedio
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Mínimo exigido: {passingGrade} / 100
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {currentAverage.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 100 ptos</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentAverage >= passingGrade ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(currentAverage, 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 block">
              {currentAverage >= passingGrade
                ? 'Supera la nota mínima establecida.'
                : 'Aún no alcanza el puntaje mínimo de aprobación.'}
            </span>
          </div>

          {/* Porcentaje de Asistencia */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Asistencia acumulada
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Mínimo exigido: {minAttendance}%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {currentAttendancePct.toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500">
                ({attendedCount} de {sessions.length} clases asistidas)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentAttendancePct >= minAttendance ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(currentAttendancePct, 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 block">
              {currentAttendancePct >= minAttendance
                ? 'Cumple con el requisito mínimo de asistencia.'
                : 'Asistencia por debajo del requisito.'}
            </span>
          </div>
        </div>
      </div>

      {/* Sección 1: Desglose de Evaluaciones */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Evaluaciones y Calificaciones
              </h4>
              <p className="text-xs text-slate-500">
                Detalle de notas asignadas por el maestro
              </p>
            </div>
          </div>
        </div>

        {evaluations.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-500 text-center py-6">
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
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {evaluation.title}
                      </span>
                      {evaluation.due_date && (
                        <span className="text-[11px] text-slate-400">
                          · {new Date(evaluation.due_date).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                    {evaluation.description && (
                      <p className="text-xs text-slate-500">{evaluation.description}</p>
                    )}
                    {gradeRecord?.notes && (
                      <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 italic mt-1">
                        Nota del maestro: "{gradeRecord.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
                    {hasScore ? (
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl text-sm font-bold">
                          <span>{gradeRecord.score}</span>
                          <span className="text-xs font-normal text-emerald-600">
                            / {evaluation.max_score}
                          </span>
                        </div>
                        {normalizedPct !== null && (
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            {normalizedPct.toFixed(0)}% equivalente
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        <Clock className="w-3.5 h-3.5" />
                        Sin calificar aún
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sección 2: Desglose de Asistencia por Sesión */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Historial de Asistencia por Clase
              </h4>
              <p className="text-xs text-slate-500">
                Registro de cada sesión realizada en el curso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              {attendedCount} Presentes
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
              {absentCount} Ausentes
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              {justifiedCount} Justificados
            </span>
          </div>
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-500 text-center py-6">
            Aún no se han programado sesiones para este ciclo.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((session, idx) => {
              const record = attendanceMap.get(session.id);
              const mark = record?.mark || null;

              return (
                <div
                  key={session.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {session.topic}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 pl-8">
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
                      <p className="text-xs text-slate-600 pl-8 italic">
                        Observación: "{record.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pl-8 sm:pl-0 flex-shrink-0">
                    {mark === 'presente' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Presente
                      </span>
                    )}

                    {mark === 'ausente' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Ausente
                      </span>
                    )}

                    {mark === 'justificado' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Justificado
                      </span>
                    )}

                    {!mark && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
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
