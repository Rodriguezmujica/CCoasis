import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from './supabase';
import {
  Offering,
  Expense,
  TransactionCategory,
  OfferingFormData,
  ExpenseFormData,
  FinancialSummary,
  CategoryType,
  MONTH_NAMES,
} from '../types/finances';
import { logAuditEvent } from './useAuditLogs';

/** Formateador de moneda en EUR (€) con formato regional es-ES */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Formateador de fecha corta en español (ej: "15 oct. 2026") */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '—';
  // Parsear 'YYYY-MM-DD'
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function parseFinancesError(error: any): string {
  const msg: string = error?.message || error?.details || String(error);

  if (msg.includes('foreign key constraint') || msg.includes('violates foreign key')) {
    return 'No se puede eliminar esta categoría porque ya tiene ofrendas o gastos vinculados.';
  }
  if (msg.includes('check constraint') && msg.includes('amount')) {
    return 'El monto debe ser mayor que 0,00 €.';
  }
  if (msg.includes('row-level security') || msg.includes('violates row-level security')) {
    return 'No tienes permisos suficientes para realizar esta operación.';
  }
  if (msg.includes('storage') || msg.includes('Bucket')) {
    return `Error en el almacenamiento de comprobantes: ${msg}`;
  }
  return msg || 'Ocurrió un error inesperado al procesar la operación.';
}

export interface PersonOption {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

export function useFinances() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [persons, setPersons] = useState<PersonOption[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Calcular rango de fechas para el periodo seleccionado
  const dateRange = useMemo(() => {
    if (selectedMonth === 0) {
      // Todo el año
      return {
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
      };
    }
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    return {
      startDate: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
      endDate: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }, [selectedMonth, selectedYear]);

  // Cargar categorías y personas (datos comunes)
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      // Categorías
      const { data: catData, error: catErr } = await supabase
        .from('transaction_categories')
        .select('*')
        .order('name', { ascending: true });

      if (catErr) throw catErr;

      // Personas para donantes
      const { data: persData, error: persErr } = await supabase
        .from('persons')
        .select('id, first_name, last_name, status')
        .is('deleted_at', null)
        .order('first_name', { ascending: true });

      if (persErr) throw persErr;

      if (mountedRef.current) {
        setCategories(catData || []);
        setPersons(persData || []);
      }
    } catch (err: any) {
      console.error('Error cargando datos auxiliares:', err);
    }
  }, []);

  // Cargar transacciones del periodo
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = dateRange;

      // 1. Cargar ofrendas con categoría y persona
      const { data: offData, error: offErr } = await supabase
        .from('offerings')
        .select('*, category:transaction_categories(id, name, type), person:persons(id, first_name, last_name)')
        .gte('offering_date', startDate)
        .lte('offering_date', endDate)
        .order('offering_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (offErr) throw offErr;

      // 2. Cargar gastos con categoría
      const { data: expData, error: expErr } = await supabase
        .from('expenses')
        .select('*, category:transaction_categories(id, name, type)')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (expErr) throw expErr;

      if (mountedRef.current) {
        setOfferings(offData || []);
        setExpenses(expData || []);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(parseFinancesError(err));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [dateRange]);

  // Carga inicial y cuando cambia el periodo
  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Resumen calculado del periodo
  const summary: FinancialSummary = useMemo(() => {
    const totalIncome = offerings.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      offeringsCount: offerings.length,
      expensesCount: expenses.length,
    };
  }, [offerings, expenses]);

  // Crear ofrenda
  const createOffering = async (data: OfferingFormData): Promise<{ ok: boolean; error?: string }> => {
    try {
      const numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return { ok: false, error: 'Introduce un monto válido mayor a 0,00 €.' };
      }
      if (!data.category_id) {
        return { ok: false, error: 'Debes seleccionar una categoría de ingreso.' };
      }
      if (!data.offering_date) {
        return { ok: false, error: 'Debes indicar una fecha válida.' };
      }

      const { data: insData, error: insErr } = await supabase.from('offerings').insert({
        amount: numAmount,
        currency: 'EUR',
        offering_date: data.offering_date,
        category_id: data.category_id,
        person_id: data.person_id || null,
        notes: data.notes?.trim() || null,
      }).select('id').single();

      if (insErr) throw insErr;

      // Registrar auditoría de ofrenda
      logAuditEvent('CREATE', 'offerings', insData?.id || null, {
        amount: numAmount,
        currency: 'EUR',
        offering_date: data.offering_date,
        category_id: data.category_id,
        person_id: data.person_id || null,
      });

      await fetchTransactions();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: parseFinancesError(err) };
    }
  };

  // Eliminar ofrenda
  const deleteOffering = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const offeringToDelete = offerings.find((o) => o.id === id);
      const { error: delErr } = await supabase.from('offerings').delete().eq('id', id);
      if (delErr) throw delErr;

      // Registrar auditoría de eliminación de ofrenda
      logAuditEvent('DELETE', 'offerings', id, {
        amount: offeringToDelete?.amount,
        offering_date: offeringToDelete?.offering_date,
        category_id: offeringToDelete?.category_id,
      });

      await fetchTransactions();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: parseFinancesError(err) };
    }
  };

  // Crear gasto con comprobante opcional en bucket receipts
  const createExpense = async (data: ExpenseFormData): Promise<{ ok: boolean; error?: string }> => {
    let uploadedFilePath: string | null = null;
    try {
      const numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return { ok: false, error: 'Introduce un monto válido mayor a 0,00 €.' };
      }
      if (!data.description || data.description.trim() === '') {
        return { ok: false, error: 'El concepto o descripción del gasto es obligatorio.' };
      }
      if (!data.category_id) {
        return { ok: false, error: 'Debes seleccionar una categoría de gasto.' };
      }
      if (!data.expense_date) {
        return { ok: false, error: 'Debes indicar una fecha válida.' };
      }

      // Si hay archivo comprobante, subirlo al bucket 'receipts'
      if (data.receipt_file) {
        const file = data.receipt_file;
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const expenseYear = data.expense_date.split('-')[0] || String(selectedYear);
        const filePath = `${expenseYear}/${Date.now()}_${sanitizedName}`;

        const { error: uploadErr } = await supabase.storage
          .from('receipts')
          .upload(filePath, file, {
            upsert: false,
          });

        if (uploadErr) {
          return { ok: false, error: `Error al subir el comprobante: ${uploadErr.message}` };
        }

        uploadedFilePath = filePath;
      }

      const { data: insExp, error: insErr } = await supabase.from('expenses').insert({
        amount: numAmount,
        currency: 'EUR',
        expense_date: data.expense_date,
        category_id: data.category_id,
        description: data.description.trim(),
        receipt_url: uploadedFilePath,
      }).select('id').single();

      if (insErr) {
        // Si falló el insert y se subió el archivo, eliminarlo para no dejar huérfanos
        if (uploadedFilePath) {
          await supabase.storage.from('receipts').remove([uploadedFilePath]);
        }
        throw insErr;
      }

      // Registrar auditoría de egreso
      logAuditEvent('CREATE', 'expenses', insExp?.id || null, {
        amount: numAmount,
        currency: 'EUR',
        expense_date: data.expense_date,
        description: data.description.trim(),
        has_receipt: Boolean(uploadedFilePath),
        is_high_amount: numAmount > 300,
      });

      await fetchTransactions();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: parseFinancesError(err) };
    }
  };

  // Eliminar gasto (y su comprobante en Storage si existe)
  const deleteExpense = async (expense: Expense): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error: delErr } = await supabase.from('expenses').delete().eq('id', expense.id);
      if (delErr) throw delErr;

      // Si tenía comprobante, borrar del Storage
      if (expense.receipt_url) {
        const { error: storageErr } = await supabase.storage
          .from('receipts')
          .remove([expense.receipt_url]);
        if (storageErr) {
          console.warn('Aviso: No se pudo eliminar el comprobante del Storage:', storageErr.message);
        }
      }

      // Registrar auditoría de eliminación de gasto
      logAuditEvent('DELETE', 'expenses', expense.id, {
        amount: expense.amount,
        expense_date: expense.expense_date,
        description: expense.description,
      });

      await fetchTransactions();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: parseFinancesError(err) };
    }
  };

  // Obtener URL firmada para descargar o ver comprobante
  const getReceiptSignedUrl = async (
    receiptPath: string
  ): Promise<{ url: string | null; error?: string }> => {
    try {
      // 1 hora de validez
      const { data, error: signErr } = await supabase.storage
        .from('receipts')
        .createSignedUrl(receiptPath, 3600);

      if (signErr || !data?.signedUrl) {
        return {
          url: null,
          error: signErr?.message || 'No se pudo generar la URL segura para el comprobante.',
        };
      }
      return { url: data.signedUrl };
    } catch (err: any) {
      return { url: null, error: err?.message || 'Error al obtener comprobante' };
    }
  };

  // Crear categoría
  const createCategory = async (
    name: string,
    type: CategoryType
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const trimmed = name.trim();
      if (!trimmed) {
        return { ok: false, error: 'El nombre de la categoría es obligatorio.' };
      }

      const { error: insErr } = await supabase.from('transaction_categories').insert({
        name: trimmed,
        type,
      });

      if (insErr) throw insErr;

      await fetchAuxiliaryData();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: parseFinancesError(err) };
    }
  };

  // Eliminar categoría
  const deleteCategory = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { error: delErr } = await supabase.from('transaction_categories').delete().eq('id', id);
      if (delErr) throw delErr;

      await fetchAuxiliaryData();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: parseFinancesError(err) };
    }
  };

  // Exportar todas las transacciones filtradas a CSV (con UTF-8 BOM y escapado)
  const exportToCSV = () => {
    const rows: {
      fecha: string;
      tipo: string;
      categoria: string;
      concepto: string;
      donante: string;
      monto: number;
      comprobante: string;
    }[] = [];

    // Ofrendas
    offerings.forEach((o) => {
      rows.push({
        fecha: o.offering_date,
        tipo: 'Ingreso (Ofrenda)',
        categoria: o.category?.name || 'Sin categoría',
        concepto: o.notes || 'Ofrenda congregacional',
        donante: o.person ? `${o.person.first_name} ${o.person.last_name}` : 'Anónimo',
        monto: Number(o.amount),
        comprobante: '—',
      });
    });

    // Gastos
    expenses.forEach((e) => {
      rows.push({
        fecha: e.expense_date,
        tipo: 'Gasto (Egreso)',
        categoria: e.category?.name || 'Sin categoría',
        concepto: e.description,
        donante: '—',
        monto: -Number(e.amount),
        comprobante: e.receipt_url ? 'Adjunto' : 'Sin comprobante',
      });
    });

    // Ordenar por fecha descendente
    rows.sort((a, b) => b.fecha.localeCompare(a.fecha));

    // Cabeceras CSV
    const headers = [
      'Fecha',
      'Tipo de Transacción',
      'Categoría',
      'Concepto / Notas',
      'Donante / Beneficiario',
      'Monto (EUR)',
      'Comprobante',
    ];

    const escapeCSV = (val: string | number) => {
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines = [
      headers.map(escapeCSV).join(';'),
      ...rows.map((r) =>
        [
          r.fecha,
          r.tipo,
          r.categoria,
          r.concepto,
          r.donante,
          r.monto.toFixed(2).replace('.', ','), // Formato numérico estándar español para Excel
          r.comprobante,
        ]
          .map(escapeCSV)
          .join(';')
      ),
      '', // Línea vacía
      // Fila de resumen al final
      [
        'RESUMEN DEL PERIODO',
        '',
        '',
        `Total Ingresos: ${summary.totalIncome.toFixed(2).replace('.', ',')} €`,
        `Total Gastos: ${summary.totalExpenses.toFixed(2).replace('.', ',')} €`,
        `Balance Neto: ${summary.netBalance.toFixed(2).replace('.', ',')} €`,
        '',
      ]
        .map(escapeCSV)
        .join(';'),
    ];

    // UTF-8 BOM (\uFEFF) para compatibilidad con Excel
    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const periodLabel =
      selectedMonth === 0
        ? `ano_${selectedYear}`
        : `${MONTH_NAMES[selectedMonth - 1].toLowerCase()}_${selectedYear}`;

    const filename = `finanzas_oasis_${periodLabel}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    offerings,
    expenses,
    categories,
    persons,
    isLoading,
    error,
    summary,
    refresh: fetchTransactions,
    createOffering,
    deleteOffering,
    createExpense,
    deleteExpense,
    getReceiptSignedUrl,
    createCategory,
    deleteCategory,
    exportToCSV,
  };
}
