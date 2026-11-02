import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Loader2,
  User,
  Clock,
  Database,
  Eye,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuditLogs } from '../lib/useAuditLogs';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_TABLE_LABELS,
  AuditLog,
} from '../types/audit';
import { BackupExportCard } from '../components/auditoria/BackupExportCard';

// Formato de fecha y hora local amigable
function formatAuditTimestamp(isoString: string): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Estilos de badge según la acción (WCAG AA >= 4,5:1 texto y >= 3:1 borde)
function getActionBadgeStyle(action: string) {
  switch (action) {
    case 'CREATE':
    case 'INSERT':
      return {
        label: 'Creación',
        className: 'bg-emerald-100 text-emerald-950 border-emerald-600',
      };
    case 'UPDATE':
      return {
        label: 'Modificación',
        className: 'bg-amber-100 text-amber-950 border-amber-600',
      };
    case 'DELETE':
      return {
        label: 'Eliminación',
        className: 'bg-rose-100 text-rose-950 border-rose-600',
      };
    case 'ROLE_CHANGE':
      return {
        label: 'Cambio de Rol',
        className: 'bg-magenta-100 text-magenta-950 border-magenta-600',
      };
    case 'ARCHIVE':
      return {
        label: 'Archivado',
        className: 'bg-amber-100 text-amber-950 border-amber-600',
      };
    case 'RESTORE':
      return {
        label: 'Restaurado',
        className: 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]',
      };
    case 'UPDATE_PASSWORD':
      return {
        label: 'Cambio de Clave',
        className: 'bg-amber-100 text-amber-950 border-amber-600',
      };
    case 'BACKUP_DOWNLOAD':
      return {
        label: 'Copia de Seguridad',
        className: 'bg-[#d9f7f8] text-[#0a5961] border-[#0e7c86]',
      };
    default:
      return {
        label: AUDIT_ACTION_LABELS[action] || action,
        className: 'bg-slate-100 text-slate-800 border-slate-400',
      };
  }
}

export const AuditoriaView: React.FC = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes('admin');

  const {
    logs,
    isLoading,
    error,
    actionFilter,
    setActionFilter,
    tableFilter,
    setTableFilter,
    searchQuery,
    setSearchQuery,
    refresh,
  } = useAuditLogs({ limit: 60 });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-[12px] bg-[#0e7c86] flex items-center justify-center text-white shadow-sm shrink-0"
            aria-hidden="true"
          >
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[24px] sm:text-[25px] font-extrabold oasis-text-gradient tracking-tight leading-tight">
              Auditoría del Sistema
            </h1>
            <p className="text-sm text-[#4a4f57] mt-0.5">
              {isLoading
                ? 'Cargando registros...'
                : `${logs.length} registro${logs.length !== 1 ? 's' : ''} de actividades sensibles`}
            </p>
          </div>
        </div>

        {/* Botón de refresco táctil */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] bg-white hover:bg-[#f5f5f5] text-[#1a1a1a] font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0e7c86]' : 'text-[#4a4f57]'}`}
              aria-hidden="true"
            />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Sección destacada de Copia de Seguridad y Exportación (exclusivo rol admin) */}
      {isAdmin && (
        <BackupExportCard onBackupLogged={refresh} />
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-3xl border border-[#d4d7dc] p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4a4f57]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por correo, ID o detalle..."
            aria-label="Buscar en registros de auditoría"
            className="w-full pl-11 pr-4 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder-[#4a4f57]/70 focus:outline-none focus:border-[#0e7c86] bg-white"
          />
        </div>

        {/* Filtro por Acción */}
        <div className="w-full sm:w-auto">
          <select
            aria-label="Filtrar por acción"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] text-base font-medium text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] focus:outline-none focus:border-[#0e7c86]"
          >
            <option value="todos">Todas las acciones</option>
            <option value="CREATE">Creaciones</option>
            <option value="UPDATE">Modificaciones</option>
            <option value="DELETE">Eliminaciones / Archivos</option>
            <option value="ROLE_CHANGE">Cambios de Rol</option>
            <option value="UPDATE_PASSWORD">Cambios de Contraseña</option>
            <option value="BACKUP_DOWNLOAD">Copias de Seguridad</option>
          </select>
        </div>

        {/* Filtro por Módulo / Tabla */}
        <div className="w-full sm:w-auto">
          <select
            aria-label="Filtrar por módulo"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] text-base font-medium text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] focus:outline-none focus:border-[#0e7c86]"
          >
            <option value="todos">Todos los módulos</option>
            <option value="users">Usuarios (Cuentas)</option>
            <option value="user_roles">Usuarios (Roles)</option>
            <option value="persons">Personas (Fichas)</option>
            <option value="expenses">Finanzas (Gastos)</option>
            <option value="offerings">Finanzas (Ofrendas)</option>
            <option value="church_events">Calendario / Eventos</option>
            <option value="system">Sistema / Resguardos</option>
          </select>
        </div>
      </div>

      {/* Error de carga */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-600 text-rose-950 text-sm flex items-start justify-between gap-3">
          <div>
            <p className="font-bold">Error al consultar registros de auditoría</p>
            <p className="text-xs text-rose-900 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => refresh()}
            className="px-3.5 py-2 min-h-[44px] rounded-xl bg-rose-100 hover:bg-rose-200 border border-rose-600 text-xs font-bold text-rose-950"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de Registros */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-[#4a4f57] space-y-3 bg-white rounded-3xl border border-[#d4d7dc]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0e7c86]" />
          <p className="text-sm font-medium">Cargando eventos de auditoría...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#d4d7dc] p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#d9f7f8] flex items-center justify-center mx-auto text-[#0e7c86]">
            <ShieldAlert className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1a1a1a]">
              No hay eventos de auditoría registrados
            </h3>
            <p className="text-sm text-[#4a4f57] mt-1 max-w-sm mx-auto">
              {searchQuery || actionFilter !== 'todos' || tableFilter !== 'todos'
                ? 'No se encontraron registros que coincidan con los filtros seleccionados.'
                : 'Las acciones sensibles como cambios de roles, eliminaciones o egresos quedarán registradas aquí automáticamente.'}
            </p>
          </div>
          {(searchQuery || actionFilter !== 'todos' || tableFilter !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActionFilter('todos');
                setTableFilter('todos');
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold text-[#0a5961] bg-[#d9f7f8] hover:bg-[#aaeif0] border border-[#0e7c86] transition-colors"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Vista Móvil / Tablet: Tarjetas */}
          <div className="space-y-3 lg:hidden">
            {logs.map((log: AuditLog) => {
              const badge = getActionBadgeStyle(log.action);
              const tableLabel = AUDIT_TABLE_LABELS[log.target_table] || log.target_table;

              return (
                <div
                  key={log.id}
                  className="bg-white rounded-3xl border border-[#d4d7dc] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  {/* Fila superior: Badge de Acción + Tabla + Fecha + Ver detalle */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border tracking-wide uppercase ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#f5f5f5] text-[#1a1a1a] border border-[#858a93]">
                        <Database className="w-3.5 h-3.5 text-[#0e7c86]" aria-hidden="true" />
                        <span>{tableLabel}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-[#4a4f57] font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#0e7c86]" aria-hidden="true" />
                        <span>{formatAuditTimestamp(log.created_at)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        aria-label={`Ver detalle del registro ${badge.label} en ${tableLabel}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold text-[#0a5961] bg-[#d9f7f8] hover:bg-[#aaeif0] border border-[#0e7c86] transition-colors"
                        title="Ver detalle de log"
                      >
                        <Eye className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                        <span>Detalle</span>
                      </button>
                    </div>
                  </div>

                  {/* Quién realizó la acción */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-[#1a1a1a]">
                    <div className="w-7 h-7 rounded-full bg-[#d9f7f8] border border-[#0e7c86] flex items-center justify-center shrink-0 text-[#0a5961]">
                      <User className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                    <span className="font-bold text-[#1a1a1a]">
                      {log.user_email || 'Usuario autenticado'}
                    </span>
                    {log.user_id && (
                      <span className="text-xs text-[#4a4f57] font-mono hidden sm:inline">
                        ({log.user_id.slice(0, 8)}...)
                      </span>
                    )}
                  </div>

                  {/* Detalle del evento en formato legible */}
                  <div className="bg-[#f5f5f5] rounded-2xl p-3.5 border border-[#e5e7eb] text-xs text-[#1a1a1a] font-mono overflow-x-auto">
                    {log.details && Object.keys(log.details).length > 0 ? (
                      <pre className="whitespace-pre-wrap break-words font-sans text-xs text-[#1a1a1a]">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-[#4a4f57] italic font-sans">
                        Sin datos complementarios adjuntos.
                      </span>
                    )}
                  </div>

                  {/* Target ID si está disponible */}
                  {log.target_id && (
                    <div className="text-xs text-[#4a4f57] flex items-center gap-1.5">
                      <span className="font-bold text-[#1a1a1a]">ID del recurso:</span>
                      <span className="font-mono bg-[#f5f5f5] border border-[#d4d7dc] px-2 py-0.5 rounded-lg text-[#1a1a1a]">
                        {log.target_id}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Vista Escritorio: Tabla en tarjeta redondeada */}
          <div className="hidden lg:block bg-white rounded-3xl border border-[#d4d7dc] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#d4d7dc] bg-[#f5f5f5] text-xs font-bold uppercase tracking-wider text-[#4a4f57]">
                    <th className="py-3.5 px-5">Fecha y Hora</th>
                    <th className="py-3.5 px-4">Acción</th>
                    <th className="py-3.5 px-4">Módulo / Entidad</th>
                    <th className="py-3.5 px-4">Autor</th>
                    <th className="py-3.5 px-4">Resumen de Detalle</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] text-sm">
                  {logs.map((log: AuditLog) => {
                    const badge = getActionBadgeStyle(log.action);
                    const tableLabel = AUDIT_TABLE_LABELS[log.target_table] || log.target_table;

                    return (
                      <tr key={log.id} className="hover:bg-[#f5f5f5]/60 transition-colors">
                        <td className="py-3.5 px-5 whitespace-nowrap text-xs font-bold text-[#1a1a1a]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#0e7c86]" aria-hidden="true" />
                            <span>{formatAuditTimestamp(log.created_at)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border tracking-wide uppercase ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#f5f5f5] text-[#1a1a1a] border border-[#858a93]">
                            <Database className="w-3.5 h-3.5 text-[#0e7c86]" aria-hidden="true" />
                            <span>{tableLabel}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 text-xs text-[#1a1a1a]">
                            <div className="w-7 h-7 rounded-full bg-[#d9f7f8] border border-[#0e7c86] flex items-center justify-center shrink-0 text-[#0a5961]">
                              <User className="w-3.5 h-3.5" aria-hidden="true" />
                            </div>
                            <div>
                              <div className="font-bold text-[#1a1a1a]">
                                {log.user_email || 'Usuario autenticado'}
                              </div>
                              {log.target_id && (
                                <div className="text-[11px] text-[#4a4f57] font-mono">
                                  ID: {log.target_id.slice(0, 8)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-md">
                          <div className="bg-[#f5f5f5] rounded-xl p-2.5 border border-[#e5e7eb] text-xs text-[#1a1a1a] font-mono truncate">
                            {log.details && Object.keys(log.details).length > 0
                              ? JSON.stringify(log.details)
                              : 'Sin datos complementarios'}
                          </div>
                        </td>

                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            aria-label={`Ver detalle del registro ${badge.label} en ${tableLabel}`}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold text-[#0a5961] bg-[#d9f7f8] hover:bg-[#aaeif0] border border-[#0e7c86] transition-colors"
                            title="Ver detalle de log"
                          >
                            <Eye className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                            <span>Ver detalle</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal de Detalle de Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#d4d7dc] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 oasis-title-gradient on-magenta flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0"
                  aria-hidden="true"
                >
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-extrabold text-white leading-tight">
                    Detalle de Auditoría
                  </h2>
                  <p className="text-xs text-white font-medium mt-0.5 truncate">
                    {formatAuditTimestamp(selectedLog.created_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                aria-label="Cerrar"
                className="p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-white hover:bg-white/15 transition-colors shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${
                    getActionBadgeStyle(selectedLog.action).className
                  }`}
                >
                  {getActionBadgeStyle(selectedLog.action).label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#f5f5f5] text-[#1a1a1a] border border-[#858a93]">
                  <Database className="w-3.5 h-3.5 text-[#0e7c86]" aria-hidden="true" />
                  <span>
                    {AUDIT_TABLE_LABELS[selectedLog.target_table] || selectedLog.target_table}
                  </span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#f5f5f5] border border-[#d4d7dc] text-xs space-y-1.5">
                <div>
                  <span className="font-bold text-[#4a4f57] uppercase">Autor: </span>
                  <span className="font-bold text-[#1a1a1a]">
                    {selectedLog.user_email || 'Usuario autenticado'}
                  </span>
                </div>
                {selectedLog.user_id && (
                  <div>
                    <span className="font-bold text-[#4a4f57] uppercase">ID Usuario: </span>
                    <span className="font-mono text-[#1a1a1a]">{selectedLog.user_id}</span>
                  </div>
                )}
                {selectedLog.target_id && (
                  <div>
                    <span className="font-bold text-[#4a4f57] uppercase">ID Recurso: </span>
                    <span className="font-mono text-[#1a1a1a]">{selectedLog.target_id}</span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] mb-1.5">
                  Datos registrados (JSON)
                </p>
                <div className="bg-[#f5f5f5] rounded-2xl p-4 border border-[#d4d7dc] text-xs text-[#1a1a1a] max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs text-[#1a1a1a]">
                    {JSON.stringify(selectedLog.details || {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="pt-2 border-t border-[#e5e7eb] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditoriaView;
