-- =============================================================================
-- Centro Cristiano Oasis · Migración 007: Programa de Culto y Turnos de Servidores
-- =============================================================================
-- Objetivo:
-- 1. Crear la tabla public.church_event_assignments para registrar los servidores
--    y roles asignados a cada evento o culto del calendario.
-- 2. Roles eclesiales admitidos:
--    - 'predicacion' : Predicación / Mensaje
--    - 'direccion'   : Dirección del culto / Apertura
--    - 'alabanza'    : Alabanza y Adoración
--    - 'ujier'       : Ujieres / Recepción / Ofrenda
--    - 'ninos'       : Escuela Dominical / Cuidado de niños
--    - 'sonido'      : Sonido / Audiovisuales / Multimedia
-- 3. Habilitar RLS:
--    - SELECT: para todos los usuarios autenticados ('authenticated').
--    - INSERT, UPDATE, DELETE: exclusivo para administradores con public.is_admin().
-- 4. Permitir a todos los usuarios autenticados leer los datos básicos (nombre, apellido)
--    de las personas asignadas a turnos de culto (para que alumnos/tesoreros/maestros
--    puedan ver el nombre del predicador, director, etc. sin restricción de RLS en persons).
-- 5. GRANTs explícitos para authenticated y service_role.
-- =============================================================================

-- 1. CREACIÓN DE LA TABLA church_event_assignments
CREATE TABLE IF NOT EXISTS public.church_event_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.church_events(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.persons(id) ON DELETE RESTRICT,
  role_type text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_church_event_assignment_role_type 
    CHECK (role_type IN ('predicacion', 'direccion', 'alabanza', 'ujier', 'ninos', 'sonido')),
  CONSTRAINT uq_church_event_assignment_event_person_role
    UNIQUE (event_id, person_id, role_type)
);

-- 2. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_church_event_assignments_event_id 
  ON public.church_event_assignments(event_id);

CREATE INDEX IF NOT EXISTS idx_church_event_assignments_person_id 
  ON public.church_event_assignments(person_id);

CREATE INDEX IF NOT EXISTS idx_church_event_assignments_role_type 
  ON public.church_event_assignments(role_type);

-- 3. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.church_event_assignments ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE SEGURIDAD PARA church_event_assignments (Idempotente)
DROP POLICY IF EXISTS "church_event_assignments_select_authenticated" ON public.church_event_assignments;
CREATE POLICY "church_event_assignments_select_authenticated"
  ON public.church_event_assignments
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "church_event_assignments_insert_admin" ON public.church_event_assignments;
CREATE POLICY "church_event_assignments_insert_admin"
  ON public.church_event_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "church_event_assignments_update_admin" ON public.church_event_assignments;
CREATE POLICY "church_event_assignments_update_admin"
  ON public.church_event_assignments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "church_event_assignments_delete_admin" ON public.church_event_assignments;
CREATE POLICY "church_event_assignments_delete_admin"
  ON public.church_event_assignments
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5. POLÍTICA EN public.persons PARA VISIBILIDAD DE SERVIDORES DE TURNO
-- Permite que cualquier usuario autenticado (incluido alumno o tesorero) pueda
-- leer nombre y apellido de las personas que figuran asignadas en eventos eclesiales.
DROP POLICY IF EXISTS "persons_authenticated_read_assigned_servers" ON public.persons;
CREATE POLICY "persons_authenticated_read_assigned_servers"
  ON public.persons
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND
    id IN (SELECT person_id FROM public.church_event_assignments)
  );

-- 6. PERMISOS DE LA API (GRANTs explícitos)
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_event_assignments TO authenticated;
GRANT ALL ON public.church_event_assignments TO service_role;
