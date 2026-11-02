-- =============================================================================
-- 018 · Función de latido (keep-alive) para evitar la pausa por inactividad
-- =============================================================================
-- Crea una función pública y ligera que no expone datos sensibles ni tablas,
-- pero genera actividad en PostgreSQL y PostgREST para mantener activo
-- el proyecto en el plan gratuito de Supabase (evitando la pausa tras 7 días).
-- Idempotente. Ejecutar en el SQL Editor de Supabase.

CREATE OR REPLACE FUNCTION public.keepalive_ping()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT true;
$$;

-- Permisos de ejecución: accesible para anon y authenticated
REVOKE EXECUTE ON FUNCTION public.keepalive_ping() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.keepalive_ping() TO anon, authenticated;

COMMENT ON FUNCTION public.keepalive_ping() IS 'Latido periódico para mantener activo el proyecto Supabase sin exponer datos sensibles.';
