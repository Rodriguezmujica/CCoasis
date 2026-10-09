import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { UserNotification } from '../types/notifications';
import { useAuth } from './AuthContext';

export interface NotificationsContextType {
  notifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const userId = user?.id;

  // Carga inicial o refetch de notificaciones
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchErr) throw fetchErr;

      if (mountedRef.current) {
        setNotifications((data as UserNotification[]) || []);
      }
    } catch (err: any) {
      console.error('Error al cargar notificaciones:', err);
      if (mountedRef.current) {
        setError(err.message || 'No se pudieron cargar las notificaciones.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  // Efecto para cargar y suscribirse a cambios en tiempo real
  useEffect(() => {
    fetchNotifications();

    if (!userId) return;

    // Generar un nombre de canal único por instancia de suscripción para evitar colisiones en Realtime y React Strict Mode
    const channelName = `user-notifs-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  // Conteo reactivo de no leídas
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read_at).length;
  }, [notifications]);

  // Marcar una notificación individual como leída
  const markAsRead = async (id: string): Promise<boolean> => {
    if (!userId) return false;

    // Actualización optimista local
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n))
    );

    try {
      const { error: updateErr } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);

      if (updateErr) throw updateErr;
      return true;
    } catch (err: any) {
      console.error('Error al marcar notificación como leída:', err);
      fetchNotifications();
      return false;
    }
  };

  // Marcar todas las notificaciones no leídas como leídas
  const markAllAsRead = async (): Promise<boolean> => {
    if (!userId) return false;

    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return true;

    setActionLoading(true);
    const nowIso = new Date().toISOString();

    // Actualización optimista local
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || nowIso })));

    try {
      const { error: updateErr } = await supabase
        .from('user_notifications')
        .update({ read_at: nowIso })
        .eq('user_id', userId)
        .is('read_at', null);

      if (updateErr) throw updateErr;
      return true;
    } catch (err: any) {
      console.error('Error al marcar todas como leídas:', err);
      fetchNotifications();
      return false;
    } finally {
      if (mountedRef.current) {
        setActionLoading(false);
      }
    }
  };

  // Eliminar una notificación
  const deleteNotification = async (id: string): Promise<boolean> => {
    if (!userId) return false;

    // Actualización optimista local
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      const { error: deleteErr } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteErr) throw deleteErr;
      return true;
    } catch (err: any) {
      console.error('Error al eliminar notificación:', err);
      fetchNotifications();
      return false;
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        actionLoading,
        error,
        refetch: fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications debe utilizarse dentro de un NotificationsProvider.');
  }
  return context;
};
