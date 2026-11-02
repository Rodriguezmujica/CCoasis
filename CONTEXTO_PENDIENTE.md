# CONTEXTO_PENDIENTE: qué falta en ccoasis-app

> Traspaso para otra IA. Léelo junto con `CONTEXTO_PROYECTO.md` y `SPEC.md`. Este archivo solo cubre lo que **falta** y las comprobaciones pendientes. Si algo contradice a la realidad del repositorio o de la base de datos, **verifica y avisa**; no supongas.

Última actualización: 2 de noviembre de 2026.

## 0. Estado en una frase

La app (React + Vite + Supabase, PWA) está funcionando y publicada en Vercel. Las fases 1 y 2 del producto están hechas. Las **comprobaciones de seguridad en Supabase están 100% COMPLETADAS Y VERIFICADAS** (31 de octubre de 2026). El **rediseño visual (Fase 3 completa: 3a, 3b, 3c y 3d)** está **COMPLETADO y FUSIONADO en `main`**. También está en `main` la **animación del libro 3D** (se abre al iniciar sesión y se cierra al cerrarla; solo CSS, componente `LoginIntro`). Queda solo la revisión visual final con un usuario admin y otro alumno.

## 1. Reglas que no se rompen

- Responde siempre en **español**. Luis no es experto técnico: dile dónde hacer clic y qué pegar, y avísale de los riesgos.
- **Nunca** uses ni pidas la clave `service_role` fuera de una Edge Function. No escribas claves en el código ni las pegues en chats.
- No edites migraciones ya ejecutadas. Los cambios de base de datos van en archivos nuevos, idempotentes (`IF NOT EXISTS`, `DROP POLICY IF EXISTS` antes de `CREATE POLICY`).
- No toques lógica, rutas, hooks ni consultas durante el rediseño: solo la capa de presentación.
- No instales software ni skills por tu cuenta: pídeselo a Luis.
- Un módulo o fase por chat. Tras cada fase: `npm run build` y pruebas con un usuario **admin** y otro **alumno** (ventana de incógnito).

## 2. PRIORIDAD 1: comprobar la seguridad en Supabase (COMPLETADA Y VERIFICADA · 31 de octubre de 2026)

Todos los puntos fueron verificados satisfactoriamente en vivo en el SQL Editor de Supabase y en el código del repositorio:

- **2.1 Vista de servidores de turno (`v_event_servers`):** [VERIFICADO] Existe `public.v_event_servers`, expone únicamente `id`, `first_name`, `last_name`, y tiene `security_invoker = false` (excepción deliberada a la regla de vistas para leer nombres de servidores asignados sin exponer datos personales sensibles de `persons`).
- **2.2 Política que filtraba fichas completas:** [VERIFICADO] No existe `persons_authenticated_read_assigned_servers` en `public.persons`. Eliminada definitivamente para evitar que usuarios autenticados lean datos privados (teléfono, dirección, notas).
- **2.3 Archivado de avisos (`announcements`):** [VERIFICADO] La política SELECT en `announcements` empieza por `is_admin() OR ...` (`(is_admin() OR ((deleted_at IS NULL) AND (is_active = true) AND ((expires_at IS NULL) OR (expires_at > now()))))`), permitiendo al admin archivar registros sin error de RLS. Reflejado en migración `016_fix_announcements_policy.sql`.
- **2.4 Permisos de la vista:** [VERIFICADO] Solo `authenticated` y `service_role` tienen `SELECT` sobre `v_event_servers`; el rol `anon` tiene revocado todo acceso.
- **2.5 Prueba decisiva como alumno:** [VERIFICADO] Ejecutada en SQL Editor con JWT de alumno: ve exactamente su propia ficha (1 ficha) en `persons`, 0 RSVPs ajenos y en `v_event_servers` únicamente los nombres y apellidos.
- **2.6 Numeración de migraciones:** [VERIFICADO Y SIN COLISIONES] Secuencia limpia de la `001` a la `017` (con la salvedad documentada de que no existe la `012`; la `017` es `017_assignment_file_cleanup.sql`). Guardado `016_fix_announcements_policy.sql`.
- **2.7 Edge Functions (`create-user`, `update-user-password`):** [VERIFICADO] Inspeccionadas en código: ambas validan el JWT de la cabecera `Authorization` vía `getUser()` y comprueban explícitamente en BD el rol de admin (`callerClient.rpc('is_admin')`) antes de invocar cualquier método administrativo con `service_role`. Sin huecos de seguridad.
- **2.8 RSVP (`church_event_rsvps`):** [VERIFICADO] Un alumno solo consulta su propia confirmación individual y el conteo consolidado (`get_event_rsvp_summary`), sin acceso a listas ni identidades ajenas.

## 3. Rediseño visual (rama `rediseno-visual`)

### Identidad aprobada por los pastores
Cabecera **cian** `#23d5da` con el logo y texto **oscuro** `#1a1a1a`. Barra de menú **magenta** `#ae4a84` con texto blanco. Banners y títulos grandes con degradado **`#0f9aa2` → `#ae4a84`** (solo títulos grandes en negrita blanca de 24 px o más; el texto pequeño va sobre tarjetas blancas). Tarjetas blancas con esquinas muy redondeadas. Fondo `#f5f5f5`. Login ya aprobado por Luis.

### Contrastes (no negociar)
| Par | Ratio | Uso |
|---|---|---|
| Blanco sobre cian `#23d5da` | 1,8:1 | **PROHIBIDO** |
| Cian `#23d5da` como texto o borde sobre blanco | 1,8:1 | **PROHIBIDO** |
| `#1a1a1a` sobre cian `#23d5da` | 9,6:1 | OK |
| Blanco sobre `#0e7c86` | 4,95:1 | OK |
| Blanco sobre magenta `#ae4a84` | 5,11:1 | OK |
| Magenta como texto sobre blanco / sobre `#f5f5f5` | 5,1 / 4,7:1 | OK (sobre gris más oscuro usar `#9a3f73`) |

Script de verificación en el repo: `scripts/design/contrast.py`.

### Hecho (Fase 3 · 100% COMPLETADA en rama `rediseno-visual`)
- Commit del skill `ui-ux-pro-max` (`.agents/`), snapshot previo (`0c58f5f`) y sistema de diseño en `ccoasis-app/design-system/oasis/MASTER.md` + `contrast-table.md`.
- **Fase 3a (`978c24f`) + Cierre de auditoría de contraste (`f1ad3e4`)**: escalas `brand`/`blue` remapeadas a cian, `magenta`/`indigo` a magenta, `slate` a neutros accesibles; tokens semánticos; foco visible global; `prefers-reduced-motion`; viewport sin `user-scalable=no` ni `maximum-scale`; `theme-color` `#23d5da`; iconos PWA generados (192, 512, maskable, apple-touch, favicon).
- **Fase 3b (`f1ad3e4`, `4fde475`, `8ebd04e`)**: layout (`AppLayout.tsx`), navegación (sidebar con cabecera cian `#23d5da`, franja magenta `#ae4a84` y cuerpo blanco; cabecera móvil cian + barra magenta + barra inferior táctil) y login (`LoginView.tsx` con `.oasis-text-gradient`, `autocomplete`, `aria-label` y campos ≥ 16 px / 44 px).
- **Fase 3c (`4fde475`)**: módulo Calendario (`CalendarioView.tsx`, `CalendarGridView.tsx`, `events.ts`) con tarjeta destacada en verde petróleo `#0a5961`, casillas y leyenda accesibles por tipo de actividad.
- **Fase 3d — Resto de módulos (100% COMPLETADA)**:
  - **Fase 3d.1 (`535ec5b`)**: Módulo Personas (`PersonasView.tsx`, `persons.ts`, `src/components/personas/*`).
  - **Fase 3d.2 (`75f0733`)**: Módulos Clases y Mis Clases (`ClasesView.tsx`, `ClassroomDetailView.tsx`, `MisClasesView.tsx`, `StudentClassroomDetailView.tsx`, `src/components/clases/*`, `src/components/mis-clases/*`).
  - **Fase 3d.3 (`c457712`)**: Módulo Finanzas (`FinanzasView.tsx`, `src/components/finanzas/*`).
  - **Fase 3d.4 (`e4b35df`)**: Módulos Usuarios y Auditoría (`UsuariosView.tsx`, `AuditoriaView.tsx`, `src/types/users.ts`, `src/components/usuarios/*`).

### Animación de entrada y salida (Fase 3b ampliada) · en `main`
- `src/components/LoginIntro.tsx` + `LoginIntro.css`, montado en `App.tsx` fuera de las rutas. Un libro cerrado (portada magenta `#ae4a84`, símbolo cian, páginas blancas) se abre en 3D al aparecer una sesión (login nuevo o app abierta con sesión guardada) y se cierra al cerrar sesión.
- Solo `transform` y `opacity`, sin librerías. Dura 1,45 s; un temporizador de 1,5 s retira la capa (no usa `animationend`). Un clic, toque o tecla la salta. Con `prefers-reduced-motion`: solo fundido de 150 ms.
- Solo observa la sesión (`useAuth`): no cambia la autenticación, las rutas ni la carga de roles, y no se activa si el login falla.
- Commits: `34e2312`, `465e97f`, fusión `dbad6d3`.

### Pendiente (rediseño y animación ya están en `main`)
1. **Revisión visual final en navegador (`localhost:5173` o preview de Vercel):** validar con un usuario **admin** y otro **alumno** que todas las vistas se ven y funcionan según lo esperado.
2. Ya no aplica la restricción de no fusionar: todo está en `main`. Si algo no convence, se corrige con un commit nuevo.

## 4. Antes de entregar la app a la iglesia

1. **Copias de seguridad:** [COMPLETADO] Implementado módulo completo de exportación y respaldo en la vista de Auditoría (`BackupExportCard.tsx`, `useDataExport.ts`, exclusivo para el rol `admin`). Permite:
   - Exportación de planillas CSV compatibles con Excel (UTF-8 con BOM): Personas, Finanzas (ofrendas y gastos con categoría y método de pago), y Clases/Notas (alumnos, ciclos, porcentaje de asistencia y calificaciones).
   - Respaldo integral del sistema en formato JSON estructurado con metadatos y todas las tablas clave (`persons`, `courses`, `cycles`, `enrollments`, `sessions`, `attendance`, `evaluations`, `grades`, `assignments`, `assignment_submissions`, `class_materials`, `transaction_categories`, `offerings`, `expenses`, `church_events`, `church_event_assignments`, `church_event_attendance`, `announcements`, `notifications`, `audit_logs`, `church_event_rsvps`).
   - Registro automático en `audit_logs` con la acción `BACKUP_DOWNLOAD` cada vez que se genera un respaldo.
2. **Pausa por inactividad:** los proyectos gratuitos de Supabase pueden pausarse tras unos 7 días sin uso. Confirmar las condiciones actuales y definir quién lo reactiva.
3. **Propiedad de cuentas:** Supabase, Vercel y GitHub están a nombre de Luis. Acordar con el pastor quién las tendrá a medio plazo.
4. **Datos sensibles (RGPD):** listas de miembros y ofrendas. Acceso solo a quien lo necesita; el pastor debe saber que es responsable de esos datos.
5. **Caché de la PWA:** que no guarde datos de Supabase en móviles compartidos (la configuración de `workbox` no se ha tocado y debe seguir así).
6. **Authentication, URL Configuration** en Supabase: `Site URL` = la URL de producción de Vercel (`https://c-coasis.vercel.app`). El correo integrado de Supabase es muy limitado: si se usan invitaciones por correo, configurar un servicio propio.
7. **Prueba final con un usuario por rol** (admin, tesorero, maestro, alumno): cada uno ve solo lo suyo, y escribiendo a mano una URL ajena (`/finanzas`) sale "permiso denegado".

## 5. Documentación a corregir en `CONTEXTO_PROYECTO.md`

- La sección de esquema (5.2) **no coincide** con la migración 001 original: el documento decía `teacher_person_id`, `min_attendance_percentage`, `passing_score`, `grades.person_id`, `attendance.status`; la 001 usa `teacher_id`, `min_attendance_pct`, `passing_grade`, `grades.enrollment_id`, `attendance.mark`. Regenerarla desde la base real:

```sql
SELECT table_name, string_agg(column_name, ', ' ORDER BY ordinal_position)
FROM information_schema.columns WHERE table_schema='public'
GROUP BY table_name ORDER BY 1;
```

- Añadir regla: **no usar `deleted_at IS NULL` en la política SELECT del admin** en tablas con archivado (rompe el soft-delete).
- Anotar la excepción de `v_event_servers` a la regla "todas las vistas `security_invoker`".
- ~~Listar las migraciones reales y la fase del rediseño~~ (hecho el 2 de noviembre de 2026 en `CONTEXTO_PROYECTO.md`, incluida la `017`).
- El resto de esta sección sigue pendiente de contrastar con la base real.

## 5b. Ideas futuras

Ver `IDEAS_FUTURAS.md` (solo ideas, nada implementado): push y recordatorios, pantalla de inicio por rol, página pública con calendario de solo lectura, noticias, Instagram, exportar datos.

## 6. Datos útiles

- Proyecto Supabase: `ccoasis-app`, región West EU (Irlanda), plan gratuito. Las claves van solo en `.env` (nunca en el repositorio).
- Producción: `https://c-coasis.vercel.app`.
- Rutas en Windows: raíz `E:\Documentos\centro_cristiano-osasis`, app en `ccoasis-app\`. Python 3.14 (comando `python`, no `python3`).
- Skill `ui-ux-pro-max` instalada con `uipro init --ai antigravity`.

## 7. Plantilla para un chat nuevo

```
Lee CONTEXTO_PROYECTO.md, CONTEXTO_PENDIENTE.md y SPEC.md. No modifiques
migraciones ya ejecutadas. Responde en español. Tarea de ahora, y SOLO esto:
<TAREA>. Al terminar, dime cómo probarlo con un usuario admin y uno alumno.
```
