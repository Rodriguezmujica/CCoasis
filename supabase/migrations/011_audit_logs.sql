-- =============================================================================
-- Centro Cristiano Oasis · Migración 011: Registro de Auditoría de Acciones Sensibles
-- =============================================================================
-- Objetivo:
-- 1. Crear la tabla public.audit_logs para registrar eventos críticos y acciones sensibles
--    (cambios de roles de usuario, eliminación/archivado de personas o eventos,
--    registro o eliminación de gastos y ofrendas en finanzas).
--    - id (uuid primary key default gen_random_uuid())
--    - user_id (uuid references auth.users(id) on delete set null)
--    - user_email (text)
--    - action (text not null, ej: 'CREATE', 'UPDATE', 'DELETE', 'ROLE_CHANGE', 'ARCHIVE')
--    - target_table (text not null, ej: 'expenses', 'offerings', 'persons', 'user_roles', 'church_events')
--    - target_id (text)
--    - details (jsonb default '{}'::jsonb)
--    - created_at (timestamptz not null default now())
-- 2. Índices para consultas por user_id, action, target_table y created_at.
-- 3. Habilitar Row Level Security (RLS) en public.audit_logs.
-- 4. Políticas RLS estrictas e inmutables:
--    - SELECT: Exclusivo para administradores (public.is_admin()).
--    - INSERT: Permitido para usuarios autenticados (TO authenticated).
--    - UPDATE y DELETE: Estrictamente denegados (los registros de auditoría son inmutables).
-- 5. Función auxiliar y triggers automáticos opcionales para capturar cambios directos en BD.
-- 6. GRANTs necesarios para 'authenticated' y 'service_role'.
-- =============================================================================

-- 1. CREACIÓN DE LA TABLA audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. ÍNDICES DE RENDIMIENTO PARA CONSULTAS Y FILTRADO
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target_table
  ON public.audit_logs(target_table);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs(created_at DESC);

-- 3. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE SEGURIDAD (Idempotente)

-- SELECT: Exclusivo para administradores del sistema
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- INSERT: Permitido a usuarios autenticados para que puedan registrar sus acciones sensibles
DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE y DELETE: NO SE CREAN POLÍTICAS PERMISIVAS.
-- Al no existir políticas de UPDATE ni DELETE, cualquier intento de modificar o borrar
-- filas en audit_logs desde la API cliente es rechazado por RLS, asegurando inmutabilidad.

-- 5. FUNCIÓN AUXILIAR SECURITY DEFINER PARA REGISTRO SEGURO DE EVENTOS (Opcional por RPC)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text,
  p_target_table text,
  p_target_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_log_id uuid;
  v_user_email text;
BEGIN
  -- Obtener el correo del usuario actual desde auth.users si existe
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    target_table,
    target_id,
    details,
    created_at
  ) VALUES (
    auth.uid(),
    v_user_email,
    p_action,
    p_target_table,
    p_target_id,
    p_details,
    now()
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- 6. PERMISOS DE LA API (GRANTs explícitos)
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, text, jsonb) TO authenticated, service_role;
