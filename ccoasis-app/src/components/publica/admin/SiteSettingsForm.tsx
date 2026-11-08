import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';
import { AdminPublicSiteSettings, PublicSiteSettingsUpdate } from '../../../types/publicPage';
import { isSafePublicUrl } from '../../../lib/publicPageSecurity';

interface SiteSettingsFormProps {
  settings: AdminPublicSiteSettings;
  loading: boolean;
  saving: boolean;
  onSave: (input: PublicSiteSettingsUpdate) => Promise<{ ok: boolean; error?: string }>;
}

type FormState = Required<PublicSiteSettingsUpdate>;
type UrlKey = 'maps_url' | 'whatsapp_url' | 'instagram_url' | 'youtube_url' | 'live_stream_url';

const URL_KEYS: UrlKey[] = ['maps_url', 'whatsapp_url', 'instagram_url', 'youtube_url', 'live_stream_url'];

const URL_LABELS: Record<UrlKey, string> = {
  maps_url: 'El enlace de Google Maps',
  whatsapp_url: 'El enlace de WhatsApp',
  instagram_url: 'El enlace de Instagram',
  youtube_url: 'El enlace de YouTube',
  live_stream_url: 'El enlace de transmisión en vivo',
};

function toForm(s: AdminPublicSiteSettings): FormState {
  return {
    slogan: s.slogan || '',
    hero_title: s.hero_title || '',
    welcome_text: s.welcome_text || '',
    service_schedule: s.service_schedule || '',
    address: s.address || '',
    maps_url: s.maps_url || '',
    whatsapp_url: s.whatsapp_url || '',
    contact_email: s.contact_email || '',
    instagram_url: s.instagram_url || '',
    youtube_url: s.youtube_url || '',
    live_stream_url: s.live_stream_url || '',
  };
}

const inputClass =
  'w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#858a93] bg-white text-base text-[#1a1a1a] placeholder:text-[#6b7078] focus:outline-none focus:ring-2 focus:ring-[#0e7c86]';
const labelClass = 'block text-sm font-bold text-[#1a1a1a] mb-1';
const helpClass = 'text-xs text-[#4a4f57] mt-1';
const errorClass = 'text-xs font-semibold text-rose-800 mt-1';

export const SiteSettingsForm: React.FC<SiteSettingsFormProps> = ({
  settings,
  loading,
  saving,
  onSave,
}) => {
  const [form, setForm] = useState<FormState>(() => toForm(settings));
  const [urlErrors, setUrlErrors] = useState<Partial<Record<UrlKey, string>>>({});
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      setForm(toForm(settings));
    }
  }, [settings, loading]);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    if (key in urlErrors) {
      setUrlErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setSaveError(null);

    const errors: Partial<Record<UrlKey, string>> = {};
    for (const key of URL_KEYS) {
      if (!isSafePublicUrl(form[key])) {
        errors[key] = `${URL_LABELS[key]} no es válido. Debe empezar por https:// o http:// (o dejarse vacío).`;
      }
    }
    setUrlErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSaveError('Revisa los enlaces marcados en rojo antes de guardar.');
      return;
    }

    const result = await onSave(form);
    if (result.ok) {
      setSaved(true);
    } else {
      setSaveError(result.error || 'No se pudo guardar la configuración.');
    }
  };

  if (loading) {
    return (
      <div role="status" className="flex items-center gap-2 p-6 text-[#4a4f57]">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        <span>Cargando configuración...</span>
      </div>
    );
  }

  const renderUrlField = (key: UrlKey, label: string, placeholder: string, help?: string) => (
    <div>
      <label htmlFor={`f-${key}`} className={labelClass}>
        {label}
      </label>
      <input
        id={`f-${key}`}
        type="url"
        inputMode="url"
        value={form[key]}
        onChange={(e) => setField(key, e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(urlErrors[key])}
        className={inputClass}
      />
      {help && <p className={helpClass}>{help}</p>}
      {urlErrors[key] && (
        <p role="alert" className={errorClass}>
          {urlErrors[key]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <fieldset className="bg-white border border-[#d4d7dc] rounded-2xl p-5 space-y-4">
        <legend className="px-2 text-base font-extrabold text-[#1a1a1a]">Portada</legend>
        <div>
          <label htmlFor="f-slogan" className={labelClass}>Eslogan</label>
          <input
            id="f-slogan"
            type="text"
            maxLength={140}
            value={form.slogan}
            onChange={(e) => setField('slogan', e.target.value)}
            placeholder="Oasis: un hogar de refugio"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="f-hero" className={labelClass}>Título de portada</label>
          <input
            id="f-hero"
            type="text"
            maxLength={160}
            value={form.hero_title}
            onChange={(e) => setField('hero_title', e.target.value)}
            placeholder="Te esperamos este domingo"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="f-welcome" className={labelClass}>Mensaje de bienvenida</label>
          <textarea
            id="f-welcome"
            rows={4}
            maxLength={2000}
            value={form.welcome_text}
            onChange={(e) => setField('welcome_text', e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="bg-white border border-[#d4d7dc] rounded-2xl p-5 space-y-4">
        <legend className="px-2 text-base font-extrabold text-[#1a1a1a]">Horarios y ubicación</legend>
        <div>
          <label htmlFor="f-schedule" className={labelClass}>Horarios de reuniones</label>
          <textarea
            id="f-schedule"
            rows={4}
            maxLength={1000}
            value={form.service_schedule}
            onChange={(e) => setField('service_schedule', e.target.value)}
            placeholder={'Domingos 11:00 · Culto de celebración\nMiércoles 19:30 · Reunión de oración'}
            className={inputClass}
          />
          <p className={helpClass}>Escribe una reunión por línea, por ejemplo: «Domingos 11:00 · Culto de celebración».</p>
        </div>
        <div>
          <label htmlFor="f-address" className={labelClass}>Dirección postal</label>
          <input
            id="f-address"
            type="text"
            maxLength={400}
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="Calle Ejemplo 12, 28000 Madrid"
            className={inputClass}
          />
          <p className={helpClass}>Con solo escribir la dirección ya se genera el mapa y el botón «Cómo llegar» en la página pública.</p>
        </div>
        {renderUrlField(
          'maps_url',
          'Enlace de Google Maps (opcional)',
          'https://maps.app.goo.gl/...',
          'Si lo dejas vacío, se usa la dirección para crear el enlace automáticamente.'
        )}
      </fieldset>

      <fieldset className="bg-white border border-[#d4d7dc] rounded-2xl p-5 space-y-4">
        <legend className="px-2 text-base font-extrabold text-[#1a1a1a]">Contacto</legend>
        {renderUrlField(
          'whatsapp_url',
          'Enlace de WhatsApp',
          'https://wa.me/34600000000',
          'Formato: https://wa.me/ seguido del número con prefijo de país y sin signos (+34 600 000 000 → 34600000000).'
        )}
        <div>
          <label htmlFor="f-email" className={labelClass}>Correo de contacto</label>
          <input
            id="f-email"
            type="email"
            maxLength={200}
            value={form.contact_email}
            onChange={(e) => setField('contact_email', e.target.value)}
            placeholder="contacto@ejemplo.org"
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="bg-white border border-[#d4d7dc] rounded-2xl p-5 space-y-4">
        <legend className="px-2 text-base font-extrabold text-[#1a1a1a]">Redes y transmisión</legend>
        {renderUrlField('instagram_url', 'Instagram', 'https://www.instagram.com/tu_iglesia')}
        {renderUrlField('youtube_url', 'YouTube', 'https://www.youtube.com/@tu_iglesia')}
        {renderUrlField('live_stream_url', 'Enlace de transmisión en vivo', 'https://www.youtube.com/live/...')}
      </fieldset>

      {saveError && (
        <div role="alert" className="flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-600 text-rose-950 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{saveError}</span>
        </div>
      )}
      {saved && (
        <div role="status" className="flex items-start gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-600 text-emerald-950 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Cambios guardados. Ya se ven en la página pública.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#0e7c86] hover:bg-[#0a5961] text-white font-bold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Save className="w-5 h-5" aria-hidden="true" />}
        <span>{saving ? 'Guardando...' : 'Guardar cambios'}</span>
      </button>
    </form>
  );
};
