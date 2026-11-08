# Ideas futuras – Centro Cristiano Oasis

> Ideas de evolución y mejoras futuras. Fecha: 9 de noviembre de 2026.
> Antes de construir cualquier cosa conviene planificarla con `/plan`.

## 1. Primero: que no se pierda nada
- **Exportar y copia de seguridad.** [HECHO] Botón de admin que descarga personas, clases y finanzas en CSV, junto con respaldo completo en JSON en la vista de Auditoría (incluyendo `public_site_settings` y `public_news`).
- **Pausa por inactividad (keep-alive automático).** [HECHO] Sistema de latido automático mediante GitHub Actions y función SQL `keepalive_ping()` para evitar que Supabase se pause por inactividad tras 7 días.
- **Prueba final con un usuario por rol** (admin, tesorero, maestro, alumno): cada uno ve solo lo suyo.

## 2. Que la gente la use cada semana
- **Notificaciones push en el móvil** (la app ya es PWA): eventos, anuncios y tareas.
- **Recordatorios automáticos:** el día antes de un culto o evento, para quien confirmó asistencia y para quien tiene turno.
- **Pantalla de inicio por rol (`/inicio`).** [HECHO] Fases 1 a 6 completadas y en producción (ver sección 3).
- **Peticiones de oración:** [DESCARTADO POR DECISIÓN DEL PROYECTO] se envían y las ven los pastores o un equipo designado.
- **Devocional o versículo del día.**

## 3. Pantalla de inicio

### Visitante (sin login) [HECHO — Fases P1 a P7 completadas en `/` y `/bienvenida`]
Página pública corta, pensada para móvil:
1. Cabecera con logo y botón "Iniciar sesión". [HECHO]
2. Próximo culto o evento: fecha, hora, lugar y botón "Cómo llegar". [HECHO]
3. Calendario en solo lectura (próximos 60 días, hasta 10 eventos públicos vía `v_public_events`). [HECHO]
4. Momentos y recuerdos recientes ("Vida en Oasis", hasta 6 tarjetas con carrusel de hasta 5 fotos). [HECHO]
5. Redes sociales (Instagram, YouTube y transmisión en vivo). [HECHO]
6. Contacto: WhatsApp, dirección, horarios e instrucciones para instalar la PWA. [HECHO]

### Usuario conectado (según rol) [HECHO — Fases 1 a 6 completadas en `/inicio`]
- **Todos:** [HECHO] Anuncios vigentes (urgentes/importantes arriba, normales abajo), próximo evento con confirmación de asistencia (RSVP), mis turnos asignados y sección comunitaria "Vida en Oasis".
- **Alumno:** [HECHO] Próxima clase, tareas pendientes con fecha límite y últimas notas.
- **Maestro:** [HECHO] Próxima clase que imparte, asistencia por pasar y entregas por revisar.
- **Tesorero:** [HECHO] Resumen financiero del mes actual.
- **Admin:** [HECHO] Resumen financiero del mes y pendientes de la semana (eventos futuros sin turnos, avisos por caducar en 7 días y confirmaciones del próximo culto).
- **Multi-rol y UX:** [HECHO] Filtro interactivo de chips por rol y estados vacíos compactos.

### Calendario público (solo lectura) [HECHO — `church_events.is_public` y `v_public_events`]
- Cada evento se marca como **público** o **interno**; por defecto, interno (`is_public = false`).
- Se muestra solo título, tipo, fecha, hora y lugar. Nunca descripción, turnos, conteos, confirmaciones ni nombres.
- Acceso mediante la vista `public.v_public_events` (`security_invoker = false`), sin abrir `church_events` a `anon` (mismo patrón que `v_event_servers`).
- El calendario de usuarios conectados se mantiene igual.

## 4. Noticias y redes sociales [HECHO]
- **Noticias públicas ("Vida en Oasis"):** [HECHO] crónicas de eventos con galería de hasta 5 fotos por recuerdo. Distintas de Anuncios, que son internos.
- **Transmisión en vivo:** [HECHO] enlace configurable en `public_site_settings` mostrado en la portada pública.
- **Galería de fotos:** [HECHO] moderada exclusivamente por `admin` desde `/pagina-publica` con casilla obligatoria de verificación de privacidad y permiso paterno para menores (`privacy_verified = true`).

### Instagram

| Opción | Restricción | Opinión |
|---|---|---|
| Botón o icono que abre el perfil | Ninguna | **Implementado (`[HECHO]`)** |
| Compartir un evento | No se publica en Instagram desde un enlace web; se comparte por WhatsApp o se copia el enlace | Útil y fácil |
| Incrustar una publicación concreta | Carga scripts y cookies de Meta | Aceptable para 1 o 2 publicaciones |
| Feed completo en la app | Exige API de Meta, cuenta profesional, revisión y tokens que caducan cada 60 días | No recomendado |
| Widget de terceros | Suele ser de pago y añade un servicio externo | Solo si insisten en el feed |

Cuidados: aviso de cookies si se incrusta contenido, no copiar fotos de menores sin permiso, y no depender de integraciones que Meta pueda cambiar.

## 4b. Extensión aprobada para la Página Pública: "Vida en Oasis" [HECHO — Fases P5 a P7 en `main`]
- **Eslogan institucional:** "Oasis: un hogar de refugio". [HECHO]
- **Sección de momentos y recuerdos ("Vida en Oasis"):** [HECHO]
  - Diseñada mediante una cuadrícula de tarjetas con foto panorámica (formato 16:9), etiquetas de categoría por colores (`Bautizos`, `Comunidad`, `Discipulado`), insignia `"📷 X fotos"` cuando hay álbum, fecha y una crónica corta.
  - Al hacer clic, abre un modal limpio con **carrusel interactivo y accesible** (hasta 5 fotos, botones táctiles ≥ 44 px, teclado `ArrowLeft`/`ArrowRight`, contador y miniaturas) y la historia completa.
  - Enlace inferior directo al perfil oficial de Instagram de la iglesia para ver más álbumes.
- **Gestión pastoral (Backend y panel `/pagina-publica`):** [HECHO]
  - Soporte mediante las tablas `public_site_settings` y `public_news` (con `image_paths text[]`) y el bucket `public-media` (migraciones `019_public_welcome_page.sql` y `020_public_news_gallery.sql`).
  - Solo el rol `admin` puede crear, editar, publicar/ocultar o archivar estos recuerdos desde `/pagina-publica`, con casilla obligatoria de verificación de privacidad (RGPD y menores), compresión automática en navegador (HTML5 Canvas a WebP ≤ 1600 px) y borrado físico automático de fotos en Storage al archivar, quitar fotos al editar o cancelar.

## 5. Más adelante
- **Ofrendas y diezmos en línea:** solo con proveedor de pagos externo; nunca guardar datos de tarjeta.
- **Ministerios y grupos pequeños:** células, jóvenes, alabanza, con calendario y lista propios.
- **Seguimiento de visitas:** [DESCARTADO POR DECISIÓN DEL PROYECTO] quién vino, quién necesita contacto y cuándo.
- **Informes en PDF** para la directiva: asistencia, finanzas y crecimiento.
- **Cumpleaños y aniversarios:** [DESCARTADO POR DECISIÓN DEL PROYECTO]

## 6. Orden sugerido
1. Exportar y copias de seguridad. [HECHO]
2. Notificaciones y recordatorios.
3. Pantalla de inicio por rol (`/inicio`). [HECHO]
4. Peticiones de oración. [DESCARTADO POR DECISIÓN DEL PROYECTO]
5. Página pública con calendario de solo lectura, "Vida en Oasis" y enlace a Instagram. [HECHO]

## 7. Advertencia sobre lo público
Los datos internos (listas de miembros, ofrendas, turnos) siguen detrás de login y protegidos por RLS. La página pública consulta únicamente las tres vistas públicas (`v_public_events`, `v_public_site_settings`, `v_public_news`) y expone solo lo mínimo.

## 8. Pregunta pendiente [RESUELTA]
¿Los pastores quieren que cualquier persona vea horarios y eventos sin iniciar sesión? **Sí — aprobado, implementado en las Fases P1 a P7 y desplegado en `main`.**
