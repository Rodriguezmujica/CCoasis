-- =============================================================================
-- 004 · Conceder permisos al rol service_role en el esquema public
-- =============================================================================
-- Al crearse el proyecto con "Automatically expose new tables" desmarcado,
-- el rol de base de datos 'service_role' (usado por Edge Functions y la clave
-- SUPABASE_SERVICE_ROLE_KEY) requiere concesión explícita de permisos sobre
-- las tablas del esquema public.

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;
