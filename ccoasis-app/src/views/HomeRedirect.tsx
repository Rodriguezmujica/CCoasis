import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultPathForRoles } from '../config/navigation';
import { PublicWelcomeView } from './PublicWelcomeView';

export const HomeRedirect: React.FC = () => {
  const { session, roles, isLoading } = useAuth();

  // Visitante sin sesión activa: mostrar la vista pública de bienvenida de inmediato
  // sin quedarse bloqueado esperando user_roles ni redirigir a /login.
  if (!session) {
    return <PublicWelcomeView />;
  }

  // Usuario con sesión activa: esperar a que terminen de cargar sus roles
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5]">
        <div className="w-12 h-12 border-4 border-[#0e7c86] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-[#4a4f57] text-sm font-medium">Cargando...</p>
      </div>
    );
  }

  const destination = getDefaultPathForRoles(roles);
  return <Navigate to={destination} replace />;
};
