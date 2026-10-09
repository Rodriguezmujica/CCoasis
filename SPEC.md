# SPEC.md — Centro Cristiano Oasis · Church Management PWA (Fase 1)

> **Stack**: React 18 + Vite 5 + Supabase (PostgreSQL, Auth, Storage)  
> **Arquitectura**: Single Responsive PWA (móvil y escritorio)  
> **Última revisión**: 2026-10-08  

---

## 1. Decisiones de Arquitectura y Alcance

1. **Una sola aplicación web instalable (PWA)**:
   - Se elimina la separación de apps independientes para evitar duplicar bases de código, despliegues y costes de mantenimiento.
   - La experiencia se adapta por roles e interfaces responsive (móvil y escritorio).
2. **Seguridad real en PostgreSQL (Supabase RLS)**:
   - Ocultar vistas o botones en la interfaz es solo UX. La verdadera seguridad reside en **Row Level Security (RLS)** y políticas de **Storage**.
   - Toda solicitud se valida a nivel de fila y función en la base de datos.
3. **Roles múltiples por usuario (`user_roles`)**:
   - Una persona puede desempeñar múltiples funciones simultáneamente (ejemplo: ser `maestro` en discipulado y `tesorero` en administración).
4. **Enfoque de Fase 1 (MVP Esencial)**:
   - **Incluido**: Personas, Autenticación/Roles, Clases (cursos, ciclos, inscripciones, sesiones, asistencia, evaluaciones, tareas, entregas y materiales), Finanzas básicas (ofrendas, gastos con comprobantes).
   - **Postergado para Fase 2**: `audit_logs` automáticos, `fiscal_periods` complejos con cortes contables avanzados y flujo multinivel de aprobación con umbrales.
5. **Configuración Regional y Privacidad (RGPD)**:
   - Divisa por defecto: **EUR (€)**.
   - Privacidad: Datos de pertenencia religiosa categorizados como especial protección. Acceso estrictamente restringido (un maestro no ve finanzas, un alumno solo ve lo propio).
   - Registro cerrado: Desactivar `public signup` en Supabase Auth. Usuarios creados vía invitación o por el administrador. Primer super-admin inicializado directamente vía SQL.

---

## 2. Roles y Permisos (`user_roles`)

Roles disponibles:
- `admin` (incluye facultades de super-admin / pastor): Acceso total al sistema, configuración y asignación de roles.
- `tesorero`: Gestión de finanzas (ofrendas, gastos) y lectura del directorio de personas.
- `maestro`: Gestión de sus ciclos asignados, asistencia, evaluaciones, tareas, materiales y alumnos de sus clases.
- `alumno`: Consulta de sus cursos inscritos, sesiones, su propia asistencia, sus notas, materiales y envío de tareas propias.

### Función Helper de Seguridad
- `has_role(required_role text)`: Definida como `SECURITY DEFINER` con `search_path = public` para evitar recursión infinita en RLS.

---

## 3. Módulo 1: Personas y Perfiles

### 3.1 Reglas de Negocio
- Cada persona tiene un estado: `activo`, `inactivo`, `visita`, `transferido`, `fallecido`.
- Vínculo con Auth: Columna opcional `persons.user_id REFERENCES auth.users(id) ON DELETE SET NULL`. Permite tener personas en la congregación sin cuenta de sistema (niños, visitas, etc.).
- `email`: Opcional. Índice único parcial estricto: `CREATE UNIQUE INDEX idx_persons_email_unique ON public.persons(email) WHERE email IS NOT NULL AND deleted_at IS NULL;` para soportar reincorporaciones tras soft-delete.
- `baptism_date`: Restricción `CHECK (baptism_date IS NULL OR birth_date IS NULL OR baptism_date >= birth_date)`.
- Soft-delete: Columna `deleted_at timestamptz`. Las políticas RLS y consultas excluyen por defecto los registros borrados (`WHERE deleted_at IS NULL`).
- Los usuarios no pueden modificar sus propios roles ni elevar sus privilegios.

### 3.2 Matriz de Acceso
| Acción | admin | tesorero | maestro | alumno |
|---|---|---|---|---|
| Ver personas | Todas | Todas (solo lectura) | Solo alumnos de sus ciclos | Solo su propio registro |
| Crear / Editar | Todas | ❌ | ❌ | Solo su propio perfil |
| Eliminar (Soft) | Todas | ❌ | ❌ | ❌ |

---

## 4. Módulo 2: Clases y Discipulado

### 4.1 Conceptos y Entidades
- **Cursos (`courses`)**: Catálogo formativo (título, descripción, puntaje mínimo para aprobar `passing_grade`, porcentaje mínimo de asistencia `min_attendance_pct`).
- **Ciclos (`cycles`)**: Instancias activas o históricas de un curso en fechas determinadas, con un maestro asignado (`teacher_id REFERENCES persons(id)`).
- **Inscripciones (`enrollments`)**: Vínculo entre persona y ciclo (`status`: `'inscrito'`, `'completado'`, `'retirado'`).
- **Sesiones (`sessions`)**: Clases particulares con fecha y tema planificado.
- **Asistencia (`attendance`)**: Marca individual (`presente`, `ausente`, `justificado`) por persona y sesión.
- **Evaluaciones y Calificaciones (`evaluations`, `grades`)**:
  - `evaluations`: Evaluaciones planificadas por ciclo (ej: "Examen 1", "Ensayo"), con puntaje máximo.
  - `grades`: Calificación obtenida por alumno/inscripción.
  - El resultado "Aprobado / No Aprobado" se calcula dinámicamente mediante una vista (`v_cycle_grades_summary`), sin persistir estados redundantes o desincronizados.
- **Materiales (`class_materials`)**: Enlaces o archivos adjuntos (Supabase Storage) asignados al ciclo o sesión.
- **Tareas y Entregas (`assignments`, `assignment_submissions`)**:
  - `assignments`: Tareas creadas por el maestro con fecha límite.
  - `assignment_submissions`: Entregas de los alumnos con archivos adjuntos y retroalimentación del maestro.

### 4.2 Reglas de Integridad y Bloqueo
- **Ciclo cerrado**: Bloqueado mediante **Trigger en base de datos** (`prevent_modifications_on_closed_cycle`). Si `cycles.status = 'cerrado'`, no se permite insertar/modificar/eliminar sesiones, asistencias ni evaluaciones.
- **No eliminación física con dependencias**: Ciclos con inscripciones activas solo se archivan.

---

## 5. Módulo 3: Finanzas Básicas

### 5.1 Conceptos y Entidades
- **Categorías (`transaction_categories`)**: Diferenciadas por tipo (`ingreso`, `gasto`).
- **Ofrendas / Ingresos (`offerings`)**: Ingresos monetarios. Persona asociada opcional (`person_id NULL` para aportes anónimos).
- **Gastos (`expenses`)**: Egresos registrados con fecha, monto, concepto, categoría y comprobante de soporte.
- Moneda estandarizada: **EUR (€)**.

### 5.2 Matriz de Acceso
| Acción | admin | tesorero | maestro | alumno |
|---|---|---|---|---|
| Registrar Ofrendas/Gastos | ✅ | ✅ | ❌ | ❌ |
| Ver Reportes y Totales | ✅ | ✅ | ❌ | ❌ |
| Ver Historial Propio de Aportes | ✅ | ✅ | ❌ | Solo sus aportes identificados |

---

## 6. Supabase Storage (Buckets y Políticas)

1. **Bucket `materials` (Público autenticado para lectura / Restringido para carga)**:
   - *Lectura*: Alumnos inscritos en el ciclo, maestros del ciclo y administradores.
   - *Escritura/Borrado*: Maestro asignado al ciclo y administradores.
2. **Bucket `assignments` (Privado)**:
   - *Lectura*: El alumno propietario del archivo, el maestro del ciclo y administradores.
   - *Subida*: Alumno inscrito en la tarea correspondiente.
3. **Bucket `receipts` (Privado)**:
   - *Lectura y Escritura*: Exclusivo para roles `admin` y `tesorero`.

---

## 7. Convenciones Técnicas

- **Identificadores**: `uuid` generado con `gen_random_uuid()`.
- **Zonas horarias**: `timestamptz` en UTC.
- **Soft-delete**: `deleted_at timestamptz` con índices parciales `WHERE deleted_at IS NULL`.
- **Triggers**: Control de inmutabilidad en ciclos cerrados y actualización automática de `updated_at`.
