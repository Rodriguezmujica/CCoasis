-- =============================================================================
-- Centro Cristiano Oasis · Database Schema (Fase 1)
-- Stack: Supabase / PostgreSQL (PWA con RLS)
-- VERSIÓN CORREGIDA: probada en PostgreSQL 16 con usuarios de prueba por rol.
-- Se puede ejecutar varias veces sin errores (idempotente).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. EXTENSIONES
-- ---------------------------------------------------------------------------
-- (sin extensiones: gen_random_uuid() es nativo en Postgres 13+)

-- ---------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE person_status AS ENUM ('activo', 'inactivo', 'visita', 'transferido', 'fallecido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'tesorero', 'maestro', 'alumno');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE attendance_mark AS ENUM ('presente', 'ausente', 'justificado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cycle_status AS ENUM ('planificado', 'en_curso', 'cerrado', 'archivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('inscrito', 'completado', 'retirado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('ingreso', 'gasto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. TABLA DE ROLES Y FUNCIONES HELPER (SECURITY DEFINER)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper: verificar si el usuario autenticado tiene un rol específico
CREATE OR REPLACE FUNCTION public.has_role(required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = required_role
  );
$$;

-- Helper: verificar si es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role('admin');
$$;


-- Políticas para user_roles: Solo admin puede ver y modificar roles
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_policy"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. MÓDULO PERSONAS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  birth_date date,
  baptism_date date,
  address text,
  status person_status NOT NULL DEFAULT 'visita',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,

  CONSTRAINT chk_baptism_after_birth
    CHECK (baptism_date IS NULL OR birth_date IS NULL OR baptism_date >= birth_date)
);

-- Email único con soporte para soft-delete
CREATE UNIQUE INDEX IF NOT EXISTS idx_persons_email_unique
  ON public.persons(email)
  WHERE email IS NOT NULL AND deleted_at IS NULL;


CREATE INDEX IF NOT EXISTS idx_persons_status
  ON public.persons(status)
  WHERE deleted_at IS NULL;

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

-- Helper: obtener el person_id asociado al auth.uid() actual
CREATE OR REPLACE FUNCTION public.get_my_person_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.persons
  WHERE user_id = auth.uid() AND deleted_at IS NULL
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- 4. MÓDULO CLASES / DISCIPULADO
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  min_attendance_pct numeric(5,2) NOT NULL DEFAULT 75.00,
  passing_grade numeric(5,2) NOT NULL DEFAULT 70.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  teacher_id uuid NOT NULL REFERENCES public.persons(id) ON DELETE RESTRICT,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  status cycle_status NOT NULL DEFAULT 'planificado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,

  CONSTRAINT chk_cycle_dates
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_cycles_teacher ON public.cycles(teacher_id);
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.cycles(id) ON DELETE RESTRICT,
  person_id uuid NOT NULL REFERENCES public.persons(id) ON DELETE RESTRICT,
  status enrollment_status NOT NULL DEFAULT 'inscrito',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_person ON public.enrollments(person_id);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- HELPERS SECURITY DEFINER (evitan "infinite recursion" entre las políticas
-- de cycles y enrollments: leen las tablas sin pasar por RLS)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_teaching_cycle_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.cycles
  WHERE teacher_id = public.get_my_person_id();
$$;

CREATE OR REPLACE FUNCTION public.my_enrolled_cycle_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cycle_id FROM public.enrollments
  WHERE person_id = public.get_my_person_id();
$$;

CREATE OR REPLACE FUNCTION public.my_enrollment_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.enrollments
  WHERE person_id = public.get_my_person_id();
$$;

CREATE OR REPLACE FUNCTION public.my_student_person_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.person_id FROM public.enrollments e
  JOIN public.cycles c ON c.id = e.cycle_id
  WHERE c.teacher_id = public.get_my_person_id();
$$;

-- Que anon no pueda llamar a estas funciones
REVOKE EXECUTE ON FUNCTION public.my_teaching_cycle_ids(), public.my_enrolled_cycle_ids(),
  public.my_enrollment_ids(), public.my_student_person_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_teaching_cycle_ids(), public.my_enrolled_cycle_ids(),
  public.my_enrollment_ids(), public.my_student_person_ids() TO authenticated;

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  topic text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.persons(id) ON DELETE RESTRICT,
  mark attendance_mark NOT NULL DEFAULT 'ausente',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, person_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Evaluaciones planificadas por ciclo
CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  max_score numeric(5,2) NOT NULL DEFAULT 100.00,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Notas asignadas a inscripciones
CREATE TABLE IF NOT EXISTS public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (evaluation_id, enrollment_id)
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Tareas y Entregas
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  instructions text,
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  file_url text,
  comments text,
  feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  grade numeric(5,2),
  UNIQUE (assignment_id, enrollment_id)
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Materiales didácticos
CREATE TABLE IF NOT EXISTS public.class_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  file_url text,
  external_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. TRIGGER: IMPEDIR MODIFICACIONES EN CICLOS CERRADOS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_cycle_not_closed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_cycle_id uuid;
  v_cycle_status cycle_status;
BEGIN
  IF TG_TABLE_NAME = 'cycles' THEN
    IF OLD.status = 'cerrado' AND (NEW.status = 'cerrado' OR NEW.status IS NOT DISTINCT FROM OLD.status) THEN
      RAISE EXCEPTION 'No se pueden modificar datos de un ciclo cerrado.';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'sessions' OR TG_TABLE_NAME = 'evaluations' OR TG_TABLE_NAME = 'assignments' OR TG_TABLE_NAME = 'class_materials' THEN
    target_cycle_id := COALESCE(NEW.cycle_id, OLD.cycle_id);
  ELSIF TG_TABLE_NAME = 'attendance' THEN
    SELECT cycle_id INTO target_cycle_id FROM public.sessions WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  ELSIF TG_TABLE_NAME = 'grades' THEN
    SELECT cycle_id INTO target_cycle_id FROM public.evaluations WHERE id = COALESCE(NEW.evaluation_id, OLD.evaluation_id);
  END IF;

  IF target_cycle_id IS NOT NULL THEN
    SELECT status INTO v_cycle_status FROM public.cycles WHERE id = target_cycle_id;
    IF v_cycle_status = 'cerrado' THEN
      RAISE EXCEPTION 'Operación rechazada: El ciclo correspondiente está cerrado.';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_cycle_closed_sessions ON public.sessions;
CREATE TRIGGER trg_cycle_closed_sessions
  BEFORE INSERT OR UPDATE OR DELETE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.check_cycle_not_closed();

DROP TRIGGER IF EXISTS trg_cycle_closed_attendance ON public.attendance;
CREATE TRIGGER trg_cycle_closed_attendance
  BEFORE INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.check_cycle_not_closed();

DROP TRIGGER IF EXISTS trg_cycle_closed_evaluations ON public.evaluations;
CREATE TRIGGER trg_cycle_closed_evaluations
  BEFORE INSERT OR UPDATE OR DELETE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.check_cycle_not_closed();

DROP TRIGGER IF EXISTS trg_cycle_closed_grades ON public.grades;
CREATE TRIGGER trg_cycle_closed_grades
  BEFORE INSERT OR UPDATE OR DELETE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.check_cycle_not_closed();

-- ---------------------------------------------------------------------------
-- 6. VISTA: CÁLCULO DINÁMICO DE NOTAS Y APROBACIÓN
-- security_invoker = true => la vista respeta RLS del usuario que la consulta
-- (sin esto, cualquiera, incluso sin login, vería las notas de todos).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_cycle_grades_summary
WITH (security_invoker = true) AS
WITH eval_summary AS (
  SELECT
    e.id AS enrollment_id,
    c.id AS cycle_id,
    co.passing_grade,
    co.min_attendance_pct,
    -- Nota normalizada a escala 0-100 según el máximo de cada evaluación
    COALESCE(AVG(g.score / NULLIF(ev.max_score, 0) * 100), 0) AS average_grade
  FROM public.enrollments e
  JOIN public.cycles c ON c.id = e.cycle_id
  JOIN public.courses co ON co.id = c.course_id
  LEFT JOIN public.evaluations ev ON ev.cycle_id = c.id
  LEFT JOIN public.grades g ON g.evaluation_id = ev.id AND g.enrollment_id = e.id
  GROUP BY e.id, c.id, co.passing_grade, co.min_attendance_pct
),
att_summary AS (
  SELECT
    e.id AS enrollment_id,
    COUNT(s.id) AS total_sessions,
    COUNT(CASE WHEN a.mark = 'presente' THEN 1 END) AS attended_sessions,
    CASE
      WHEN COUNT(s.id) = 0 THEN 100.00
      ELSE ROUND((COUNT(CASE WHEN a.mark = 'presente' THEN 1 END)::numeric / COUNT(s.id)::numeric) * 100, 2)
    END AS attendance_percentage
  FROM public.enrollments e
  LEFT JOIN public.sessions s ON s.cycle_id = e.cycle_id
  LEFT JOIN public.attendance a ON a.session_id = s.id AND a.person_id = e.person_id
  GROUP BY e.id
)
SELECT
  es.enrollment_id,
  es.cycle_id,
  ROUND(es.average_grade, 2) AS average_grade,
  COALESCE(ats.attendance_percentage, 100.00) AS attendance_percentage,
  (es.average_grade >= es.passing_grade AND COALESCE(ats.attendance_percentage, 100.00) >= es.min_attendance_pct) AS passed
FROM eval_summary es
LEFT JOIN att_summary ats ON ats.enrollment_id = es.enrollment_id;

-- Solo usuarios con sesión pueden consultarla
REVOKE ALL ON public.v_cycle_grades_summary FROM PUBLIC, anon;
GRANT SELECT ON public.v_cycle_grades_summary TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. MÓDULO FINANZAS BÁSICAS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.transaction_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type category_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES public.persons(id) ON DELETE SET NULL, -- Opcional / anónimo
  category_id uuid NOT NULL REFERENCES public.transaction_categories(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'EUR',
  offering_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offerings_person ON public.offerings(person_id);
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.transaction_categories(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'EUR',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 8. POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------

-- --- PERSONS ---
DROP POLICY IF EXISTS "persons_admin_all" ON public.persons;
CREATE POLICY "persons_admin_all"
  ON public.persons FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "persons_tesorero_read" ON public.persons;
CREATE POLICY "persons_tesorero_read"
  ON public.persons FOR SELECT TO authenticated
  USING (public.has_role('tesorero') AND deleted_at IS NULL);

DROP POLICY IF EXISTS "persons_maestro_read_students" ON public.persons;
CREATE POLICY "persons_maestro_read_students"
  ON public.persons FOR SELECT TO authenticated
  USING (
    public.has_role('maestro') AND deleted_at IS NULL AND (
      id = public.get_my_person_id() OR
      id IN (SELECT public.my_student_person_ids())
    )
  );

DROP POLICY IF EXISTS "persons_self_read_and_update" ON public.persons;
CREATE POLICY "persons_self_read_and_update"
  ON public.persons FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "persons_self_update" ON public.persons;
CREATE POLICY "persons_self_update"
  ON public.persons FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-- --- COURSES & CYCLES ---
DROP POLICY IF EXISTS "courses_read_policy" ON public.courses;
CREATE POLICY "courses_read_policy"
  ON public.courses FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "courses_admin_manage" ON public.courses;
CREATE POLICY "courses_admin_manage"
  ON public.courses FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "cycles_read_policy" ON public.cycles;
CREATE POLICY "cycles_read_policy"
  ON public.cycles FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    teacher_id = public.get_my_person_id() OR
    id IN (SELECT public.my_enrolled_cycle_ids())
  );

DROP POLICY IF EXISTS "cycles_admin_manage" ON public.cycles;
CREATE POLICY "cycles_admin_manage"
  ON public.cycles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- ENROLLMENTS ---
DROP POLICY IF EXISTS "enrollments_read_policy" ON public.enrollments;
CREATE POLICY "enrollments_read_policy"
  ON public.enrollments FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    person_id = public.get_my_person_id() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids())
  );

DROP POLICY IF EXISTS "enrollments_admin_manage" ON public.enrollments;
CREATE POLICY "enrollments_admin_manage"
  ON public.enrollments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "enrollments_teacher_manage" ON public.enrollments;
CREATE POLICY "enrollments_teacher_manage"
  ON public.enrollments FOR ALL TO authenticated
  USING (cycle_id IN (SELECT public.my_teaching_cycle_ids()))
  WITH CHECK (cycle_id IN (SELECT public.my_teaching_cycle_ids()));

-- --- SESSIONS & ATTENDANCE ---
DROP POLICY IF EXISTS "sessions_read_policy" ON public.sessions;
CREATE POLICY "sessions_read_policy"
  ON public.sessions FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids()) OR
    cycle_id IN (SELECT public.my_enrolled_cycle_ids())
  );

DROP POLICY IF EXISTS "sessions_teacher_admin_manage" ON public.sessions;
CREATE POLICY "sessions_teacher_admin_manage"
  ON public.sessions FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids())
  )
  WITH CHECK (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids())
  );

DROP POLICY IF EXISTS "attendance_read_policy" ON public.attendance;
CREATE POLICY "attendance_read_policy"
  ON public.attendance FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    person_id = public.get_my_person_id() OR
    session_id IN (SELECT s.id FROM public.sessions s WHERE s.cycle_id IN (SELECT public.my_teaching_cycle_ids()))
  );

DROP POLICY IF EXISTS "attendance_teacher_admin_manage" ON public.attendance;
CREATE POLICY "attendance_teacher_admin_manage"
  ON public.attendance FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    session_id IN (SELECT s.id FROM public.sessions s WHERE s.cycle_id IN (SELECT public.my_teaching_cycle_ids()))
  )
  WITH CHECK (
    public.is_admin() OR
    session_id IN (SELECT s.id FROM public.sessions s WHERE s.cycle_id IN (SELECT public.my_teaching_cycle_ids()))
  );

-- --- EVALUATIONS & GRADES ---
DROP POLICY IF EXISTS "evaluations_read_policy" ON public.evaluations;
CREATE POLICY "evaluations_read_policy"
  ON public.evaluations FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids()) OR
    cycle_id IN (SELECT public.my_enrolled_cycle_ids())
  );

DROP POLICY IF EXISTS "evaluations_teacher_admin_manage" ON public.evaluations;
CREATE POLICY "evaluations_teacher_admin_manage"
  ON public.evaluations FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids())
  )
  WITH CHECK (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids())
  );

DROP POLICY IF EXISTS "grades_read_policy" ON public.grades;
CREATE POLICY "grades_read_policy"
  ON public.grades FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    enrollment_id IN (SELECT public.my_enrollment_ids()) OR
    evaluation_id IN (SELECT e.id FROM public.evaluations e WHERE e.cycle_id IN (SELECT public.my_teaching_cycle_ids()))
  );

DROP POLICY IF EXISTS "grades_teacher_admin_manage" ON public.grades;
CREATE POLICY "grades_teacher_admin_manage"
  ON public.grades FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    evaluation_id IN (SELECT e.id FROM public.evaluations e WHERE e.cycle_id IN (SELECT public.my_teaching_cycle_ids()))
  )
  WITH CHECK (
    public.is_admin() OR
    evaluation_id IN (SELECT e.id FROM public.evaluations e WHERE e.cycle_id IN (SELECT public.my_teaching_cycle_ids()))
  );

-- --- ASSIGNMENTS & SUBMISSIONS ---
DROP POLICY IF EXISTS "assignments_read_policy" ON public.assignments;
CREATE POLICY "assignments_read_policy"
  ON public.assignments FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids()) OR
    cycle_id IN (SELECT public.my_enrolled_cycle_ids())
  );

DROP POLICY IF EXISTS "assignments_teacher_admin_manage" ON public.assignments;
CREATE POLICY "assignments_teacher_admin_manage"
  ON public.assignments FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids())
  )
  WITH CHECK (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids())
  );

DROP POLICY IF EXISTS "submissions_read_policy" ON public.assignment_submissions;
CREATE POLICY "submissions_read_policy"
  ON public.assignment_submissions FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    enrollment_id IN (SELECT public.my_enrollment_ids()) OR
    assignment_id IN (SELECT a.id FROM public.assignments a WHERE a.cycle_id IN (SELECT public.my_teaching_cycle_ids()))
  );

DROP POLICY IF EXISTS "submissions_student_insert" ON public.assignment_submissions;
CREATE POLICY "submissions_student_insert"
  ON public.assignment_submissions FOR INSERT TO authenticated
  WITH CHECK (
    enrollment_id IN (SELECT public.my_enrollment_ids())
    AND EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.enrollments e ON e.cycle_id = a.cycle_id
      WHERE a.id = assignment_submissions.assignment_id
        AND e.id = assignment_submissions.enrollment_id
    )
  );

DROP POLICY IF EXISTS "submissions_update_policy" ON public.assignment_submissions;
CREATE POLICY "submissions_update_policy"
  ON public.assignment_submissions FOR UPDATE TO authenticated
  USING (
    enrollment_id IN (SELECT public.my_enrollment_ids()) OR
    assignment_id IN (SELECT a.id FROM public.assignments a WHERE a.cycle_id IN (SELECT public.my_teaching_cycle_ids())) OR
    public.is_admin()
  )
  WITH CHECK (
    enrollment_id IN (SELECT public.my_enrollment_ids()) OR
    assignment_id IN (SELECT a.id FROM public.assignments a WHERE a.cycle_id IN (SELECT public.my_teaching_cycle_ids())) OR
    public.is_admin()
  );

-- --- CLASS MATERIALS ---
DROP POLICY IF EXISTS "materials_read_policy" ON public.class_materials;
CREATE POLICY "materials_read_policy"
  ON public.class_materials FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids()) OR
    cycle_id IN (SELECT public.my_enrolled_cycle_ids())
  );

DROP POLICY IF EXISTS "materials_teacher_admin_manage" ON public.class_materials;
CREATE POLICY "materials_teacher_admin_manage"
  ON public.class_materials FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids())
  )
  WITH CHECK (
    public.is_admin() OR
    cycle_id IN (SELECT public.my_teaching_cycle_ids())
  );

-- --- FINANZAS (TRANSACTION CATEGORIES, OFFERINGS, EXPENSES) ---
DROP POLICY IF EXISTS "trans_cat_read" ON public.transaction_categories;
CREATE POLICY "trans_cat_read"
  ON public.transaction_categories FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_role('tesorero'));

DROP POLICY IF EXISTS "trans_cat_admin" ON public.transaction_categories;
CREATE POLICY "trans_cat_admin"
  ON public.transaction_categories FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "offerings_admin_tesorero_all" ON public.offerings;
CREATE POLICY "offerings_admin_tesorero_all"
  ON public.offerings FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_role('tesorero'))
  WITH CHECK (public.is_admin() OR public.has_role('tesorero'));

DROP POLICY IF EXISTS "offerings_self_read" ON public.offerings;
CREATE POLICY "offerings_self_read"
  ON public.offerings FOR SELECT TO authenticated
  USING (person_id IS NOT NULL AND person_id = public.get_my_person_id());

DROP POLICY IF EXISTS "expenses_admin_tesorero_all" ON public.expenses;
CREATE POLICY "expenses_admin_tesorero_all"
  ON public.expenses FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_role('tesorero'))
  WITH CHECK (public.is_admin() OR public.has_role('tesorero'));

-- ---------------------------------------------------------------------------
-- 9. SUPABASE STORAGE
-- Convención de rutas:
--   materials/<cycle_id>/<archivo>
--   assignments/<auth_user_id>/<assignment_id>/<archivo>
--   receipts/<cualquier-ruta>
-- Límites de tamaño y tipos de archivo: configúralos en el panel del bucket.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES
  ('materials', 'materials', false),
  ('assignments', 'assignments', false),
  ('receipts', 'receipts', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- materials: ve el material quien está inscrito o enseña ese ciclo (o admin)
DROP POLICY IF EXISTS "storage_materials_select" ON storage.objects;
CREATE POLICY "storage_materials_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'materials' AND (
      public.is_admin() OR
      (storage.foldername(name))[1] IN (SELECT c::text FROM public.my_enrolled_cycle_ids() c) OR
      (storage.foldername(name))[1] IN (SELECT c::text FROM public.my_teaching_cycle_ids() c)
    )
  );

-- materials: solo admin o el maestro de ESE ciclo suben, reemplazan o borran
DROP POLICY IF EXISTS "storage_materials_write" ON storage.objects;
CREATE POLICY "storage_materials_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'materials' AND (
      public.is_admin() OR
      (storage.foldername(name))[1] IN (SELECT c::text FROM public.my_teaching_cycle_ids() c)
    )
  );

DROP POLICY IF EXISTS "storage_materials_update" ON storage.objects;
CREATE POLICY "storage_materials_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'materials' AND (
      public.is_admin() OR
      (storage.foldername(name))[1] IN (SELECT c::text FROM public.my_teaching_cycle_ids() c)
    )
  );

DROP POLICY IF EXISTS "storage_materials_delete" ON storage.objects;
CREATE POLICY "storage_materials_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'materials' AND (
      public.is_admin() OR
      (storage.foldername(name))[1] IN (SELECT c::text FROM public.my_teaching_cycle_ids() c)
    )
  );

-- assignments: el alumno ve/sube lo suyo; el maestro solo las entregas de SUS tareas
DROP POLICY IF EXISTS "storage_assignments_select" ON storage.objects;
CREATE POLICY "storage_assignments_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'assignments' AND (
      public.is_admin() OR
      (storage.foldername(name))[1] = auth.uid()::text OR
      (storage.foldername(name))[2] IN (
        SELECT a.id::text FROM public.assignments a
        WHERE a.cycle_id IN (SELECT public.my_teaching_cycle_ids())
      )
    )
  );

DROP POLICY IF EXISTS "storage_assignments_insert" ON storage.objects;
CREATE POLICY "storage_assignments_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assignments' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "storage_assignments_update" ON storage.objects;
CREATE POLICY "storage_assignments_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'assignments' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "storage_assignments_delete" ON storage.objects;
CREATE POLICY "storage_assignments_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'assignments' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()
    )
  );

-- receipts: solo admin y tesorero
DROP POLICY IF EXISTS "storage_receipts_access" ON storage.objects;
CREATE POLICY "storage_receipts_access"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'receipts' AND (public.is_admin() OR public.has_role('tesorero'))
  )
  WITH CHECK (
    bucket_id = 'receipts' AND (public.is_admin() OR public.has_role('tesorero'))
  );

-- ---------------------------------------------------------------------------
-- 9b. TRIGGERS DE INTEGRIDAD
-- ---------------------------------------------------------------------------

-- Un usuario normal no puede cambiar campos sensibles de su propia ficha
CREATE OR REPLACE FUNCTION public.guard_person_self_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.user_id := OLD.user_id;
    NEW.status := OLD.status;
    NEW.deleted_at := OLD.deleted_at;
    NEW.notes := OLD.notes;
    NEW.baptism_date := OLD.baptism_date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_person_self_update ON public.persons;
CREATE TRIGGER trg_guard_person_self_update
  BEFORE UPDATE ON public.persons
  FOR EACH ROW EXECUTE FUNCTION public.guard_person_self_update();

-- Solo el maestro del ciclo (o admin) puede poner nota/comentarios en una entrega
CREATE OR REPLACE FUNCTION public.guard_submission_grading()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  can_grade boolean;
BEGIN
  can_grade := public.is_admin() OR NEW.assignment_id IN (
    SELECT a.id FROM public.assignments a
    WHERE a.cycle_id IN (SELECT public.my_teaching_cycle_ids())
  );
  IF NOT can_grade THEN
    IF TG_OP = 'INSERT' THEN
      NEW.grade := NULL;
      NEW.feedback := NULL;
    ELSE
      NEW.grade := OLD.grade;
      NEW.feedback := OLD.feedback;
      NEW.assignment_id := OLD.assignment_id;
      NEW.enrollment_id := OLD.enrollment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_submission_grading ON public.assignment_submissions;
CREATE TRIGGER trg_guard_submission_grading
  BEFORE INSERT OR UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.guard_submission_grading();

-- Solo se puede inscribir a personas activas o visitas
CREATE OR REPLACE FUNCTION public.check_enrollment_person_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status person_status;
BEGIN
  SELECT status INTO v_status FROM public.persons
  WHERE id = NEW.person_id AND deleted_at IS NULL;
  IF v_status IS NULL OR v_status NOT IN ('activo', 'visita') THEN
    RAISE EXCEPTION 'Solo se puede inscribir a personas con estado activo o visita.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrollment_person_status ON public.enrollments;
CREATE TRIGGER trg_enrollment_person_status
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.check_enrollment_person_status();

-- La nota debe estar entre 0 y el máximo de la evaluación
CREATE OR REPLACE FUNCTION public.check_grade_range()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_max numeric;
BEGIN
  SELECT max_score INTO v_max FROM public.evaluations WHERE id = NEW.evaluation_id;
  IF NEW.score < 0 OR NEW.score > v_max THEN
    RAISE EXCEPTION 'La nota debe estar entre 0 y %.', v_max;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_grade_range ON public.grades;
CREATE TRIGGER trg_check_grade_range
  BEFORE INSERT OR UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.check_grade_range();

-- updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['persons','courses','cycles','enrollments','sessions','attendance',
                           'evaluations','grades','assignments','offerings','expenses']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 10. INSTRUCCIÓN DE INICIALIZACIÓN (PRIMER SUPER ADMIN)
-- ---------------------------------------------------------------------------
-- Ejecutar en Supabase SQL Editor una sola vez tras registrar el primer usuario:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('<UUID_DEL_PRIMER_USUARIO_EN_AUTH_USERS>', 'admin');

-- ---------------------------------------------------------------------------
-- 11. PERMISOS DE LA API (GRANTs)
-- Necesario porque el proyecto se crea con "Automatically expose new tables"
-- DESMARCADO (recomendado): las tablas no son accesibles desde la API hasta que
-- se concede acceso explícitamente. RLS sigue decidiendo QUÉ filas ve cada rol.
-- El rol anónimo (anon) no recibe nada: sin login no se accede a ningún dato.
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- La vista es solo de lectura
REVOKE INSERT, UPDATE, DELETE ON public.v_cycle_grades_summary FROM authenticated;
