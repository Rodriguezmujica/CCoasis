-- =============================================================================
-- 005 · Políticas de categorías financieras y categorías estándar
-- =============================================================================
-- 1. Ampliar permisos en transaction_categories:
--    En 001_initial_schema.sql, la política 'trans_cat_admin' solo permitía a 'admin'
--    insertar y modificar categorías. Esta migración permite que tanto 'admin' como
--    'tesorero' puedan gestionar las categorías de transacciones.
-- 2. Insertar categorías estándar iniciales si la tabla está vacía o no existen.
-- =============================================================================

-- Actualizar política de gestión de categorías para incluir a tesorero
DROP POLICY IF EXISTS "trans_cat_admin" ON public.transaction_categories;
DROP POLICY IF EXISTS "trans_cat_manage" ON public.transaction_categories;

CREATE POLICY "trans_cat_manage"
  ON public.transaction_categories FOR ALL TO authenticated
  USING (public.is_admin() OR public.has_role('tesorero'))
  WITH CHECK (public.is_admin() OR public.has_role('tesorero'));

-- Categorías estándar iniciales para la iglesia (idempotente)
INSERT INTO public.transaction_categories (name, type)
SELECT default_cats.name, default_cats.type::category_type
FROM (
  VALUES
    ('Diezmos', 'ingreso'),
    ('Ofrenda General', 'ingreso'),
    ('Ofrenda Misionera', 'ingreso'),
    ('Donaciones Especiales', 'ingreso'),
    ('Alquiler de Local', 'gasto'),
    ('Suministros y Servicios', 'gasto'),
    ('Materiales y Ministerios', 'gasto'),
    ('Mantenimiento', 'gasto'),
    ('Ayuda Social / Benevolencia', 'gasto'),
    ('Honorarios y Ministerio', 'gasto')
) AS default_cats(name, type)
WHERE NOT EXISTS (
  SELECT 1 FROM public.transaction_categories tc 
  WHERE tc.name = default_cats.name AND tc.type = default_cats.type::category_type
);
