import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { PaymentItem, PaymentMethod, PaymentServiceType, PaymentReceipt } from '../../types';
import { 
  CreditCard, Plus, Trash2, CheckCircle2, Download, 
  Search, AlertTriangle, Printer, RotateCcw, ShieldCheck, 
  FileText, ArrowRight, DollarSign, Lock, Check, Sparkles,
  UserCheck, HelpCircle, Calendar, Tag, Percent
} from 'lucide-react';
import { formatKz, formatDateTimeAO, formatDateAO } from '../../utils/formatters';
import { generateReceiptPDF } from '../../utils/pdfGenerator';
import { 
  getStudentTuitionStatus, 
  getNextPayableTuitionMonth, 
  isEnrollmentRequirementsFulfilled,
  isTuitionMonthPayable,
  MonthPaymentStatus
} from '../../utils/academicUtils';

export const CashRegisterPOS: React.FC = () => {
  const { 
    students, receipts, financialServices, activeAcademicYear,
    processMultiPayment, cancelReceipt, canProcessPayments, 
    isGestorReadOnly, institution 
  } = useSchool();

  // POS State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');
  const [cartItems, setCartItems] = useState<Omit<PaymentItem, 'id'>[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TPA');
  const [bankReference, setBankReference] = useState('');

  // Item Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [multiMonthCount, setMultiMonthCount] = useState<number>(1);
  const [itemBasePrice, setItemBasePrice] = useState<number>(35000);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [applyLateFee, setApplyLateFee] = useState<boolean>(false);

  // Tab & History State
  const [receiptsSearch, setReceiptsSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'POS' | 'HISTORICO'>('POS');
  const [lastProcessedReceipt, setLastProcessedReceipt] = useState<PaymentReceipt | null>(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Tuition status for the selected student
  const tuitionStatuses: MonthPaymentStatus[] = useMemo(() => {
    if (!selectedStudentId || !activeAcademicYear) return [];
    return getStudentTuitionStatus(selectedStudentId, receipts, activeAcademicYear);
  }, [selectedStudentId, receipts, activeAcademicYear]);

  // Consecutive unpaid months not yet paid and not in cart
  const eligibleUnpaidMonths: string[] = useMemo(() => {
    if (!selectedStudent || !activeAcademicYear) return [];
    const allMonths = activeAcademicYear.tuitionMonths || [];
    const paidOrInCartMonths = new Set<string>();

    // Paid in receipts
    receipts.filter(r => r.studentId === selectedStudent.id && r.status === 'EMITIDO').forEach(r => {
      r.items.forEach(it => {
        if (it.serviceType === 'PROPINA_MENSAL' && it.targetMonth) {
          paidOrInCartMonths.add(it.targetMonth.trim());
          paidOrInCartMonths.add(it.targetMonth.split('/')[0].trim());
        }
      });
    });

    // In cart
    cartItems.forEach(it => {
      if (it.serviceType === 'PROPINA_MENSAL' && it.targetMonth) {
        paidOrInCartMonths.add(it.targetMonth.trim());
        paidOrInCartMonths.add(it.targetMonth.split('/')[0].trim());
      }
    });

    const result: string[] = [];
    for (const m of allMonths) {
      const mPrefix = m.split('/')[0].trim();
      if (!paidOrInCartMonths.has(m) && !paidOrInCartMonths.has(mPrefix)) {
        result.push(m);
      } else if (result.length > 0) {
        break; // strictly sequential
      }
    }
    return result;
  }, [selectedStudent, activeAcademicYear, receipts, cartItems]);

  const nextPayableMonth = useMemo(() => {
    if (!selectedStudentId || !activeAcademicYear) return null;
    return getNextPayableTuitionMonth(selectedStudentId, receipts, activeAcademicYear);
  }, [selectedStudentId, receipts, activeAcademicYear]);

  const enrollmentCheck = useMemo(() => {
    if (!selectedStudentId || !activeAcademicYear || !selectedStudent) return { fulfilled: false, hasFee: false, hasFirstMonth: false, hasCard: false, missingItems: [], feeTypeName: 'Taxa de Matrícula' };
    return isEnrollmentRequirementsFulfilled(selectedStudentId, receipts, activeAcademicYear, selectedStudent);
  }, [selectedStudentId, selectedStudent, receipts, activeAcademicYear]);

  // Set default month when student changes or nextPayableMonth updates
  React.useEffect(() => {
    if (nextPayableMonth) {
      setSelectedMonth(nextPayableMonth);
    } else if (tuitionStatuses.length > 0) {
      const firstUnpaid = tuitionStatuses.find(t => !t.isPaid);
      if (firstUnpaid) {
        setSelectedMonth(firstUnpaid.monthName);
      }
    }
  }, [selectedStudentId, nextPayableMonth, tuitionStatuses]);

  // Set default financial service
  React.useEffect(() => {
    if (financialServices.length > 0 && !selectedServiceId) {
      const tuitionSrv = financialServices.find(s => s.serviceType === 'PROPINA_MENSAL' && s.status === 'ATIVO') || financialServices[0];
      if (tuitionSrv) {
        setSelectedServiceId(tuitionSrv.id);
        setItemBasePrice(tuitionSrv.basePrice);
        setCustomDescription(tuitionSrv.name);
      }
    }
  }, [financialServices, selectedServiceId]);

  const currentService = financialServices.find(s => s.id === selectedServiceId);

  // Handle service selection change
  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const srv = financialServices.find(s => s.id === serviceId);
    if (srv) {
      setItemBasePrice(srv.basePrice);
      setCustomDescription(srv.name);
      setApplyLateFee(false);
    }
  };

  // Add Item to Receipt Cart
  const handleAddItemToCart = () => {
    if (!selectedStudent) return;

    const isTuition = currentService?.serviceType === 'PROPINA_MENSAL';
    
    // Check sequential payment if it's tuition
    if (isTuition) {
      if (itemQuantity > 1) {
        handleAddMultipleTuitionMonths(itemQuantity);
        return;
      }

      if (!selectedMonth) {
        alert('Por favor selecione o mês da propina.');
        return;
      }
      
      const validation = isTuitionMonthPayable(selectedStudent.id, selectedMonth, receipts, activeAcademicYear);
      if (!validation.payable) {
        alert(validation.reason || 'Este mês de propina não pode ser liquidado no momento.');
        return;
      }

      // Check if already in cart
      const alreadyInCart = cartItems.some(it => it.serviceType === 'PROPINA_MENSAL' && it.targetMonth === selectedMonth);
      if (alreadyInCart) {
        alert(`A propina referente a ${selectedMonth} já foi adicionada ao carrinho.`);
        return;
      }
    }

    const finePercentage = (currentService?.fineEnabled && currentService?.finePercentage) ? currentService.finePercentage : 10;
    const lateFeeAmount = applyLateFee ? Math.round(itemBasePrice * (finePercentage / 100)) : 0;
    
    const finalDescription = isTuition 
      ? `Propina Mensal: ${selectedMonth}${applyLateFee ? ` (Com Multa de ${finePercentage}% por Atraso)` : ''}`
      : (customDescription || currentService?.name || 'Serviço Escolar');

    const newItem: Omit<PaymentItem, 'id'> = {
      serviceType: currentService?.serviceType || 'OUTRO',
      description: finalDescription,
      targetMonth: isTuition ? selectedMonth : undefined,
      baseAmount: itemBasePrice,
      lateFee: lateFeeAmount,
      quantity: itemQuantity,
      totalAmount: (itemBasePrice * itemQuantity) + lateFeeAmount,
    };

    setCartItems(prev => [...prev, newItem]);
    setApplyLateFee(false);
  };

  // Quick 1-click add for enrollment package (Fee + 1st Month + Card)
  const handleAddEnrollmentPackage = () => {
    if (!selectedStudent) return;
    const isConfirmation = selectedStudent.enrollmentType === 'CONFIRMACAO';
    const feeType = isConfirmation ? 'CONFIRMACAO' : 'MATRICULA';
    const feeLabel = isConfirmation ? 'Taxa de Confirmação de Matrícula' : 'Taxa de Matrícula';

    const firstMonth = activeAcademicYear?.tuitionMonths?.[0] || 'Setembro';
    const firstMonthLower = (firstMonth || 'Setembro').toLowerCase().trim();
    const feeSrv = financialServices.find(s => s.serviceType === feeType) || { basePrice: isConfirmation ? 12000 : 15000 };
    const tuitionSrv = financialServices.find(s => s.serviceType === 'PROPINA_MENSAL') || { basePrice: 35000 };
    const cardSrv = financialServices.find(s => s.serviceType === 'CARTAO_ESTUDANTE') || { basePrice: 3500 };

    const itemsToAdd: Omit<PaymentItem, 'id'>[] = [];

    // 1. Check if enrollment fee is paid or in cart
    const isFeePaid = receipts.some(r => 
      r.studentId === selectedStudent.id && 
      r.status === 'EMITIDO' && 
      r.items.some(it => it.serviceType === 'MATRICULA' || it.serviceType === 'CONFIRMACAO')
    );
    const isFeeInCart = cartItems.some(it => it.serviceType === 'MATRICULA' || it.serviceType === 'CONFIRMACAO');

    if (!isFeePaid && !isFeeInCart) {
      itemsToAdd.push({
        serviceType: feeType as any,
        description: feeLabel,
        baseAmount: feeSrv.basePrice,
        lateFee: 0,
        quantity: 1,
        totalAmount: feeSrv.basePrice,
      });
    }

    // 2. Check if 1st month already in cart or paid
    const isFirstMonthPaid = receipts.some(r => 
      r.studentId === selectedStudent.id && 
      r.status === 'EMITIDO' && 
      r.items.some(it => it.serviceType === 'PROPINA_MENSAL' && it.targetMonth && (it.targetMonth || '').toLowerCase().includes(firstMonthLower))
    );
    const isFirstMonthInCart = cartItems.some(it => it.serviceType === 'PROPINA_MENSAL' && it.targetMonth && (it.targetMonth || '').toLowerCase().includes(firstMonthLower));

    if (!isFirstMonthPaid && !isFirstMonthInCart) {
      itemsToAdd.push({
        serviceType: 'PROPINA_MENSAL',
        description: `Propina Mensal: ${firstMonth} (1º Mês Obrigatório)`,
        targetMonth: firstMonth,
        baseAmount: tuitionSrv.basePrice,
        lateFee: 0,
        quantity: 1,
        totalAmount: tuitionSrv.basePrice,
      });
    }

    // 3. Check if card fee is paid or in cart
    const isCardPaid = receipts.some(r => 
      r.studentId === selectedStudent.id && 
      r.status === 'EMITIDO' && 
      r.items.some(it => it.serviceType === 'CARTAO_ESTUDANTE')
    );
    const isCardInCart = cartItems.some(it => it.serviceType === 'CARTAO_ESTUDANTE');

    if (!isCardPaid && !isCardInCart) {
      itemsToAdd.push({
        serviceType: 'CARTAO_ESTUDANTE',
        description: 'Emissão de Cartão de Estudante com QR Code',
        baseAmount: cardSrv.basePrice,
        lateFee: 0,
        quantity: 1,
        totalAmount: cardSrv.basePrice,
      });
    }

    if (itemsToAdd.length > 0) {
      setCartItems(prev => [...prev, ...itemsToAdd]);
    }
  };

  // Add multiple consecutive tuition months respecting sequential rule
  const handleAddMultipleTuitionMonths = (count: number) => {
    if (!selectedStudent || !activeAcademicYear) return;
    const tuitionSrv = financialServices.find(s => s.serviceType === 'PROPINA_MENSAL' && s.status === 'ATIVO') || financialServices[0];
    if (!tuitionSrv) return;

    if (eligibleUnpaidMonths.length === 0) {
      alert('Não existem meses subsequentes disponíveis para pagamento neste momento.');
      return;
    }

    const countToTake = Math.min(count, eligibleUnpaidMonths.length);
    const monthsToProcess = eligibleUnpaidMonths.slice(0, countToTake);
    const finePercentage = (tuitionSrv.fineEnabled && tuitionSrv.finePercentage) ? tuitionSrv.finePercentage : 10;

    const newItems: Omit<PaymentItem, 'id'>[] = monthsToProcess.map(month => {
      const lateFeeAmount = applyLateFee ? Math.round(tuitionSrv.basePrice * (finePercentage / 100)) : 0;
      return {
        serviceType: 'PROPINA_MENSAL',
        description: `Propina Mensal: ${month}${applyLateFee ? ` (Com Multa de ${finePercentage}% por Atraso)` : ''}`,
        targetMonth: month,
        baseAmount: tuitionSrv.basePrice,
        lateFee: lateFeeAmount,
        quantity: 1,
        totalAmount: tuitionSrv.basePrice + lateFeeAmount,
      };
    });

    setCartItems(prev => [...prev, ...newItems]);
    setApplyLateFee(false);
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
    if ((paymentMethod === 'TRANSFERENCIA' || paymentMethod === 'DEPOSITO') && !bankReference.trim()) {
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
  };

  // Filtered receipts list
  const filteredReceipts = receipts.filter(r => {
    if (!receiptsSearch) return true;
    const term = (receiptsSearch || '').toLowerCase().trim();
    return (
      (r.receiptNumber || '').toLowerCase().includes(term) ||
      (r.studentName || '').toLowerCase().includes(term) ||
      (r.studentBi || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Caixa Escolar Multi-Serviço & Gestão de Propinas
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Ano Letivo: {activeAcademicYear?.code || '2025/2026'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cobrança sequencial de propinas de 10 meses e liquidação de serviços oficiais
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('POS')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'POS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Terminal de Caixa (POS)
          </button>
          <button
            onClick={() => setActiveTab('HISTORICO')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'HISTORICO' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Livro de Recibos ({receipts.length})
          </button>
        </div>
      </div>

      {activeTab === 'POS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Columns: Student + Service Selection */}
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
                  placeholder="Pesquisar por nome, nº de processo ou BI..."
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
                  .filter(s => {
                    if (!studentSearch) return true;
                    const term = (studentSearch || '').toLowerCase().trim();
                    return (
                      (s.fullName || '').toLowerCase().includes(term) || 
                      (s.id || '').toLowerCase().includes(term) ||
                      (s.biNumber || '').toLowerCase().includes(term)
                    );
                  })
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.id} • {s.status === 'PENDENTE_PAGAMENTO' ? 'Pendente de Pagamento' : s.status} • BI: {s.biNumber})
                    </option>
                  ))}
              </select>

              {selectedStudent && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedStudent.photoUrl}
                        alt={selectedStudent.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-300 shadow-2xs"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{selectedStudent.fullName}</span>
                        <span className="text-[11px] text-slate-500">
                          {selectedStudent.turmaName} • {selectedStudent.courseName} • Encarregado: {selectedStudent.guardianName}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      selectedStudent.status === 'MATRICULADO' || selectedStudent.status === 'CONFIRMADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedStudent.status === 'PENDENTE_PAGAMENTO'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-200 text-slate-700'
                    }`}>
                      {selectedStudent.status === 'PENDENTE_PAGAMENTO' ? 'Matrícula Pendente' : selectedStudent.status}
                    </span>
                  </div>

                  {/* Pending Payment Notice & Quick Package Button */}
                  {selectedStudent.status === 'PENDENTE_PAGAMENTO' && (
                    <div className="p-3.5 bg-amber-50/90 rounded-xl border border-amber-300 space-y-2.5">
                      <div className="flex items-start gap-2.5 text-xs text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-xs font-bold text-amber-950">Requisitos Obrigatórios para Efetivar Matrícula:</strong>
                          <p className="mt-0.5 text-[11px] text-amber-900 leading-relaxed">
                            Para efetivar e ativar o estudante no sistema é obrigatório liquidar o pacote inicial de 3 pagamentos: 
                            <strong> 1. {selectedStudent.enrollmentType === 'CONFIRMACAO' ? 'Taxa de Confirmação' : 'Taxa de Matrícula'}</strong> + 
                            <strong> 2. 1ª Propina ({activeAcademicYear?.tuitionMonths?.[0] || 'Setembro'})</strong> + 
                            <strong> 3. Cartão de Estudante</strong>.
                          </p>
                          {enrollmentCheck.missingItems.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[10px] font-semibold text-amber-800">Itens em falta:</span>
                              {enrollmentCheck.missingItems.map((item, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900 text-[10px] font-bold border border-amber-300">
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddEnrollmentPackage}
                        className="w-full py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Adicionar Pacote de Efetivação ao Carrinho ({selectedStudent.enrollmentType === 'CONFIRMACAO' ? 'Taxa Confirmação' : 'Taxa Matrícula'} + 1ª Propina + Cartão)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sequential 10-Month Tuition Timeline */}
            {selectedStudent && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Plano de Propinas do Ano Letivo (10 Meses)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Regra: Pagamento rigorosamente sequencial
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {tuitionStatuses.map((ts, idx) => {
                    const isSelected = selectedMonth === ts.monthName && currentService?.serviceType === 'PROPINA_MENSAL';

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (ts.isPayable) {
                            const tuitionSrv = financialServices.find(s => s.serviceType === 'PROPINA_MENSAL') || financialServices[0];
                            if (tuitionSrv) {
                              setSelectedServiceId(tuitionSrv.id);
                              setItemBasePrice(tuitionSrv.basePrice);
                              setCustomDescription(tuitionSrv.name);
                            }
                            setSelectedMonth(ts.monthName);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          ts.isPaid
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 cursor-default'
                            : ts.isPayable
                              ? isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-xs cursor-pointer ring-2 ring-blue-300'
                                : 'bg-white border-blue-300 text-blue-900 hover:bg-blue-50/70 cursor-pointer'
                              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                        }`}
                      >
                        <span className="text-[9px] block uppercase font-bold tracking-wider">
                          {idx + 1}º Mês
                        </span>
                        <strong className="text-xs block truncate mt-0.5">{ts.monthName}</strong>
                        
                        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-semibold">
                          {ts.isPaid ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Pago</span>
                            </>
                          ) : ts.isPayable ? (
                            <span className={isSelected ? 'text-white font-bold' : 'text-blue-700 font-bold'}>
                              Próximo
                            </span>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Bloqueado</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Multi-Month Quick Actions Panel */}
                {eligibleUnpaidMonths.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/80 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Plus className="w-3.5 h-3.5 text-blue-600" />
                        <span>Liquidação de Múltiplos Meses de Propina:</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {eligibleUnpaidMonths.length} {eligibleUnpaidMonths.length === 1 ? 'mês pendente' : 'meses pendentes'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <button
                        type="button"
                        onClick={() => handleAddMultipleTuitionMonths(1)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold shadow-2xs transition-all cursor-pointer"
                      >
                        + 1 Mês ({eligibleUnpaidMonths[0]})
                      </button>

                      {eligibleUnpaidMonths.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => handleAddMultipleTuitionMonths(2)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold shadow-2xs transition-all cursor-pointer"
                        >
                          + 2 Meses ({formatKz(70000)})
                        </button>
                      )}

                      {eligibleUnpaidMonths.length >= 3 && (
                        <button
                          type="button"
                          onClick={() => handleAddMultipleTuitionMonths(3)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          + 3 Meses (Trimestre)
                        </button>
                      )}

                      {eligibleUnpaidMonths.length >= 6 && (
                        <button
                          type="button"
                          onClick={() => handleAddMultipleTuitionMonths(6)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          + 6 Meses (Semestre)
                        </button>
                      )}

                      {eligibleUnpaidMonths.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleAddMultipleTuitionMonths(eligibleUnpaidMonths.length)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          + Todos os {eligibleUnpaidMonths.length} Meses Restantes
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Add Multi-Item Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">2</span>
                Adicionar Serviços / Propinas ao Recibo
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Service Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selecionar Serviço / Produto do Catálogo
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={e => handleServiceSelect(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  >
                    {financialServices.filter(s => s.status === 'ATIVO').map(srv => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} — {formatKz(srv.basePrice)} {srv.fineEnabled ? `(Multa ${srv.finePercentage}%)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* If tuition, show month selection */}
                {currentService?.serviceType === 'PROPINA_MENSAL' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mês de Propina a Liquidar *
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                    >
                      {tuitionStatuses.map(m => (
                        <option 
                          key={m.monthName} 
                          value={m.monthName} 
                          disabled={!m.isPayable}
                        >
                          {m.monthName} {m.isPaid ? '(Já Pago)' : !m.isPayable ? '(Bloqueado - Quite anteriores)' : '(A Pagar)'}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Descrição no Recibo
                    </label>
                    <input
                      type="text"
                      value={customDescription}
                      onChange={e => setCustomDescription(e.target.value)}
                      className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Price */}
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

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {currentService?.serviceType === 'PROPINA_MENSAL' ? 'Qtd. de Meses a Liquidar' : 'Quantidade'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={currentService?.serviceType === 'PROPINA_MENSAL' ? Math.max(1, eligibleUnpaidMonths.length) : 10}
                    value={itemQuantity}
                    onChange={e => setItemQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                  {currentService?.serviceType === 'PROPINA_MENSAL' && itemQuantity > 1 && (
                    <span className="text-[10px] text-blue-600 font-semibold block mt-1">
                      Liquidação sequencial de {Math.min(itemQuantity, eligibleUnpaidMonths.length)} meses: {eligibleUnpaidMonths.slice(0, itemQuantity).join(', ')}
                    </span>
                  )}
                </div>

                {/* Late fee calculation toggle */}
                {currentService?.fineEnabled && (
                  <div className="sm:col-span-2 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="lateFeeCheck"
                        checked={applyLateFee}
                        onChange={e => setApplyLateFee(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <label htmlFor="lateFeeCheck" className="text-xs font-bold text-amber-900 cursor-pointer">
                        Aplicar Multa por Atraso de {currentService.finePercentage || 10}% (+{formatKz(Math.round(itemBasePrice * ((currentService.finePercentage || 10) / 100)))})
                      </label>
                    </div>
                    <span className="text-[11px] text-amber-700 font-medium">
                      Vencimento: Dia {currentService.fineDueDay || 10}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddItemToCart}
                disabled={!selectedStudentId}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
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
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
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
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
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
                disabled={cartItems.length === 0 || !selectedStudentId}
                className={`
                  w-full py-3 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer
                  ${(cartItems.length === 0 || !selectedStudentId)
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
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Reemitir e Baixar Recibo em PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {r.status === 'EMITIDO' && (
                          <button
                            onClick={() => {
                              const reason = window.prompt('Indique o motivo da anulação deste recibo:');
                              if (reason) {
                                cancelReceipt(r.id, reason);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
