import React from 'react';
import {
  FileSpreadsheet,
  FileJson,
  Users,
  Coins,
  GraduationCap,
  Loader2,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';
import { useDataExport } from '../../lib/useDataExport';
import { useToast } from '../../context/ToastContext';

interface BackupExportCardProps {
  onBackupLogged?: () => void;
}

export const BackupExportCard: React.FC<BackupExportCardProps> = ({ onBackupLogged }) => {
  const { toast } = useToast();
  const {
    activeExport,
    error,
    exportPersonsCSV,
    exportFinancesCSV,
    exportClassesAndGradesCSV,
    exportFullBackupJSON,
  } = useDataExport(onBackupLogged);

  const handleExportPersons = async () => {
    toast.info('Generando planilla de personas...');
    const ok = await exportPersonsCSV();
    if (ok) {
      toast.success('Descarga completada: Personas (CSV)');
    } else {
      toast.error('No se pudo generar la exportación de personas.');
    }
  };

  const handleExportFinances = async () => {
    toast.info('Generando planilla de finanzas...');
    const ok = await exportFinancesCSV();
    if (ok) {
      toast.success('Descarga completada: Finanzas (CSV)');
    } else {
      toast.error('No se pudo generar la exportación de finanzas.');
    }
  };

  const handleExportClasses = async () => {
    toast.info('Generando planilla de clases y notas...');
    const ok = await exportClassesAndGradesCSV();
    if (ok) {
      toast.success('Descarga completada: Clases y Notas (CSV)');
    } else {
      toast.error('No se pudo generar la exportación de clases.');
    }
  };

  const handleExportJSON = async () => {
    toast.info('Preparando respaldo completo del sistema...');
    const ok = await exportFullBackupJSON();
    if (ok) {
      toast.success('Copia de seguridad completa descargada y registrada en auditoría.');
    } else {
      toast.error('Error al generar la copia de seguridad completa.');
    }
  };

  const isBusy = activeExport !== null;

  return (
    <section
      aria-labelledby="backup-export-title"
      className="bg-white rounded-3xl border border-[#d4d7dc] p-5 sm:p-6 shadow-sm space-y-6"
    >
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-[#0e7c86] text-white flex items-center justify-center shrink-0 shadow-xs"
            aria-hidden="true"
          >
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                id="backup-export-title"
                className="text-lg sm:text-xl font-extrabold text-[#1a1a1a] tracking-tight leading-tight"
              >
                Copia de Seguridad y Exportación
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0e7c86]" aria-hidden="true" />
                <span>Exclusivo Pastor / Admin</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#4a4f57] mt-0.5">
              Descarga resguardos completos o planillas en formato CSV compatible con Microsoft Excel (UTF-8 con BOM).
            </p>
          </div>
        </div>
      </div>

      {/* Alerta de error si ocurre alguno */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-600 text-rose-950 text-xs sm:text-sm"
        >
          <span className="font-bold">Error en la exportación:</span> {error}
        </div>
      )}

      {/* Tarjeta destacada: Respaldo Completo (JSON) para el pastor */}
      <div className="rounded-2xl border border-[#0e7c86]/30 bg-gradient-to-br from-[#d9f7f8]/50 via-white to-[#f5f5f5] p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0e7c86] animate-pulse" aria-hidden="true" />
            <h3 className="text-base font-bold text-[#1a1a1a]">
              Respaldo Completo de la Congregación (JSON)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#4a4f57] leading-relaxed">
            Descarga un único archivo fechado (<code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-[#d4d7dc] text-[#1a1a1a]">ccoasis_backup_YYYY-MM-DD.json</code>) con el volcado íntegro de las tablas principales (personas, finanzas, cursos, sesiones, eventos y asistencias).
          </p>
          <p className="text-[11px] text-[#0a5961] font-semibold">
            Nota de seguridad: Esta acción queda asentada de inmediato en la bitácora de auditoría.
          </p>
        </div>

        <div className="shrink-0 flex items-center">
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={isBusy}
            aria-label="Descargar respaldo completo en formato JSON fechado"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-xl font-bold text-sm text-white bg-[#0e7c86] hover:bg-[#0a5961] focus:outline-none focus-oasis shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {activeExport === 'json' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
                <span>Generando respaldo...</span>
              </>
            ) : (
              <>
                <FileJson className="w-4 h-4 text-white" aria-hidden="true" />
                <span>Descargar Respaldo Completo (JSON)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sección de Exportaciones individuales en CSV */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#4a4f57]">
            Planillas Individuales en CSV (Apertura directa en Excel)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1. Personas CSV */}
          <div className="bg-[#f5f5f5] rounded-2xl p-4 border border-[#d4d7dc] flex flex-col justify-between gap-3 hover:border-[#858a93] transition-colors">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]/30 flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#1a1a1a]">Fichas de Personas</h4>
              </div>
              <p className="text-xs text-[#4a4f57] leading-relaxed">
                Todas las personas registradas (activas, visitas, transferidas y archivadas con fecha de baja).
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportPersons}
              disabled={isBusy}
              aria-label="Exportar lista de personas activas y archivadas en archivo CSV"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs sm:text-sm text-[#1a1a1a] bg-white hover:bg-[#e5e7eb] border border-[#858a93] focus:outline-none focus-oasis shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {activeExport === 'personas' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0e7c86]" aria-hidden="true" />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                  <span>Exportar Personas (CSV)</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Finanzas CSV */}
          <div className="bg-[#f5f5f5] rounded-2xl p-4 border border-[#d4d7dc] flex flex-col justify-between gap-3 hover:border-[#858a93] transition-colors">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg bg-[#fdf2f8] text-[#ae4a84] border border-[#ae4a84]/30 flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <Coins className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#1a1a1a]">Finanzas Completas</h4>
              </div>
              <p className="text-xs text-[#4a4f57] leading-relaxed">
                Historial completo de ofrendas y egresos con su categoría, método de pago, cuenta y comprobante.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportFinances}
              disabled={isBusy}
              aria-label="Exportar historial de ofrendas y gastos con categorías en archivo CSV"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs sm:text-sm text-[#1a1a1a] bg-white hover:bg-[#e5e7eb] border border-[#858a93] focus:outline-none focus-oasis shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {activeExport === 'finanzas' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#ae4a84]" aria-hidden="true" />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-[#ae4a84]" aria-hidden="true" />
                  <span>Exportar Finanzas (CSV)</span>
                </>
              )}
            </button>
          </div>

          {/* 3. Clases y Notas CSV */}
          <div className="bg-[#f5f5f5] rounded-2xl p-4 border border-[#d4d7dc] flex flex-col justify-between gap-3 hover:border-[#858a93] transition-colors">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg bg-[#d9f7f8] text-[#0a5961] border border-[#0e7c86]/30 flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#1a1a1a]">Clases y Notas</h4>
              </div>
              <p className="text-xs text-[#4a4f57] leading-relaxed">
                Cursos, ciclos, alumnos inscritos, maestros, promedio normalizado (0-100) y % de asistencia.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportClasses}
              disabled={isBusy}
              aria-label="Exportar resumen de clases, ciclos y calificaciones de alumnos en archivo CSV"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs sm:text-sm text-[#1a1a1a] bg-white hover:bg-[#e5e7eb] border border-[#858a93] focus:outline-none focus-oasis shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {activeExport === 'clases' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0e7c86]" aria-hidden="true" />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                  <span>Exportar Clases y Notas (CSV)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BackupExportCard;
