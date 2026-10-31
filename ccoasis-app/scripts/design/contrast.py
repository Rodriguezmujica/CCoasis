"""Calcula contrastes WCAG 2.x de los pares de color del rediseño (determinista)."""
import json
import sys


def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def lum(h):
    h = h.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# (uso, primer plano, fondo, mínimo exigido)
PAIRS = [
    ('Texto principal sobre fondo de página', '#1a1a1a', '#f5f5f5', 4.5),
    ('Texto principal sobre tarjeta blanca', '#1a1a1a', '#ffffff', 4.5),
    ('Texto secundario sobre tarjeta blanca', '#4a4f57', '#ffffff', 4.5),
    ('Texto secundario sobre fondo de página', '#4a4f57', '#f5f5f5', 4.5),
    ('Texto oscuro sobre cian de marca (cabecera)', '#1a1a1a', '#23d5da', 4.5),
    ('Texto blanco sobre cian de marca (NO usar)', '#ffffff', '#23d5da', 4.5),
    ('Texto blanco sobre barra magenta (#ae4a84)', '#ffffff', '#ae4a84', 4.5),
    ('Texto grande blanco sobre inicio degradado (#0f9aa2)', '#ffffff', '#0f9aa2', 3.0),
    ('Texto normal blanco sobre inicio degradado (#0f9aa2 - NO usar en texto <18pt)', '#ffffff', '#0f9aa2', 4.5),
    ('Texto grande blanco sobre punto medio degradado (#5f7293)', '#ffffff', '#5f7293', 3.0),
    ('Texto grande blanco sobre fin degradado (#ae4a84)', '#ffffff', '#ae4a84', 3.0),
    ('Texto blanco en botón primario (cian oscuro)', '#ffffff', '#0e7c86', 4.5),
    ('Texto blanco sobre magenta de marca', '#ffffff', '#ae4a84', 4.5),
    ('Enlace magenta sobre blanco', '#ae4a84', '#ffffff', 4.5),
    ('Enlace magenta sobre fondo de página', '#ae4a84', '#f5f5f5', 4.5),
    ('Enlace magenta oscuro sobre tarjeta gris', '#9a3f73', '#f5f5f5', 4.5),
    ('Enlace magenta oscuro sobre gris de cabecera de tabla', '#9a3f73', '#ebedef', 4.5),
    ('Texto blanco sobre magenta oscuro (hover)', '#ffffff', '#8f3b6b', 4.5),
    ('Cian oscuro como texto/icono sobre blanco', '#0e7c86', '#ffffff', 4.5),
    ('Cian oscuro como icono/borde sobre fondo de página', '#0e7c86', '#f5f5f5', 3.0),
    ('Cian de marca como borde/icono sobre blanco (NO usar)', '#23d5da', '#ffffff', 3.0),
    ('Borde de campo de formulario sobre blanco', '#767b83', '#ffffff', 3.0),
    ('Aro de foco cian oscuro sobre blanco', '#0e7c86', '#ffffff', 3.0),
    ('Aro de foco cian oscuro sobre fondo de página', '#0e7c86', '#f5f5f5', 3.0),
    ('Aro de foco oscuro sobre la barra cian', '#1a1a1a', '#23d5da', 3.0),
    ('Aro de foco blanco sobre magenta (botón magenta)', '#ffffff', '#ae4a84', 3.0),
    ('Texto activo menú (cian oscuro) sobre fondo cian muy claro', '#0a5961', '#d9f7f8', 4.5),
    ('Texto sobre insignia magenta clara', '#7a2f5a', '#f6e6ef', 4.5),
    ('Error: texto sobre fondo de error', '#9b1c1c', '#fdecec', 4.5),
    ('Éxito: texto sobre fondo de éxito', '#14532d', '#e3f5e9', 4.5),
    ('Aviso: texto sobre fondo de aviso', '#713f12', '#fdf3d6', 4.5),
]

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    rows = []
    for uso, fg, bg, minimo in PAIRS:
        r = ratio(fg, bg)
        rows.append((uso, fg, bg, r, minimo, r >= minimo))
    if '--md' in sys.argv:
        print('| Uso | Primer plano | Fondo | Ratio | Mínimo | Resultado |')
        print('|---|---|---|---|---|---|')
        for uso, fg, bg, r, m, ok in rows:
            print(f"| {uso} | `{fg}` | `{bg}` | {r:.2f}:1 | {m}:1 | {'✅ cumple' if ok else '❌ no cumple'} |")
    else:
        for uso, fg, bg, r, m, ok in rows:
            print(f"{'OK ' if ok else 'NO '} {r:5.2f}  (min {m})  {fg} sobre {bg}  - {uso}")
