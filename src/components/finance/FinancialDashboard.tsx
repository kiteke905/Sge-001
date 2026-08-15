import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Expense } from '../../types';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, 
  Download, Plus, Search, Filter, ShieldCheck, 
  Calendar, CheckCircle2, AlertTriangle, PieChart 
} from 'lucide-react';
import { formatKz, formatDateAO, formatDateTimeAO } from '../../utils/formatters';
import { generateBalancetePDF } from '../../utils/pdfGenerator';

export const FinancialDashboard: React.FC = () => {
  const { 
    receipts, expenses, addExpense, activeAcademicYear, 
    institution, isGestorReadOnly 
  } = useSchool();

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    category: 'MANUTENCAO' as Expense['category'],
    amount: 50000,
    recipient: '',
    paymentMethod: 'TRANSFERENCIA' as Expense['paymentMethod'],
    notes: '',
  });

  // Financial calculations
  const totalRevenue = receipts
    .filter(r => r.status === 'EMITIDO')
    .reduce((acc, r) => acc + r.totalPaid, 0);

  const totalLateFees = receipts
    .filter(r => r.status === 'EMITIDO')
    .reduce((acc, r) => acc + r.totalLateFee, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalRevenue - totalExpenses;

  // Breakdown by method
  const revenueByMethod = receipts
    .filter(r => r.status === 'EMITIDO')
    .reduce((acc, r) => {
      acc[r.paymentMethod] = (acc[r.paymentMethod] || 0) + r.totalPaid;
      return acc;
    }, {} as Record<string, number>);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGestorReadOnly) {
      alert('Aviso RBAC: Gestor não tem autorização para registar saídas de caixa.');
      return;
    }

    addExpense(expenseForm);
    setExpenseModalOpen(false);
    alert('Despesa registada com sucesso no balancete financeiro!');
  };

  const handleDownloadBalancete = () => {
    generateBalancetePDF(
      activeAcademicYear?.name || '2025/2026',
      totalRevenue,
      totalExpenses,
      totalLateFees,
      netBalance,
      receipts,
      expenses,
      institution
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Gestão Financeira & Balancete de Caixa
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Moeda Oficial: Kwanza (Kz)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fluxo de caixa consolidado, receitas de propinas/taxas, multas por atraso e despesas institucionais
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBalancete}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Emitir Balancete Oficial (PDF)
          </button>

          <button
            onClick={() => setExpenseModalOpen(true)}
            disabled={isGestorReadOnly}
            className={`
              px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-2 transition-all
              ${isGestorReadOnly ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}
            `}
          >
            <Plus className="w-4 h-4" />
            Registar Saída / Despesa
          </button>
        </div>
      </div>

      {isGestorReadOnly && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Perfil GESTOR: Acesso de consulta financeira e supervisão de balancetes habilitado.</span>
        </div>
      )}

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Arrecadado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total de Receitas Arrecadadas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-emerald-700">
            {formatKz(totalRevenue)}
          </div>
          <span className="text-[11px] text-slate-400 block">
            {receipts.filter(r => r.status === 'EMITIDO').length} Recibos Liquidados
          </span>
        </div>

        {/* Multas por Atraso */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Multas de Atraso (10%)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-amber-700">
            {formatKz(totalLateFees)}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Acrescido às Propinas em Atraso
          </span>
        </div>

        {/* Despesas Operacionais */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Despesas / Saídas Totais</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-rose-700">
            {formatKz(totalExpenses)}
          </div>
          <span className="text-[11px] text-slate-400 block">
            {expenses.length} Saídas Registadas
          </span>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Saldo Líquido em Caixa</span>
            <div className={`p-2 rounded-xl ${netBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-black font-mono ${netBalance >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>
            {formatKz(netBalance)}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Disponível no Fundo Escolar
          </span>
        </div>
      </div>

      {/* Methods breakdown & expenses list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Breakdown by Payment Method */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            Arrecadação por Meio de Pagamento
          </h3>

          <div className="space-y-3">
            {[
              { key: 'TPA', label: 'TPA / Multicaixa (POS)' },
              { key: 'TRANSFERENCIA', label: 'Transferência Bancária' },
              { key: 'DEPOSITO', label: 'Depósito Bancário Direto' },
              { key: 'NUMERARIO', label: 'Numerário / Dinheiro Físico' },
            ].map(m => {
              const amount = revenueByMethod[m.key] || 0;
              const percent = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;

              return (
                <div key={m.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{m.label}</span>
                    <span className="font-mono font-bold text-slate-900">{formatKz(amount)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Expenses List */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              Registo de Despesas & Saídas de Caixa
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Total: {formatKz(totalExpenses)}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Data</th>
                  <th className="p-2.5">Descrição</th>
                  <th className="p-2.5">Categoria</th>
                  <th className="p-2.5">Beneficiário</th>
                  <th className="p-2.5 text-right">Valor (Kz)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-slate-500">{formatDateAO(e.date)}</td>
                    <td className="p-2.5 font-medium text-slate-900">{e.description}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600">{e.recipient}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                      -{formatKz(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Registar Nova Despesa</h2>
              <button onClick={() => setExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição da Despesa *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Ex: Aquisição de resmas de papel A4 para provas"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    <option value="SALARIOS">Salários / Docentes</option>
                    <option value="MANUTENCAO">Manutenção & Obras</option>
                    <option value="MATERIAL_ESCRITORIO">Material de Escritório</option>
                    <option value="SERVICOS">Água / Energia / Internet</option>
                    <option value="OUTRO">Outros Gastos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor (Kz) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="500"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entidade / Beneficiário *</label>
                  <input
                    type="text"
                    required
                    value={expenseForm.recipient}
                    onChange={e => setExpenseForm({ ...expenseForm, recipient: e.target.value })}
                    placeholder="Ex: Papelaria Luanda Lda"
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as any })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="NUMERARIO">Numerário</option>
                    <option value="TPA">TPA</option>
                    <option value="DEPOSITO">Depósito</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
                >
                  Registar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
