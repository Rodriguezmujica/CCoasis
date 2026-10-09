import React, { useState, useEffect, useCallback } from 'react';
import { Link2, CheckCircle2, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
      const confirmed = window.confirm(
        '¡Atención! Estás a punto de quitarte el rol de administrador a ti mismo. ' +
        'Si continúas, podrías perder acceso a esta sección. ¿Deseas continuar?'
      );
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
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900">Acceso a la app</h3>
      </div>

      {isLoadingLink ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Cargando...</span>
        </div>
      ) : userLink.user_id ? (
        /* ── Cuenta vinculada ── */
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Cuenta vinculada</span>
          </div>

          {/* Role checkboxes */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Roles asignados:</p>
            <div className="space-y-2">
              {ALL_ROLES.map((role) => {
                const checked = userLink.roles.includes(role);
                const isToggling = togglingRole === role;
                return (
                  <label
                    key={role}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    } ${isToggling ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleRoleToggle(role)}
                      disabled={isToggling}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">{ROLE_LABELS[role]}</span>
                    {isToggling && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 ml-auto" />}
                  </label>
                );
              })}
            </div>
          </div>

          {roleError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{roleError}</span>
            </div>
          )}
        </div>
      ) : (
        /* ── Sin cuenta vinculada ── */
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Esta persona no tiene cuenta de usuario vinculada. Introduce el correo de una cuenta
            existente para vincularla.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo de la cuenta
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={linkEmail}
                onChange={(e) => {
                  setLinkEmail(e.target.value);
                  setLinkError(null);
                  setLinkSuccess(null);
                }}
                placeholder="usuario@ejemplo.com"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleLink}
                disabled={isLinking}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Link2 className="w-4 h-4" />
                {isLinking ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </div>

          {linkError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{linkError}</span>
            </div>
          )}

          {linkSuccess && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{linkSuccess}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
