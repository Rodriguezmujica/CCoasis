# CONTEXTO DEL PROYECTO: ccoasis-app

> Lee este archivo completo antes de tocar nada. Es la fuente de verdad sobre qué se ha hecho, qué se decidió y qué falta. Si algo de aquí contradice una suposición tuya, manda este archivo. Si algo te parece mal, dilo antes de cambiarlo.

Última actualización: 8 de octubre de 2026.

## 1. Qué es y para quién

App web instalable (PWA) para administrar el **Centro Cristiano Oasis**, una iglesia pequeña. La construye Luis (desarrollador autodidacta, Madrid, España) como **regalo para la iglesia**. El **pastor será quien la administre**, no Luis; por eso importa que el pastor pueda gestionar todo desde la app sin tocar el panel de Supabase.

- Idioma de la interfaz y de los mensajes de error: **español**.
- Moneda: **EUR**. Zona horaria: Europe/Madrid.
- Uso: móvil y PC. **Mobile-first**.
- Escala: pequeña. Clases de **máximo 12 personas**.
- Luis se comunica en español y prefiere respuestas directas, concisas y honestas.

## 2. Qué incluye la app

1. **Personas:** fichas de miembros y visitas.
2. **Clases / discipulado:** cursos, ciclos, inscripciones, sesiones, asistencia, evaluaciones y notas, tareas con entregas, materiales. Funciona como un pequeño instituto.
3. **Finanzas:** ofrendas (con o sin persona), gastos con comprobante.
4. **Administración:** usuarios y roles.

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
- **Sin registro público.** Los usuarios los crea un administrador (hoy a mano en Supabase; luego desde la app con una Edge Function).
- **Soft-delete** (`deleted_at`) en personas y cursos y ciclos. En la app no se hace DELETE de personas ni de ciclos.
- No todos los miembros necesitan cuenta: pueden existir como ficha en `persons` sin `user_id`.
- Fase 1 recortada a propósito: **no hay** `audit_logs`, `fiscal_periods` ni umbral de aprobación de gastos. Se dejan para una fase 2.

## 5. Estado actual

### Hecho y verificado

- Proyecto de Supabase creado (`ccoasis-app`). Creado con "Automatically expose new tables" **desmarcado** y "Enable automatic RLS" marcado.
- `supabase/migrations/001_initial_schema.sql` **ejecutado** en Supabase (versión corregida e idempotente). Probado en PostgreSQL 16 local con usuarios de prueba por rol, con 0 errores.
- Usuario administrador creado y con rol `admin` en `user_roles`.
- Registro público de usuarios desactivado en Supabase (Authentication).
- App con login (correo y contraseña), cierre de sesión, menú por rol y rutas protegidas. **Probada por Luis con un admin y un alumno de prueba: funciona.** Se corrigió un bug de primer login (ver sección 8).
- Los módulos aún son pantallas "En construcción".

### Pendiente, en este orden

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
| `admin` | Personas, Clases, Finanzas, Usuarios |
| `tesorero` | Finanzas |
| `maestro` | Mis clases |
| `alumno` | Mis clases |

Un usuario con varios roles ve la unión de menús.

## 7. Base de datos (resumen)

Fuente de verdad: `supabase/migrations/`. **No edites `001` ni `002`.** Cualquier cambio va en un archivo nuevo (`003_...sql`, etc.), idempotente (`IF NOT EXISTS`, `DROP POLICY IF EXISTS` antes de `CREATE POLICY`), y se ejecuta en el SQL Editor de Supabase.

**Tablas:** `user_roles`, `persons`, `courses`, `cycles`, `enrollments`, `sessions`, `attendance`, `evaluations`, `grades`, `assignments`, `assignment_submissions`, `class_materials`, `transaction_categories`, `offerings`, `expenses`.

**Vista:** `v_cycle_grades_summary` (promedio normalizado a 0-100, porcentaje de asistencia y `passed`). Es `security_invoker`, respeta RLS y no es accesible para anon. Solo cuenta `presente` como asistencia.

**Storage (buckets privados):**
- `materials`: ruta `<cycle_id>/<archivo>`.
- `assignments`: ruta `<auth_user_id>/<assignment_id>/<archivo>`.
- `receipts`: solo admin y tesorero.

**Funciones auxiliares (SECURITY DEFINER):** `has_role`, `is_admin`, `get_my_person_id`, `my_teaching_cycle_ids`, `my_enrolled_cycle_ids`, `my_enrollment_ids`, `my_student_person_ids`, `link_person_to_user(p_person_id, p_email)`.

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
- **Vistas y RLS:** una vista normal salta RLS. Crea las vistas con `WITH (security_invoker = true)` y revoca el acceso a anon.
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

### Alcance de cada módulo pendiente

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

1. **Copias de seguridad:** el plan gratuito de Supabase no las incluía al crear el proyecto. Añadir un botón "Exportar" y revisar los planes actuales.
2. **Pausa por inactividad:** los proyectos gratuitos pueden pausarse tras semanas sin uso. Comprobar las condiciones actuales y quién puede reactivarlo.
3. **Propiedad de la cuenta de Supabase:** hoy está a nombre de Luis. Acordar con el pastor quién la tendrá a medio plazo.
4. **Datos sensibles:** una lista de miembros y ofrendas es información delicada (en España, los datos de creencias religiosas son categoría especial en el RGPD). Dar acceso solo a quien lo necesite; el pastor debe saber que es responsable de esos datos.
5. **Caché de la PWA:** que cachee solo archivos de la app, no datos de Supabase, para que no queden notas ni ofrendas guardadas en móviles compartidos.
6. **Prueba final** con un usuario por rol.
7. **Correo de Supabase:** el envío integrado es muy limitado. Si se usan invitaciones por correo, configurar un servicio propio.
