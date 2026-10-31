"""Genera los iconos de la PWA de forma determinista a partir de public/logo.png.

El logo es horizontal (1016x359). No se deforma ni se recorta el texto: se usa solo
el SÍMBOLO (la "O" cian con la cruz), que es prácticamente cuadrado, centrado sobre
un fondo liso con un margen del 20 % por cada lado.

Uso:
  python scripts/design/make_icons.py [directorio_salida]
Por defecto escribe en design-system/oasis/icon-preview/ (vista previa, sin tocar public/).
"""
import os
import sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LOGO = os.path.join(ROOT, 'public', 'logo.png')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'design-system', 'oasis', 'icon-preview')
BG = (255, 255, 255, 255)  # blanco: el cian del símbolo no se lee sobre fondos cian
MARGIN = 0.20


def extract_symbol(img):
    """Recorta la región del símbolo (x < 400) y la ajusta a su caja real de píxeles opacos."""
    region = img.crop((0, 0, 400, img.height))
    px = region.load()
    w, h = region.size
    keep = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    kp = keep.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # solo el cian de marca (el resto, p. ej. el inicio de la "A" magenta, se descarta)
            if a > 0 and g > 150 and b > 150 and r < 120:
                kp[x, y] = (r, g, b, a)
    bbox = keep.getbbox()
    return keep.crop(bbox)


def make_icon(symbol, size):
    canvas = Image.new('RGBA', (size, size), BG)
    inner = int(round(size * (1 - 2 * MARGIN)))
    sw, sh = symbol.size
    scale = inner / max(sw, sh)  # misma escala en ambos ejes: sin deformar
    resized = symbol.resize((max(1, round(sw * scale)), max(1, round(sh * scale))), Image.LANCZOS)
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


def main():
    os.makedirs(OUT, exist_ok=True)
    logo = Image.open(LOGO).convert('RGBA')
    print('Tamaño original del logo:', logo.size)
    symbol = extract_symbol(logo)
    print('Tamaño del símbolo recortado:', symbol.size)
    targets = {
        'icon-192.png': 192,
        'icon-512.png': 512,
        'icon-maskable-512.png': 512,
    }
    if os.path.abspath(OUT) == os.path.abspath(os.path.join(ROOT, 'public')):
        targets['apple-touch-icon.png'] = 180
        targets['favicon.png'] = 64
    for name, size in targets.items():
        icon = make_icon(symbol, size).convert('RGB')
        icon.save(os.path.join(OUT, name), optimize=True)
        print('Generado', name, icon.size)


if __name__ == '__main__':
    main()
