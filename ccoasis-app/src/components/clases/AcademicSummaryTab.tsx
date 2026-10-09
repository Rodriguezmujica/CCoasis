import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  EnrollmentWithPerson,
  CycleAcademicSummary,
} from '../../types/classroom';

interface AcademicSummaryTabProps {
  summaryList: CycleAcademicSummary[];
  enrollments: EnrollmentWithPerson[];
  courseCriteria: {
    title: string;
    passing_grade: number;
    min_attendance_pct: number;
  } | null;
  onRefresh: () => Promise<void>;
}

export const AcademicSummaryTab: React.FC<AcademicSummaryTabProps> = ({
  summaryList,
  enrollments,
  courseCriteria,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Combinar alumnos inscritos con los cálculos de la vista v_cycle_grades_summary
  const combined = enrollments.map((enrollment) => {
    const summary = summaryList.find((s) => s.enrollment_id === enrollment.id);
    return {
      enrollment,
      person: enrollment.person,
      averageGrade: summary ? summary.average_grade : 0,
      attendancePct: summary ? summary.attendance_percentage : 100,
      passed: summary ? summary.passed : false,
      hasSummary: Boolean(summary),
    };
  });

  const passingGrade = courseCriteria?.passing_grade ?? 70;
  const minAttendance = courseCriteria?.min_attendance_pct ?? 75;

  return (
    <div className="space-y-4">
      {/* Banner de Criterios del Curso */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Criterios Académicos del Curso ({courseCriteria?.title || 'Curso'})
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            La vista oficial <code>v_cycle_grades_summary</code> normaliza automáticamente las notas
            a escala 0-100 y calcula la asistencia sobre las sesiones impartidas.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-2 text-xs font-semibold bg-white px-3 py-2 rounded-xl border border-blue-200 shadow-xs">
            <span className="text-slate-500">Nota mínima:</span>
            <span className="text-blue-700">{passingGrade} pts</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Asistencia mínima:</span>
            <span className="text-blue-700">{minAttendance}%</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 transition-colors shadow-xs disabled:opacity-50"
            title="Recalcular resumen académico"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contenido: Si no hay inscritos */}
      {combined.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          No hay alumnos inscritos en este ciclo para mostrar en el resumen académico.
        </div>
      ) : (
        <>
          {/* Tarjetas Mobile First */}
          <div className="grid grid-cols-1 md:hidden gap-3">
            {combined.map((item) => {
              const meetsGrade = item.averageGrade >= passingGrade;
              const meetsAttendance = item.attendancePct >= minAttendance;

              return (
                <div
                  key={item.enrollment.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {item.person.first_name} {item.person.last_name}
                      </h4>
                      {item.person.email && (
                        <p className="text-xs text-slate-400">{item.person.email}</p>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.passed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {item.passed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprobado</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>No Aprobado</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Métricas del alumno */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-slate-500 font-medium">Asistencia:</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`font-bold ${
                            meetsAttendance ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {Number(item.attendancePct).toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (min {minAttendance}%)
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-500 font-medium">Promedio:</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`font-bold ${
                            meetsGrade ? 'text-blue-700' : 'text-rose-700'
                          }`}
                        >
                          {Number(item.averageGrade).toFixed(1)} pts
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (min {passingGrade})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla para Escritorio */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Alumno</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Estado Inscripción</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Asistencia Acumulada</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Promedio (0-100)</th>
                  <th className="px-5 py-3.5 font-semibold text-center">Resultado Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {combined.map((item) => {
                  const meetsGrade = item.averageGrade >= passingGrade;
                  const meetsAttendance = item.attendancePct >= minAttendance;

                  return (
                    <tr key={item.enrollment.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">
                          {item.person.first_name} {item.person.last_name}
                        </div>
                        {item.person.email && (
                          <div className="text-xs text-slate-400">{item.person.email}</div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.enrollment.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-bold text-sm ${
                              meetsAttendance ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {Number(item.attendancePct).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Req: {minAttendance}%
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-bold text-sm ${
                              meetsGrade ? 'text-blue-700' : 'text-rose-700'
                            }`}
                          >
                            {Number(item.averageGrade).toFixed(1)} pts
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Req: {passingGrade} pts
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            item.passed
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {item.passed ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Aprobado</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span>No Aprobado</span>
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Nota informativa al pie */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span>
          Este resumen es calculado en tiempo real directamente por la vista{' '}
          <code>public.v_cycle_grades_summary</code> de Supabase PostgreSQL conforme al reglamento del curso.
        </span>
      </div>
    </div>
  );
};
