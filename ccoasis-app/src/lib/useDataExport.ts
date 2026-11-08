import { useState, useCallback } from 'react';
import { supabase } from './supabase';
import { logAuditEvent } from './useAuditLogs';
import { PAYMENT_METHOD_LABELS, FUND_ACCOUNT_LABELS } from '../types/finances';

// Formato de fecha para los nombres de archivo: YYYY-MM-DD
function getBackupDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Escapar valores para CSV (delimitador ;)
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Descargar un Blob en el navegador
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Descargar archivo CSV con UTF-8 BOM (\uFEFF)
function downloadCSV(csvLines: string[][], filename: string) {
  const csvBody = csvLines.map((row) => row.map(escapeCSV).join(';')).join('\r\n');
  // \uFEFF fuerza a Excel en Windows a reconocer la codificación UTF-8 para tildes y eñes
  const blob = new Blob(['\uFEFF' + csvBody], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

// Descargar archivo JSON formateado
function downloadJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export type ExportType = 'personas' | 'finanzas' | 'clases' | 'json';

export function useDataExport(onBackupLogged?: () => void) {
  const [activeExport, setActiveExport] = useState<ExportType | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 1. Exportar Personas (activas y archivadas) en CSV
   */
  const exportPersonsCSV = useCallback(async (): Promise<boolean> => {
    setActiveExport('personas');
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('persons')
        .select('*')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (fetchErr) throw fetchErr;

      const STATUS_LABELS: Record<string, string> = {
        activo: 'Activo',
        inactivo: 'Inactivo',
        visita: 'Visita',
        transferido: 'Transferido',
        fallecido: 'Fallecido',
      };

      const headers = [
        'ID',
        'Nombre',
        'Apellidos',
        'Estado',
        '¿Archivado?',
        'Fecha Archivado',
        'Teléfono',
        'Correo Electrónico',
        'Fecha de Nacimiento',
        'Fecha de Bautismo',
        'Dirección',
        'Notas',
        'Fecha de Registro',
        'Última Modificación',
      ];

      const rows: string[][] = (data || []).map((p: any) => [
        p.id,
        p.first_name,
        p.last_name,
        STATUS_LABELS[p.status] || p.status,
        p.deleted_at ? 'Sí' : 'No',
        p.deleted_at || '—',
        p.phone || '—',
        p.email || '—',
        p.birth_date || '—',
        p.baptism_date || '—',
        p.address || '—',
        p.notes || '—',
        p.created_at,
        p.updated_at,
      ]);

      const dateStr = getBackupDateStr();
      const filename = `ccoasis_personas_${dateStr}.csv`;
      downloadCSV([headers, ...rows], filename);

      return true;
    } catch (err: any) {
      console.error('Error al exportar personas:', err);
      setError(err?.message || 'Error al exportar personas a CSV');
      return false;
    } finally {
      setActiveExport(null);
    }
  }, []);

  /**
   * 2. Exportar Finanzas (ofrendas y gastos con su categoría) en CSV
   */
  const exportFinancesCSV = useCallback(async (): Promise<boolean> => {
    setActiveExport('finanzas');
    setError(null);
    try {
      const [offRes, expRes] = await Promise.all([
        supabase
          .from('offerings')
          .select('*, category:transaction_categories(id, name, type), person:persons(id, first_name, last_name)')
          .order('offering_date', { ascending: false }),
        supabase
          .from('expenses')
          .select('*, category:transaction_categories(id, name, type)')
          .order('expense_date', { ascending: false }),
      ]);

      if (offRes.error) throw offRes.error;
      if (expRes.error) throw expRes.error;

      const offerings = offRes.data || [];
      const expenses = expRes.data || [];

      let totalIncome = 0;
      let totalExpenses = 0;

      interface UnifiedFinanceRow {
        fecha: string;
        tipo: string;
        categoria: string;
        concepto: string;
        donante: string;
        metodoPago: string;
        cuentaCaja: string;
        montoRaw: number;
        montoFormatted: string;
        comprobante: string;
        fechaRegistro: string;
      }

      const rows: UnifiedFinanceRow[] = [];

      (offerings as any[]).forEach((o: any) => {
        const amount = Number(o.amount) || 0;
        totalIncome += amount;
        const categoryObj = Array.isArray(o.category) ? o.category[0] : o.category;
        const personObj = Array.isArray(o.person) ? o.person[0] : o.person;
        const paymentMethodKey = o.payment_method as keyof typeof PAYMENT_METHOD_LABELS;
        const fundAccountKey = o.fund_account as keyof typeof FUND_ACCOUNT_LABELS;

        rows.push({
          fecha: o.offering_date,
          tipo: 'Ingreso (Ofrenda)',
          categoria: categoryObj?.name || 'Sin categoría',
          concepto: o.notes || 'Ofrenda congregacional',
          donante: personObj ? `${personObj.first_name} ${personObj.last_name}` : 'Anónimo',
          metodoPago: PAYMENT_METHOD_LABELS[paymentMethodKey] || o.payment_method || 'Efectivo',
          cuentaCaja: FUND_ACCOUNT_LABELS[fundAccountKey] || o.fund_account || 'Caja en Efectivo',
          montoRaw: amount,
          montoFormatted: amount.toFixed(2).replace('.', ','),
          comprobante: '—',
          fechaRegistro: o.created_at,
        });
      });

      (expenses as any[]).forEach((e: any) => {
        const amount = Number(e.amount) || 0;
        totalExpenses += amount;
        const categoryObj = Array.isArray(e.category) ? e.category[0] : e.category;
        const paymentMethodKey = e.payment_method as keyof typeof PAYMENT_METHOD_LABELS;
        const fundAccountKey = e.fund_account as keyof typeof FUND_ACCOUNT_LABELS;

        rows.push({
          fecha: e.expense_date,
          tipo: 'Gasto (Egreso)',
          categoria: categoryObj?.name || 'Sin categoría',
          concepto: e.description || 'Gasto registrado',
          donante: '—',
          metodoPago: PAYMENT_METHOD_LABELS[paymentMethodKey] || e.payment_method || 'Efectivo',
          cuentaCaja: FUND_ACCOUNT_LABELS[fundAccountKey] || e.fund_account || 'Caja en Efectivo',
          montoRaw: -amount,
          montoFormatted: (-amount).toFixed(2).replace('.', ','),
          comprobante: e.receipt_url ? 'Comprobante adjunto' : 'Sin comprobante',
          fechaRegistro: e.created_at,
        });
      });

      // Orden descendente por fecha de la transacción
      rows.sort((a, b) => b.fecha.localeCompare(a.fecha));

      const headers = [
        'Fecha',
        'Tipo de Transacción',
        'Categoría',
        'Concepto / Descripción',
        'Donante / Beneficiario',
        'Método de Pago',
        'Cuenta / Fondo',
        'Monto (EUR)',
        'Comprobante',
        'Fecha de Registro',
      ];

      const csvData: string[][] = [
        headers,
        ...rows.map((r) => [
          r.fecha,
          r.tipo,
          r.categoria,
          r.concepto,
          r.donante,
          r.metodoPago,
          r.cuentaCaja,
          r.montoFormatted,
          r.comprobante,
          r.fechaRegistro,
        ]),
        ['', '', '', '', '', '', '', '', '', ''],
        [
          'RESUMEN GENERAL',
          '',
          '',
          `Total Ingresos: ${totalIncome.toFixed(2).replace('.', ',')} €`,
          `Total Gastos: ${totalExpenses.toFixed(2).replace('.', ',')} €`,
          `Balance Neto: ${(totalIncome - totalExpenses).toFixed(2).replace('.', ',')} €`,
          '',
          '',
          '',
          '',
        ],
      ];

      const dateStr = getBackupDateStr();
      const filename = `ccoasis_finanzas_${dateStr}.csv`;
      downloadCSV(csvData, filename);

      return true;
    } catch (err: any) {
      console.error('Error al exportar finanzas:', err);
      setError(err?.message || 'Error al exportar finanzas a CSV');
      return false;
    } finally {
      setActiveExport(null);
    }
  }, []);

  /**
   * 3. Exportar Clases y Notas (resumen de cycles, enrollments y v_cycle_grades_summary) en CSV
   */
  const exportClassesAndGradesCSV = useCallback(async (): Promise<boolean> => {
    setActiveExport('clases');
    setError(null);
    try {
      const [cyclesRes, enrollmentsRes, summaryRes] = await Promise.all([
        supabase
          .from('cycles')
          .select(`
            id,
            name,
            status,
            start_date,
            end_date,
            deleted_at,
            course:courses ( id, title, passing_grade, min_attendance_pct ),
            teacher:persons!cycles_teacher_id_fkey ( id, first_name, last_name, email )
          `)
          .order('start_date', { ascending: false }),
        supabase
          .from('enrollments')
          .select(`
            id,
            cycle_id,
            person_id,
            status,
            created_at,
            person:persons!enrollments_person_id_fkey ( id, first_name, last_name, email, phone )
          `),
        supabase
          .from('v_cycle_grades_summary')
          .select('*'),
      ]);

      if (cyclesRes.error) throw cyclesRes.error;
      if (enrollmentsRes.error) throw enrollmentsRes.error;
      if (summaryRes.error) throw summaryRes.error;

      const cycles = cyclesRes.data || [];
      const enrollments = enrollmentsRes.data || [];
      const summaryList = summaryRes.data || [];

      // Mapeo de ciclo por ID
      const cyclesMap = new Map<string, any>();
      cycles.forEach((c: any) => cyclesMap.set(c.id, c));

      // Mapeo de resumen académico por enrollment_id
      const summaryMap = new Map<string, any>();
      summaryList.forEach((s: any) => summaryMap.set(s.enrollment_id, s));

      const CYCLE_STATUS_LABELS: Record<string, string> = {
        planificado: 'Planificado',
        en_curso: 'En curso',
        cerrado: 'Cerrado',
        archivado: 'Archivado',
      };

      const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
        inscrito: 'Inscrito',
        completado: 'Completado',
        retirado: 'Retirado',
      };

      const headers = [
        'Curso',
        'Ciclo',
        'Estado del Ciclo',
        '¿Ciclo Archivado?',
        'Maestro',
        'Fecha Inicio',
        'Fecha Fin',
        'Alumno',
        'Correo Alumno',
        'Teléfono Alumno',
        'Estado Inscripción',
        'Promedio Nota (0-100)',
        'Nota Mínima Aprobatoria',
        '% Asistencia',
        'Asistencia Mínima Requerida',
        'Resultado Académico',
      ];

      const rows: string[][] = [];

      // Seguimiento de ciclos que ya tienen al menos 1 inscripción en las filas
      const cyclesWithEnrollment = new Set<string>();

      (enrollments as any[]).forEach((e: any) => {
        const cycle = cyclesMap.get(e.cycle_id);
        const summary = summaryMap.get(e.id);
        const course = Array.isArray(cycle?.course) ? cycle?.course[0] : cycle?.course;
        const teacher = Array.isArray(cycle?.teacher) ? cycle?.teacher[0] : cycle?.teacher;
        const person = Array.isArray(e.person) ? e.person[0] : e.person;

        if (cycle) {
          cyclesWithEnrollment.add(cycle.id);
        }

        const avgGradeFormatted =
          summary?.average_grade !== undefined && summary?.average_grade !== null
            ? Number(summary.average_grade).toFixed(2).replace('.', ',')
            : '—';

        const attPctFormatted =
          summary?.attendance_percentage !== undefined && summary?.attendance_percentage !== null
            ? `${Number(summary.attendance_percentage).toFixed(2).replace('.', ',')}%`
            : '—';

        const passedLabel =
          summary?.passed !== undefined && summary?.passed !== null
            ? summary.passed
              ? 'Aprobado'
              : 'No aprobado'
            : 'Sin evaluar';

        rows.push([
          course?.title || '—',
          cycle?.name || '—',
          CYCLE_STATUS_LABELS[cycle?.status] || cycle?.status || '—',
          cycle?.deleted_at ? 'Sí' : 'No',
          teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Sin asignar',
          cycle?.start_date || '—',
          cycle?.end_date || '—',
          person ? `${person.first_name} ${person.last_name}` : '—',
          person?.email || '—',
          person?.phone || '—',
          ENROLLMENT_STATUS_LABELS[e.status] || e.status || '—',
          avgGradeFormatted,
          course?.passing_grade ? `${course.passing_grade}` : '—',
          attPctFormatted,
          course?.min_attendance_pct ? `${course.min_attendance_pct}%` : '—',
          passedLabel,
        ]);
      });

      // Incluir también los ciclos que no tienen inscritos aún para que no se pierdan del resumen
      (cycles as any[]).forEach((c: any) => {
        if (!cyclesWithEnrollment.has(c.id)) {
          const teacher = Array.isArray(c.teacher) ? c.teacher[0] : c.teacher;
          const course = Array.isArray(c.course) ? c.course[0] : c.course;
          rows.push([
            course?.title || '—',
            c.name || '—',
            CYCLE_STATUS_LABELS[c.status] || c.status || '—',
            c.deleted_at ? 'Sí' : 'No',
            teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Sin asignar',
            c.start_date || '—',
            c.end_date || '—',
            'Sin alumnos inscritos',
            '—',
            '—',
            '—',
            '—',
            course?.passing_grade ? `${course.passing_grade}` : '—',
            '—',
            course?.min_attendance_pct ? `${course.min_attendance_pct}%` : '—',
            '—',
          ]);
        }
      });

      const dateStr = getBackupDateStr();
      const filename = `ccoasis_clases_y_notas_${dateStr}.csv`;
      downloadCSV([headers, ...rows], filename);

      return true;
    } catch (err: any) {
      console.error('Error al exportar clases y notas:', err);
      setError(err?.message || 'Error al exportar clases y notas a CSV');
      return false;
    } finally {
      setActiveExport(null);
    }
  }, []);

  /**
   * 4. Descargar Respaldo Completo (JSON) con el volcado de las tablas principales
   */
  const exportFullBackupJSON = useCallback(async (): Promise<boolean> => {
    setActiveExport('json');
    setError(null);
    try {
      // 1. Obtener usuario administrador actual
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Tablas principales de la congregación para resguardo
      const tablesToBackup = [
        'persons',
        'user_roles',
        'courses',
        'cycles',
        'enrollments',
        'sessions',
        'attendance',
        'evaluations',
        'grades',
        'assignments',
        'assignment_submissions',
        'class_materials',
        'transaction_categories',
        'offerings',
        'expenses',
        'church_events',
        'church_event_assignments',
        'church_event_attendance',
        'church_event_rsvps',
        'announcements',
        'public_site_settings',
        'public_news',
      ];

      const tablesData: Record<string, any[]> = {};
      const tablesSummary: Record<string, number> = {};
      let totalRecords = 0;

      // 3. Consultar tablas en paralelo
      const fetchPromises = tablesToBackup.map(async (tableName) => {
        try {
          const { data, error: tableErr } = await supabase
            .from(tableName)
            .select('*')
            .limit(10000);

          if (tableErr) {
            console.warn(`Advertencia al leer tabla ${tableName} para respaldo:`, tableErr.message);
            tablesData[tableName] = [];
            tablesSummary[tableName] = 0;
          } else {
            const records = data || [];
            tablesData[tableName] = records;
            tablesSummary[tableName] = records.length;
            totalRecords += records.length;
          }
        } catch (err: any) {
          console.warn(`Excepción al leer tabla ${tableName}:`, err);
          tablesData[tableName] = [];
          tablesSummary[tableName] = 0;
        }
      });

      await Promise.all(fetchPromises);

      // 4. Estructura del respaldo JSON fechado
      const dateStr = getBackupDateStr();
      const filename = `ccoasis_backup_${dateStr}.json`;

      const backupPayload = {
        app: 'Centro Cristiano Oasis',
        version: '1.0',
        tipo: 'copia_de_seguridad_completa',
        fecha_generacion: new Date().toISOString(),
        generado_por: {
          id: user?.id || null,
          email: user?.email || null,
        },
        resumen_tablas: tablesSummary,
        total_registros: totalRecords,
        tablas: tablesData,
      };

      // 5. Descargar archivo en el cliente
      downloadJSON(backupPayload, filename);

      // 6. Registrar evento en audit_logs de forma transparente
      try {
        await logAuditEvent('BACKUP_DOWNLOAD', 'system', null, {
          tipo: 'respaldo_completo_json',
          archivo: filename,
          total_registros: totalRecords,
          tablas_incluidas: Object.keys(tablesData),
          resumen_filas: tablesSummary,
        });

        // Refrescar lista de auditoría en la vista si se pasó callback
        if (onBackupLogged) {
          onBackupLogged();
        }
      } catch (logErr) {
        console.warn('No se pudo registrar la descarga del respaldo en audit_logs:', logErr);
      }

      return true;
    } catch (err: any) {
      console.error('Error al generar respaldo completo JSON:', err);
      setError(err?.message || 'Error al generar el respaldo completo JSON');
      return false;
    } finally {
      setActiveExport(null);
    }
  }, [onBackupLogged]);

  return {
    activeExport,
    error,
    exportPersonsCSV,
    exportFinancesCSV,
    exportClassesAndGradesCSV,
    exportFullBackupJSON,
  };
}
