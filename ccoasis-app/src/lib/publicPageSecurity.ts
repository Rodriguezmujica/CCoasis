import { supabase } from './supabase';

/**
 * Protocolos peligrosos explícitamente prohibidos en enlaces públicos.
 */
const DANGEROUS_PROTOCOLS_REGEX = /^\s*(javascript|data|vbscript|file|blob|about):/i;

/**
 * Patrones de inyección HTML o atributos ejecutables que nunca deben aparecer en una URL.
 */
const HTML_INJECTION_REGEX = /[<>"'`]|on\w+\s*=/i;

/**
 * Valida que una URL pública sea segura para renderizar en enlaces (`href`) o recursos (`src`).
 *
 * Reglas:
 * - Permite cadena vacía (`""` o solo espacios, que se considera "sin enlace configurado").
 * - Rechaza siempre `javascript:`, `data:`, `vbscript:`, etiquetas HTML o vectores XSS.
 * - Solo acepta URLs válidas con protocolo `https:` o `http:` y hostname presente.
 * - Permite enlaces de WhatsApp (`https://wa.me/...`, `https://api.whatsapp.com/...`, `https://chat.whatsapp.com/...`)
 *   y redes sociales siempre que usen `https:` o `http:` y tengan un formato de URL válido.
 */
export function isSafePublicUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();

  // Cadena vacía permitida (campo opcional vacío)
  if (trimmed === '') {
    return true;
  }

  // Rechazar caracteres de control, espacios internos no codificados o intentos de inyección HTML/atributos
  if (/[\u0000-\u001F\u007F\s]/.test(trimmed) || HTML_INJECTION_REGEX.test(trimmed)) {
    return false;
  }

  // Rechazar explícitamente protocolos peligrosos
  if (DANGEROUS_PROTOCOLS_REGEX.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);

    // Solo permitir http: o https:
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    // Debe tener un host válido no vacío y sin credenciales embebidas
    if (!parsed.hostname || parsed.username || parsed.password) {
      return false;
    }

    // Validación adicional si es un enlace corto de WhatsApp (wa.me)
    const hostLower = parsed.hostname.toLowerCase();
    if (hostLower === 'wa.me' || hostLower.endsWith('.wa.me')) {
      // En wa.me se recomienda https:
      if (parsed.protocol !== 'https:') {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Recorta espacios y asegura que un texto sea texto plano limpio.
 * Elimina caracteres de control invisibles (excepto saltos de línea y tabulaciones normales)
 * y etiquetas HTML residuales para garantizar que nunca se almacene ni muestre código inyectado.
 * Nota: En React este texto siempre debe renderizarse como nodo de texto normal, nunca con `dangerouslySetInnerHTML`.
 */
export function sanitizePlainText(text: string, maxLength?: number): string {
  if (typeof text !== 'string') {
    return '';
  }

  // 1. Eliminar caracteres de control nulos o no imprimibles (preservando \n y \r)
  let cleaned = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  // 2. Neutralizar posibles etiquetas HTML o scripts pegados por error, conservando el texto plano
  cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, '');

  // 3. Normalizar saltos de línea y recortar extremos
  cleaned = cleaned.replace(/\r\n/g, '\n').trim();

  // 4. Aplicar límite de longitud si se especifica
  if (typeof maxLength === 'number' && maxLength > 0 && cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength).trim();
  }

  return cleaned;
}

/**
 * Resuelve la URL pública de una imagen para la sección "Vida en Oasis" (`public-media`).
 *
 * - Si `imagePath` está vacío, devuelve cadena vacía `""`.
 * - Si `imagePath` ya comienza por `https://` o `http://` y pasa `isSafePublicUrl`, la devuelve directamente.
 * - Si `imagePath` comienza por un protocolo no seguro o falla la validación URL, devuelve `""`.
 * - Si es una ruta interna del bucket `public-media`, obtiene su URL pública mediante Supabase Storage.
 */
export function getPublicMediaUrl(imagePath: string): string {
  if (!imagePath || typeof imagePath !== 'string') {
    return '';
  }

  const trimmed = imagePath.trim();
  if (!trimmed) {
    return '';
  }

  // Si empieza por http:// o https://, verificar seguridad y devolver
  if (/^https?:\/\//i.test(trimmed)) {
    return isSafePublicUrl(trimmed) ? trimmed : '';
  }

  // Si contiene algún otro esquema (ej. javascript:, data:, etc.), rechazar
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return '';
  }

  // Limpiar barras iniciales y evitar traversal '..'
  const cleanInternalPath = trimmed.replace(/^\/+/, '');
  if (!cleanInternalPath || cleanInternalPath.includes('..') || HTML_INJECTION_REGEX.test(cleanInternalPath)) {
    return '';
  }

  const { data } = supabase.storage.from('public-media').getPublicUrl(cleanInternalPath);
  const publicUrl = data?.publicUrl || '';

  return isSafePublicUrl(publicUrl) ? publicUrl : '';
}
