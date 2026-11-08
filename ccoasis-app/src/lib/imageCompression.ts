/**
 * Compresor de imágenes nativo del navegador (Image + <canvas>), sin librerías externas.
 *
 * - Redimensiona manteniendo la proporción: lado mayor <= 1600 px (nunca amplía).
 * - Exporta a image/webp (calidad 0.82); si el navegador no soporta WebP,
 *   usa image/jpeg (calidad 0.85).
 */

export const MAX_IMAGE_SIDE_PX = 1600;
export const WEBP_QUALITY = 0.82;
export const JPEG_QUALITY = 0.85;

export interface CompressedImage {
  blob: Blob;
  mimeType: 'image/webp' | 'image/jpeg';
  extension: 'webp' | 'jpg';
}

function loadImage(file: File): Promise<{ img: HTMLImageElement; revoke: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, revoke: () => URL.revokeObjectURL(url) });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen seleccionada.'));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Comprime y redimensiona una imagen antes de subirla a Storage.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  const { img, revoke } = await loadImage(file);
  try {
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    if (!srcW || !srcH) {
      throw new Error('La imagen no tiene dimensiones válidas.');
    }

    const scale = Math.min(1, MAX_IMAGE_SIDE_PX / Math.max(srcW, srcH));
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Tu navegador no permite optimizar imágenes.');
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Si el navegador no soporta WebP, toBlob devuelve un PNG: se comprueba el tipo real.
    const webp = await canvasToBlob(canvas, 'image/webp', WEBP_QUALITY);
    if (webp && webp.type === 'image/webp') {
      return { blob: webp, mimeType: 'image/webp', extension: 'webp' };
    }

    const jpeg = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
    if (jpeg && jpeg.type === 'image/jpeg') {
      return { blob: jpeg, mimeType: 'image/jpeg', extension: 'jpg' };
    }

    throw new Error('No se pudo optimizar la imagen en este navegador.');
  } finally {
    revoke();
  }
}
