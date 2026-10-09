import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabasePublishableKey && 
  supabaseUrl.trim() !== '' && 
  supabasePublishableKey.trim() !== ''
);

if (!isSupabaseConfigured) {
  console.warn(
    'ADVERTENCIA: VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY no están configuradas en el archivo .env.'
  );
}

// Inicialización del cliente de Supabase (exclusivamente con clave public/anon)
// NUNCA se utiliza la clave service_role
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabasePublishableKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
