# Centro Cristiano Oasis (CCoasis)

Plataforma Web Progresiva (PWA) para la gestion integral, administracion eclesial, control financiero y seguimiento academico del Centro Cristiano Oasis (Madrid, Espana).

Desarrollada como una solucion a medida orientada al despliegue en produccion, la aplicacion centraliza la administracion comunitaria en un entorno seguro, accesible y disenado bajo el principio mobile-first, permitiendo que el liderazgo de la congregacion gestione la totalidad de las operaciones sin requerir conocimientos tecnicos ni acceso directo a paneles de bases de datos.

---

## Tabla de Contenidos

- [Resumen del Proyecto](#resumen-del-proyecto)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Modulos Funcionales](#modulos-funcionales)
- [Modelo de Seguridad y Autorizacion](#modelo-de-seguridad-y-autorizacion)
- [Diseno de Base de Datos y Almacenamiento](#diseno-de-base-de-datos-y-almacenamiento)
- [Funciones Serverless en el Edge](#funciones-serverless-en-el-edge)
- [Cumplimiento Normativo y Privacidad (RGPD)](#cumplimiento-normativo-y-privacidad-rgpd)
- [Estructura del Repositorio](#estructura-del-repositorio)
- [Pila Tecnologica](#pila-tecnologica)
- [Instalacion y Configuracion Local](#instalacion-y-configuracion-local)
- [Estrategia de Despliegue](#estrategia-de-despliegue)
- [Estado y Roadmap del Proyecto](#estado-y-roadmap-del-proyecto)
- [Autor y Contacto](#autor-y-contacto)

---

## Resumen del Proyecto

Las organizaciones comunitarias y eclesiales de tamano mediano y pequeno suelen depender de procesos fragmentados (hojas de calculo manuales, cuadernos fisicos o cadenas de mensajeria instantanea) para registrar asistencia, aportaciones economicas, programas de servidores y formacion de miembros.

CCoasis resuelve esta problematica unificando todas las areas operativas en una unica aplicacion web responsiva e instalable (PWA):

- Directorio central de miembros y visitantes con historiales individualizados.
- Modulo academico completo para institutos biblicos y discipulado (aulas virtuales, tareas, calificaciones y asistencia).
- Libro contable eclesial con registro de ofrendas, control estricto de egresos y almacenamiento de comprobantes.
- Calendario general de actividades y generacion de programas de servicio dominical por turnos.
- Conteo y metricas de crecimiento congregacional.
- Comunicacion interna mediante avisos oficiales y bandeja de notificaciones.
- Panel de administracion con auditoria inmutable de acciones criticas.

---

## Arquitectura del Sistema

La aplicacion sigue un patron arquitectonico desacoplado compuesto por un cliente frontend reactivo e instalable, y un backend as a service (BaaS) gobernado por politicas de seguridad estrictas a nivel de motor relacional.

```
+-----------------------------------------------------------------------+
|                            CLIENTE PWA                                |
|  React 18 + TypeScript + Vite + Tailwind CSS + vite-plugin-pwa        |
|  - Ruteo protegido y adaptativo segun roles multiples                 |
|  - Interfaz tactil mobile-first para dispositivos moviles y escritorio|
|  - Service Worker para cacheo de assets estaticos de aplicacion       |
+-----------------------------------------------------------------------+
                                   |
                     Peticiones HTTPS / REST / RPC
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    SERVICIOS EDGE Y CONTROL DE ACCESO                 |
|  Supabase Edge Functions (Deno / TypeScript runtime)                  |
|  - create-user: Aprovisionamiento administrativo de usuarios          |
|  - update-user-password: Reset seguro de credenciales                 |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                     CAPA DE PERSISTENCIA Y MOTOR                      |
|  Supabase (PostgreSQL 16)                                             |
|  - Row Level Security (RLS) en el 100% de las tablas                  |
|  - Funciones auxiliares SECURITY DEFINER contra recursion             |
|  - Vistas dinamicas de evaluacion (security_invoker = true)           |
|  - Triggers de integridad para ciclos cerrados y marcas temporales    |
|  - Buckets de almacenamiento privado con URLs prefirmadas             |
+-----------------------------------------------------------------------+
```

---

## Modulos Funcionales

### 1. Directorio de Personas y Perfiles
- Ficha unificada para miembros, alumnos, maestros y visitantes.
- Estados de pertenencia: Activo, Inactivo, Visita, Transferido, Fallecido.
- Vinculacion opcional con cuentas de autenticacion (`auth.users`), permitiendo registrar menores o personas sin acceso digital sin comprometer la integridad de la base.
- Soporte de borrado logico (`soft-delete`) mediante marcas temporales `deleted_at`, garantizando que nunca se destruya informacion historica vinculada.
- Vinculacion administrativa de perfiles mediante llamadas a funciones almacenadas seguras (`public.link_person_to_user`).

### 2. Formacion y Discipulado (Aula Virtual)
- **Catalogo de cursos:** Definicion de asignaturas con puntaje de aprobacion y porcentaje minimo de asistencia requerida.
- **Ciclos academicos:** Convocatorias temporales asignadas a docentes especificos. Bloqueo estricto por trigger cuando un ciclo pasa a estado "cerrado" (modo solo lectura para evitar alteraciones retroactivas de notas).
- **Inscripciones:** Registro individual con estados (inscrito, completado, retirado).
- **Sesiones y asistencia:** Toma de asistencia tactil por sesion con estados (presente, ausente, justificado).
- **Evaluaciones y calificaciones:** Planificacion de instrumentos de evaluacion con puntuaciones maximas y ponderacion automatica mediante vista relacional (`v_cycle_grades_summary`).
- **Tareas y entregas:** Publicacion de asignaciones con fechas limite, recepcion de entregas adjuntas por parte del alumnado y calificacion con retroalimentacion personalizada del maestro.
- **Material didactico:** Repositorio de documentos y enlaces de apoyo por ciclo y sesion.
- **Portal del Alumno ("Mis Clases"):** Espacio exclusivo donde los estudiantes consultan su progreso, descargan material, suben entregas y revisan su historial de asistencia y notas de forma privada.

### 3. Gestion Financiera y Tesoreria
- Registro categorizado de ingresos (ofrendas congregacionales identificadas o anonimas).
- Registro de egresos con imputacion contable por categoria y subida de comprobante fiscal adjunto.
- Umbral preventivo de seguridad: Confirmacion y validacion obligatoria ante gastos que superen los 300,00 EUR.
- Filtro por ejercicios y meses con balance consolidado en tiempo real.
- Exportacion a formatos tabulares (CSV) para rendicion de cuentas.
- Privacidad estricta: Los miembros que aportan solo pueden consultar su propio historial de ofrendas personales; el resto del modulo financiero permanece exclusivamente accesible a tesoreros y administradores.

### 4. Calendario Eclesial y Turnos de Servicio
- Planificacion centralizada de cultos, reuniones de oracion, vigilias y eventos especiales.
- Asignacion dinamica de servidores por culto:
  - Predicacion / Mensaje principal.
  - Direccion y apertura de reunion.
  - Alabanza y musica.
  - Recepcion, ujieres y ofrenda.
  - Escuela infantil / Cuidado de ninos.
  - Sonido y transmision audiovisual.
- Confirmacion de asistencia (RSVP) para eventos especiales.
- Tarjeta reactiva de "Proximo Evento" visible para todos los miembros autenticados.

### 5. Conteo Congregacional (Headcount)
- Interfaz tactil de captura rapida durante el culto para registro de:
  - Adultos.
  - Ninos.
  - Visitas de primera vez.
- Calculo matematico inmutable del total congregacional generado directamente a nivel de base de datos (`GENERATED ALWAYS AS (adults_count + children_count + visitors_count) STORED`).
- Modal analitico con metricas mensuales de evolucion y comparativa de asistencia.

### 6. Comunicaciones y Notificaciones
- **Anuncios oficiales:** Publicacion de comunicados de la directiva y pastoral con periodos de vigencia y soporte de archivado logico.
- **Notificaciones in-app:** Campana interactiva con contador de no leidas y cajon desplegable con avisos automaticos al asignarse turnos de servicio o publicarse nuevos comunicados.

### 7. Administracion de Usuarios y Auditoria
- Interfaz administrativa para alta de usuarios, activacion/desactivacion de credenciales y asignacion dinamica de roles multiples.
- **Registro inmutable de auditoria (`audit_logs`):** Trazabilidad completa de modificaciones en roles, eliminacion de perfiles, creacion o archivado de eventos y transacciones financieras. La tabla de auditoria cuenta con politicas RLS que bloquean cualquier operacion de `UPDATE` o `DELETE`.

---

## Modelo de Seguridad y Autorizacion

La aplicacion opera bajo un enfoque de **cero confianza** (*Zero-Trust*). Ocultar vistas, botones o rutas en la interfaz de React es unicamente una medida de experiencia de usuario (UX); toda la proteccion efectiva del sistema se ejecuta y valida a nivel de motor PostgreSQL mediante Row Level Security (RLS).

### Matriz de Acceso por Roles (RBAC)

El sistema admite la asignacion de multiples roles a una misma cuenta de usuario (`user_roles`).

| Modulo / Accion | admin | tesorero | maestro | alumno |
|---|:---:|:---:|:---:|:---:|
| Personas (Gestion global y alta) | Total | Solo lectura | Solo sus alumnos | Solo perfil propio |
| Clases (Crear cursos y ciclos) | Total | Denegado | Denegado | Denegado |
| Clases (Asistencia, notas, tareas) | Total | Denegado | Sus ciclos | Solo consulta propia |
| Mis Clases (Entregas y descargas) | Total | Denegado | Denegado | Sus inscripciones |
| Finanzas (Ingresos, gastos, balances) | Total | Total | Denegado | Solo ofrendas propias |
| Calendario (Crear eventos y turnos) | Total | Lectura | Lectura | Lectura |
| Conteo de Culto (Headcount) | Total | Lectura | Lectura | Lectura |
| Anuncios (Publicar y archivar) | Total | Lectura | Lectura | Lectura |
| Usuarios y Credenciales | Total | Denegado | Denegado | Denegado |
| Auditoria del Sistema | Total | Denegado | Denegado | Denegado |

### Resolucion de Recursividad y Vistas Seguras

1. **Funciones `SECURITY DEFINER`:** Para evitar la recursion infinita en politicas RLS cruzadas (por ejemplo, validar si un usuario puede leer una inscripcion consultando la tabla de ciclos y viceversa), se implementaron funciones auxiliares ejecutadas en el contexto de definicion con ruta de busqueda fija (`search_path = public`):
   - `has_role(required_role text)`
   - `is_admin()`
   - `get_my_person_id()`
   - `my_teaching_cycle_ids()`
   - `my_enrolled_cycle_ids()`
   - `my_enrollment_ids()`
   - `my_student_person_ids()`

2. **Vistas con `security_invoker = true`:** Las vistas analiticas (como `v_cycle_grades_summary`) estan declaradas explicitamente con `WITH (security_invoker = true)`, obligando a que las consultas sobre la vista respeten las politicas RLS de la sesion del usuario que realiza la llamada y no los privilegios del creador de la vista.

3. **Restriccion del rol anonimo:** El rol publico `anon` tiene denegado el acceso al esquema de negocio. Unicamente el rol `authenticated` dispone de permisos de seleccion, insercion y modificacion limitados por politicas RLS.

---

## Diseno de Base de Datos y Almacenamiento

### Migraciones Idempotentes

La definicion del esquema se estructura en migraciones SQL secuenciales e idempotentes ubicadas en `supabase/migrations/`:

- `001_initial_schema.sql`: Estructura inicial, funciones base, tablas de personas, cursos, ciclos, asistencia, evaluaciones, entregas, finanzas y RLS.
- `002_link_person_user.sql`: Procedimiento almacenado para vinculacion segura entre cuentas de correo y expedientes personales.
- `003_student_read_teachers.sql`: Permisos de lectura de datos docentes para perfiles de alumnos.
- `004_grant_service_role.sql`: Concesion de privilegios tecnicos minimos al rol de servicio para ejecucion en el Edge.
- `005_finanzas_categories_policy.sql`: Permisos de gestion de categorias de transaccion financiera.
- `006_calendar_events.sql`: Esquema del calendario eclesial y actividades comunitarias.
- `007_event_assignments.sql`: Asignaciones de servidores por ministerio y evento.
- `008_event_attendance_headcount.sql`: Registro de aforo y metricas de conteo congregacional.
- `009_announcements.sql`: Tablon oficial de comunicados y avisos institucionales.
- `010_notifications.sql`: Motor relacional de notificaciones internas in-app.
- `011_audit_logs.sql`: Registro inmutable de eventos de auditoria y trazabilidad.
- `013_event_rsvps.sql`: Sistema de confirmacion de asistencia a eventos especiales.

### Politicas de Almacenamiento (Supabase Storage)

El almacenamiento binario se organiza en tres buckets privados independientes con politicas de acceso granular:

- `materials`: Almacena bibliografia y archivos de clase organizados bajo la ruta `<cycle_id>/<archivo>`. Lectura permitida a docentes y alumnos matriculados; subida y eliminacion restringida a administradores y al docente titular.
- `assignments`: Almacena documentos de tareas entregadas por los alumnos bajo la ruta `<auth_user_id>/<assignment_id>/<archivo>`. Lectura restringida al propio alumno, al maestro del ciclo y al administrador.
- `receipts`: Almacena justificantes de pago, tickets y facturas de egresos. Lectura y carga restringida exclusivamente a roles `admin` y `tesorero`.

La exposicion de archivos en el cliente se realiza exclusivamente a traves de URLs temporales prefirmadas generadas bajo demanda.

---

## Funciones Serverless en el Edge

Para mantener intacto el principio de menor privilegio en el cliente, la aplicacion web nunca dispone de la clave secreta `service_role`. Cualquier operacion sensible que requiera privilegios elevados se delega a Supabase Edge Functions ejecutadas en un entorno Deno con secretos inyectados en el servidor:

- **`create-user` (`supabase/functions/create-user/index.ts`):**
  - Valida el token JWT del usuario que realiza la peticion.
  - Verifica que el usuario emisor posea el rol `admin` en la base de datos.
  - Invoca la API administrativa de autenticacion (`supabase.auth.admin.createUser`) para aprovisionar la nueva cuenta con correo y contrasena inicial.
  - Inserta los roles correspondientes en la tabla `user_roles` y vincula opcionalmente el registro con la tabla `persons`.
- **`update-user-password` (`supabase/functions/update-user-password/index.ts`):**
  - Permite a los administradores reestablecer contrasenas de acceso de miembros de manera asistida sin comprometer la seguridad general del sistema.

---

## Cumplimiento Normativo y Privacidad (RGPD)

Bajo el Reglamento General de Proteccion de Datos (RGPD) de la Union Europea y la legislacion espanola (LOPDGDD), la informacion relativa a convicciones religiosas esta clasificada como **datos de categoria especial (Articulo 9 del RGPD)**.

En consonancia con este requisito legal:
- **Segregacion funcional:** Ningun usuario ajeno a la administracion o tesoreria puede visualizar el directorio completo de miembros ni sus datos de contacto.
- **Aislamiento economico:** Los registros de ofrendas personales estan estrictamente blindados por RLS; ningun maestro, alumno u operador puede consultar las aportaciones economicas de terceros.
- **Politica de cache de la PWA:** El service worker esta configurado para almacenar en cache unicamente los assets estaticos de la aplicacion (HTML, JavaScript compilado, hojas de estilo e iconos). Los datos provenientes de la API de Supabase nunca se almacenan en caches locales persistentes, impidiendo la exposicion de informacion privada en ordenadores o dispositivos moviles compartidos.
- **Registro cerrado:** La creacion publica de cuentas esta inhabilitada; todos los accesos son controlados y gestionados por administradores acreditados.

---

## Estructura del Repositorio

El proyecto esta organizado bajo una estructura monorepo modular:

```
centro_cristiano-osasis/
├── ccoasis-app/                     # Codigo fuente de la aplicacion frontend (PWA)
│   ├── public/                      # Iconos estaticos y manifiesto web
│   ├── src/
│   │   ├── assets/                  # Recursos graficos
│   │   ├── components/              # Componentes visuales organizados por dominio
│   │   │   ├── announcements/       # Banners y modales de comunicados
│   │   │   ├── calendario/          # Asignacion de turnos, conteo y metricas
│   │   │   ├── clases/              # Formularios de ciclos, asistencia, notas y tareas
│   │   │   ├── finanzas/            # Formularios de ingresos, egresos y categorias
│   │   │   ├── mis-clases/          # Vista interactiva del alumno y entregas
│   │   │   ├── notifications/       # Campana y panel de notificaciones
│   │   │   ├── personas/            # Directorio y vinculacion de expedientes
│   │   │   └── usuarios/            # Gestion de usuarios y asignacion de roles
│   │   ├── config/                  # Configuracion de navegacion por perfil
│   │   ├── context/                 # AuthContext y NotificationsContext
│   │   ├── lib/                     # Hooks personalizados de integracion con Supabase
│   │   ├── types/                   # Definiciones de tipos TypeScript del modelo
│   │   ├── views/                   # Vistas principales de enrutamiento
│   │   ├── App.tsx                  # Enrutador principal y suspension
│   │   ├── index.css                # Directivas de Tailwind CSS
│   │   └── main.tsx                 # Punto de entrada de la aplicacion
│   ├── package.json                 # Dependencias del frontend
│   ├── tsconfig.json                # Configuracion del compilador TypeScript
│   └── vite.config.ts               # Configuracion de empaquetado y plugin PWA
├── supabase/
│   ├── functions/                   # Edge Functions en Deno / TypeScript
│   │   ├── create-user/             # Aprovisionamiento administrativo de usuarios
│   │   └── update-user-password/    # Modificacion de contrasenas por administracion
│   └── migrations/                  # Migraciones SQL ordenadas e idempotentes
├── .env.example                     # Plantilla de variables de entorno
├── CONTEXTO_PROYECTO.md             # Documento de contexto funcional interno
├── ROADMAP_FASE2.md                 # Registro de estado de hitos de Fase 2
├── SPEC.md                          # Especificacion tecnica de arquitectura
├── vercel.json                      # Configuracion de reescritura de rutas para despliegue
└── package.json                     # Scripts de conveniencia raiz
```

---

## Pila Tecnologica

### Frontend
- **React 18**: Biblioteca de construccion de interfaces de usuario mediante componentes declarativos.
- **TypeScript 5**: Tipado estatico riguroso en entidades de dominio, estados y propiedades.
- **Vite 5**: Entorno de desarrollo y empaquetado optimizado de alto rendimiento.
- **Tailwind CSS 3**: Sistema de estilos de utilidad para interfaces responsivas mobile-first.
- **React Router 7**: Enrutamiento declarativo del lado del cliente con guardas de autenticacion.
- **Lucide React**: Catalogo de iconografia SVG ligero y accesible.
- **Vite Plugin PWA**: Generacion automatizada de Service Worker y manifiesto web instalable.

### Backend y Persistencia
- **Supabase**: Plataforma Backend as a Service basada en codigo abierto.
- **PostgreSQL 16**: Motor de base de datos relacional con extensiones pgcrypto y pg_net.
- **Supabase Auth**: Sistema de identidad y emision de tokens JWT.
- **Supabase Storage**: Almacenamiento seguro de objetos compatible con API S3.
- **Supabase Edge Functions (Deno)**: Funciones serverless para ejecucion de logica administrativa protegida.

---

## Instalacion y Configuracion Local

### Requisitos Previos
- **Node.js**: Version 18.0.0 o superior.
- **npm**: Version 9.0.0 o superior.
- **Supabase CLI**: Para despliegue de Edge Functions o pruebas locales con Docker.

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Rodriguezmujica/CCoasis.git
cd CCoasis
```

### 2. Instalar Dependencias
Instalar las dependencias de la aplicacion cliente:
```bash
npm --prefix ccoasis-app install
```

### 3. Configurar Variables de Entorno
Crear el archivo `.env` dentro de la carpeta `ccoasis-app/` tomando como referencia `.env.example`:

```bash
cp .env.example ccoasis-app/.env
```

Contenido requerido en `ccoasis-app/.env`:
```env
VITE_SUPABASE_URL=https://<TU-PROYECTO>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<TU-ANON-KEY>
```

> Nota de seguridad: La clave `service_role` nunca debe ser declarada en este archivo ni expuesta en el codigo cliente.

### 4. Inicializar la Base de Datos
Si se utiliza una instancia de Supabase en la nube:
1. Acceder al **SQL Editor** del proyecto en Supabase.
2. Ejecutar correlativamente los scripts contenidos en `supabase/migrations/` (desde `001_initial_schema.sql` hasta la migracion mas reciente).
3. Crear un usuario administrador en Supabase Authentication y registrar su rol en la tabla `user_roles`:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<UUID-DEL-USUARIO>', 'admin');
   ```

### 5. Desplegar Edge Functions (Opcional en desarrollo local)
Para habilitar la creacion de usuarios desde la interfaz web, desplegar las Edge Functions vinculando la CLI con el proyecto:
```bash
supabase link --project-ref <TU-PROJECT-REF>
supabase functions deploy create-user
supabase functions deploy update-user-password
```

### 6. Ejecutar en Modo Desarrollo
```bash
npm run dev
```
La aplicacion estara disponible de forma predeterminada en `http://localhost:5173`.

### 7. Compilar para Produccion
```bash
npm run build
```
Genera los archivos estaticos optimizados dentro de `ccoasis-app/dist/`.

---

## Estrategia de Despliegue

La aplicacion cliente esta disenada para alojarse de forma estatica en plataformas como **Vercel**, **Netlify** o **Cloudflare Pages**.

El archivo `vercel.json` en la raiz del proyecto gestiona la reescritura de rutas para Single Page Applications (SPA):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Al compilar y desplegar:
1. El directorio de publicacion debe apuntar a `ccoasis-app/dist`.
2. Las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` deben configurarse en el panel de despliegue correspondiente.

---

## Estado y Roadmap del Proyecto

### Fase 1: Nucleo Operativo [Completado]
- [x] Arquitectura base, autenticacion por JWT y guardas de navegacion.
- [x] Modelo de datos relacional con RLS en todas las entidades.
- [x] Modulo de personas con soft-delete y vinculacion de cuentas.
- [x] Sistema academico: Cursos, ciclos, inscripciones, sesiones y control de asistencia.
- [x] Evaluaciones, calculo dinamico de promedios ponderados y libro de calificaciones.
- [x] Recepcion de tareas con subida de archivos y portal de alumno.
- [x] Modulo financiero: Registro de ofrendas, egresos con comprobante y balance contable.
- [x] Aprovisionamiento seguro de usuarios mediante Edge Functions.

### Fase 2: Extension Operativa y Gobernanza [Completado]
- [x] Calendario congregacional y agenda comunitaria.
- [x] Asignacion de turnos y roles de servicio por culto y ministerio.
- [x] Registro tactil de aforo y metricas de crecimiento (headcount).
- [x] Tablon oficial de comunicados y avisos pastorales.
- [x] Sistema interno de notificaciones in-app.
- [x] Modulo de auditoria inmutable (`audit_logs`) para acciones criticas.
- [x] Confirmacion de asistencia a eventos especiales (RSVP).
- [x] Umbral de validacion y advertencia para egresos superiores a 300,00 EUR.

### Proximas Mejoras Planificadas
- [-] Notificaciones Web Push en segundo plano para avisos de servicio dominical.
- [-] Exportacion automatica de informes contables y balances en formato PDF.
- [-] Herramienta de copias de seguridad periodicas descargables para el administrador.

---

## Autor y Contacto

- **Desarrollador**: Luis Rodriguez Mujica
- **GitHub**: [github.com/Rodriguezmujica](https://github.com/Rodriguezmujica)
- **Repositorio**: [github.com/Rodriguezmujica/CCoasis](https://github.com/Rodriguezmujica/CCoasis)
- **Localizacion**: Madrid, Espana
- **Licencia**: Proyecto privado desarrollado a medida para el Centro Cristiano Oasis.
