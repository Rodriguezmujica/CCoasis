import React, { useState, useRef } from 'react';
import {
  X,
  Receipt,
  Loader2,
  AlertCircle,
  PlusCircle,
  UploadCloud,
  FileText,
  Banknote,
  ArrowLeftRight,
  Smartphone,
  CreditCard,
  MoreHorizontal,
  Wallet,
  Landmark,
} from 'lucide-react';
import {
  ExpenseFormData,
  TransactionCategory,
  PaymentMethod,
  FundAccount,
} from '../../types/finances';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<{ ok: boolean; error?: string }>;
  categories: TransactionCategory[];
  onOpenCategories: () => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight },
  { id: 'bizum', label: 'Bizum', icon: Smartphone },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'otro', label: 'Otro', icon: MoreHorizontal },
];

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [fundAccount, setFundAccount] = useState<FundAccount>('caja_efectivo');
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

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    // Sugerencia automática e inteligente de cuenta de fondos
    if (method === 'efectivo') {
      setFundAccount('caja_efectivo');
    } else if (method === 'transferencia' || method === 'bizum' || method === 'tarjeta') {
      setFundAccount('cuenta_bancaria');
    }
  };

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
        payment_method: paymentMethod,
        fund_account: fundAccount,
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
        setPaymentMethod('efectivo');
        setFundAccount('caja_efectivo');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#d4d7dc] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-6 py-5 oasis-title-gradient on-magenta">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 text-white flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Receipt className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Registrar Gasto
              </h2>
              <p className="text-xs text-white font-medium mt-0.5">
                Salida de fondos con comprobante opcional
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar"
            className="p-2.5 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-white hover:bg-white/15 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-600 text-rose-950 text-sm font-medium flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-700" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Monto y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1a1a] mb-1.5">
                Monto (€) <span className="text-[#9b1c1c]">*</span>
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
                  className="w-full text-lg font-extrabold text-[#1a1a1a] pl-3.5 pr-9 py-2.5 min-h-[44px] rounded-xl border border-[#858a93] bg-white placeholder-[#4a4f57]/70 focus:border-[#0e7c86] focus:outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a4f57] font-extrabold text-base">
                  €
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1a1a] mb-1.5">
                Fecha <span className="text-[#9b1c1c]">*</span>
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full py-2.5 px-3.5 min-h-[44px] rounded-xl border border-[#858a93] text-[#1a1a1a] text-base bg-white focus:border-[#0e7c86] focus:outline-none"
              />
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1a1a] mb-1.5">
              Método de pago <span className="text-[#9b1c1c]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handlePaymentMethodSelect(m.id)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 min-h-[44px] rounded-xl border text-xs font-bold transition-all ${
                      m.id === 'otro' ? 'col-span-2 sm:col-span-1' : ''
                    } ${
                      isSelected
                        ? 'bg-[#0e7c86] text-white border-[#0e7c86] shadow-sm'
                        : 'bg-white text-[#1a1a1a] border-[#858a93] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ubicación del dinero / Cuenta */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1a1a] mb-1.5">
              Ubicación del dinero / Cuenta <span className="text-[#9b1c1c]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFundAccount('caja_efectivo')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 min-h-[44px] rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                  fundAccount === 'caja_efectivo'
                    ? 'bg-[#0e7c86] text-white border-[#0e7c86] shadow-sm'
                    : 'bg-white text-[#1a1a1a] border-[#858a93] hover:bg-[#f5f5f5]'
                }`}
              >
                <Wallet
                  className={`w-4 h-4 shrink-0 ${fundAccount === 'caja_efectivo' ? 'text-white' : 'text-amber-700'}`}
                  aria-hidden="true"
                />
                <span>Caja en Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setFundAccount('cuenta_bancaria')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 min-h-[44px] rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                  fundAccount === 'cuenta_bancaria'
                    ? 'bg-[#0e7c86] text-white border-[#0e7c86] shadow-sm'
                    : 'bg-white text-[#1a1a1a] border-[#858a93] hover:bg-[#f5f5f5]'
                }`}
              >
                <Landmark
                  className={`w-4 h-4 shrink-0 ${fundAccount === 'cuenta_bancaria' ? 'text-white' : 'text-[#0e7c86]'}`}
                  aria-hidden="true"
                />
                <span>Cuenta Bancaria</span>
              </button>
            </div>
          </div>

          {/* Alerta de gasto mayor a 300 € */}
          {parseFloat(amount) > 300 && (
            <div className="p-4 rounded-2xl bg-amber-100 border-2 border-amber-600 text-amber-950 text-xs sm:text-sm space-y-3 shadow-sm animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-900 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="font-extrabold block text-amber-950">
                    Gasto de importe alto (&gt; 300,00 €)
                  </span>
                  <span className="text-amber-950 font-medium">
                    Gasto de importe alto: confirma que los datos y comprobante sean correctos.
                  </span>
                </div>
              </div>
              <label className="flex items-center gap-3 pt-2.5 border-t border-amber-600/40 cursor-pointer font-bold text-amber-950 min-h-[44px]">
                <input
                  type="checkbox"
                  checked={highAmountConfirmed}
                  onChange={(e) => setHighAmountConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded text-[#0e7c86] focus:ring-[#0e7c86] border-amber-800 shrink-0"
                />
                <span>Confirmo explícitamente la validez de este gasto superior a 300 €</span>
              </label>
            </div>
          )}

          {/* Concepto / Descripción obligatorio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1a1a] mb-1.5">
              Concepto / Descripción <span className="text-[#9b1c1c]">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Factura de luz septiembre, compra de material escolar, etc."
              className="w-full py-2.5 px-3.5 min-h-[44px] rounded-xl border border-[#858a93] text-[#1a1a1a] text-base bg-white placeholder-[#4a4f57]/70 focus:border-[#0e7c86] focus:outline-none"
            />
          </div>

          {/* Categoría de gasto */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">
                Categoría de Gasto <span className="text-[#9b1c1c]">*</span>
              </label>
              <button
                type="button"
                onClick={onOpenCategories}
                className="text-xs font-bold text-[#0e7c86] hover:text-[#0a5961] flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-[#d9f7f8]/60"
              >
                <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Nueva categoría</span>
              </button>
            </div>
            {expenseCategories.length === 0 ? (
              <div className="p-3.5 bg-amber-100 border border-amber-600 rounded-xl text-amber-950 text-xs font-medium flex items-center justify-between">
                <span>No hay categorías de gasto creadas.</span>
                <button
                  type="button"
                  onClick={onOpenCategories}
                  className="font-extrabold underline ml-2"
                >
                  Crear una ahora
                </button>
              </div>
            ) : (
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full py-2.5 px-3.5 min-h-[44px] rounded-xl border border-[#858a93] text-[#1a1a1a] text-base focus:border-[#0e7c86] focus:outline-none bg-white"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1a1a] mb-1.5">
              Comprobante o Factura <span className="text-[#4a4f57] font-medium">(PDF o Imagen, opcional)</span>
            </label>

            {!receiptFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#858a93] hover:border-[#0e7c86] hover:bg-[#d9f7f8]/20 rounded-2xl p-4 text-center cursor-pointer transition-colors"
              >
                <UploadCloud className="w-8 h-8 mx-auto text-[#0e7c86] mb-2" aria-hidden="true" />
                <p className="text-sm font-bold text-[#1a1a1a]">Toca para seleccionar un comprobante</p>
                <p className="text-xs text-[#4a4f57] mt-1">Archivos PDF, PNG o JPG (máx. 15 MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-[#f5f5f5] border border-[#d4d7dc] rounded-xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-[#d9f7f8] text-[#0e7c86] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-[#1a1a1a] truncate">{receiptFile.name}</p>
                    <p className="text-xs text-[#4a4f57]">
                      {(receiptFile.size / 1024).toFixed(0)} KB • Listo para subir a recibos
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={isSubmitting}
                  aria-label="Quitar archivo"
                  className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[#4a4f57] hover:text-rose-700 rounded-xl hover:bg-rose-50 transition-colors ml-2 shrink-0"
                  title="Quitar archivo"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-[#e5e7eb]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-sm font-bold text-[#1a1a1a] bg-white hover:bg-[#f5f5f5] border border-[#858a93] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || expenseCategories.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] text-sm font-bold text-white bg-[#0e7c86] hover:bg-[#0a5961] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
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
