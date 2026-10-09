# ROADMAP_FASE2.md — Centro Cristiano Oasis

> **Estado de Fase 1**: 100% COMPLETADA Y VALIDADA (Personas, Clases, Usuarios con Edge Function y Finanzas).  
> **Propósito**: Planificar las ampliaciones post-MVP en bloques modulares, pequeños y seguros sin alterar la estabilidad del código existente.

---

## Bloque 1: Calendario y Actividades Eclesiales (COMPLETADO)
- **Objetivo**: Agenda visual de cultos, reuniones de oración, eventos de jóvenes, vigilias y actividades pro-fondos (ventas, verbenas).
- **Acceso**:
  - `admin`: Crear, modificar, reprogramar y archivar eventos.
  - `todos los roles` (`admin`, `tesorero`, `maestro`, `alumno`): Lectura en vista adaptada para móvil y PC con tarjeta destacada de "Próximo evento".
- **Base de datos**: Tabla `church_events` (Migración `006_calendar_events.sql`).

---

## Bloque 2: Programa de Culto y Turnos de Servidores (Liderazgo) (COMPLETADO)
- **Objetivo**: Organizar quién sirve en cada culto o reunión para evitar confusiones de última hora.
- **Roles a asignar por culto**:
  - Predicación / Mensaje (pastor o predicador invitado).
  - Dirección del culto / Apertura.
  - Alabanza / Música (líder de alabanza o grupo).
  - Ujieres / Bienvenida / Recogida de ofrenda.
  - Escuela Dominical / Cuidado de niños.
  - Sonido / Audiovisuales.
- **Integración**: Vinculado directamente a cada evento del Calendario (`church_event_assignments`, migración `007_event_assignments.sql`), seleccionando personas activas de la tabla `persons`.

---

## Bloque 3: Conteo y Métricas de Asistencia General de Cultos (COMPLETADO)
- **Objetivo**: Conteo numérico rápido de cada reunión (sin pasar lista individual con nombre).
- **Datos a registrar por culto**:
  - Número de Adultos.
  - Número de Niños.
  - Número de Visitas / Nuevos asistentes.
  - Total congregacional calculado automáticamente en PostgreSQL (`GENERATED ALWAYS AS (adults_count + children_count + visitors_count) STORED`).
- **Vista**: Formulario táctil rápido con botones +/- y modal de resumen y métricas mensuales de crecimiento congregacional.
- **Base de datos**: Tabla `church_event_headcount` (Migración `008_event_attendance_headcount.sql`).

---

## Bloque 4: Avisos y Anuncios Generales (Tablón Parroquial) (COMPLETADO)
- **Objetivo**: Comunicados oficiales del pastor o directiva en la pantalla principal tras iniciar sesión.
- **Acceso**:
  - `admin`: Redactar, editar, activar/desactivar y archivar (soft-delete) avisos.
  - `todos los roles` (`admin`, `tesorero`, `maestro`, `alumno`): Lectura en carrusel/banner prioritario de comunicados vigentes.
- **Base de datos**: Tabla `announcements` (Migración `009_announcements.sql`).

---

## Bloque 5: Notificaciones y Alertas (FASE A COMPLETADA)
- **Fase A (Completada)**: Indicador visual interno (campana de notificaciones, badge de no leídas, drawer táctil y avisos automáticos por anuncios y turnos con migración `010_notifications.sql`).
- **Fase B (Futuro)**: Notificaciones Web Push de la PWA para recordar cultos o tareas pendientes en segundo plano.

---

## Bloque 6: Mejoras Administrativas y Auditoría (COMPLETADO)
- **Objetivo**: Trazabilidad de eventos críticos en la app y control preventivo en desembolsos financieros.
- **Auditoría (`audit_logs`)**:
  - Registro de cambios de roles de usuario (`user_roles`).
  - Eliminación/archivado de personas (`persons`) y eventos de agenda (`church_events`).
  - Registro y eliminación de ofrendas y egresos (`offerings`, `expenses`).
  - Panel exclusivo para Administradores en `/auditoria` con filtros táctiles y badges semánticos.
  - Tabla inmutable: `UPDATE` y `DELETE` bloqueados a nivel de RLS.
- **Validación de Gastos Mayores**:
  - Alerta destacada y confirmación explícita obligatoria en el modal de registro de egresos cuando el importe supere los 300,00 €.
- **Base de datos**: Migración `011_audit_logs.sql`.