-- =============================================================================
-- 014 · Métodos de pago y ubicación de fondos en Finanzas
-- Permite distinguir si un ingreso/egreso fue en efectivo, transferencia, Bizum, etc.
-- y en qué cuenta o caja está depositado el dinero.
-- =============================================================================

-- 1. Campos para la tabla de ofrendas/ingresos (offerings)
ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'efectivo',
  ADD COLUMN IF NOT EXISTS fund_account text NOT NULL DEFAULT 'caja_efectivo';

ALTER TABLE public.offerings
  DROP CONSTRAINT IF EXISTS chk_offerings_payment_method,
  ADD CONSTRAINT chk_offerings_payment_method 
    CHECK (payment_method IN ('efectivo', 'transferencia', 'bizum', 'tarjeta', 'otro'));

ALTER TABLE public.offerings
  DROP CONSTRAINT IF EXISTS chk_offerings_fund_account,
  ADD CONSTRAINT chk_offerings_fund_account 
    CHECK (fund_account IN ('caja_efectivo', 'cuenta_bancaria', 'otro'));

-- 2. Campos para la tabla de egresos/gastos (expenses) para saber de dónde salió el dinero
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'efectivo',
  ADD COLUMN IF NOT EXISTS fund_account text NOT NULL DEFAULT 'caja_efectivo';

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS chk_expenses_payment_method,
  ADD CONSTRAINT chk_expenses_payment_method 
    CHECK (payment_method IN ('efectivo', 'transferencia', 'bizum', 'tarjeta', 'otro'));

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS chk_expenses_fund_account,
  ADD CONSTRAINT chk_expenses_fund_account 
    CHECK (fund_account IN ('caja_efectivo', 'cuenta_bancaria', 'otro'));