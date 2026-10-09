import React, { useState, useRef } from 'react';
import { X, Receipt, Loader2, AlertCircle, PlusCircle, UploadCloud, FileText } from 'lucide-react';
import { ExpenseFormData, TransactionCategory } from '../../types/finances';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<{ ok: boolean; error?: string }>;
  categories: TransactionCategory[];
  onOpenCategories: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  onOpenCategories,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const expenseCategories = categories.filter((c) => c.type === 'gasto');

  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(todayStr);
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(
    expenseCategories.length > 0 ? expenseCategories[0].id : ''
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [highAmountConfirmed, setHighAmountConfirmed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validar tamaño máximo (15 MB)
      if (file.size > 15 * 1024 * 1024) {
        setError('El archivo no puede superar los 15 MB.');
        return;
      }
      setError(null);
      setReceiptFile(file);
    }
  };

  const removeFile = () => {
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Por favor introduce un monto válido mayor que 0,00 €.');
      return;
    }

    if (numAmount > 300 && !highAmountConfirmed) {
      setError('Este gasto supera los 300,00 €. Por favor, marca la casilla de confirmación para proceder.');
      return;
    }

    if (!description.trim()) {
      setError('El concepto o descripción del gasto es obligatorio.');
      return;
    }

    if (!categoryId) {
      setError('Debes seleccionar una categoría de gasto.');
      return;
    }

    if (!expenseDate) {
      setError('Indica la fecha del gasto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        amount: numAmount,
        expense_date: expenseDate,
        description: description.trim(),
        category_id: categoryId,
        receipt_file: receiptFile,
      });

      if (!res.ok) {
        setError(res.error || 'Error al guardar el gasto.');
      } else {
        // Reset y cerrar
        setAmount('');
        setDescription('');
        setReceiptFile(null);
        setHighAmountConfirmed(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al procesar el gasto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registrar Gasto / Egreso</h2>
              <p className="text-xs text-slate-500">Salida de fondos con comprobante opcional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Monto y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Monto (€) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-lg font-bold pl-3 pr-8 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                />
                <span className="absolute right-3 top-3 text-slate-400 font-bold">€</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Fecha <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Alerta de gasto mayor a 300 € */}
          {parseFloat(amount) > 300 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm space-y-3 shadow-sm animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold block">Gasto de importe alto (&gt; 300,00 €)</span>
                  <span className="text-amber-800">
                    Gasto de importe alto: confirma que los datos y comprobante sean correctos.
                  </span>
                </div>
              </div>
              <label className="flex items-center gap-2.5 pt-2 border-t border-amber-200 cursor-pointer font-medium text-amber-950">
                <input
                  type="checkbox"
                  checked={highAmountConfirmed}
                  onChange={(e) => setHighAmountConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-amber-400"
                />
                <span>Confirmo explícitamente la validez de este gasto superior a 300 €</span>
              </label>
            </div>
          )}

          {/* Concepto / Descripción obligatorio */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Concepto / Descripción <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Factura de luz septiembre, compra de material escolar, etc."
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* Categoría de gasto */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Categoría de Gasto <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenCategories}
                className="text-xs font-medium text-rose-700 hover:text-rose-800 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nueva categoría</span>
              </button>
            </div>
            {expenseCategories.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
                <span>No hay categorías de gasto creadas.</span>
                <button
                  type="button"
                  onClick={onOpenCategories}
                  className="font-bold underline ml-2"
                >
                  Crear una ahora
                </button>
              </div>
            ) : (
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none bg-white"
              >
                <option value="" disabled>
                  Selecciona una categoría...
                </option>
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subida opcional de comprobante (PDF o Imagen) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Comprobante o Factura <span className="text-slate-400 font-normal">(PDF o Imagen, opcional)</span>
            </label>

            {!receiptFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-rose-400 hover:bg-rose-50/30 rounded-2xl p-4 text-center cursor-pointer transition-colors"
              >
                <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Toca para seleccionar un comprobante</p>
                <p className="text-xs text-slate-500 mt-1">Archivos PDF, PNG o JPG (máx. 15 MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-800 truncate">{receiptFile.name}</p>
                    <p className="text-xs text-slate-500">
                      {(receiptFile.size / 1024).toFixed(0)} KB • Listo para subir a recibos
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={isSubmitting}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-2"
                  title="Quitar archivo"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || expenseCategories.length === 0}
              className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{receiptFile ? 'Subiendo comprobante y guardando...' : 'Guardando...'}</span>
                </>
              ) : (
                <span>Guardar gasto</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
