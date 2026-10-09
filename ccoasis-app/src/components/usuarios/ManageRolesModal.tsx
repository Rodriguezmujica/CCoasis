import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { AppUser, ROLE_DESCRIPTIONS, ROLE_BADGE_STYLES } from '../../types/users';
import { AppRole } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';

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
      const confirmed = window.confirm(
        '¡Atención! Estás a punto de quitarte el rol de Administrador a ti mismo.\n' +
        'Si confirmas, perderás acceso de inmediato a este panel de administración.\n\n' +
        '¿Estás seguro de que deseas continuar?'
      );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Gestionar roles</h2>
              <p className="text-xs text-blue-100 truncate max-w-[240px]">
                {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <div className="font-semibold text-slate-800">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-slate-500 mt-0.5">{user.email}</div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Roles asignados
            </label>
            {AVAILABLE_ROLES.map(({ role, label }) => {
              const checked = user.roles.includes(role);
              const isCurrent = togglingRole === role;

              return (
                <label
                  key={role}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    checked
                      ? 'bg-blue-50/70 border-blue-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  } ${isCurrent ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle(role)}
                    disabled={isCurrent}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{label}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${ROLE_BADGE_STYLES[role]}`}
                      >
                        {role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{ROLE_DESCRIPTIONS[role]}</p>
                  </div>
                  {isCurrent && <Loader2 className="w-4 h-4 animate-spin text-blue-600 ml-2 mt-1" />}
                </label>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
