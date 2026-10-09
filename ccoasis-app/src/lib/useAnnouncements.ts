import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabase';
import { Announcement, AnnouncementFormData, AnnouncementPriority } from '../types/announcements';

const PRIORITY_WEIGHT: Record<AnnouncementPriority, number> = {
  urgente: 3,
  importante: 2,
  normal: 1,
};

/**
 * Comprueba si una fecha ISO ha expirado respecto a la fecha actual.
 */
export function isAnnouncementExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

/**
 * Formatea una fecha ISO a formato amigable en español (ej: "9 oct 2026, 18:30").
 */
export function formatAnnouncementDate(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formatea una fecha y hora completa para expiración o detalle.
 */
export function formatAnnouncementDateTime(isoString: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Carga de anuncios desde Supabase (respeta RLS: miembros solo ven vigentes; admin ve todos los no eliminados)
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('announcements')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchErr) {
        throw fetchErr;
      }

      setAnnouncements((data as Announcement[]) || []);
    } catch (err: any) {
      console.error('Error al cargar anuncios:', err);
      setError(err.message || 'No se pudieron cargar los avisos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Anuncios vigentes (activos y sin caducar), ordenados por urgencia y luego por fecha reciente
  const activeAnnouncements = useMemo(() => {
    return announcements
      .filter((a) => a.is_active && !isAnnouncementExpired(a.expires_at))
      .sort((a, b) => {
        const weightA = PRIORITY_WEIGHT[a.priority] || 0;
        const weightB = PRIORITY_WEIGHT[b.priority] || 0;
        if (weightB !== weightA) {
          return weightB - weightA; // Urgente primero
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [announcements]);

  // Crear anuncio (solo admin)
  const createAnnouncement = async (formData: AnnouncementFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      setActionLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const insertPayload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        priority: formData.priority,
        is_active: formData.is_active,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        created_by: user?.id || null,
      };

      const { error: insertErr } = await supabase.from('announcements').insert([insertPayload]);

      if (insertErr) {
        throw insertErr;
      }

      await fetchAnnouncements();
      return { success: true };
    } catch (err: any) {
      console.error('Error al crear anuncio:', err);
      const msg = err.message || 'Error al guardar el aviso.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setActionLoading(false);
    }
  };

  // Editar anuncio (solo admin)
  const updateAnnouncement = async (
    id: string,
    formData: AnnouncementFormData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setActionLoading(true);
      setError(null);

      const updatePayload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        priority: formData.priority,
        is_active: formData.is_active,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      };

      const { error: updateErr } = await supabase
        .from('announcements')
        .update(updatePayload)
        .eq('id', id);

      if (updateErr) {
        throw updateErr;
      }

      await fetchAnnouncements();
      return { success: true };
    } catch (err: any) {
      console.error('Error al actualizar anuncio:', err);
      const msg = err.message || 'Error al actualizar el aviso.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setActionLoading(false);
    }
  };

  // Alternar estado activo / inactivo (solo admin)
  const toggleActive = async (id: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      setActionLoading(true);
      setError(null);

      const { error: updateErr } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (updateErr) {
        throw updateErr;
      }

      await fetchAnnouncements();
      return { success: true };
    } catch (err: any) {
      console.error('Error al cambiar estado del anuncio:', err);
      const msg = err.message || 'Error al modificar el estado del aviso.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setActionLoading(false);
    }
  };

  // Soft-delete de anuncio (marcar deleted_at = now()) (solo admin)
  const deleteAnnouncement = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setActionLoading(true);
      setError(null);

      const { error: deleteErr } = await supabase
        .from('announcements')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (deleteErr) {
        throw deleteErr;
      }

      await fetchAnnouncements();
      return { success: true };
    } catch (err: any) {
      console.error('Error al archivar anuncio:', err);
      const msg = err.message || 'Error al archivar el aviso.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setActionLoading(false);
    }
  };

  return {
    allAnnouncements: announcements,
    activeAnnouncements,
    loading,
    actionLoading,
    error,
    clearError,
    refetch: fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    toggleActive,
    deleteAnnouncement,
  };
}
