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
      <div className="bg-white border border-[#d4d7dc] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#0e7c86]" />
            <h3 className="font-extrabold text-[#1a1a1a] text-sm sm:text-base">
              Criterios Académicos del Curso ({courseCriteria?.title || 'Curso'})
            </h3>
          </div>
          <p className="text-xs text-[#4a4f57]">
            La vista oficial <code>v_cycle_grades_summary</code> normaliza automáticamente las notas
            a escala 0-100 y calcula la asistencia sobre las sesiones impartidas.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-2 text-xs font-extrabold bg-[#f5f5f5] px-3.5 py-2.5 rounded-xl border border-[#d4d7dc]">
            <span className="text-[#4a4f57]">Nota mínima:</span>
            <span className="text-[#0e7c86]">{passingGrade} pts</span>
            <span className="text-[#d4d7dc]">|</span>
            <span className="text-[#4a4f57]">Asistencia mínima:</span>
            <span className="text-[#0e7c86]">{minAttendance}%</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Recalcular resumen académico"
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl border border-[#858a93] bg-white text-[#0e7c86] hover:bg-[#d9f7f8]/60 transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center"
            title="Recalcular resumen académico"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contenido: Si no hay inscritos */}
      {combined.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center text-[#4a4f57] text-sm">
          No hay alumnos inscritos en este ciclo para mostrar en el resumen académico.
        </div>
      ) : (
        <>
          {/* Tarjetas Mobile First */}
          <div className="grid grid-cols-1 md:hidden gap-3.5">
            {combined.map((item) => {
              const meetsGrade = item.averageGrade >= passingGrade;
              const meetsAttendance = item.attendancePct >= minAttendance;

              return (
                <div
                  key={item.enrollment.id}
                  className="bg-white rounded-3xl border border-[#d4d7dc] p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-[#1a1a1a] text-sm">
                        {item.person.first_name} {item.person.last_name}
                      </h4>
                      {item.person.email && (
                        <p className="text-xs text-[#4a4f57]">{item.person.email}</p>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                        item.passed
                          ? 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]'
                          : 'bg-rose-100 text-rose-950 border-rose-600'
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
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#f5f5f5] p-3 rounded-2xl border border-[#e5e7eb]">
                    <div>
                      <div className="text-[#4a4f57] font-bold">Asistencia:</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`font-extrabold ${
                            meetsAttendance ? 'text-emerald-800' : 'text-rose-800'
                          }`}
                        >
                          {Number(item.attendancePct).toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-[#4a4f57]">
                          (min {minAttendance}%)
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[#4a4f57] font-bold">Promedio:</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`font-extrabold ${
                            meetsGrade ? 'text-[#0e7c86]' : 'text-rose-800'
                          }`}
                        >
                          {Number(item.averageGrade).toFixed(1)} pts
                        </span>
                        <span className="text-[10px] text-[#4a4f57]">
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
          <div className="hidden md:block bg-white rounded-3xl border border-[#d4d7dc] shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f5f5f5] text-[#4a4f57] border-b border-[#d4d7dc] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-extrabold">Alumno</th>
                  <th className="px-4 py-3.5 font-extrabold text-center">Estado Inscripción</th>
                  <th className="px-4 py-3.5 font-extrabold text-center">Asistencia Acumulada</th>
                  <th className="px-4 py-3.5 font-extrabold text-center">Promedio (0-100)</th>
                  <th className="px-5 py-3.5 font-extrabold text-center">Resultado Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {combined.map((item) => {
                  const meetsGrade = item.averageGrade >= passingGrade;
                  const meetsAttendance = item.attendancePct >= minAttendance;

                  return (
                    <tr key={item.enrollment.id} className="hover:bg-[#f5f5f5]/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-[#1a1a1a]">
                          {item.person.first_name} {item.person.last_name}
                        </div>
                        {item.person.email && (
                          <div className="text-xs text-[#4a4f57]">{item.person.email}</div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-600">
                          {item.enrollment.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-extrabold text-sm ${
                              meetsAttendance ? 'text-emerald-800' : 'text-rose-800'
                            }`}
                          >
                            {Number(item.attendancePct).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[11px] text-[#4a4f57]">
                          Req: {minAttendance}%
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-extrabold text-sm ${
                              meetsGrade ? 'text-[#0e7c86]' : 'text-rose-800'
                            }`}
                          >
                            {Number(item.averageGrade).toFixed(1)} pts
                          </span>
                        </div>
                        <div className="text-[11px] text-[#4a4f57]">
                          Req: {passingGrade} pts
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                            item.passed
                              ? 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]'
                              : 'bg-rose-100 text-rose-950 border-rose-600'
                          }`}
                        >
                          {item.passed ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-[#0e7c86]" />
                              <span>Aprobado</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-700" />
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
      <div className="p-3.5 bg-white border border-[#d4d7dc] rounded-2xl text-[#4a4f57] text-xs flex items-center gap-2">
        <Info className="w-4 h-4 text-[#0e7c86] flex-shrink-0" />
        <span>
          Este resumen es calculado en tiempo real directamente por la vista{' '}
          <code>public.v_cycle_grades_summary</code> de Supabase PostgreSQL conforme al reglamento del curso.
        </span>
      </div>
    </div>
  );
};
