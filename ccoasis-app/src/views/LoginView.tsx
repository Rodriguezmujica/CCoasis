import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LOGIN_SUCCESS_EVENT } from '../components/LoginIntro';
import { Lock, Mail, AlertCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { session, isLoading: authLoading } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mientras authLoading sea true, muestra "Cargando..." y NO navegues ni redirijas
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app-bg">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-ink-muted text-sm font-medium">Cargando...</p>
      </div>
    );
  }

  // Cuando authLoading sea false y ya exista sesión, redirigir a la ruta previa o a "/"
  if (session) {
    const fromLocation = (location.state as { from?: { pathname?: string; search?: string } })?.from;
    const redirectTarget = fromLocation
      ? `${fromLocation.pathname || '/'}${fromLocation.search || ''}`
      : '/';
    return <Navigate to={redirectTarget} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage(
        'Faltan las variables VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env.'
      );
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, ingresa tu correo electrónico y contraseña.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Credenciales incorrectas. Verifica tu correo electrónico y contraseña.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('El correo electrónico no ha sido confirmado.');
        } else {
          setErrorMessage(`Error al iniciar sesión: ${error.message}`);
        }
        setIsSubmitting(false);
        return;
      }

      // Aviso para la animación de entrada (capa superpuesta; no afecta a la navegación).
      window.dispatchEvent(new Event(LOGIN_SUCCESS_EVENT));

      // TRAS EL LOGIN: NO navegamos manualmente.
      // onAuthStateChange actualiza session, el efecto carga roles,
      // y cuando authLoading sea false, este componente o HomeRedirect redirige.
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocurrió un error inesperado al conectar con el servidor.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      {/* Franja superior de identidad cian (#23d5da) + magenta (#ae4a84) */}
      <div className="h-2.5 bg-brand-cyan w-full flex-shrink-0" aria-hidden="true" />
      <div className="h-1.5 bg-brand-magenta w-full flex-shrink-0" aria-hidden="true" />

      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6">
        <div className="max-w-md w-full">
          {/* Cabecera / Identidad */}
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="Centro Cristiano Oasis"
              className="w-[200px] h-auto mx-auto mb-3 object-contain"
            />
            <h1 className="text-[26px] leading-tight font-extrabold oasis-text-gradient">
              Centro Cristiano Oasis
            </h1>
            <p className="text-sm text-ink-muted mt-1">
              Plataforma de Gestión Eclesial y Discipulado
            </p>
          </div>

          {/* Alerta si falta configurar .env */}
          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-warning-soft border border-amber-300 rounded-[12px] text-warning text-xs flex gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <p className="font-bold mb-1">Configuración pendiente</p>
                <p>
                  Copia el archivo <code>.env.example</code> a <code>.env</code> y define tus credenciales de Supabase (
                  <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>).
                </p>
              </div>
            </div>
          )}

          {/* Tarjeta blanca de Login */}
          <div className="bg-surface rounded-[12px] border border-line p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-ink">Iniciar sesión</h2>
            <p className="text-sm text-ink-muted mt-1 mb-5">
              Ingresa con tus credenciales otorgadas por la administración.
            </p>

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 bg-danger-soft border border-rose-300 rounded-2xl text-danger text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Email / Usuario */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-ink mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail
                    className="w-5 h-5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ccoasis.org"
                    required
                    autoComplete="username"
                    className="w-full min-h-[44px] pl-11 pr-4 py-2.5 bg-white border border-control rounded-xl text-base text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-focus transition"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-ink mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock
                    className="w-5 h-5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full min-h-[44px] pl-11 pr-12 py-2.5 bg-white border border-control rounded-xl text-base text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-focus transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-0 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-ink-muted hover:text-ink transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] mt-2 py-2.5 px-4 bg-primary hover:bg-primary-hover active:bg-brand-800 disabled:opacity-50 text-white font-semibold text-base rounded-xl transition shadow-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Iniciar sesión</span>
                )}
              </button>
            </form>

            {/* Aviso de registro cerrado */}
            <div className="mt-6 pt-5 border-t border-line text-center">
              <p className="text-sm text-ink-muted">
                ¿No tienes cuenta? Contacta al administrador de la iglesia.
              </p>
              <p className="text-xs text-ink-muted mt-1">
                El registro público está deshabilitado por motivos de seguridad.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-ink-muted mt-6">
            Centro Cristiano Oasis &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};
