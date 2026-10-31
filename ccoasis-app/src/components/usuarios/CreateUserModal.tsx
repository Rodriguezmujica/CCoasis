import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Link2,
} from 'lucide-react';
import { AppRole } from '../../types/auth';
import { Person } from '../../types/persons';
import { CreateUserPayload, ROLE_DESCRIPTIONS, ROLE_BADGE_STYLES } from '../../types/users';

const AVAILABLE_ROLES: { role: AppRole; label: string }[] = [
  { role: 'admin', label: 'Administrador' },
  { role: 'tesorero', label: 'Tesorero' },
  { role: 'maestro', label: 'Maestro' },
  { role: 'alumno', label: 'Miembro / Alumno' },
];

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlinkedPersons: Person[];
  onSubmit: (payload: CreateUserPayload) => Promise<{ ok: boolean; error?: string; message?: string }>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  unlinkedPersons,
  onSubmit,
}) => {
  const [linkToExisting, setLinkToExisting] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(['alumno']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        if (prev.length === 1) {
          setFormError('El usuario debe tener al menos un rol asignado.');
          return prev;
        }
        setFormError(null);
        return prev.filter((r) => r !== role);
      } else {
        setFormError(null);
        return [...prev, role];
      }
    });
  };

  const handleSelectPerson = (personId: string) => {
    setSelectedPersonId(personId);
    setFormError(null);

    const found = unlinkedPersons.find((p) => p.id === personId);
    if (found) {
      setFirstName(found.first_name);
      setLastName(found.last_name);
      if (found.email) {
        setEmail(found.email);
      }
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
    }
  };

  const handleToggleLinkExisting = (checked: boolean) => {
    setLinkToExisting(checked);
    setFormError(null);
    if (!checked) {
      setSelectedPersonId('');
      setFirstName('');
      setLastName('');
      setEmail('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (linkToExisting && !selectedPersonId) {
      setFormError('Por favor, selecciona una persona de la lista para vincular.');
      return;
    }

    if (!linkToExisting && (!firstName.trim() || !lastName.trim())) {
      setFormError('El nombre y el apellido son obligatorios.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Introduce una dirección de correo electrónico válida.');
      return;
    }

    if (!password || password.length < 6) {
      setFormError('La contraseña inicial debe tener al menos 6 caracteres.');
      return;
    }

    if (selectedRoles.length === 0) {
      setFormError('Debes seleccionar al menos un rol para el usuario.');
      return;
    }

    setIsSubmitting(true);

    const payload: CreateUserPayload = {
      email: email.trim().toLowerCase(),
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      roles: selectedRoles,
      person_id: linkToExisting && selectedPersonId ? selectedPersonId : null,
    };

    const res = await onSubmit(payload);

    if (res.ok) {
      setSuccessMessage(res.message || 'Usuario creado correctamente.');
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      setFormError(res.error || 'Ocurrió un error al crear el usuario.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#d4d7dc] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 oasis-title-gradient on-magenta text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Crear nuevo usuario
              </h2>
              <p className="text-xs text-white font-medium mt-0.5">
                Crea credenciales de acceso y asigna roles
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-white hover:bg-white/15 transition-colors disabled:opacity-50 shrink-0"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-600 text-rose-950 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-700" aria-hidden="true" />
              <div className="flex-1 font-bold">{formError}</div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-100 border border-emerald-600 text-emerald-950 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-800" aria-hidden="true" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Opción: Vincular a persona existente */}
          <div className="bg-[#f5f5f5] border border-[#d4d7dc] rounded-2xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none min-h-[44px]">
              <input
                type="checkbox"
                checked={linkToExisting}
                onChange={(e) => handleToggleLinkExisting(e.target.checked)}
                disabled={isSubmitting}
                className="w-5 h-5 rounded border-[#858a93] text-[#0e7c86] focus:ring-[#0e7c86] shrink-0"
              />
              <span className="text-sm font-bold text-[#1a1a1a] flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-[#0e7c86]" aria-hidden="true" />
                Vincular a una persona ya registrada
              </span>
            </label>

            {linkToExisting && (
              <div className="pt-2.5 border-t border-[#d4d7dc]">
                <label className="block text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                  Seleccionar persona existente (sin cuenta)
                </label>
                {unlinkedPersons.length === 0 ? (
                  <p className="text-xs font-medium text-amber-950 bg-amber-100 p-3 rounded-xl border border-amber-600">
                    No hay personas sin cuenta registradas en el sistema. Puedes crear el usuario directamente abajo y se creará su ficha automáticamente.
                  </p>
                ) : (
                  <select
                    value={selectedPersonId}
                    onChange={(e) => handleSelectPerson(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] bg-white text-base text-[#1a1a1a] focus:outline-none focus:border-[#0e7c86]"
                  >
                    <option value="">-- Elige una persona --</option>
                    {unlinkedPersons.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name} {p.email ? `(${p.email})` : ''} - [{p.status}]
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Campos de Nombre y Apellido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                Nombre <span className="text-[#9b1c1c]">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4f57]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSubmitting || (linkToExisting && Boolean(selectedPersonId))}
                  placeholder="Ej. Juan"
                  className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder-[#4a4f57]/70 focus:outline-none focus:border-[#0e7c86] disabled:bg-[#f5f5f5] disabled:text-[#4a4f57]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                Apellido <span className="text-[#9b1c1c]">*</span>
              </label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4f57]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSubmitting || (linkToExisting && Boolean(selectedPersonId))}
                  placeholder="Ej. Pérez"
                  className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder-[#4a4f57]/70 focus:outline-none focus:border-[#0e7c86] disabled:bg-[#f5f5f5] disabled:text-[#4a4f57]"
                />
              </div>
            </div>
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
              Correo Electrónico <span className="text-[#9b1c1c]">*</span>
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4f57]"
                aria-hidden="true"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                placeholder="usuario@ejemplo.com"
                className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder-[#4a4f57]/70 focus:outline-none focus:border-[#0e7c86] disabled:bg-[#f5f5f5]"
              />
            </div>
            <p className="text-xs text-[#4a4f57] mt-1">
              Servirá como nombre de usuario para iniciar sesión.
            </p>
          </div>

          {/* Contraseña Inicial */}
          <div>
            <label className="block text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">
              Contraseña Inicial <span className="text-[#9b1c1c]">*</span>
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4f57]"
                aria-hidden="true"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-12 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] text-base text-[#1a1a1a] placeholder-[#4a4f57]/70 focus:outline-none focus:border-[#0e7c86] disabled:bg-[#f5f5f5]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[#4a4f57] hover:text-[#1a1a1a] rounded-xl"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-[#4a4f57] mt-1">
              Comunícale esta contraseña al usuario para su primer ingreso.
            </p>
          </div>

          {/* Selección de Roles */}
          <div>
            <label className="block text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2">
              Roles en la aplicación <span className="text-[#9b1c1c]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_ROLES.map(({ role, label }) => {
                const isChecked = selectedRoles.includes(role);
                return (
                  <label
                    key={role}
                    className={`flex items-start gap-3 p-3.5 min-h-[44px] rounded-2xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-[#d9f7f8] border-[#0e7c86] shadow-sm'
                        : 'bg-white border-[#858a93] hover:bg-[#f5f5f5]'
                    } ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleRoleToggle(role)}
                      disabled={isSubmitting}
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
                      <p className="text-xs text-[#4a4f57] mt-0.5 leading-snug">
                        {ROLE_DESCRIPTIONS[role]}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-[#e5e7eb] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
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
              disabled={isSubmitting || Boolean(successMessage)}
              className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] rounded-xl text-sm font-bold text-white bg-[#0e7c86] hover:bg-[#0a5961] shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando usuario...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  <span>Crear usuario</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
