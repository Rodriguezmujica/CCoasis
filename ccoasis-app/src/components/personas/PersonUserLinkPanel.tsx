import React, { useState, useEffect, useCallback } from 'react';
import { Link2, CheckCircle2, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Person, PersonUserLink, ALL_ROLES, ROLE_LABELS } from '../../types/persons';
import { AppRole } from '../../types/auth';

interface PersonUserLinkPanelProps {
  person: Person;
  linkPersonToUser: (personId: string, email: string) => Promise<{ ok: boolean; error?: string }>;
  getPersonUserLink: (person: Person) => Promise<PersonUserLink>;
  addUserRole: (userId: string, role: AppRole) => Promise<{ ok: boolean; error?: string }>;
  removeUserRole: (userId: string, role: AppRole) => Promise<{ ok: boolean; error?: string }>;
  onLinked: () => void;
}

export const PersonUserLinkPanel: React.FC<PersonUserLinkPanelProps> = ({
  person,
  linkPersonToUser,
  getPersonUserLink,
  addUserRole,
  removeUserRole,
  onLinked,
}) => {
  const { user: currentUser } = useAuth();
  const { confirm } = useConfirm();
  const [linkEmail, setLinkEmail] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [userLink, setUserLink] = useState<PersonUserLink>({ user_id: null, roles: [] });
  const [isLoadingLink, setIsLoadingLink] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [togglingRole, setTogglingRole] = useState<AppRole | null>(null);

  const loadLink = useCallback(async () => {
    setIsLoadingLink(true);
    const link = await getPersonUserLink(person);
    setUserLink(link);
    setIsLoadingLink(false);
  }, [person, getPersonUserLink]);

  useEffect(() => {
    loadLink();
  }, [loadLink]);

  const handleLink = async () => {
    if (!linkEmail.trim()) {
      setLinkError('Introduce un correo electrónico.');
      return;
    }
    setIsLinking(true);
    setLinkError(null);
    setLinkSuccess(null);

    const result = await linkPersonToUser(person.id, linkEmail.trim());
    if (result.ok) {
      setLinkSuccess('Cuenta vinculada correctamente.');
      setLinkEmail('');
      onLinked();
      await loadLink();
    } else {
      setLinkError(result.error || 'Error al vincular.');
    }
    setIsLinking(false);
  };

  const handleRoleToggle = async (role: AppRole) => {
    if (!userLink.user_id) return;
    const hasRole = userLink.roles.includes(role);

    // Warn before removing own admin role
    if (hasRole && role === 'admin' && userLink.user_id === currentUser?.id) {
      const confirmed = await confirm({
        title: '¡Atención! Quitar rol de Administrador',
        message: (
          <div>
            <p>
              Estás a punto de quitarte el rol de <strong>Administrador</strong> a ti mismo.
            </p>
            <p className="text-xs text-[#713f12] bg-[#fdf3d6] p-2.5 rounded-xl border border-[#a8741a] mt-2 font-medium">
              Si continúas, perderás el acceso a las funciones de administración y a esta sección de inmediato. ¿Deseas continuar?
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
    setRoleError(null);

    const result = hasRole
      ? await removeUserRole(userLink.user_id, role)
      : await addUserRole(userLink.user_id, role);

    if (result.ok) {
      setUserLink((prev) => ({
        ...prev,
        roles: hasRole ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
      }));
    } else {
      setRoleError(result.error || 'Error al modificar el rol.');
    }
    setTogglingRole(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#d4d7dc] p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-[#0e7c86]" />
        <h3 className="font-bold text-base text-[#1a1a1a]">Acceso a la app</h3>
      </div>

      {isLoadingLink ? (
        <div className="flex items-center gap-2 text-[#4a4f57] text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-[#0e7c86]" />
          <span>Cargando...</span>
        </div>
      ) : userLink.user_id ? (
        /* ── Cuenta vinculada ── */
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#14532d] bg-[#e3f5e9] border border-[#2f7d4f] rounded-xl px-3.5 py-2.5 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#2f7d4f]" />
            <span className="font-semibold">Cuenta vinculada</span>
          </div>

          {/* Casillas de rol */}
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a] mb-2">Roles asignados:</p>
            <div className="space-y-2">
              {ALL_ROLES.map((role) => {
                const checked = userLink.roles.includes(role);
                const isToggling = togglingRole === role;
                return (
                  <label
                    key={role}
                    className={`min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#d9f7f8] border-[#0e7c86] text-[#0a5961]'
                        : 'bg-white border-[#d4d7dc] hover:border-[#858a93] text-[#1a1a1a]'
                    } ${isToggling ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleRoleToggle(role)}
                      disabled={isToggling}
                      className="w-4 h-4 rounded border-[#858a93] text-[#0e7c86] focus:ring-[#0e7c86]"
                    />
                    <span className="text-sm font-semibold">{ROLE_LABELS[role]}</span>
                    {isToggling && (
                      <Loader2 className="w-4 h-4 animate-spin text-[#0e7c86] ml-auto" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {roleError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#fdecec] border border-rose-300 text-[#9b1c1c] text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{roleError}</span>
            </div>
          )}
        </div>
      ) : (
        /* ── Sin cuenta vinculada ── */
        <div className="space-y-3">
          <p className="text-sm text-[#4a4f57]">
            Esta persona no tiene cuenta de usuario vinculada. Introduce el correo de una cuenta
            existente para vincularla.
          </p>
          <div>
            <label className="block text-sm font-semibold text-[#1a1a1a] mb-1.5">
              Correo de la cuenta
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={linkEmail}
                onChange={(e) => {
                  setLinkEmail(e.target.value);
                  setLinkError(null);
                  setLinkSuccess(null);
                }}
                placeholder="usuario@ejemplo.com"
                className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder:text-[#5b6068] bg-white focus:outline-none focus:ring-2 focus:ring-[#0e7c86]"
              />
              <button
                type="button"
                onClick={handleLink}
                disabled={isLinking}
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#0e7c86] hover:bg-[#0a5961] disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Link2 className="w-4 h-4" />
                {isLinking ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </div>

          {linkError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#fdecec] border border-rose-300 text-[#9b1c1c] text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{linkError}</span>
            </div>
          )}

          {linkSuccess && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#e3f5e9] border border-[#2f7d4f] text-[#14532d] text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{linkSuccess}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
