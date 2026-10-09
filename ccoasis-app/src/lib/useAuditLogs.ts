import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { AuditLog, AuditAction, AuditTargetTable } from '../types/audit';

/**
 * Registra un evento de auditoría en la base de datos de manera resiliente.
 * Si falla, no bloquea el flujo principal de la aplicación, pero emite advertencia en consola.
 */
export async function logAuditEvent(
  action: AuditAction | string,
  target_table: AuditTargetTable | string,
  target_id: string | null = null,
  details: Record<string, any> = {}
): Promise<{ ok: boolean; error?: string }> {
  try {
    // 1. Obtener usuario autenticado actual
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Intentar inserción directa en audit_logs
    const { error } = await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      action,
      target_table,
      target_id: target_id ? String(target_id) : null,
      details: details || {},
    });

    if (error) {
      // Intentar fallback mediante RPC por si RLS o permisos difieren
      const { error: rpcError } = await supabase.rpc('log_audit_event', {
        p_action: action,
        p_target_table: target_table,
        p_target_id: target_id ? String(target_id) : null,
        p_details: details || {},
      });

      if (rpcError) {
        console.warn('No se pudo registrar log de auditoría (RPC):', rpcError.message);
        return { ok: false, error: rpcError.message };
      }
    }

    return { ok: true };
  } catch (err: any) {
    console.warn('Error al enviar evento de auditoría:', err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
}

interface UseAuditLogsOptions {
  limit?: number;
}

export function useAuditLogs(options: UseAuditLogsOptions = { limit: 50 }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('todos');
  const [tableFilter, setTableFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options.limit || 50);

      if (actionFilter !== 'todos') {
        query = query.eq('action', actionFilter);
      }

      if (tableFilter !== 'todos') {
        query = query.eq('target_table', tableFilter);
      }

      const { data, error: fetchErr } = await query;

      if (fetchErr) {
        throw fetchErr;
      }

      if (mountedRef.current) {
        let results = (data as AuditLog[]) || [];

        // Filtrado por búsqueda en cliente (email o texto en detalles)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          results = results.filter((item) => {
            const emailMatch = item.user_email?.toLowerCase().includes(q);
            const targetIdMatch = item.target_id?.toLowerCase().includes(q);
            const detailsMatch = JSON.stringify(item.details || {}).toLowerCase().includes(q);
            return emailMatch || targetIdMatch || detailsMatch;
          });
        }

        setLogs(results);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        console.error('Error al cargar registros de auditoría:', err);
        setError(err?.message || 'Error al obtener los registros de auditoría.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [actionFilter, tableFilter, searchQuery, options.limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    actionFilter,
    setActionFilter,
    tableFilter,
    setTableFilter,
    searchQuery,
    setSearchQuery,
    refresh: fetchLogs,
  };
}
