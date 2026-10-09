import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppRole } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, session, roles, isLoading } = useAuth();
  const location = useLocation();

  // 3. Mientras loading sea true, muestra "Cargando..." y NO navegues ni redirijas
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 text-sm font-medium">Cargando...</p>
      </div>
    );
  }

  // Sin sesión activa -> redirigir a login
  if (!session || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Usuario autenticado sin ningún rol asignado -> redirigir a /sin-permisos
  if (roles.length === 0) {
    return <Navigate to="/sin-permisos" replace />;
  }

  // Verificación de rol para ruta protegida
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some((role) => roles.includes(role));
    if (!hasPermission) {
      return <Navigate to="/sin-permisos" replace />;
    }
  }

  return <>{children}</>;
};
