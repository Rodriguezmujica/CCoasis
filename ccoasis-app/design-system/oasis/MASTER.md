# Sistema de diseño · Oasis (Centro Cristiano Oasis)

> Fuente de verdad visual de `ccoasis-app`. Generado con la skill `ui-ux-pro-max`
> (`search.py ... --design-system --persist -p "Oasis"`) y adaptado a la **identidad visual aprobada**
> del Centro Cristiano Oasis con los colores del logo (`logo.png`).
> Esto es una **app de gestión** (login, menú por rol, calendario, listas, formularios, modales),
> no una web de marketing. Se conservan las reglas de accesibilidad de la skill: contraste WCAG AA,
> foco visible de 3-4 px, objetivos táctiles de 44 px y `prefers-reduced-motion`.

Alcance: **solo capa de presentación**. No se toca lógica, rutas, hooks, Supabase, `src/lib`,
`src/context` ni `supabase/`.

## 1. Dónde viven hoy los tokens (inspección real)

| Dónde | Qué hay hoy |
|---|---|
| `tailwind.config.js` | Define `colors.brand` (`50`…`900` en azules `#eff6ff`…`#1e3a8a`), pero **`brand-*` tiene 0 usos en `src/`**. Los componentes usan directamente `blue-*` (~275 ocurrencias) y `slate-*`. |
| `src/index.css` | `@tailwind` + utilidades (`scrollbar-none`, `animate-slide-up`, `animate-fade-in`), `body { background:#f8fafc; color:#0f172a }`, fuente Inter/system. |
| `index.html` | `theme-color #2563eb`, `body class="bg-slate-50 text-slate-900 selection:bg-blue-100"`, viewport con `maximum-scale=1.0, user-scalable=no`. |
| `vite.config.ts` | Manifiesto PWA: `theme_color #2563eb`, `background_color #f8fafc`, iconos 192/512 `any maskable`. |
| `src/App.css` | Resto de plantilla de Vite (`#root` con `text-align:center`, `.logo`). No se usa como sistema. |
| Componentes (`src/views`, `src/components`) | ~1.280 clases de color escritas a mano (`blue-*`, `slate-*`, `purple-*`, `emerald-*`, `amber-*`, `rose-*`…). Ninguna con hex en línea. |

## 2. Identidad visual aprobada y paleta (`logo.png`)

Colores extraídos del logo: cian `#23d5da`, magenta `#ae4a84`, gris del rótulo `#888888`.

### Rasgos de identidad aprobados

1. **Cabecera cian (`#23d5da`) con texto e iconos oscuros (`#1a1a1a`, 9,62:1):** barra superior en móvil y cabecera de identidad en el menú lateral de escritorio.
2. **Barra magenta (`#ae4a84`) con texto blanco (`#ffffff`, 5,11:1):** franja secundaria de rol/identidad bajo la cabecera y acentos destacados.
3. **Degradado `linear-gradient(135deg, #0f9aa2, #ae4a84)` exclusivo para títulos grandes (`h1` ≥ 24 px / 700):** se aplica mediante `background-clip: text` sobre fondo claro (o como cabecera de bloque solo con título grande blanco ≥ 18 pt). El extremo `#0f9aa2` tiene **3,41:1** contra blanco (cumple el mínimo de **3:1** de texto grande WCAG AA, pero **no** debe usarse en texto normal pequeño < 18 pt).

### Tokens semánticos

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#f5f5f5` | Fondo de página |
| `--surface` | `#ffffff` | Tarjetas, modales, tablas |
| `--surface-muted` | `#ebedef` | Cabecera de tabla, zonas secundarias |
| `--text` | `#1a1a1a` | Texto principal |
| `--text-muted` | `#4a4f57` | Texto secundario |
| `--border` | `#d4d7dc` | Divisores y bordes decorativos |
| `--border-control` | `#767b83` | Borde de campos (≥ 3:1) |
| `--brand-cyan` | `#23d5da` | Cabecera cian y acento de marca. **Texto encima siempre oscuro `#1a1a1a` (9,62:1).** |
| `--brand-cyan-grad` | `#0f9aa2` | Inicio del degradado para títulos grandes (`#0f9aa2` → `#ae4a84`, 3,41:1). |
| `--primary` | `#0e7c86` | Botón primario, iconos y bordes de énfasis (4,95:1 con texto blanco). |
| `--primary-hover` | `#0a5961` | Hover/pulsado del primario (7,96:1 con blanco). |
| `--primary-soft` | `#d9f7f8` | Fondo suave (ítem activo, chips). Texto: `#0a5961` (7,12:1). |
| `--brand-magenta` | `#ae4a84` | Barra magenta, enlaces sobre blanco, insignias y acción secundaria. Texto encima: `#ffffff` (5,11:1). |
| `--link-on-gray` | `#9a3f73` | Enlaces sobre fondos grises/tarjetas grises (5,78:1 sobre `#f5f5f5`). |
| `--magenta-hover` | `#8f3b6b` | Hover del magenta (6,99:1 con blanco). |
| `--magenta-soft` | `#f6e6ef` | Fondo suave magenta. Texto: `#7a2f5a` (7,34:1). |
| `--focus` | `#0e7c86` | Aro de foco sobre superficies claras (3 px + 2 px de separación blanca). |
| `--focus-on-cyan` | `#1a1a1a` | Aro de foco sobre la cabecera cian (9,62:1). |
| `--focus-on-magenta` | `#ffffff` | Aro de foco sobre la barra magenta (5,11:1). |
| `--danger` / `--danger-soft` | `#9b1c1c` / `#fdecec` | Errores, borrar |
| `--success` / `--success-soft` | `#14532d` / `#e3f5e9` | Confirmaciones |
| `--warning` / `--warning-soft` | `#713f12` / `#fdf3d6` | Avisos |

### Reglas de contraste (no negociables)

1. Texto **blanco sobre cian `#23d5da` está prohibido** (1,81:1). Sobre el cian `#23d5da` va siempre `#1a1a1a` (9,62:1).
2. Sobre la **barra magenta `#ae4a84`** va siempre **texto blanco `#ffffff`** (5,11:1).
3. El **degradado `#0f9aa2` → `#ae4a84`** se usa **únicamente en títulos grandes** (`h1` ≥ 24 px bold, donde el mínimo WCAG es 3:1 y `#0f9aa2` da 3,41:1). Prohibido en texto normal pequeño (< 18 pt).
4. Botones primarios con texto blanco usan `#0e7c86` (4,95:1) o `#ae4a84` (5,11:1).
5. Bordes e iconos con significado ≥ 3:1 sobre claro usan `#0e7c86` o `#767b83`, nunca `#23d5da`.
6. El color nunca es el único indicador (los tipos de actividad llevan además punto + leyenda con nombre).

### Tabla de contrastes (fórmula WCAG 2.x)

Calculada con `scripts/design/contrast.py` (reproducible: `python scripts/design/contrast.py`).
Ver [`contrast-table.md`](./contrast-table.md).

### Colores de tipo de actividad (calendario)

La app ya colorea las casillas **por tipo de actividad** (no por rol). Se mantiene esa función con
tonos armonizados (fondo claro + texto oscuro, ≥ 7:1) y siempre con punto y leyenda:

| Tipo | Fondo | Borde / punto | Texto |
|---|---|---|---|
| Culto General | `#d9f7f8` | `#0e7c86` | `#0a5961` |
| Reunión de Oración | `#f6e6ef` | `#ae4a84` | `#7a2f5a` |
| Jóvenes / Adolescentes | `#e3f5e9` | `#2f7d4f` | `#14532d` |
| Evento Especial | `#fdf3d6` | `#a8741a` | `#713f12` |
| Actividad Pro-fondos | `#fdecec` | `#c0392b` | `#9b1c1c` |
| Otra Actividad | `#ebedef` | `#5b6068` | `#1a1a1a` |

## 3. Tipografía

- Familia: **Inter**, con respaldo `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` (sin fuentes externas para que la PWA no dependa de red).
- Cuerpo ≥ 16 px en formularios (evita el zoom automático de iOS); texto auxiliar ≥ 12 px.
- Escala: 12 / 14 / 16 / 18 / 20 / 24 px.
- **Títulos grandes (`h1` de pantalla y título del login, 24-28 px / 700-800):** llevan el degradado `linear-gradient(135deg, #0f9aa2 0%, #ae4a84 100%)` con `-webkit-background-clip: text; color: transparent` (y color de respaldo `#0e7c86`).

## 4. Espaciado, forma, elevación

- Ritmo de 4/8 px (`4, 8, 12, 16, 24, 32, 48`). Densidad media-alta (app de gestión).
- Radios: controles 10 px, tarjetas 12 px, modales 16 px, chips 999 px.
- Elevación limpia: borde 1 px en tarjetas, sombra suave en modales y hojas inferiores.

## 5. Componentes

| Componente | Especificación |
|---|---|
| Cabecera cian | Fondo `#23d5da`, texto e iconos `#1a1a1a` (9,62:1), logo sobre pastilla blanca. |
| Barra magenta | Franja bajo la cabecera con fondo `#ae4a84` y texto blanco `#ffffff` (5,11:1) mostrando el contexto/rol activo. |
| Título grande (`h1`) | Degradado `#0f9aa2` → `#ae4a84` en texto (`>= 24 px` bold, ≥ 3,41:1). |
| Botón primario | Fondo `--primary` (`#0e7c86`), texto blanco 16 px/600, alto mínimo **44 px**, radio 10 px, hover `--primary-hover` (`#0a5961`). |
| Botón secundario | Fondo blanco, borde `--border-control`, texto `--text`; hover `--surface-muted`. |
| Botón magenta | Fondo `--brand-magenta` (`#ae4a84`), texto blanco; hover `--magenta-hover` (`#8f3b6b`). |
| Botón solo icono | Área 44×44 px, **`aria-label` obligatorio**, icono con contraste ≥ 3:1. |
| Campo de texto | Alto 44 px, borde `--border-control`, etiqueta visible encima, error en línea con icono y texto. |
| Menú lateral (PC) | Cabecera cian `#23d5da` con texto oscuro + barra magenta `#ae4a84` con texto blanco; ítem activo `--primary-soft` + barra izquierda `--primary` 4 px + texto `#0a5961`. |
| Barra inferior (móvil) | Blanco, borde superior; ítem activo `--primary-soft` con texto `#0a5961`; 4 ítems + «Más». Alto táctil 56 px. |
| Modal / hoja inferior | `--surface`, radio 16 px, fondo atenuado `rgba(26,26,26,.55)`, `Esc` cierra. |

## 6. Foco, teclado, movimiento, zoom

- `:focus-visible`: aro de 3 px `--focus` (`#0e7c86`) con separación de 2 px. Sobre la cabecera cian: `#1a1a1a`. Sobre la barra magenta: `#ffffff`.
- Objetivos táctiles ≥ 44×44 px.
- `@media (prefers-reduced-motion: reduce)`: desactiva animaciones y transiciones de movimiento.
- Viewport: `width=device-width, initial-scale=1, viewport-fit=cover` (**sin** `user-scalable` ni `maximum-scale`).
- `theme-color` de la PWA: `#23d5da`; `background_color`: `#f5f5f5`.

## 7. Iconos

- Librería actual: `lucide-react` (se mantiene).
- Iconos decorativos junto a texto: `aria-hidden="true"`. Icono solo: `aria-label` en el botón.
- **Iconos de la PWA:** símbolo del logo (la «O» cian con la cruz) centrado sobre blanco con margen del 20 %, sin deformar (`scripts/design/make_icons.py`).

## 8. Estrategia de migración en `tailwind.config.js` (remapeo de escala + excepciones)

En el código actual, `brand-*` tiene **0 usos**, mientras que `blue-*` tiene **275 usos** como color primario. Por tanto, en `tailwind.config.js` remapearemos `brand` **y** `blue` a la nueva escala Oasis y añadiremos `magenta` para la barra/acentos secundarios:

```js
// Escala Oasis en tailwind.config.js (aplicada a brand y blue)
{
  50:  '#eefcfc', // Fondos muy suaves
  100: '#d9f7f8', // Fondo de chip / ítem activo (con text-700/800/900/950 cumple >= 4.95:1)
  200: '#aaeif0', // Bordes suaves decorativos
  300: '#6ddfe3', // Bordes medios
  400: '#23d5da', // CIAN DEL LOGO (cabecera con texto oscuro #1a1a1a; NUNCA con texto blanco)
  500: '#0f9aa2', // Cian medio (inicio de degradado títulos grandes, 3.41:1 sobre blanco)
  600: '#0e7c86', // PRIMARIO ACCESIBLE (bg-blue-600 text-white = 4.95:1; text-blue-600 sobre blanco = 4.95:1)
  700: '#0a5961', // Hover primario / texto sobre bg-100 (7.96:1 sobre blanco, 7.12:1 sobre #d9f7f8)
  800: '#08474e', // Activo oscuro (9.75:1 sobre blanco)
  900: '#06373c', // Muy oscuro (11.8:1 sobre blanco)
  950: '#042428', // Tinta casi negra (14.5:1 sobre blanco)
}
```

### Qué se resuelve de golpe con este remapeo (sin tocar cada archivo)

- Los **28 `bg-blue-600 text-white`** y **21 `hover:bg-blue-700`** pasan automáticamente a `#0e7c86` / `#0a5961` (**4,95:1** y **7,96:1** con blanco ✅).
- Los **64 `text-blue-600`** y **19 `text-blue-700`** sobre fondos blancos/claros pasan a `#0e7c86` / `#0a5961` (**≥ 4,54:1** ✅).
- Los **24 `focus:ring-blue-500`** y **19 `border-blue-600`** pasan a `#0f9aa2` (**3,41:1** ≥ 3:1 ✅) y `#0e7c86` (**4,95:1** ≥ 3:1 ✅).
- Las combinaciones de chips **`bg-blue-50`/`100` con `text-blue-700`/`800`/`900`/`950`** cumplen todas (**≥ 6,5:1** ✅).

### Pares de contraste que FALLARÍAN con el remapeo y que corregiremos como excepciones

1. **Si se pusiera `#23d5da` en `600`:** fallarían los 28 botones `bg-blue-600 text-white` (1,81:1 ❌) y los 64 textos `text-blue-600` sobre blanco (1,81:1 ❌). Por eso `#23d5da` va en `400` (`bg-brand-400 text-[#1a1a1a]`) y `600` es `#0e7c86`.
2. **`text-blue-500` sobre blanco (`#0f9aa2` sobre `#ffffff` = 3,41:1 ❌ para texto normal):** hay **1 ocurrencia** (`AppLayout.tsx:314`, icono de flecha en el menú «Más»). Para icono cumple 3:1 (3,41:1), pero en cualquier texto normal debe cambiarse a `text-blue-600` (`#0e7c86`, 4,95:1).
3. **`border-blue-400` / `ring-blue-400` sobre blanco (`#23d5da` sobre `#ffffff` = 1,81:1 ❌ < 3:1):** hay **2 ocurrencias** (`CalendarGridView.tsx:382` y `AppLayout.tsx:277`) donde el borde/anillo de estado activo usa `400`. Deben pasar a `600` (`#0e7c86`, 4,95:1).
4. **Banners con `from-blue-600 via-indigo-600 to-blue-700` y textos internos `text-blue-100` / `text-blue-200`:** hay **2 componentes** (`CalendarioView.tsx:382` y `SelfChangePasswordModal.tsx:109`). Si el banner lleva degradado a magenta (`#ae4a84`), un texto cian claro `text-blue-200` (`#aaeif0`) sobre magenta `#ae4a84` cae a **3,65:1** (❌ < 4,5:1 para texto normal). En esos bloques el texto secundario debe ser `text-white` (5,11:1).
5. **Textos o bordes grises demasiado claros (`text-slate-400`, `placeholder-slate-400`, `border-slate-300` en inputs):** `#94a3b8` sobre blanco da **2,56:1** (❌). En los controles e inputs se cambian al token de borde/texto secundario accesible (`#767b83` 4,26:1 para bordes, `#4a4f57` 8,24:1 para texto secundario).

## 9. Anti-patrones (prohibido)

- Patrones de landing: hero de marketing, «Servicios», «Nosotros», llamadas a la acción comerciales.
- Texto de relleno o el texto «Pro Max» en la interfaz. Todo el contenido visible es el real, en español.
- Texto blanco sobre cian `#23d5da` (1,81:1).
- Usar el degradado `#0f9aa2` → `#ae4a84` en texto pequeño o párrafos (solo en títulos grandes `h1`).
- Emojis como iconos estructurales; botones solo icono sin `aria-label`.
- `user-scalable=no`, `maximum-scale`, `outline: none` sin sustituto.
- Cachear datos de Supabase en el service worker.
