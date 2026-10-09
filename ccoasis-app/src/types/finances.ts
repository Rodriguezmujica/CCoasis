export type CategoryType = 'ingreso' | 'gasto';

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
  notes: string;
}

export interface ExpenseFormData {
  amount: string | number;
  expense_date: string;
  category_id: string;
  description: string;
  receipt_file: File | null;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  offeringsCount: number;
  expensesCount: number;
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
