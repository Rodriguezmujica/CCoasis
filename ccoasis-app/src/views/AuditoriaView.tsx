import {
  ShieldAlert,
  Search,
  RefreshCw,
  Loader2,
  User,
  Clock,
  Database,
} from 'lucide-react';
import { useAuditLogs } from '../lib/useAuditLogs';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_TABLE_LABELS,
  AuditLog,
} from '../types/audit';

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

// Estilos de badge según la acción
function getActionBadgeStyle(action: string) {
  switch (action) {
    case 'CREATE':
      return {
        label: 'Creación',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'UPDATE':
      return {
        label: 'Actualización',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'DELETE':
      return {
        label: 'Eliminación',
        className: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    case 'ROLE_CHANGE':
      return {
        label: 'Cambio de Rol',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
      };
    case 'ARCHIVE':
      return {
        label: 'Archivado',
        className: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'RESTORE':
      return {
        label: 'Restaurado',
        className: 'bg-teal-100 text-teal-800 border-teal-200',
      };
    default:
      return {
        label: AUDIT_ACTION_LABELS[action] || action,
        className: 'bg-slate-100 text-slate-800 border-slate-200',
      };
  }
}

export const AuditoriaView: React.FC = () => {
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

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-950 flex items-center justify-center text-white shadow-md shadow-slate-900/20">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Auditoría del Sistema
            </h1>
            <p className="text-sm text-slate-500">
              {isLoading
                ? 'Cargando registros...'
                : `${logs.length} registro${logs.length !== 1 ? 's' : ''} de actividades sensibles`}
            </p>
          </div>
        </div>

        {/* Botón de refresco táctil */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por correo, ID o detalle..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Filtro por Acción */}
        <div className="w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todas las acciones</option>
            <option value="CREATE">Creaciones</option>
            <option value="UPDATE">Modificaciones</option>
            <option value="DELETE">Eliminaciones / Archivos</option>
            <option value="ROLE_CHANGE">Cambios de Rol</option>
          </select>
        </div>

        {/* Filtro por Módulo / Tabla */}
        <div className="w-full sm:w-auto">
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los módulos</option>
            <option value="expenses">Finanzas (Gastos)</option>
            <option value="offerings">Finanzas (Ofrendas)</option>
            <option value="user_roles">Usuarios (Roles)</option>
            <option value="persons">Personas (Fichas)</option>
            <option value="church_events">Calendario / Eventos</option>
          </select>
        </div>
      </div>

      {/* Error de carga */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start justify-between">
          <div>
            <p className="font-semibold">Error al consultar registros de auditoría</p>
            <p className="text-xs text-rose-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => refresh()}
            className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-xs font-semibold text-rose-800"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de Registros */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          <p className="text-sm font-medium">Cargando eventos de auditoría...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              No hay eventos de auditoría registrados
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || actionFilter !== 'todos' || tableFilter !== 'todos'
                ? 'No se encontraron registros que coincidan con los filtros seleccionados.'
                : 'Las acciones sensibles como cambios de roles, eliminaciones o egresos quedarán registradas aquí automáticamente.'}
            </p>
          </div>
          {(searchQuery || actionFilter !== 'todos' || tableFilter !== 'todos') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActionFilter('todos');
                setTableFilter('todos');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log: AuditLog) => {
            const badge = getActionBadgeStyle(log.action);
            const tableLabel = AUDIT_TABLE_LABELS[log.target_table] || log.target_table;

            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                {/* Fila superior: Badge de Acción + Tabla + Fecha */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border tracking-wide uppercase ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <Database className="w-3.5 h-3.5 text-slate-400" />
                      <span>{tableLabel}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatAuditTimestamp(log.created_at)}</span>
                  </div>
                </div>

                {/* Quién realizó la acción */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-900">
                    {log.user_email || 'Usuario autenticado'}
                  </span>
                  {log.user_id && (
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      ({log.user_id.slice(0, 8)}...)
                    </span>
                  )}
                </div>

                {/* Detalle del evento en formato legible */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 font-mono overflow-x-auto">
                  {log.details && Object.keys(log.details).length > 0 ? (
                    <pre className="whitespace-pre-wrap break-words font-sans text-xs text-slate-700">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-slate-400 italic font-sans">
                      Sin datos complementarios adjuntos.
                    </span>
                  )}
                </div>

                {/* Target ID si está disponible */}
                {log.target_id && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="font-medium text-slate-500">ID del recurso:</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {log.target_id}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditoriaView;
