# CONTEXTO DEL PROYECTO: ccoasis-app

> Lee este archivo completo antes de tocar nada. Es la fuente de verdad sobre qué se ha hecho, qué se decidió y qué falta. Si algo de aquí contradice una suposición tuya, manda este archivo. Si algo te parece mal, dilo antes de cambiarlo.

Última actualización: 2 de noviembre de 2026.

## 1. Qué es y para quién

App web instalable (PWA) para administrar el **Centro Cristiano Oasis**, una iglesia pequeña. La construye Luis (desarrollador autodidacta, Madrid, España) como **regalo para la iglesia**. El **pastor será quien la administre**, no Luis; por eso importa que el pastor pueda gestionar todo desde la app sin tocar el panel de Supabase.

- Idioma de la interfaz y de los mensajes de error: **español**.
- Moneda: **EUR**. Zona horaria: Europe/Madrid.
- Uso: móvil y PC. **Mobile-first**.
- Escala: pequeña. Clases con **capacidad flexible según el ciclo**.
- Luis se comunica en español y prefiere respuestas directas, concisas y honestas.

## 2. Qué incluye la app

1. **Personas:** fichas de miembros y visitas.
2. **Clases / discipulado:** cursos, ciclos, inscripciones, sesiones, asistencia, evaluaciones y notas, tareas con entregas, materiales. Funciona como un pequeño instituto.
3. **Finanzas:** ofrendas (con o sin persona), gastos con comprobante.
4. **Administración:** usuarios, roles y auditoría.
5. **Calendario y vida de la iglesia:** eventos, turnos de servidores, conteo de asistencia, confirmaciones (RSVP), anuncios y notificaciones.

## 3. Stack

- Frontend: React + Vite + TypeScript, `vite-plugin-pwa`, `react-router-dom`.
- Backend: **Supabase** (Postgres, Auth, Storage). Plan gratuito, región West EU (Irlanda).
- Carpeta de la app: `ccoasis-app/`.
- Variables de entorno (archivo `.env` en `ccoasis-app/`, **nunca subir a GitHub**):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- La clave **secret / service_role NUNCA va en la app, ni en el código, ni en un chat.** Si hace falta para una Edge Function, vive solo como secreto de esa función.

## 4. Decisiones tomadas (no cambiar sin hablarlo)

- **Una sola app** con roles, no dos apps.
- **Varios roles por usuario** (tabla `user_roles`). Roles: `admin`, `tesorero`, `maestro`, `alumno`. El pastor tendrá `admin`.
- **La seguridad real está en la base de datos (RLS).** Esconder pestañas en la interfaz es solo comodidad, no protección.
- **Sin registro público.** Los usuarios los crea un administrador desde la app (pantalla Usuarios, mediante Edge Function).
- **Soft-delete** (`deleted_at`) en personas y cursos y ciclos. En la app no se hace DELETE de personas ni de ciclos.
- No todos los miembros necesitan cuenta: pueden existir como ficha en `persons` sin `user_id`.
- Fase 1 se recortó a propósito sin `audit_logs`, `fiscal_periods` ni umbral de aprobación de gastos. `audit_logs` y el aviso de gastos mayores de 300 EUR ya se añadieron en la fase 2; `fiscal_periods` sigue sin existir.

## 5. Estado actual

### Hecho y verificado

- Proyecto de Supabase creado (`ccoasis-app`). Creado con "Automatically expose new tables" **desmarcado** y "Enable automatic RLS" marcado.
- `supabase/migrations/001_initial_schema.sql` **ejecutado** en Supabase (versión corregida e idempotente). Probado en PostgreSQL 16 local con usuarios de prueba por rol, con 0 errores.
- Usuario administrador creado y con rol `admin` en `user_roles`.
- Registro público de usuarios desactivado en Supabase (Authentication).
- App con login (correo y contraseña), cierre de sesión, menú por rol y rutas protegidas. **Probada por Luis con un admin y un alumno de prueba: funciona.** Se corrigió un bug de primer login (ver sección 8).
- **Fase 1 completada:** Personas, Clases y Mis clases, Usuarios (con Edge Functions `create-user` y `update-user-password`) y Finanzas.
- **Fase 2 completada:** Calendario, turnos de servidores, conteo de asistencia, anuncios, notificaciones internas, auditoría (`audit_logs`), confirmaciones de asistencia (RSVP) y aviso de egresos superiores a 300 EUR.
- **Fase 3 completada y en `main`:** rediseño visual con la identidad cian `#23d5da` y magenta `#ae4a84`, y animación del libro 3D al iniciar y cerrar sesión (`LoginIntro`, solo CSS).
- Seguridad en Supabase revisada y verificada el 31 de octubre de 2026 (ver `CONTEXTO_PENDIENTE.md`).
- **Exportación y copias de seguridad (Auditoría):** módulo de exportación CSV (Personas, Finanzas, Clases y Calificaciones) y respaldo integral en JSON en la vista de Auditoría (`BackupExportCard`), exclusivo para rol `admin`, con registro automático en `audit_logs` (`BACKUP_DOWNLOAD`).
- **Keep-alive automático (Supabase):** función SQL `public.keepalive_ping()` (`018_keepalive_ping.sql`) y GitHub Action programado (`.github/workflows/supabase-keepalive.yml`) que ejecuta un ping RPC dos veces por semana (lunes y jueves 08:00 UTC) para evitar que el proyecto gratuito de Supabase se pause por inactividad tras 7 días. Si el ping falla, el workflow falla y GitHub envía un email de alerta a Luis. En caso de pausa manual o fallo extremo, se restaura desde supabase.com/dashboard pulsando "Restore project".

### Pendiente (lo que sigue abierto)

1. Revisión visual final con un usuario admin y otro alumno, en móvil (390 px) y escritorio.
2. Antes de entregar la app: ver la sección 12 (propiedad de cuentas, RGPD, prueba por rol).
3. Futuro: notificaciones Web Push, informes en PDF. Ideas en `IDEAS_FUTURAS.md`.

### Histórico: orden original de construcción (ya completado)

1. **Ejecutar `002_link_person_user.sql`** en el SQL Editor de Supabase (puede que ya esté hecho; comprobar que existe la función `public.link_person_to_user`). Es la función que vincula una persona con un usuario por correo, solo para admin.
2. **Módulo Personas** (solo admin).
3. **Módulo Clases, lado admin y maestro.**
4. **Sección "Mis clases", lado alumno.**
5. **Pantalla Usuarios** con Edge Function (crear cuentas desde la app).
6. **Módulo Finanzas.**
7. Fase 2: avisos o anuncios por ciclo (tabla `announcements`), notificaciones, auditoría.

## 6. Menú por rol

| Rol | Ve |
|---|---|
| `admin` | Calendario, Personas, Clases, Finanzas, Usuarios, Auditoría |
| `tesorero` | Calendario, Finanzas |
| `maestro` | Calendario, Mis clases |
| `alumno` | Calendario, Mis clases |

Un usuario con varios roles ve la unión de menús.

## 7. Base de datos (resumen)

Fuente de verdad: `supabase/migrations/`. **No edites migraciones ya ejecutadas.** Cualquier cambio va en un archivo nuevo (`018_...sql`, etc.), idempotente (`IF NOT EXISTS`, `DROP POLICY IF EXISTS` antes de `CREATE POLICY`), y se ejecuta en el SQL Editor de Supabase.

**Secuencia real de migraciones en el repositorio (`supabase/migrations/`):**
- `001_initial_schema.sql`: Esquema base (personas, cursos, ciclos, finanzas, funciones SECURITY DEFINER, RLS base).
- `002_link_person_user.sql`: Función `link_person_to_user` (vincular persona con cuenta por correo, solo admin).
- `003_student_read_teachers.sql`: Permite a alumnos ver fichas de los maestros de sus ciclos inscritos.
- `004_grant_service_role.sql`: Concesión de permisos explícitos al rol `service_role`.
- `005_finanzas_categories_policy.sql`: Políticas de acceso a categorías financieras.
- `006_calendar_events.sql`: Eventos del calendario congregacional (`church_events`).
- `007_event_assignments.sql`: Asignaciones y turnos de servidores en eventos (`church_event_assignments`).
- `008_event_attendance_headcount.sql`: Registro de asistencia y conteo general a eventos (`church_event_attendance`).
- `009_announcements.sql`: Avisos y tablón de anuncios (`announcements`).
- `010_notifications.sql`: Sistema de notificaciones internas (`notifications`).
- `011_audit_logs.sql`: Registro de auditoría administrativa (`audit_logs`).
- *(Nota: la migración `012` no existe en la secuencia).*
- `013_event_rsvps.sql`: Confirmaciones individuales de asistencia a eventos (`church_event_rsvps`).
- `014_finance_payment_methods.sql`: Métodos de pago y cuenta/fondo en `offerings` y `expenses`.
- `015_event_servers_view.sql`: Vista segura `v_event_servers` (`security_invoker = false`) y eliminación de la política insegura en `persons`.
- `016_fix_announcements_policy.sql`: Corrección de la política SELECT de `announcements` (`is_admin() OR ...`) para permitir archivar registros con soft-delete sin error de RLS.
- `017_assignment_file_cleanup.sql`: Limpieza de archivos huérfanos en Storage y anulación de entregas pendientes por el alumno.
- `018_keepalive_ping.sql`: Función ligera `public.keepalive_ping()` para latido periódico vía GitHub Actions (evita pausa por inactividad tras 7 días sin exponer datos sensibles).

**Tablas principales:** `user_roles`, `persons`, `courses`, `cycles`, `enrollments`, `sessions`, `attendance`, `evaluations`, `grades`, `assignments`, `assignment_submissions`, `class_materials`, `transaction_categories`, `offerings`, `expenses`, `church_events`, `church_event_assignments`, `church_event_attendance`, `announcements`, `notifications`, `audit_logs`, `church_event_rsvps`.

**Vistas:**
- `v_cycle_grades_summary` (`security_invoker = true`): promedio normalizado a 0-100, porcentaje de asistencia y `passed`. Respeta RLS y no es accesible para anon. Solo cuenta `presente` como asistencia.
- `v_event_servers` (`security_invoker = false`): **excepción deliberada a la regla de vistas**. Permite a los usuarios autenticados consultar únicamente `id`, `first_name` y `last_name` de los servidores asignados a turnos en el calendario sin exponer datos personales sensibles de la tabla `persons` (teléfono, dirección, notas). La advertencia "Security Definer View" en el Security Advisor de Supabase para esta vista es esperada y debe ignorarse.

**Storage (buckets privados):**
- `materials`: ruta `<cycle_id>/<archivo>`.
- `assignments`: ruta `<auth_user_id>/<assignment_id>/<archivo>`.
- `receipts`: solo admin y tesorero.

**Funciones auxiliares (SECURITY DEFINER):** `has_role`, `is_admin`, `get_my_person_id`, `my_teaching_cycle_ids`, `my_enrolled_cycle_ids`, `my_enrollment_ids`, `my_student_person_ids`, `link_person_to_user(p_person_id, p_email)`, `keepalive_ping()`.

**Reglas que impone la base de datos (la app solo debe mostrar el error):**
- Un usuario no puede asignarse roles a sí mismo; solo `admin` escribe en `user_roles`.
- Un usuario normal no puede cambiar en su ficha: `user_id`, `status`, `deleted_at`, `notes`, `baptism_date`.
- Un alumno no puede poner `grade` ni `feedback` en sus entregas; solo admin o el maestro del ciclo.
- Solo se inscribe a personas con estado `activo` o `visita`.
- Una nota debe estar entre 0 y el `max_score` de la evaluación.
- Un ciclo `cerrado` bloquea cambios en sesiones, asistencia, evaluaciones y notas. No cubre tareas, materiales, entregas ni inscripciones.
- No se puede borrar un ciclo con inscripciones ni una persona inscrita (`ON DELETE RESTRICT`); se archiva o se marca `deleted_at`.
- `updated_at` se actualiza solo.

**Permisos de la API:** solo el rol `authenticated` tiene acceso a las tablas (bloque GRANT al final de `001`). El rol anónimo no recibe nada. Si se crea una tabla nueva, hay que añadir sus `GRANT` y activar RLS con sus políticas.

## 8. Lecciones aprendidas (no repetir)

- **Bug de primer login:** consultar `user_roles` dentro de `onAuthStateChange` devolvía vacío y mandaba a `/sin-permisos`. Solución: guardar solo la sesión en ese callback y cargar los roles en un `useEffect` aparte que dependa de `session.user.id`. Mostrar "Cargando..." sin navegar hasta tener sesión y roles. `/sin-permisos` nunca debe redirigir a `/` (provocó un bucle infinito).
- **Recursión de RLS:** políticas que se consultan entre sí (cycles y enrollments) dan "infinite recursion". Se resolvió con las funciones auxiliares SECURITY DEFINER. Usa siempre esas funciones en políticas nuevas.
- **Vistas y RLS:** una vista normal salta RLS. Por norma general, crea las vistas con `WITH (security_invoker = true)` y revoca el acceso a anon. La excepción deliberada es `public.v_event_servers` (`security_invoker = false`), creada para permitir que cualquier usuario autenticado consulte el nombre de los servidores asignados en el calendario sin vulnerar la privacidad de la tabla `persons` (su alerta "Security Definer View" en el Security Advisor de Supabase es esperada y deliberada).
- **Políticas SELECT y soft-delete (`deleted_at`):** en tablas con archivado mediante `deleted_at`, la política SELECT del administrador no debe exigir `deleted_at IS NULL` de forma obligatoria. Si se exige, al hacer un `UPDATE ... SET deleted_at = now()` que retorna la fila (típico en `.select()`), la fila modificada deja de pasar la condición SELECT y Postgres arroja `new row violates row-level security policy`. La condición SELECT debe empezar siempre por `is_admin() OR ((deleted_at IS NULL) AND ...)`.
- **Funciones SQL y orden de creación:** una función `LANGUAGE sql` se valida al crearla, así que las tablas que usa deben existir antes.
- **GRANTs:** con "Automatically expose new tables" desmarcado, una tabla sin GRANT da `permission denied` aunque la RLS esté bien.
- El script SQL probado fue en PostgreSQL 16 con auth y storage simulados. En Supabase real, repetir las pruebas con un usuario por rol.

## 9. Reglas para la IA que trabaje en este proyecto

1. Haz **solo la tarea pedida**, un módulo por vez. No inventes módulos nuevos ni cambies la estructura de la base de datos sin avisar.
2. **Nunca uses ni pidas la clave service_role.** Nunca escribas claves en el código.
3. Toda la interfaz y los errores en **español**, mobile-first, botones grandes para móvil.
4. No uses `DELETE` para personas ni ciclos. Soft-delete.
5. Los errores del servidor (por ejemplo, ciclo cerrado, nota fuera de rango) se **muestran de forma legible**, no se ocultan.
6. Para archivos de Storage usa **URLs firmadas** (buckets privados) y respeta las rutas de la sección 7.
7. Si un cambio exige modificar la base de datos, escribe un archivo nuevo en `supabase/migrations/`, idempotente, y explícale a Luis cómo ejecutarlo en el SQL Editor. Prueba que no rompe las políticas existentes.
8. Si no estás seguro de algo, **pregunta**. No supongas.
9. Luis no es experto en esta parte técnica: explica los pasos de forma concreta (dónde hacer clic, qué pegar) y avísale de cualquier riesgo.

## 10. Plantilla para abrir un chat nuevo

```
Lee CONTEXTO_PROYECTO.md, SPEC.md y supabase/migrations/ (no modifiques las
migraciones ya ejecutadas). Tarea de ahora, y SOLO esto: <MÓDULO>.
<Detalles del módulo>
Respeta las reglas de la sección 9 del CONTEXTO. Al terminar, dime cómo
probarlo y qué pruebas hacer con un usuario de cada rol.
```

### Alcance de cada módulo (histórico: todos ya implementados)

- **Personas (admin):** lista con búsqueda y filtro por estado; crear y editar ficha; soft-delete; vincular cuenta con `supabase.rpc('link_person_to_user', { p_person_id, p_email })`; roles como casillas (insertar o eliminar en `user_roles`), avisando antes de quitarse a uno mismo el rol admin.
- **Clases, admin y maestro:** admin gestiona cursos y ciclos (crear, asignar maestro, cerrar). Maestro: inscribir, sesiones, asistencia con botones grandes, evaluaciones y notas, tareas, materiales (archivo o enlace), ver entregas y calificarlas, resumen con `v_cycle_grades_summary`. Ciclo cerrado = solo lectura.
- **Mis clases, alumno:** ciclos inscritos, próxima sesión, materiales, tareas con fecha límite, subir entrega, ver feedback y notas, su asistencia. Nunca edita `grade` ni `feedback`.
- **Usuarios (admin):** pantalla que llama a una **Edge Function** de Supabase. La función verifica que quien llama es admin, crea el usuario (`auth.admin`) con la clave secret guardada como secreto de la función, y asigna roles. Requiere instalar la CLI de Supabase y desplegar. Guiar a Luis paso a paso.
- **Finanzas (admin y tesorero):** categorías, ofrendas (persona opcional), gastos con comprobante en `receipts`, resumen mensual, exportar a CSV. Cada miembro solo ve sus propias ofrendas (ya garantizado por RLS).

## 11. Cómo probar cada módulo

Crear usuarios de prueba en Supabase, en Authentication, Users, Add user, con Auto Confirm User. Truco: `tucorreo+alumno@gmail.com` llega al mismo buzón. Asignar rol con:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'alumno' FROM auth.users WHERE email = 'tucorreo+alumno@gmail.com'
ON CONFLICT DO NOTHING;
```

Probar con ventanas de incógnito en paralelo. Comprobar siempre:
- Cada rol solo ve su menú y sus datos.
- Escribiendo a mano una URL ajena (`/finanzas`) sale "permiso denegado".
- Un alumno no ve notas, ofrendas ni datos de otros alumnos.
- Tras login, sin recargar, entra directo (sin `/sin-permisos`).

## 12. Antes de entregarla a la iglesia

1. **Copias de seguridad:** [COMPLETADO] Implementado módulo de respaldo completo JSON y exportaciones CSV en la vista de Auditoría para rol `admin`.
2. **Pausa por inactividad:** [AUTOMATIZADO Y RESUELTO] En Supabase gratuito el proyecto se pausa tras 7 días de inactividad. Se implementó un sistema automático de latido ("keep-alive") mediante un GitHub Action programado (cron lunes y jueves a las 08:00 UTC, `.github/workflows/supabase-keepalive.yml`) que invoca la función `public.keepalive_ping()` (`018_keepalive_ping.sql`) sin exponer datos sensibles. Si por algún motivo extremo el proyecto llegara a pausarse (o fallara el Action, notificando por correo a Luis), basta con entrar a https://supabase.com/dashboard y pulsar "Restore project" (el proyecto se restaura intacto en unos 2 minutos).
3. **Propiedad de la cuenta de Supabase:** hoy está a nombre de Luis. Acordar con el pastor quién la tendrá a medio plazo.
4. **Datos sensibles:** una lista de miembros y ofrendas es información delicada (en España, los datos de creencias religiosas son categoría especial en el RGPD). Dar acceso solo a quien lo necesite; el pastor debe saber que es responsable de esos datos.
5. **Caché de la PWA:** que cachee solo archivos de la app, no datos de Supabase, para que no queden notas ni ofrendas guardadas en móviles compartidos.
6. **Prueba final** con un usuario por rol.
7. **Correo de Supabase:** el envío integrado es muy limitado. Si se usan invitaciones por correo, configurar un servicio propio.
