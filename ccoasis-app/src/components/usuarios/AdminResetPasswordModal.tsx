import React, { useState, useEffect } from 'react';
import { X, KeyRound, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { AppUser } from '../../types/users';

interface AdminResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  onUpdatePassword: (
    userId: string,
    newPassword: string,
    userEmail?: string
  ) => Promise<{ ok: boolean; error?: string; message?: string }>;
  onSuccess?: (message: string) => void;
}

export const AdminResetPasswordModal: React.FC<AdminResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdatePassword,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reiniciar estado cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setIsSubmitting(false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validaciones en frontend
    if (!newPassword) {
      setErrorMessage('Por favor, ingresa la nueva contraseña.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor, verifica que sean idénticas.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await onUpdatePassword(user.userId, newPassword, user.email);

      if (res.ok) {
        const msg = res.message || 'Contraseña actualizada correctamente.';
        setSuccessMessage(msg);
        if (onSuccess) {
          onSuccess(msg);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Error al actualizar la contraseña del usuario.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error inesperado al procesar el cambio de contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordValid = newPassword.length >= 6;
  const doPasswordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#d4d7dc] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="px-6 py-5 oasis-title-gradient on-magenta text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Cambiar contraseña
              </h2>
              <p className="text-xs text-white font-medium mt-0.5 truncate max-w-[220px]">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar"
            className="p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-white hover:bg-white/15 transition-colors disabled:opacity-50 shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Ficha informativa del usuario objetivo */}
          <div className="p-3.5 rounded-2xl bg-[#f5f5f5] border border-[#d4d7dc] text-xs text-[#4a4f57] space-y-1">
            <div className="font-bold text-[#1a1a1a] text-sm">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-[#4a4f57] font-medium">{user.email}</div>
          </div>

          {/* Mensaje de error */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-600 text-rose-950 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700" aria-hidden="true" />
              <div className="flex-1 font-bold">{errorMessage}</div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-100 border border-emerald-600 text-emerald-950 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-800" aria-hidden="true" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Advertencia de acción administrativa */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-100 border border-amber-600 text-amber-950 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-900 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Esta acción modificará inmediatamente la contraseña del usuario. Recuérdale ingresar con la nueva clave.
            </p>
          </div>

          {/* Campo: Nueva Contraseña */}
          <div>
            <label className="block text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
              Nueva contraseña <span className="text-[#9b1c1c]">*</span>
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4f57]"
                aria-hidden="true"
              />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-12 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder-[#4a4f57]/70 focus:outline-none focus:border-[#0e7c86] disabled:bg-[#f5f5f5]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[#4a4f57] hover:text-[#1a1a1a] rounded-xl"
                title={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {newPassword.length > 0 && (
              <p
                className={`text-xs mt-1 font-bold ${
                  isPasswordValid ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {isPasswordValid
                  ? '✓ Longitud mínima alcanzada'
                  : `Faltan ${6 - newPassword.length} caracter${6 - newPassword.length > 1 ? 'es' : ''}`}
              </p>
            )}
          </div>

          {/* Campo: Confirmar Nueva Contraseña */}
          <div>
            <label className="block text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
              Confirmar nueva contraseña <span className="text-[#9b1c1c]">*</span>
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4f57]"
                aria-hidden="true"
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                placeholder="Repite la nueva contraseña"
                className="w-full pl-10 pr-12 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder-[#4a4f57]/70 focus:outline-none focus:border-[#0e7c86] disabled:bg-[#f5f5f5]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[#4a4f57] hover:text-[#1a1a1a] rounded-xl"
                title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p
                className={`text-xs mt-1 font-bold ${
                  doPasswordsMatch ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {doPasswordsMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-[#e5e7eb] flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newPassword || !confirmPassword}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold text-white bg-[#0e7c86] hover:bg-[#0a5961] transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" aria-hidden="true" />
                  <span>Actualizar contraseña</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
