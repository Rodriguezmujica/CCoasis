-- =============================================================================
-- Centro Cristiano Oasis · Migración 010: Notificaciones y Alertas Internas
-- =============================================================================
-- Objetivo:
-- 1. Crear la tabla public.user_notifications para almacenar las notificaciones
--    individuales de cada usuario con su estado de lectura independiente (read_at):
--    - id (uuid primary key default gen_random_uuid())
--    - user_id (uuid not null references auth.users(id) on delete cascade)
--    - title (text not null)
--    - message (text not null)
--    - type (text not null default 'info' check (type in ('info', 'anuncio', 'turno', 'alerta')))
--    - link_url (text, ej: '/calendario' o '/')
--    - read_at (timestamptz)
--    - created_at (timestamptz not null default now())
-- 2. Índices para consultas ágiles por usuario, estado de lectura y orden cronológico.
-- 3. Habilitar Row Level Security (RLS) en public.user_notifications.
-- 4. Políticas de seguridad idempotentes:
--    - SELECT, UPDATE, DELETE: exclusivamente para el dueño (auth.uid() = user_id).
--    - INSERT: para el propio usuario o administradores (public.is_admin()).
-- 5. Triggers automáticos en base de datos:
--    a) trg_notify_announcement_created: Notifica a todos los usuarios cuando se publica
--       un aviso general con prioridad 'importante' o 'urgente'.
--    b) trg_notify_event_assignment: Notifica automáticamente al usuario vinculado a la
--       persona asignada a un turno de culto/evento en church_event_assignments.
-- 6. Inclusión en la publicación supabase_realtime para soporte reactivo en tiempo real.
-- 7. GRANTs necesarios para 'authenticated' y 'service_role'.
-- =============================================================================

-- 1. CREACIÓN DE LA TABLA user_notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_user_notifications_type
    CHECK (type IN ('info', 'anuncio', 'turno', 'alerta'))
);

-- 2. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id
  ON public.user_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
  ON public.user_notifications(user_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at
  ON public.user_notifications(user_id, created_at DESC);

-- 3. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE SEGURIDAD (Idempotente)

-- SELECT: El usuario solo puede consultar sus propias notificaciones
DROP POLICY IF EXISTS "user_notifications_select_owner" ON public.user_notifications;
CREATE POLICY "user_notifications_select_owner"
  ON public.user_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- UPDATE: El usuario puede modificar exclusivamente sus notificaciones (ej: marcar como leída)
DROP POLICY IF EXISTS "user_notifications_update_owner" ON public.user_notifications;
CREATE POLICY "user_notifications_update_owner"
  ON public.user_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: El usuario puede borrar sus notificaciones
DROP POLICY IF EXISTS "user_notifications_delete_owner" ON public.user_notifications;
CREATE POLICY "user_notifications_delete_owner"
  ON public.user_notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Permitir insertar si el registro pertenece al usuario o si quien inserta es administrador
DROP POLICY IF EXISTS "user_notifications_insert_owner_or_admin" ON public.user_notifications;
CREATE POLICY "user_notifications_insert_owner_or_admin"
  ON public.user_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 5. TRIGGERS AUTOMÁTICOS PARA GENERAR NOTIFICACIONES

-- A. Trigger para Avisos Importantes o Urgentes
CREATE OR REPLACE FUNCTION public.trg_notify_announcement_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_prefix text;
BEGIN
  -- Verificar que el anuncio esté activo, no eliminado y tenga prioridad 'importante' o 'urgente'
  IF NEW.deleted_at IS NULL AND NEW.is_active = true AND NEW.priority IN ('importante', 'urgente') THEN
    -- En inserción, o en actualización si antes no estaba activo, estaba borrado o cambió de 'normal' a alta prioridad
    IF TG_OP = 'INSERT' OR (
      TG_OP = 'UPDATE' AND (
        OLD.is_active = false
        OR OLD.deleted_at IS NOT NULL
        OR (OLD.priority = 'normal' AND NEW.priority IN ('importante', 'urgente'))
      )
    ) THEN
      v_prefix := CASE WHEN NEW.priority = 'urgente' THEN '🚨 Aviso urgente: ' ELSE '📢 Aviso importante: ' END;

      -- Notificar a todos los usuarios con roles en la aplicación
      INSERT INTO public.user_notifications (user_id, title, message, type, link_url, created_at)
      SELECT DISTINCT ur.user_id,
             v_prefix || NEW.title,
             NEW.message,
             'anuncio',
             '/',
             now()
      FROM public.user_roles ur
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_announcement_after_insert_update ON public.announcements;
CREATE TRIGGER trg_notify_announcement_after_insert_update
  AFTER INSERT OR UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_announcement_created();

-- B. Trigger para Asignación de Turnos de Servidores (Liderazgo)
CREATE OR REPLACE FUNCTION public.trg_notify_event_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_event_title text;
  v_start_time timestamptz;
  v_role_label text;
  v_date_str text;
BEGIN
  -- 1. Buscar si la persona asignada tiene una cuenta vinculada en persons.user_id
  SELECT user_id INTO v_user_id
  FROM public.persons
  WHERE id = NEW.person_id AND deleted_at IS NULL;

  -- 2. Si tiene cuenta vinculada, obtener datos del evento y generar la notificación
  IF v_user_id IS NOT NULL THEN
    SELECT title, start_time INTO v_event_title, v_start_time
    FROM public.church_events
    WHERE id = NEW.event_id AND deleted_at IS NULL;

    IF v_event_title IS NOT NULL THEN
      -- Mapeo legible del rol eclesial
      v_role_label := CASE NEW.role_type
        WHEN 'predicacion' THEN 'Predicación / Mensaje'
        WHEN 'direccion'   THEN 'Dirección del culto'
        WHEN 'alabanza'    THEN 'Alabanza y Adoración'
        WHEN 'ujier'       THEN 'Ujieres / Recepción'
        WHEN 'ninos'       THEN 'Escuela Dominical / Niños'
        WHEN 'sonido'      THEN 'Sonido / Multimedia'
        ELSE NEW.role_type
      END;

      -- Formatear fecha y hora para lectura cómoda
      v_date_str := to_char(v_start_time AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI');

      INSERT INTO public.user_notifications (user_id, title, message, type, link_url, created_at)
      VALUES (
        v_user_id,
        'Turno asignado: ' || v_role_label,
        'Has sido asignado/a para ' || v_role_label || ' en el evento "' || v_event_title || '" (' || v_date_str || ' hs).',
        'turno',
        '/calendario',
        now()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_event_assignment_after_insert ON public.church_event_assignments;
CREATE TRIGGER trg_notify_event_assignment_after_insert
  AFTER INSERT ON public.church_event_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_event_assignment();

-- 6. SUSCRIPCIÓN EN SUPABASE REALTIME (Idempotente)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END;
$$;

-- 7. PERMISOS DE LA API (GRANTs explícitos)
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;

-- 8. CORRECCIÓN DE POLÍTICA SELECT EN announcements (Soporte soft-delete y administración)
-- Permite que los administradores lean todas las filas (incluidas las archivadas con deleted_at IS NOT NULL),
-- evitando que el UPDATE de archivado (soft-delete) sea bloqueado por RLS en PostgREST.
DROP POLICY IF EXISTS "announcements_select_authenticated" ON public.announcements;
CREATE POLICY "announcements_select_authenticated"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      deleted_at IS NULL
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

