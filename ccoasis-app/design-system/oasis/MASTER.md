# Sistema de diseño · Oasis (Centro Cristiano Oasis)

> Fuente de verdad visual de `ccoasis-app`. Generado con la skill `ui-ux-pro-max`
> (`search.py ... --design-system --persist -p "Oasis"`) y **ajustado a mano** porque la salida
> automática proponía una paleta morada y un patrón de landing (Hero + Testimonios + CTA) que no
> encajan: esto es una **app de gestión** (login, menú por rol, calendario, listas, formularios,
> modales), no una web de marketing. Se conservan de la skill: estilo *Accessible & Ethical*,
> foco visible de 3-4 px, objetivos táctiles de 44 px, `prefers-reduced-motion`, alto contraste.

Alcance: **solo capa de presentación**. No se toca lógica, rutas, hooks, Supabase, `src/lib`,
`src/context` ni `supabase/`.

## 1. Dónde viven hoy los tokens (inspección real)

| Dónde | Qué hay hoy |
|---|---|
| `tailwind.config.js` | Escala `brand` azul (`#eff6ff` … `#1e3a8a`). Tailwind 3.4 + PostCSS. |
| `src/index.css` | `@tailwind` + utilidades (`scrollbar-none`, `animate-slide-up`, `animate-fade-in`), `body { background:#f8fafc; color:#0f172a }`, fuente Inter/system. |
| `index.html` | `theme-color #2563eb`, `body class="bg-slate-50 text-slate-900 selection:bg-blue-100"`, viewport con `maximum-scale=1.0, user-scalable=no`. |
| `vite.config.ts` | Manifiesto PWA: `theme_color #2563eb`, `background_color #f8fafc`, iconos 192/512 `any maskable`. |
| `src/App.css` | Resto de plantilla de Vite (`#root` con `text-align:center`, `.logo`). No se usa como sistema. |
| Componentes (`src/views`, `src/components`) | ~1.280 clases de color escritas a mano (`blue-*`, `slate-*`, `purple-*`, `emerald-*`, `amber-*`, `rose-*`…). Ninguna con hex en línea. |

## 2. Paleta (extraída de `logo.png`)

Colores del logo: cian `#23d5da`, magenta `#ae4a84`, gris del rótulo `#888`. **Colores planos, sin degradados.**

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
| `--brand-cyan` | `#23d5da` | Acento y barra superior/activa. **Nunca texto ni borde sobre claro.** Texto encima: `#1a1a1a`. |
| `--primary` | `#0e7c86` | Botón primario, iconos y bordes de énfasis. Texto encima: blanco. |
| `--primary-hover` | `#0a5961` | Hover/pulsado del primario |
| `--primary-soft` | `#d9f7f8` | Fondo suave (ítem activo, chips). Texto: `#0a5961`. |
| `--brand-magenta` | `#ae4a84` | Acento secundario, enlaces sobre blanco, botón secundario. Texto encima: blanco. |
| `--link-on-gray` | `#9a3f73` | Enlaces sobre fondos grises/tarjetas grises |
| `--magenta-hover` | `#8f3b6b` | Hover del magenta |
| `--magenta-soft` | `#f6e6ef` | Fondo suave magenta. Texto: `#7a2f5a`. |
| `--focus` | `#0e7c86` | Aro de foco sobre superficies claras (3 px + 2 px de separación blanca) |
| `--focus-on-cyan` | `#1a1a1a` | Aro de foco sobre la barra cian |
| `--danger` / `--danger-soft` | `#9b1c1c` / `#fdecec` | Errores, borrar |
| `--success` / `--success-soft` | `#14532d` / `#e3f5e9` | Confirmaciones |
| `--warning` / `--warning-soft` | `#713f12` / `#fdf3d6` | Avisos |

### Reglas de uso (no negociables)

1. Texto **blanco sobre cian `#23d5da` está prohibido** (1,81:1). Sobre el cian: `#1a1a1a` (9,62:1).
2. Botones con texto blanco: cian oscuro `#0e7c86` (4,95:1) o magenta `#ae4a84` (5,11:1).
3. El cian `#23d5da` nunca como fondo grande, ni como color de texto/borde/icono sobre claro.
4. Enlaces: `#ae4a84` sobre blanco (5,11:1) y sobre `#f5f5f5` (4,68:1); sobre gris más oscuro `#9a3f73`.
5. Bordes e iconos con significado ≥ 3:1: `#0e7c86` o `#767b83`, nunca el cian de marca.
6. El color nunca es el único indicador (los tipos de actividad llevan además punto + leyenda con nombre).

### Tabla de contrastes (fórmula WCAG 2.x)

Calculada con `scripts/design/contrast.py` (reproducible: `python scripts/design/contrast.py`).
Los dos ❌ son pares **prohibidos a propósito**, incluidos para dejar constancia.

Ver [`contrast-table.md`](./contrast-table.md).

### Colores de tipo de actividad (calendario)

La app ya colorea las casillas **por tipo de actividad** (no por rol). Se mantiene esa función con
tonos armonizados (fondo claro + texto oscuro, 7:1 o más) y siempre con punto y leyenda:

| Tipo | Fondo | Borde / punto | Texto |
|---|---|---|---|
| Culto General | `#d9f7f8` | `#0e7c86` | `#0a5961` |
| Reunión de Oración | `#f6e6ef` | `#ae4a84` | `#7a2f5a` |
| Jóvenes / Adolescentes | `#e3f5e9` | `#2f7d4f` | `#14532d` |
| Evento Especial | `#fdf3d6` | `#a8741a` | `#713f12` |
| Actividad Pro-fondos | `#fdecec` | `#c0392b` | `#9b1c1c` |
| Otra Actividad | `#ebedef` | `#5b6068` | `#1a1a1a` |

## 3. Tipografía

- Familia: **Inter**, con respaldo `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` (ya está
  declarada; no se añade ninguna fuente externa, así la PWA no depende de red).
- Cuerpo ≥ 16 px en formularios (evita el zoom automático de iOS); texto auxiliar ≥ 12 px.
- Escala: 12 / 14 / 16 / 18 / 20 / 24 px. Títulos de pantalla 24 px/700; de tarjeta 18 px/600.
- Interlineado 1,5 en cuerpo. Longitud de línea ≤ 75 caracteres en texto corrido.

## 4. Espaciado, forma, elevación

- Ritmo de 4/8 px (`4, 8, 12, 16, 24, 32, 48`). Densidad media-alta (app de gestión).
- Radios: controles 10 px, tarjetas 12 px, modales 16 px, chips 999 px.
- Elevación mínima: borde 1 px en tarjetas, sombra suave solo en modales y hojas inferiores.
- Sin degradados, sin glassmorphism, sin sombras de color.

## 5. Componentes

| Componente | Especificación |
|---|---|
| Botón primario | Fondo `--primary`, texto blanco 16 px/600, alto mínimo **44 px**, radio 10 px, hover `--primary-hover`. |
| Botón secundario | Fondo blanco, borde `--border-control`, texto `--text`; hover `--surface-muted`. |
| Botón magenta | Fondo `--brand-magenta`, texto blanco; uso puntual (acción destacada secundaria). |
| Botón solo icono | Área 44×44 px, **`aria-label` obligatorio**, icono `--text-muted` (≥ 3:1). |
| Botón destructivo | Texto `--danger` sobre `--danger-soft`, confirmación por diálogo (ya existe). |
| Campo de texto | Alto 44 px, borde `--border-control`, etiqueta visible encima, error en línea con icono y texto. |
| Barra superior móvil | Fondo `--brand-cyan`, texto/iconos `#1a1a1a`. |
| Menú lateral (PC) | Fondo blanco; ítem activo `--primary-soft` + barra izquierda `--primary` 4 px + texto `#0a5961`. |
| Barra inferior (móvil) | Blanco, borde superior; ítem activo `--primary-soft` con texto `#0a5961`; 4 ítems + «Más». Alto táctil 56 px. |
| Tarjeta | `--surface`, borde `--border`, radio 12 px. |
| Tabla | Cabecera `--surface-muted`, filas con divisor `--border`, fila clicable con hover. En móvil se convierte en tarjetas (como hoy). |
| Chip de estado | Fondo suave + texto oscuro del mismo matiz (≥ 4,5:1); siempre con texto. |
| Modal / hoja inferior | `--surface`, radio 16 px, fondo atenuado `rgba(26,26,26,.55)`, foco atrapado, `Esc` cierra. |

## 6. Foco, teclado, movimiento, zoom

- `:focus-visible`: aro de 3 px `--focus` con separación de 2 px blanca (`outline-offset: 2px`).
  Sobre la barra cian: `--focus-on-cyan`. Nunca `outline: none` sin sustituto.
- Objetivos táctiles ≥ 44×44 px (los iconos pequeños amplían el área clicable con *padding*).
- `@media (prefers-reduced-motion: reduce)`: sin animaciones ni transiciones de transformación.
- Viewport: `width=device-width, initial-scale=1, viewport-fit=cover` (**sin** `user-scalable` ni
  `maximum-scale`: se permite el zoom).
- `theme-color` de la PWA: `#23d5da`; `background_color`: `#f5f5f5`.

## 7. Iconos

- Librería actual: `lucide-react` (trazo 2 px, se mantiene; no se mezclan familias).
- Iconos decorativos junto a texto: `aria-hidden="true"`. Icono solo: `aria-label` en el botón.
- Tamaños: 16 (en línea), 20 (menú/botones), 24 (cabeceras).
- **Iconos de la PWA:** símbolo del logo (la «O» cian con la cruz) centrado sobre blanco con margen
  del 20 %, sin deformar. Se generan con `scripts/design/make_icons.py` (Pillow, determinista).

## 8. Mapa de migración (Tailwind actual → token)

| Hoy | Pasa a |
|---|---|
| `bg-slate-50` (fondo de página) | `bg-app-bg` (`#f5f5f5`) |
| `bg-white` (tarjetas) | `bg-surface` |
| `text-slate-900` / `text-slate-600`/`500` | `text-ink` / `text-ink-muted` |
| `border-slate-200` | `border-line` |
| `border-slate-300` (campos) | `border-control` |
| `bg-blue-600 hover:bg-blue-700 text-white` | `bg-primary hover:bg-primary-hover text-white` |
| `text-blue-600` (enlaces/activo) | `text-link` (magenta) o `text-primary` (activo de menú) |
| `bg-blue-50 text-blue-700` | `bg-primary-soft text-primary-ink` |
| `focus:ring-blue-500` | `focus-visible:ring-focus` |
| `purple/emerald/amber/rose-*` (chips de rol/estado) | variantes `*-soft` + texto oscuro de los tokens |

Implementación prevista (Tailwind 3): variables CSS en `src/index.css` (`:root`) y colores semánticos
en `tailwind.config.js` (`app-bg`, `surface`, `ink`, `primary`, `link`, `focus`…), manteniendo
temporalmente la escala `brand` para no romper nada hasta migrar cada módulo.

## 9. Anti-patrones (prohibido)

- Patrones de landing: hero, «Servicios», «Nosotros», llamadas a la acción de marketing.
- Texto de relleno o el texto «Pro Max» en la interfaz. Todo el contenido visible es el real, en español.
- Degradado cian→magenta, cian como fondo grande, texto blanco sobre cian.
- Emojis como iconos estructurales; iconos sin `aria-label` cuando van solos.
- `user-scalable=no`, `maximum-scale`, `outline: none` sin sustituto.
- Cachear datos de Supabase en el service worker (la caché de la PWA solo guarda archivos de la app).

## 10. Lista de verificación por fase

- [ ] `npm run build` sin errores
- [ ] Contraste de cada par nuevo contra la tabla (texto 4,5:1 · grande y no-texto 3:1)
- [ ] Foco visible con Tab en cada pantalla, también en la barra cian
- [ ] 390 px y 1280 px sin scroll horizontal; zoom 200 % sin pérdida de contenido
- [ ] Objetivos táctiles ≥ 44 px; botones solo icono con `aria-label`
- [ ] `prefers-reduced-motion` respetado
- [ ] Mismo menú y contenido por rol (admin, tesorero, maestro, alumno)
