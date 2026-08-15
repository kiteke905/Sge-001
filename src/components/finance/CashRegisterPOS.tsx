import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { PaymentItem, PaymentMethod, PaymentServiceType, PaymentReceipt } from '../../types';
import { 
  CreditCard, Plus, Trash2, CheckCircle2, Download, 
  Search, AlertTriangle, Printer, RotateCcw, ShieldCheck, 
  FileText, ArrowRight, DollarSign 
} from 'lucide-react';
import { formatKz, formatDateTimeAO, formatDateAO } from '../../utils/formatters';
import { generateReceiptPDF } from '../../utils/pdfGenerator';

const SERVICE_PRESETS: {
  type: PaymentServiceType;
  label: string;
  defaultPrice: number;
  isMonthly?: boolean;
}[] = [
  { type: 'PROPINA_MENSAL', label: 'Propina Mensal Regular', defaultPrice: 35000, isMonthly: true },
  { type: 'MATRICULA', label: 'Taxa de Nova Matrícula', defaultPrice: 20000 },
  { type: 'CONFIRMACAO', label: 'Taxa de Confirmação de Matrícula', defaultPrice: 15000 },
  { type: 'CARTAO_ESTUDANTE', label: 'Emissão de Cartão Magnético com QR', defaultPrice: 3500 },
  { type: 'UNIFORME', label: 'Uniforme Escolar Completo (2 Batas + Polo)', defaultPrice: 18000 },
  { type: 'DECLARACAO', label: 'Emissão de Declaração Escolar (Com/Sem Notas)', defaultPrice: 4000 },
  { type: 'CERTIFICADO', label: 'Emissão de Certificado de Habilitações', defaultPrice: 8500 },
  { type: 'RECURSO_EXAME', label: 'Emolumento de Prova de Recurso / Exame', defaultPrice: 5000 },
  { type: 'FOLHA_PROVA', label: 'Caderno / Folha de Prova Trimestral', defaultPrice: 1000 },
  { type: 'OUTRO', label: 'Outros Emolumentos / Taxas', defaultPrice: 2500 },
];

const MONTHS_LIST = [
  'Setembro / 2025', 'Outubro / 2025', 'Novembro / 2025', 'Dezembro / 2025',
  'Janeiro / 2026', 'Fevereiro / 2026', 'Março / 2026', 'Abril / 2026',
  'Maio / 2026', 'Junho / 2026', 'Julho / 2026',
];

export const CashRegisterPOS: React.FC = () => {
  const { 
    students, receipts, processMultiPayment, cancelReceipt, 
    canProcessPayments, isGestorReadOnly, institution 
  } = useSchool();

  // POS State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');
  const [cartItems, setCartItems] = useState<Omit<PaymentItem, 'id'>[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TPA');
  const [bankReference, setBankReference] = useState('');

  // Item to add form state
  const [selectedServiceType, setSelectedServiceType] = useState<PaymentServiceType>('PROPINA_MENSAL');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Outubro / 2025');
  const [itemBasePrice, setItemBasePrice] = useState<number>(35000);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [applyLateFee, setApplyLateFee] = useState<boolean>(false);

  // Filter receipts state
  const [receiptsSearch, setReceiptsSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'POS' | 'HISTORICO'>('POS');
  const [lastProcessedReceipt, setLastProcessedReceipt] = useState<PaymentReceipt | null>(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Handle service type change
  const handleServiceTypeChange = (type: PaymentServiceType) => {
    setSelectedServiceType(type);
    const preset = SERVICE_PRESETS.find(p => p.type === type);
    if (preset) {
      setItemBasePrice(preset.defaultPrice);
      setCustomDescription(preset.label);
      if (type === 'PROPINA_MENSAL') {
        setApplyLateFee(false); // Can be toggled on
      } else {
        setApplyLateFee(false);
      }
    }
  };

  // Add Item to Receipt Cart
  const handleAddItemToCart = () => {
    const lateFeeAmount = applyLateFee ? Math.round(itemBasePrice * 0.10) : 0;
    const finalDescription = selectedServiceType === 'PROPINA_MENSAL' 
      ? `Propina Mensal de ${selectedMonth}${applyLateFee ? ' (Com Multa de 10% por Atraso)' : ''}`
      : (customDescription || 'Serviço Escolar');

    const newItem: Omit<PaymentItem, 'id'> = {
      serviceType: selectedServiceType,
      description: finalDescription,
      targetMonth: selectedServiceType === 'PROPINA_MENSAL' ? selectedMonth : undefined,
      baseAmount: itemBasePrice,
      lateFee: lateFeeAmount,
      quantity: itemQuantity,
      totalAmount: (itemBasePrice * itemQuantity) + lateFeeAmount,
    };

    setCartItems(prev => [...prev, newItem]);

    // Reset some fields
    if (selectedServiceType === 'PROPINA_MENSAL') {
      setApplyLateFee(false);
    }
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Totals calculations
  const subtotalCart = cartItems.reduce((acc, it) => acc + (it.baseAmount * it.quantity), 0);
  const totalLateFeeCart = cartItems.reduce((acc, it) => acc + it.lateFee, 0);
  const totalAmountCart = subtotalCart + totalLateFeeCart;

  // Process & Emit Receipt
  const handleCheckout = () => {
    if (!canProcessPayments) {
      alert('Aviso RBAC: O seu perfil atual não tem permissão para processar pagamentos de caixa.');
      return;
    }
    if (!selectedStudentId) {
      alert('Por favor, selecione o estudante beneficiário do pagamento.');
      return;
    }
    if (cartItems.length === 0) {
      alert('O carrinho de cobrança está vazio. Adicione pelo menos um item.');
      return;
    }
    if ((paymentMethod === 'TRANSFERENCIA' || paymentMethod === 'DEPOSITO') && !bankReference) {
      alert('Por favor, insira o número de comprovativo / referência bancária.');
      return;
    }

    const receipt = processMultiPayment(
      selectedStudentId,
      cartItems,
      paymentMethod,
      bankReference
    );

    setLastProcessedReceipt(receipt);
    generateReceiptPDF(receipt, institution);

    // Reset Cart
    setCartItems([]);
    setBankReference('');
    alert(`Recibo ${receipt.receiptNumber} emitido com sucesso! O download em PDF foi iniciado.`);
  };

  // Filtered receipts list
  const filteredReceipts = receipts.filter(r => 
    !receiptsSearch ||
    r.receiptNumber.toLowerCase().includes(receiptsSearch.toLowerCase()) ||
    r.studentName.toLowerCase().includes(receiptsSearch.toLowerCase()) ||
    r.studentBi.toLowerCase().includes(receiptsSearch.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Caixa Escolar Multi-Serviço (POS)
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Cobrança & Liquidação de Propinas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Processamento de faturas múltiplas em recibo único com cálculo automático de multas por atraso
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('POS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'POS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Terminal de Cobrança (POS)
          </button>
          <button
            onClick={() => setActiveTab('HISTORICO')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'HISTORICO' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Livro de Recibos Emitidos ({receipts.length})
          </button>
        </div>
      </div>

      {/* Warning for Gestor */}
      {isGestorReadOnly && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Restrição RBAC:</strong> Perfil Gestor não tem autorização para processar cobranças financeiras.
          </span>
        </div>
      )}

      {activeTab === 'POS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Columns: Selection & Add Items */}
          <div className="lg:col-span-7 space-y-4">
            {/* Step 1: Select Student */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">1</span>
                Identificar Estudante Beneficiário
              </h3>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou nº de processo..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full py-2.5 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="">-- Selecione o Estudante para Cobrança --</option>
                {students
                  .filter(s => 
                    !studentSearch || 
                    s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) || 
                    s.id.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    s.biNumber.toLowerCase().includes(studentSearch.toLowerCase())
                  )
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.id} • B.I: {s.biNumber})
                    </option>
                  ))}
              </select>

              {selectedStudent && (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedStudent.photoUrl}
                      alt={selectedStudent.fullName}
                      className="w-9 h-9 rounded-full object-cover border border-blue-300"
                    />
                    <div>
                      <span className="font-bold text-blue-950 block">{selectedStudent.fullName}</span>
                      <span className="text-[11px] text-blue-700">Encarregado: {selectedStudent.guardianName} ({selectedStudent.guardianPhone})</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                    {selectedStudent.id}
                  </span>
                </div>
              )}
            </div>

            {/* Step 2: Add Multi-Item Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">2</span>
                Adicionar Serviços / Propinas ao Recibo
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Serviço / Emolumento
                  </label>
                  <select
                    value={selectedServiceType}
                    onChange={e => handleServiceTypeChange(e.target.value as PaymentServiceType)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    {SERVICE_PRESETS.map(preset => (
                      <option key={preset.type} value={preset.type}>
                        {preset.label} - {formatKz(preset.defaultPrice)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedServiceType === 'PROPINA_MENSAL' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mês de Referência da Propina
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {MONTHS_LIST.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Descrição Personalizada
                    </label>
                    <input
                      type="text"
                      value={customDescription}
                      onChange={e => setCustomDescription(e.target.value)}
                      className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preço Base (Kz)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={itemBasePrice}
                    onChange={e => setItemBasePrice(Number(e.target.value))}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={itemQuantity}
                    onChange={e => setItemQuantity(Number(e.target.value))}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Late fee calculation toggle (10% penalty) */}
                <div className="sm:col-span-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="lateFeeCheck"
                      checked={applyLateFee}
                      onChange={e => setApplyLateFee(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="lateFeeCheck" className="text-xs font-bold text-amber-900 cursor-pointer">
                      Aplicar Multa por Atraso de 10% (+{formatKz(Math.round(itemBasePrice * 0.10))})
                    </label>
                  </div>
                  <span className="text-[11px] text-amber-700">Regulamento Art. 14º</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItemToCart}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Item ao Carrinho do Recibo
              </button>
            </div>
          </div>

          {/* Right 5 Columns: Receipt Invoice Summary & Settlement */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Resumo da Cobrança ({cartItems.length} Itens)
                </h3>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>

              {/* Items List in Cart */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Nenhum serviço adicionado ao recibo ainda.
                  </div>
                ) : (
                  cartItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">{item.description}</span>
                        <span className="text-[11px] text-slate-500">
                          {item.quantity}x {formatKz(item.baseAmount)}
                          {item.lateFee > 0 && <span className="text-amber-700 font-bold ml-1">(Multa: +{formatKz(item.lateFee)})</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-900 font-mono">
                          {formatKz(item.totalAmount)}
                        </span>
                        <button
                          onClick={() => handleRemoveFromCart(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Financial Totals */}
              <div className="p-3 bg-slate-100 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Serviços:</span>
                  <span className="font-mono font-medium">{formatKz(subtotalCart)}</span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Total Multas por Atraso:</span>
                  <span className="font-mono font-medium">{formatKz(totalLateFeeCart)}</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between text-slate-900 font-extrabold text-sm">
                  <span>TOTAL A PAGAR:</span>
                  <span className="font-mono text-emerald-700">{formatKz(totalAmountCart)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Forma de Liquidação / Pagamento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['TPA', 'TRANSFERENCIA', 'DEPOSITO', 'NUMERARIO'] as PaymentMethod[]).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                        paymentMethod === pm
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pm === 'TPA' && 'TPA / Multicaixa'}
                      {pm === 'TRANSFERENCIA' && 'Transferência'}
                      {pm === 'DEPOSITO' && 'Depósito Bancário'}
                      {pm === 'NUMERARIO' && 'Numerário (Dinheiro)'}
                    </button>
                  ))}
                </div>
              </div>

              {(paymentMethod === 'TRANSFERENCIA' || paymentMethod === 'DEPOSITO') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nº de Comprovativo / Referência Bancária *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankReference}
                    onChange={e => setBankReference(e.target.value)}
                    placeholder="Ex: BFA-TRF-009847291"
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              )}

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isGestorReadOnly || cartItems.length === 0 || !selectedStudentId}
                className={`
                  w-full py-3 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all
                  ${(isGestorReadOnly || cartItems.length === 0 || !selectedStudentId)
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'}
                `}
              >
                <CheckCircle2 className="w-4 h-4" />
                Processar Pagamento & Emitir Recibo Oficial (PDF)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Receipts Table Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-sm text-slate-900">
              Registo Histórico de Recibos Emitidos no Caixa
            </h3>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar recibo, aluno ou BI..."
                value={receiptsSearch}
                onChange={e => setReceiptsSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Nº Recibo</th>
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Estudante</th>
                  <th className="p-3">Serviços / Propinas</th>
                  <th className="p-3">Forma</th>
                  <th className="p-3 text-right">Multas</th>
                  <th className="p-3 text-right">Total Pago</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-blue-900">{r.receiptNumber}</td>
                    <td className="p-3 text-slate-500">{formatDateTimeAO(r.issuedAt)}</td>
                    <td className="p-3 font-medium text-slate-900">
                      <div>{r.studentName}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{r.studentBi}</span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-[220px] truncate">
                      {r.items.map(it => it.description).join('; ')}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700">
                      {r.paymentMethod}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-700">
                      {r.totalLateFee > 0 ? formatKz(r.totalLateFee) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatKz(r.totalPaid)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'EMITIDO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => generateReceiptPDF(r, institution)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Reemitir e Baixar Recibo em PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {r.status === 'EMITIDO' && (
                          <button
                            onClick={() => {
                              if (isGestorReadOnly) {
                                alert('Aviso RBAC: Gestor não pode anular recibos.');
                                return;
                              }
                              const reason = window.prompt('Indique o motivo da anulação deste recibo:');
                              if (reason) {
                                cancelReceipt(r.id, reason);
                              }
                            }}
                            disabled={isGestorReadOnly}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Anular Recibo de Caixa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
