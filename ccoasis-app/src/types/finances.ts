export type CategoryType = 'ingreso' | 'gasto';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'bizum' | 'tarjeta' | 'otro';
export type FundAccount = 'caja_efectivo' | 'cuenta_bancaria' | 'otro';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  bizum: 'Bizum',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};

export const PAYMENT_METHOD_SHORT_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transf.',
  bizum: 'Bizum',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};

export const FUND_ACCOUNT_LABELS: Record<FundAccount, string> = {
  caja_efectivo: 'Caja en Efectivo',
  cuenta_bancaria: 'Cuenta Bancaria',
  otro: 'Otro',
};

export const FUND_ACCOUNT_SHORT_LABELS: Record<FundAccount, string> = {
  caja_efectivo: 'Caja',
  cuenta_bancaria: 'Banco',
  otro: 'Otro',
};

export interface TransactionCategory {
  id: string;
  name: string;
  type: CategoryType;
  created_at: string;
}

export interface Offering {
  id: string;
  person_id: string | null;
  category_id: string;
  amount: number;
  currency: string;
  offering_date: string;
  payment_method: PaymentMethod;
  fund_account: FundAccount;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: TransactionCategory;
  person?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface Expense {
  id: string;
  category_id: string;
  amount: number;
  currency: string;
  expense_date: string;
  payment_method: PaymentMethod;
  fund_account: FundAccount;
  receipt_url: string | null;
  description: string;
  created_at: string;
  updated_at: string;
  category?: TransactionCategory;
}

export interface OfferingFormData {
  amount: string | number;
  offering_date: string;
  category_id: string;
  person_id: string | null;
  payment_method: PaymentMethod;
  fund_account: FundAccount;
  notes: string;
}

export interface ExpenseFormData {
  amount: string | number;
  expense_date: string;
  category_id: string;
  payment_method: PaymentMethod;
  fund_account: FundAccount;
  description: string;
  receipt_file: File | null;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  offeringsCount: number;
  expensesCount: number;
  cashIncome: number;
  cashExpenses: number;
  cashBalance: number;
  bankIncome: number;
  bankExpenses: number;
  bankBalance: number;
}

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
