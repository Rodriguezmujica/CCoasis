import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginView } from './views/LoginView';
import { HomeRedirect } from './views/HomeRedirect';
import { SinPermisosView } from './views/SinPermisosView';
import {
  PersonasView,
  ClasesView,
  ClassroomDetailView,
  FinanzasView,
  UsuariosView,
  MisClasesView,
  StudentClassroomDetailView,
  CalendarioView,
  AuditoriaView,
} from './views/modules';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública de login */}
          <Route path="/login" element={<LoginView />} />

          {/* Ruta explícita para usuarios sin roles o sin permisos (nunca redirige a "/") */}
          <Route path="/sin-permisos" element={<SinPermisosView />} />

          {/* Redirección raíz según sesión y roles (HomeRedirect) */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Rutas protegidas dentro del Layout de la aplicación */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Todos los roles autenticados: Calendario */}
            <Route
              path="/calendario"
              element={
                <ProtectedRoute allowedRoles={['admin', 'tesorero', 'maestro', 'alumno']}>
                  <CalendarioView />
                </ProtectedRoute>
              }
            />

            {/* admin: Personas, Clases, Finanzas, Usuarios */}
            <Route
              path="/personas"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PersonasView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clases"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ClasesView />
                </ProtectedRoute>
              }
            />
            {/* Gestión del Aula (Lado Maestro y Admin) */}
            <Route
              path="/clases/ciclo/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'maestro']}>
                  <ClassroomDetailView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsuariosView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auditoria"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditoriaView />
                </ProtectedRoute>
              }
            />

            {/* admin, tesorero: Finanzas */}
            <Route
              path="/finanzas"
              element={
                <ProtectedRoute allowedRoles={['admin', 'tesorero']}>
                  <FinanzasView />
                </ProtectedRoute>
              }
            />

            {/* maestro, alumno: Mis clases */}
            <Route
              path="/mis-clases"
              element={
                <ProtectedRoute allowedRoles={['maestro', 'alumno']}>
                  <MisClasesView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mis-clases/ciclo/:id"
              element={
                <ProtectedRoute allowedRoles={['maestro', 'alumno']}>
                  <StudentClassroomDetailView />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Ruta por defecto para cualquier URL no reconocida */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
