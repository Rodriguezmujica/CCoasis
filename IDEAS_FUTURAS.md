# Ideas futuras – Centro Cristiano Oasis

> Ideas de evolución y mejoras futuras. Fecha: 8 de noviembre de 2026.
> Antes de construir cualquier cosa conviene planificarla con `/plan`.

## 1. Primero: que no se pierda nada
- **Exportar y copia de seguridad.** [HECHO] Botón de admin que descarga personas, clases y finanzas en CSV, junto con respaldo completo en JSON en la vista de Auditoría.
- **Pausa por inactividad (keep-alive automático).** [HECHO] Sistema de latido automático mediante GitHub Actions y función SQL `keepalive_ping()` para evitar que Supabase se pause por inactividad tras 7 días.
- **Prueba final con un usuario por rol** (admin, tesorero, maestro, alumno): cada uno ve solo lo suyo.

## 2. Que la gente la use cada semana
- **Notificaciones push en el móvil** (la app ya es PWA): eventos, anuncios y tareas.
- **Recordatorios automáticos:** el día antes de un culto o evento, para quien confirmó asistencia y para quien tiene turno.
- **Pantalla de inicio por rol (`/inicio`).** [HECHO] Fases 1 a 6 completadas y en producción (ver sección 3).
- **Peticiones de oración:** se envían y las ven los pastores o un equipo designado.
- **Devocional o versículo del día.**

## 3. Pantalla de inicio

### Visitante (sin login) [PENDIENTE — sujeta a aprobación y datos de los pastores]
Página pública corta, pensada para móvil:
1. Cabecera con logo y botón "Iniciar sesión".
2. Próximo culto o evento: fecha, hora, lugar y botón "Cómo llegar".
3. Calendario en solo lectura (próximos 30 días, solo eventos públicos).
4. Noticias recientes (3 o 4 tarjetas).
5. Redes sociales (Instagram y las que usen).
6. Contacto: WhatsApp, dirección, horarios.

### Usuario conectado (según rol) [HECHO — Fases 1 a 6 completadas en `/inicio`]
- **Todos:** [HECHO] Anuncios vigentes (urgentes/importantes arriba, normales abajo), próximo evento con confirmación de asistencia (RSVP) y mis turnos asignados.
- **Alumno:** [HECHO] Próxima clase, tareas pendientes con fecha límite y últimas notas.
- **Maestro:** [HECHO] Próxima clase que imparte, asistencia por pasar y entregas por revisar.
- **Tesorero:** [HECHO] Resumen financiero del mes actual.
- **Admin:** [HECHO] Resumen financiero del mes y pendientes de la semana (eventos futuros sin turnos, avisos por caducar en 7 días y confirmaciones del próximo culto).
- **Multi-rol y UX:** [HECHO] Filtro interactivo de chips por rol y estados vacíos compactos.

### Calendario público (solo lectura) [PENDIENTE — sujeto a aprobación de los pastores]
- Cada evento se marca como **público** o **interno**; por defecto, interno.
- Se muestra solo título, fecha, hora y lugar. Nunca turnos, conteos, confirmaciones ni nombres.
- Acceso mediante una vista o función aparte, sin leer `church_events` directamente (mismo patrón que `v_event_servers`).
- El calendario de usuarios conectados se mantiene igual.

## 4. Noticias y redes sociales
- **Noticias públicas:** crónicas de eventos con fotos. Distintas de Anuncios, que son internos.
- **Transmisión en vivo:** enlace a YouTube o Facebook Live en la tarjeta del próximo culto.
- **Galería de fotos:** requiere moderación y permiso de los padres si salen menores.

### Instagram

| Opción | Restricción | Opinión |
|---|---|---|
| Botón o icono que abre el perfil | Ninguna | Empezar por aquí |
| Compartir un evento | No se publica en Instagram desde un enlace web; se comparte por WhatsApp o se copia el enlace | Útil y fácil |
| Incrustar una publicación concreta | Carga scripts y cookies de Meta | Aceptable para 1 o 2 publicaciones |
| Feed completo en la app | Exige API de Meta, cuenta profesional, revisión y tokens que caducan cada 60 días | No recomendado |
| Widget de terceros | Suele ser de pago y añade un servicio externo | Solo si insisten en el feed |

Cuidados: aviso de cookies si se incrusta contenido, no copiar fotos de menores sin permiso, y no depender de integraciones que Meta pueda cambiar.

## 5. Más adelante
- **Ofrendas y diezmos en línea:** solo con proveedor de pagos externo; nunca guardar datos de tarjeta.
- **Ministerios y grupos pequeños:** células, jóvenes, alabanza, con calendario y lista propios.
- **Seguimiento de visitas:** quién vino, quién necesita contacto y cuándo.
- **Informes en PDF** para la directiva: asistencia, finanzas y crecimiento.
- **Cumpleaños y aniversarios.**

## 6. Orden sugerido
1. Exportar y copias de seguridad. [HECHO]
2. Notificaciones y recordatorios.
3. Pantalla de inicio por rol (`/inicio`). [HECHO]
4. Peticiones de oración.
5. Página pública con calendario de solo lectura, noticias y enlace a Instagram (pendiente de aprobación y datos de los pastores).

## 7. Advertencia sobre lo público
Hoy todo está detrás de login y contiene datos sensibles (listas de miembros, ofrendas). Cualquier sección pública debe ir separada de esos datos y exponer solo lo mínimo.

## 8. Pregunta pendiente
¿Los pastores quieren que cualquier persona vea horarios y eventos sin iniciar sesión?
