import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AppRole, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialSessionLoaded, setIsInitialSessionLoaded] = useState<boolean>(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Suscripción a Auth y carga de sesión inicial.
  // NO hacemos consultas a Supabase dentro del callback de onAuthStateChange:
  // allí SOLO se guarda la sesión en el estado (setSession).
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsInitialSessionLoaded(true);
      return;
    }

    let isMounted = true;

    // (a) Leer sesión inicial con getSession()
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession }, error: sessionError }) => {
        if (!isMounted) return;

        if (sessionError) {
          console.error('Error al obtener sesión inicial:', sessionError);
          setError(sessionError.message);
        }

        setSession(initialSession);
        setIsInitialSessionLoaded(true);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error inesperado en getSession():', err);
        setError(err?.message || 'Error al obtener sesión inicial');
        setIsInitialSessionLoaded(true);
      });

    // Callback de onAuthStateChange: SOLO setSession
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setIsInitialSessionLoaded(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. Cargar los roles en un useEffect separado que dependa de session?.user?.id:
  // cuando haya user.id, consulta user_roles filtrando por user_id.
  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId) {
      setRoles([]);
      setLoadedUserId(null);
      setIsRolesLoading(false);
      return;
    }

    let isMounted = true;
    setIsRolesLoading(true);
    setError(null);

    const loadRoles = async () => {
      try {
        const { data, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (!isMounted) return;

        if (rolesError) {
          console.error('Error al consultar user_roles:', rolesError);
          setError(rolesError.message);
          setRoles([]);
        } else {
          const userRoles = (data || []).map((item) => item.role as AppRole);
          setRoles(userRoles);
          setError(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Excepción al consultar roles:', err);
        setError(err?.message || 'Error inesperado al consultar los roles');
        setRoles([]);
      } finally {
        if (isMounted) {
          setLoadedUserId(userId);
          setIsRolesLoading(false);
        }
      }
    };

    loadRoles();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  const refreshRoles = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) {
      setRoles([]);
      setLoadedUserId(null);
      return;
    }

    setIsRolesLoading(true);
    setError(null);
    try {
      const { data, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        setError(rolesError.message);
        setRoles([]);
      } else {
        const userRoles = (data || []).map((item) => item.role as AppRole);
        setRoles(userRoles);
        setError(null);
      }
      setLoadedUserId(userId);
    } catch (err: any) {
      setError(err?.message || 'Error al refrescar roles');
      setRoles([]);
    } finally {
      setIsRolesLoading(false);
    }
  }, [session?.user?.id]);

  const signOut = async () => {
    setIsRolesLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setRoles([]);
      setLoadedUserId(null);
      setError(null);
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err);
      setError(err?.message || 'Error al cerrar sesión');
    } finally {
      setIsRolesLoading(false);
    }
  };

  const user = session?.user ?? null;
  const currentUserId = user?.id ?? null;

  // 3. Estado loading que es true hasta que:
  // (a) se haya leído la sesión inicial con getSession(), y
  // (b) los roles hayan terminado de cargar para el usuario actual, o no haya usuario.
  const isLoading =
    !isInitialSessionLoaded ||
    (Boolean(currentUserId) && (loadedUserId !== currentUserId || isRolesLoading));

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        isLoading,
        error,
        signOut,
        refreshRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
