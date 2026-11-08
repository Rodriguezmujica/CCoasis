# PLAN_INICIO_Y_PUBLICA: pantalla `/inicio` por rol y página pública

> Documento de traspaso. Léelo junto con `CONTEXTO_PROYECTO.md`, `CONTEXTO_PENDIENTE.md`, `IDEAS_FUTURAS.md` y `design-system/oasis/MASTER.md`. Si algo de aquí contradice al repositorio real, **verifica y avisa; no supongas**.

Última actualización: 8 de noviembre de 2026.

---

## A. Cómo usar este archivo con Gemini (para Luis)

Gemini redacta los prompts; Antigravity los ejecuta. Un chat nuevo de Antigravity por fase.

**Mensaje para Gemini** (pega este archivo y, debajo, esto):

```
Lee el archivo adjunto. Eres mi redactor de prompts para Antigravity. Quiero
el prompt de la FASE N (indica el número). Reglas: usa el BLOQUE FIJO DE
REGLAS de la sección 2 tal cual, la especificación de esa fase de la
sección 5, y sus pruebas. No inventes nombres de archivos ni de funciones
que no estén en este documento: si un dato falta, haz que el prompt le
pida a Antigravity inspeccionarlo antes. Entrégame un único bloque de texto
listo para pegar, en español, y nada más.
```

**Antes de cada fase:** `git status` limpio y estar en la rama correcta. **Después de cada fase:** pruebas de la sección 6 con ventana de incógnito.

Si Antigravity dice "listo", verifícalo tú: lo que escribe sobre sí mismo es un informe, no una prueba.

---

## 1. Estado actual

- Producción: `https://c-coasis.vercel.app` (Vercel, rama `main`). Supabase `ccoasis-app`, región West EU, plan gratuito.
- Rediseño visual, animación del libro, respaldos y keep-alive: hechos y en `main` (ver `CONTEXTO_PENDIENTE.md`).
- **Pantalla de Inicio por Rol (`/inicio`) 100% COMPLETADA y FUSIONADA en `main`:**
  - **Fases 1 a 6 `[HECHO]` y probadas por Luis** (`8f2e6d0`, `52403bc`, `3b3d950`, `9952ffc`, `2243f29`, `a24fefd`).
  - `/inicio` es ahora el primer ítem de navegación y el destino predeterminado al iniciar sesión para los cuatro roles (`admin`, `tesorero`, `maestro`, `alumno`), con `start_url: "/inicio"` en el manifiesto PWA.
  - Incluye saludo personalizado, avisos separados por prioridad, próximo evento con confirmación de asistencia (`InicioNextEventCard` + RSVP), mis turnos y tarjetas por rol con filtro de chips multi-rol y estados vacíos compactos.
- **Queda pendiente únicamente la sección 8** (Página pública de bienvenida para visitantes, sujeta a la aprobación y datos de los pastores).

### Cómo funciona la app hoy (informe de solo lectura, verificado por Luis)
- `HomeRedirect` (`/`): mientras `isLoading` muestra "Cargando..." y no navega; sin sesión va a `/login`; con sesión va a `getDefaultPathForRoles(roles)`.
- `getDefaultPathForRoles` devuelve la ruta del primer ítem de `NAV_ITEMS` accesible: ahora es `/inicio` para todos los roles con permisos. Sin roles: `/sin-permisos`.
- `ProtectedRoute`: cargando, spinner; sin sesión, `/login` guardando `state.from`; sin roles o sin el rol exigido, `/sin-permisos`.
- `/sin-permisos` **nunca redirige a `/`**. No se debe cambiar.
- `LoginView`: si ya hay sesión, vuelve a `location.state.from` o a `/`; tras un login correcto no navega de forma imperativa, deja que el estado reactivo lo haga.
- Ruta comodín `*` redirige a `/`.
- Menú definido en `src/config/navigation.ts` (`NAV_ITEMS`, `MOBILE_NAV_PRIORITY`, `getAvailableNavItems`, `getMobileNavItems`, `canAccessPath`, `getDefaultPathForRoles`) y consumido en `AppLayout.tsx`. Los logos de `AppLayout.tsx` (escritorio y móvil) enlazan a `/inicio`.
- Hooks y componentes que existen: `useAnnouncements` (con `activeAnnouncements`), `useEvents` (con `upcomingEvent`), `useEventRSVPs` (`myRsvpsByEvent`, `upsertRSVP`), `useEventAssignments`, `useStudentClasses`, `useStudentClassroom`, `useFinances` (con `summary`), `useInicioDashboard`; `AnnouncementsBanner`, `FinancialSummaryCards`, `EventRSVPModal`, `EventAssignmentsModal`, `AnnouncementModal`, `InicioNextEventCard`, `DashboardCard`, `DashboardSkeleton`, `DashboardEmptyState`.
- **No hizo falta SQL nuevo ni migraciones para `/inicio`:** las políticas RLS y funciones auxiliares ya cubren los datos. Solo consultas del cliente de Supabase.

---

## 2. BLOQUE FIJO DE REGLAS (incluir en TODOS los prompts)

```
Lee CONTEXTO_PROYECTO.md, CONTEXTO_PENDIENTE.md, PLAN_INICIO_Y_PUBLICA.md y
design-system/oasis/MASTER.md. Responde en español. Estás en la rama
"inicio-por-rol"; comprueba con git status y git branch antes de empezar.
No fusiones con main sin mi aprobación expresa.

REGLAS
- Solo lectura de datos con la clave publishable; nunca service_role.
- No modifiques AuthContext, HomeRedirect, ProtectedRoute, migraciones
  ejecutadas ni la animación LoginIntro.
- No modifiques CalendarioView.tsx (ya aprobada por los pastores): si
  necesitas algo parecido, crea un componente nuevo.
- No añadas dependencias nuevas sin preguntarme.
- Si crees que hace falta SQL (vista, función, política), NO lo crees ni lo
  ejecutes: escríbelo en tu respuesta para que yo lo revise antes.
- Haz solo lo pedido en esta fase. Un commit al final. npm run build debe
  pasar sin errores.
- Estilo: identidad aprobada y contrastes de MASTER.md (texto pequeño nunca
  sobre el degradado, zonas táctiles de 44 px, mobile-first 390 px).
- Al terminar: lista de archivos modificados, confirmación de que no tocaste
  lo prohibido, y pasos exactos para que yo lo pruebe.
```

---

## 3. Decisiones ya tomadas (Luis)

1. **Orden en móvil:** arriba solo los avisos **urgentes o importantes**; los normales más abajo. Después: próximo evento con confirmación de asistencia, mis turnos y las tarjetas de su rol.
2. **Varios roles:** tarjetas **apiladas**, con un título de sección por rol (Administración, Maestro, Alumno, Tesorería). Sin pestañas. Sin duplicados.
3. **Máximo 3 elementos por tarjeta**, con botón "Ver todo".
4. **La redirección tras el login se queda en `/calendario` hasta la última fase (la 6).**
5. Dos páginas distintas: `/inicio` (con sesión y rol) y una página pública de bienvenida en `/` (visitantes), esta última más adelante y solo si los pastores la aprueban.

---

## 4. Reglas técnicas específicas de las tarjetas

- **Cada tarjeta carga por separado y distingue tres estados:** cargando (esqueleto), vacío (mensaje amable) y **error** ("No se pudo cargar" con botón "Reintentar"). Un error **nunca** se muestra como "no tienes nada".
- **Importante:** con las políticas RLS de esta app, una consulta bloqueada puede devolver una lista vacía en lugar de un error. Por eso un vacío no demuestra que funcione: hay que probar con datos reales (sección 6).
- `.limit(3)` y pedir solo las columnas necesarias.
- Un error en una tarjeta no rompe las demás.
- Solo lectura. Si falta una consulta que exija SQL nuevo, parar y consultar.
- Tarjeta base reutilizable (`DashboardCard`): fondo blanco, borde `#d4d7dc`, esquinas redondeadas, icono, título y enlace "Ver todo".

---

## 5. Fases (Fases 1 a 6 `[HECHO]` y fusionadas en `main`)

Cada fase se desarrolló en la rama `inicio-por-rol`, fue probada por Luis y se fusionó en `main`.

### Fase 1 `[HECHO]`
Ruta `/inicio` y `InicioView` esqueleto. Commit `8f2e6d0`.

### Fase 2: componentes base, anuncios y próximo evento `[HECHO]`
- Commit `52403bc`.
- Creados `DashboardCard`, `DashboardSkeleton`, `DashboardEmptyState` y estado de error con "Reintentar" (en `src/components/inicio/`).
- Anuncios vigentes: reutilizando `useAnnouncements().activeAnnouncements`. Arriba solo urgentes e importantes; los normales, más abajo (máximo 3 por bloque).
- **Próximo evento** con confirmación de asistencia: componente nuevo y compacto (`InicioNextEventCard`) que reutiliza `useEvents().upcomingEvent`, `useEventRSVPs` y `EventRSVPModal`. **Sin extraer ni cambiar nada de `CalendarioView.tsx`.**
- Integrado todo en `InicioView.tsx`, quitando el texto "Estamos preparando tu inicio".

### Fase 3: Mis turnos y tarjetas del alumno `[HECHO]`
- Commit `3b3d950`.
- Hook ligero `src/lib/useInicioDashboard.ts` (solo consultas de lectura).
- **Mis turnos** (cualquier rol con ficha vinculada): `church_event_assignments` de mi persona con evento futuro, orden ascendente, máximo 3. Reutiliza cómo `useEventRSVPs` resuelve la persona vinculada (`get_my_person_id`).
- **Alumno:** próxima clase (`sessions` con fecha desde hoy, limit 1), tareas pendientes con fecha límite (tareas de ciclos activos sin entrega mía), últimas notas (`grades` con `evaluations`, últimas 3).
- Si la persona no tiene ficha vinculada: muestra el aviso amigable que ya usa el RSVP, no un error.

### Fase 4: tarjetas del maestro `[HECHO]`
- Commit `9952ffc`.
- **Próxima clase** de ciclos que imparte; **asistencia por pasar** (sesiones pasadas de sus ciclos sin ningún registro de asistencia); **entregas por revisar** (`assignment_submissions` de sus ciclos con `grade` nulo y archivo presente).
- Enlaces "Ver todo" al módulo Clases.

### Fase 5: tarjetas de Tesorería y Administración `[HECHO]`
- Commit `2243f29`.
- Tesorero y admin: resumen financiero del mes (reutilizando `useFinances().summary`, fijado al mes actual).
- Admin: pendientes de la semana (eventos futuros sin turnos asignados, avisos que caducan en 7 días, confirmaciones del próximo culto).

### Fase 6: activar `/inicio` como destino, filtro de chips multi-rol y estados vacíos compactos `[HECHO]`
- Commit `a24fefd`.
- Filtro interactivo de chips por rol para usuarios con varios roles y estados vacíos compactos.
- `navigation.ts`: añadido `inicio` como **primer** ítem de `NAV_ITEMS` (icono `Home`, los 4 roles) y como primero de `MOBILE_NAV_PRIORITY`. Esto hace que `getDefaultPathForRoles` devuelva `/inicio`.
- `AppLayout.tsx`: los dos enlaces del logo pasaron de `/calendario` a `/inicio`.
- Manifiesto de la PWA: `start_url: "/inicio"`.
- Probadas las 6 fases por Luis y fusionadas a `main`.

---

## 6. Pruebas (después de cada fase, en ventana de incógnito)

**Datos de prueba necesarios** (créalos desde la propia app, con tu admin; si no, todo se verá vacío y no probarás nada):
- Un anuncio normal, uno importante y uno urgente (y uno que caduque en 5 días).
- Un evento la próxima semana, y otro sin turnos asignados.
- Un turno asignado a la persona del usuario de prueba.
- Un curso con un ciclo, el alumno de prueba inscrito, una sesión futura y una pasada sin asistencia, una tarea con fecha límite, una entrega sin calificar y alguna nota.
- Ofrendas y gastos de este mes.

**Matriz mínima:** `admin`, `tesorero`, `maestro`, `alumno`, un usuario con **dos roles** y un usuario **sin roles**.

Para cada uno comprobar:
1. Ve solo las tarjetas de su rol (sin duplicados en el usuario con dos roles).
2. Ninguna tarjeta muestra datos de otras personas.
3. Un error simulado (por ejemplo, sin conexión) muestra "No se pudo cargar", no "vacío".
4. Móvil (390 px) y escritorio: legible, sin texto cortado, botones táctiles.
5. Sin sesión, `/inicio` te manda a `/login`. Sin roles, `/sin-permisos` se queda quieto (sin bucle).
6. Tras cada cambio de la Fase 6: login, cierre de sesión, abrir a mano `/calendario` sin sesión, iniciar sesión y volver a `/calendario`.

---

## 7. Cómo revertir

- Todo vive en la rama `inicio-por-rol`: si no convence, no se fusiona y `main` queda intacto.
- Tras fusionar, si falla en producción: en Vercel, volver a un despliegue anterior, y después `git revert` del commit de fusión.

---

## 8. Página pública de bienvenida (DESPUÉS, solo si los pastores la aprueban)

### Decisión pendiente
Preguntar a los pastores: "¿Quieren que cualquier persona vea horarios y eventos sin iniciar sesión?". Reunir además: dirección, horarios fijos, WhatsApp, correo, redes y texto de bienvenida. Fotos de menores, solo con permiso de los padres.

### Diseño
Maqueta (privada de Luis): `https://claude.ai/artifact/HXhqnuXj3Dor3DNqztHwRm` (móvil y escritorio). La IA de Antigravity **no puede abrirla**: Luis debe hacer **capturas de pantalla** y adjuntarlas. Estructura: cabecera cian con logo y botón "Iniciar sesión", barra magenta, portada con degradado y título grande "Te esperamos este domingo" con tarjeta del próximo culto y "Cómo llegar", próximos eventos públicos, horarios, "¿Primera vez?" con WhatsApp, contacto y redes, franja "Instala la app" con pasos para Android (Chrome) e iPhone (Safari, "Añadir a pantalla de inicio").

### Rutas
- `/`: visitante sin sesión ve la página pública. **Se pinta al instante, sin esperar ni consultar `user_roles`.** Si detecta sesión, redirige a `/inicio`.
- `/login` se mantiene. No tocar `AuthContext`.

### Base de datos (no ejecutar nada sin revisar el SQL)
- `church_events`: columna `is_public boolean NOT NULL DEFAULT false` (todo lo existente queda interno).
- Vista `v_public_events`: solo `id`, título, inicio y lugar de eventos públicos, no archivados, futuros, máximo 10 en los próximos 60 días. Nunca descripción, turnos, conteos, confirmaciones ni nombres.
- Tabla `public_site_settings` (una sola fila) con los datos editables (horarios, dirección, WhatsApp, correo, redes, texto de bienvenida), **solo el admin puede leerla y modificarla** (RLS), y una vista de solo lectura para anónimos. Así el pastor cambia los datos sin pedírselo a Luis.
- Las vistas **no** son `security_invoker` (excepción deliberada, como `v_event_servers`); `GRANT SELECT` a `anon` y `authenticated` **solo sobre esas vistas**.
- Pruebas obligatorias como rol `anon`: **no** puede leer `persons`, `church_events`, `church_event_assignments`, `church_event_rsvps`, `announcements`, `user_roles` ni `public_site_settings`; **sí** lee las vistas públicas. Como alumno: no puede modificar `is_public` ni `public_site_settings`. Como admin: sí.

### Seguridad de contenido
Los textos editables se pintan como **texto plano, nunca HTML**. Los enlaces se validan (solo `http`, `https` y `wa.me`). Metadatos para compartir en WhatsApp (`title`, `description`, `og:image`). Sin cambiar la caché del service worker.

### Admin
Casilla "Evento público" (por defecto desactivada) en el formulario de eventos, con el aviso "Se mostrará a cualquier persona sin iniciar sesión: solo título, fecha, hora y lugar", e insignia "Público" en la tarjeta. Pantalla "Contenido de la página pública" con vista previa.

### Orden
1. Reunir datos y respuesta de los pastores. 2. SQL revisado y ejecutado por Luis. 3. Pruebas como anónimo. 4. Página. 5. Pantalla de admin.

---

## 9. No olvidar (viene de `CONTEXTO_PENDIENTE.md`)

- Respaldo JSON: añadir `user_roles` y todas las tablas que falten, paginar consultas (límite habitual de 1.000 filas) y comparar filas con un `count`. No incluye Storage ni usuarios de Auth: hacer también `supabase db dump` de vez en cuando.
- Keep-alive: GitHub desactiva workflows programados de repositorios públicos tras 60 días sin actividad. Preferible repositorio privado y revisar la pestaña Actions cada mes.
- Hablar con el pastor sobre la propiedad de las cuentas (Supabase, Vercel, GitHub) y la responsabilidad sobre los datos.
- Prueba final con cuatro roles antes de dar la app por entregada.
- Descartado por Luis (no proponer): peticiones de oración, seguimiento de visitas y cumpleaños.
