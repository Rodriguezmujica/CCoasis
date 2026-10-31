import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { AppUser, ROLE_DESCRIPTIONS, ROLE_BADGE_STYLES } from '../../types/users';
import { AppRole } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';

const AVAILABLE_ROLES: { role: AppRole; label: string }[] = [
  { role: 'admin', label: 'Administrador' },
  { role: 'tesorero', label: 'Tesorero' },
  { role: 'maestro', label: 'Maestro' },
  { role: 'alumno', label: 'Miembro / Alumno' },
];

interface ManageRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  onAddRole: (userId: string, role: AppRole) => Promise<{ ok: boolean; error?: string }>;
  onRemoveRole: (userId: string, role: AppRole) => Promise<{ ok: boolean; error?: string }>;
  onRolesUpdated: () => void;
}

export const ManageRolesModal: React.FC<ManageRolesModalProps> = ({
  isOpen,
  onClose,
  user,
  onAddRole,
  onRemoveRole,
  onRolesUpdated,
}) => {
  const { user: currentAuthUser } = useAuth();
  const { confirm } = useConfirm();
  const [togglingRole, setTogglingRole] = useState<AppRole | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleToggle = async (role: AppRole) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const hasRole = user.roles.includes(role);

    // Impedir que quede sin roles
    if (hasRole && user.roles.length === 1) {
      setErrorMsg('El usuario debe conservar al menos un rol activo.');
      return;
    }

    // Advertencia de seguridad si se quita a sí mismo el rol de admin
    if (hasRole && role === 'admin' && user.userId === currentAuthUser?.id) {
      const confirmed = await confirm({
        title: '¡Atención! Quitar rol de Administrador',
        message: (
          <div>
            <p>
              Estás a punto de quitarte el rol de <strong>Administrador</strong> a ti mismo.
            </p>
            <p className="text-xs font-medium text-amber-950 bg-amber-100 p-2.5 rounded-xl border border-amber-600 mt-2">
              Si confirmas, perderás el acceso de inmediato a este panel de administración. ¿Estás seguro de que deseas continuar?
            </p>
          </div>
        ),
        confirmText: 'Sí, quitar rol',
        cancelText: 'Cancelar',
        variant: 'warning',
      });
      if (!confirmed) return;
    }

    setTogglingRole(role);

    const res = hasRole
      ? await onRemoveRole(user.userId, role)
      : await onAddRole(user.userId, role);

    if (res.ok) {
      setSuccessMsg(
        hasRole ? `Rol ${role} removido con éxito.` : `Rol ${role} asignado con éxito.`
      );
      onRolesUpdated();
      setTimeout(() => setSuccessMsg(null), 2000);
    } else {
      setErrorMsg(res.error || 'Error al actualizar el rol.');
    }

    setTogglingRole(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#d4d7dc] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 oasis-title-gradient on-magenta text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Gestionar roles
              </h2>
              <p className="text-xs text-white font-medium mt-0.5 truncate max-w-[240px]">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-white hover:bg-white/15 transition-colors shrink-0"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#f5f5f5] border border-[#d4d7dc] text-xs text-[#4a4f57]">
            <div className="font-bold text-[#1a1a1a] text-sm">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-[#4a4f57] font-medium mt-0.5">{user.email}</div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-600 text-rose-950 text-xs font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-100 border border-emerald-600 text-emerald-950 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-800" aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">
              Roles asignados
            </label>
            {AVAILABLE_ROLES.map(({ role, label }) => {
              const checked = user.roles.includes(role);
              const isCurrent = togglingRole === role;

              return (
                <label
                  key={role}
                  className={`flex items-start gap-3 p-3.5 min-h-[44px] rounded-2xl border cursor-pointer transition-colors ${
                    checked
                      ? 'bg-[#d9f7f8] border-[#0e7c86] shadow-sm'
                      : 'bg-white border-[#858a93] hover:bg-[#f5f5f5]'
                  } ${isCurrent ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle(role)}
                    disabled={isCurrent}
                    className="w-5 h-5 mt-0.5 rounded border-[#858a93] text-[#0e7c86] focus:ring-[#0e7c86] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#1a1a1a]">{label}</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${ROLE_BADGE_STYLES[role]}`}
                      >
                        {role}
                      </span>
                    </div>
                    <p className="text-xs text-[#4a4f57] mt-0.5">{ROLE_DESCRIPTIONS[role]}</p>
                  </div>
                  {isCurrent && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#0e7c86] ml-2 mt-1 shrink-0" />
                  )}
                </label>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#e5e7eb] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
