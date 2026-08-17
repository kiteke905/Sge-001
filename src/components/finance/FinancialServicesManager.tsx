import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { FinancialService, PaymentServiceType, ServiceTargetAudience } from '../../types';
import { 
  DollarSign, Plus, Search, Filter, Edit3, Trash2, 
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck, 
  Percent, Calendar, Users, Layers, Tag, ArrowRight, 
  Settings, Info, Sparkles, BookOpen
} from 'lucide-react';
import { formatKz } from '../../utils/formatters';

const SERVICE_CATEGORIES: { key: FinancialService['category']; label: string }[] = [
  { key: 'PROPINA', label: 'Propinas Mensais' },
  { key: 'MATRICULA', label: 'Matrículas & Inscrições' },
  { key: 'CONFIRMACAO', label: 'Confirmações de Matrícula' },
  { key: 'CARTAO', label: 'Cartões de Estudante' },
  { key: 'DOCUMENTO', label: 'Declarações & Certificados' },
  { key: 'UNIFORME', label: 'Uniformes & Enxovais' },
  { key: 'OUTRO', label: 'Outros Emolumentos & Serviços' },
];

const AUDIENCE_OPTIONS: { key: ServiceTargetAudience; label: string; desc: string }[] = [
  { key: 'TODOS', label: 'Todos os Alunos', desc: 'Aplicável universalmente a todos os níveis de ensino' },
  { key: 'PRIMARIO', label: 'Ensino Primário (Iniciação à 6ª Classe)', desc: 'Exclusivo para alunos do nível primário' },
  { key: 'I_CICLO', label: 'Iº Ciclo do Ensino Secundário (7ª à 9ª)', desc: 'Exclusivo para o Iº Ciclo Geral' },
  { key: 'II_CICLO_GERAL', label: 'IIº Ciclo Secundário / PUNIV (10ª à 12ª)', desc: 'Cursos do Pré-Universitário Geral' },
  { key: 'II_CICLO_TECNICO', label: 'Ensino Técnico-Profissional (10ª à 13ª)', desc: 'Cursos técnicos e profissionais' },
  { key: 'CURSO_ESPECIFICO', label: 'Curso Específico', desc: 'Atribuído a um curso curricular selecionado' },
  { key: 'CLASSE_ESPECIFICA', label: 'Classe Específica', desc: 'Atribuído a uma classe/ano de escolaridade' },
];

export const FinancialServicesManager: React.FC = () => {
  const { 
    financialServices, addFinancialService, updateFinancialService, 
    deleteFinancialService, toggleFinancialServiceStatus, courses, classes,
    currentUser, canManageFinancialServices
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'SERVICOS' | 'MULTAS' | 'DESTINATARIOS'>('SERVICOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAudience, setSelectedAudience] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<FinancialService | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    serviceType: 'PROPINA_MENSAL' as PaymentServiceType,
    category: 'PROPINA' as FinancialService['category'],
    basePrice: 35000,
    description: '',
    isMonthly: true,
    targetAudience: 'TODOS' as ServiceTargetAudience,
    targetCourseId: '',
    targetClassId: '',
    fineEnabled: true,
    finePercentage: 10,
    fineFixedAmount: 0,
    fineDueDay: 10,
    fineDescription: 'Multa de 10% por mora após o dia 10 de cada mês',
    status: 'ATIVO' as 'ATIVO' | 'INATIVO',
  });

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      code: `SRV-${String(Date.now()).slice(-4)}`,
      name: '',
      serviceType: 'PROPINA_MENSAL',
      category: 'PROPINA',
      basePrice: 35000,
      description: '',
      isMonthly: true,
      targetAudience: 'TODOS',
      targetCourseId: '',
      targetClassId: '',
      fineEnabled: true,
      finePercentage: 10,
      fineFixedAmount: 0,
      fineDueDay: 10,
      fineDescription: 'Multa de 10% por mora após o dia 10 de cada mês',
      status: 'ATIVO',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv: FinancialService) => {
    setEditingService(srv);
    setFormData({
      code: srv.code,
      name: srv.name,
      serviceType: srv.serviceType,
      category: srv.category,
      basePrice: srv.basePrice,
      description: srv.description || '',
      isMonthly: !!srv.isMonthly,
      targetAudience: srv.targetAudience,
      targetCourseId: srv.targetCourseId || '',
      targetClassId: srv.targetClassId || '',
      fineEnabled: srv.fineEnabled,
      finePercentage: srv.finePercentage ?? 10,
      fineFixedAmount: srv.fineFixedAmount ?? 0,
      fineDueDay: srv.fineDueDay ?? 10,
      fineDescription: srv.fineDescription || '',
      status: srv.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }

    if (editingService) {
      updateFinancialService(editingService.id, {
        code: formData.code,
        name: formData.name,
        serviceType: formData.serviceType,
        category: formData.category,
        basePrice: Number(formData.basePrice),
        description: formData.description,
        isMonthly: formData.isMonthly,
        targetAudience: formData.targetAudience,
        targetCourseId: formData.targetAudience === 'CURSO_ESPECIFICO' ? formData.targetCourseId : undefined,
        targetClassId: formData.targetAudience === 'CLASSE_ESPECIFICA' ? formData.targetClassId : undefined,
        fineEnabled: formData.fineEnabled,
        finePercentage: Number(formData.finePercentage),
        fineFixedAmount: Number(formData.fineFixedAmount),
        fineDueDay: Number(formData.fineDueDay),
        fineDescription: formData.fineDescription,
        status: formData.status,
      });
    } else {
      addFinancialService({
        code: formData.code,
        name: formData.name,
        serviceType: formData.serviceType,
        category: formData.category,
        basePrice: Number(formData.basePrice),
        description: formData.description,
        isMonthly: formData.isMonthly,
        targetAudience: formData.targetAudience,
        targetCourseId: formData.targetAudience === 'CURSO_ESPECIFICO' ? formData.targetCourseId : undefined,
        targetClassId: formData.targetAudience === 'CLASSE_ESPECIFICA' ? formData.targetClassId : undefined,
        fineEnabled: formData.fineEnabled,
        finePercentage: Number(formData.finePercentage),
        fineFixedAmount: Number(formData.fineFixedAmount),
        fineDueDay: Number(formData.fineDueDay),
        fineDescription: formData.fineDescription,
        status: formData.status,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem a certeza que pretende eliminar o serviço "${name}"?`)) {
      deleteFinancialService(id);
    }
  };

  // Filtered services
  const filteredServices = useMemo(() => {
    return financialServices.filter(s => {
      const term = (searchQuery || '').toLowerCase().trim();
      const matchesSearch = 
        !term ||
        (s.name || '').toLowerCase().includes(term) ||
        (s.code || '').toLowerCase().includes(term) ||
        (s.category || '').toLowerCase().includes(term);

      const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
      const matchesAudience = selectedAudience === 'ALL' || s.targetAudience === selectedAudience;

      return matchesSearch && matchesCat && matchesAudience;
    });
  }, [financialServices, searchQuery, selectedCategory, selectedAudience]);

  // Statistics
  const activeCount = financialServices.filter(s => s.status === 'ATIVO').length;
  const finesActiveCount = financialServices.filter(s => s.status === 'ATIVO' && s.fineEnabled).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Gestão de Serviços, Produtos & Multas
              </h2>
              <p className="text-xs text-slate-500">
                Módulo exclusivo da Direção e Gestão Geral para parametrização do catálogo financeiro, taxas, multas e destinatários
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Serviço / Produto</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('SERVICOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'SERVICOS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catálogo de Serviços & Preços ({financialServices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MULTAS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'MULTAS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Percent className="w-4 h-4 text-amber-500" />
          <span>Regras & Ativação de Multas ({finesActiveCount} Ativas)</span>
        </button>

        <button
          onClick={() => setActiveTab('DESTINATARIOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'DESTINATARIOS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-blue-500" />
          <span>Enquadramento & Destinatários</span>
        </button>
      </div>

      {/* TAB 1: CATALOGO DE SERVICOS */}
      {activeTab === 'SERVICOS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por Nome, Código ou Categoria..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="ALL">Todas as Categorias</option>
                {SERVICE_CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>

              <select
                value={selectedAudience}
                onChange={e => setSelectedAudience(e.target.value)}
                className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="ALL">Todos os Destinatários</option>
                {AUDIENCE_OPTIONS.map(a => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map(srv => {
              const categoryLabel = SERVICE_CATEGORIES.find(c => c.key === srv.category)?.label || srv.category;
              const audienceLabel = AUDIENCE_OPTIONS.find(a => a.key === srv.targetAudience)?.label || srv.targetAudience;
              const targetCourse = courses.find(c => c.id === srv.targetCourseId);
              const targetClass = classes.find(c => c.id === srv.targetClassId);

              return (
                <div 
                  key={srv.id} 
                  className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs ${
                    srv.status === 'ATIVO' ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200/60 bg-slate-50/50 opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Status & Code */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {srv.code}
                      </span>
                      <button
                        onClick={() => toggleFinancialServiceStatus(srv.id)}
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                          srv.status === 'ATIVO' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200'
                        }`}
                        title="Clique para alternar o estado ativo/inativo"
                      >
                        {srv.status === 'ATIVO' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Inativo</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Title & Category */}
                    <div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-sm">
                        {categoryLabel}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-2">
                        {srv.name}
                      </h3>
                      {srv.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {srv.description}
                        </p>
                      )}
                    </div>

                    {/* Price Block */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Preço Base:</span>
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {formatKz(srv.basePrice)}
                      </span>
                    </div>

                    {/* Target Audience & Fine Badge */}
                    <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {audienceLabel}
                          {targetCourse && ` (${targetCourse.name})`}
                          {targetClass && ` (${targetClass.name})`}
                        </span>
                      </div>

                      {srv.fineEnabled ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50/80 p-1.5 rounded-lg border border-amber-200">
                          <Percent className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="font-medium">
                            Multa: {srv.finePercentage}% após dia {srv.fineDueDay || 10}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Percent className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <span>Sem multa configurada</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEdit(srv)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => handleDelete(srv.id, srv.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar Serviço"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MULTAS */}
      {activeTab === 'MULTAS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <Percent className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Regulamento de Multas e Juros por Mora
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Defina quais serviços sofrem acréscimo financeiro quando o pagamento ocorre fora do prazo regulamentar. Por padrão estatutário em Angola, as propinas vencem no dia 10 de cada mês, aplicando-se 10% de multa.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Serviço / Produto</th>
                    <th className="p-3.5">Preço Base</th>
                    <th className="p-3.5 text-center">Estado da Multa</th>
                    <th className="p-3.5 text-center">Percentual (%)</th>
                    <th className="p-3.5 text-center">Dia de Vencimento</th>
                    <th className="p-3.5">Valor Estimado da Multa</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financialServices.map(srv => {
                    const fineVal = srv.fineEnabled && srv.finePercentage 
                      ? (srv.basePrice * (srv.finePercentage / 100)) 
                      : 0;

                    return (
                      <tr key={srv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 block">{srv.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{srv.code}</span>
                        </td>
                        <td className="p-3.5 font-mono font-semibold text-slate-800">
                          {formatKz(srv.basePrice)}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              updateFinancialService(srv.id, { fineEnabled: !srv.fineEnabled });
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                              srv.fineEnabled
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {srv.fineEnabled ? 'Multa Ativa' : 'Sem Multa'}
                          </button>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                          {srv.fineEnabled ? `${srv.finePercentage ?? 10}%` : '-'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                          {srv.fineEnabled ? `Dia ${srv.fineDueDay ?? 10}` : '-'}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-700">
                          {srv.fineEnabled ? `+ ${formatKz(fineVal)}` : '0 Kz'}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenEdit(srv)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                          >
                            Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DESTINATARIOS */}
      {activeTab === 'DESTINATARIOS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Matriz de Destinatários & Atribuição de Taxas
            </h3>
            <p className="text-xs text-slate-500">
              Cada serviço pode ser restrito a uma audiência específica (ex: propinas diferenciadas para o Ensino Técnico Profissional).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AUDIENCE_OPTIONS.map(aud => {
              const srvsForAudience = financialServices.filter(s => s.targetAudience === aud.key);

              return (
                <div key={aud.key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      {aud.label}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {srvsForAudience.length} Serviços
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {aud.desc}
                  </p>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    {srvsForAudience.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic block">Nenhum serviço restrito a este público</span>
                    ) : (
                      srvsForAudience.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                          <span className="font-medium text-slate-800 truncate max-w-[200px]">{s.name}</span>
                          <span className="font-mono font-bold text-slate-700">{formatKz(s.basePrice)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">
                    {editingService ? 'Editar Serviço / Produto Financeiro' : 'Cadastrar Novo Serviço Financeiro'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Preencha as informações cadastrais, enquadramento de público e parâmetros de multa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Código do Serviço *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: PROP-REG, TAXA-MATR"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 uppercase font-mono font-bold"
                  />
                </div>

                {/* Service Type */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipo de Operação no Caixa *
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={e => setFormData({ ...formData, serviceType: e.target.value as PaymentServiceType })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="PROPINA_MENSAL">Propina Mensal</option>
                    <option value="MATRICULA">Matrícula</option>
                    <option value="CONFIRMACAO">Confirmação de Matrícula</option>
                    <option value="CARTAO_ESTUDANTE">Cartão de Estudante</option>
                    <option value="UNIFORME">Uniforme Escolar</option>
                    <option value="DECLARACAO">Declaração</option>
                    <option value="CERTIFICADO">Certificado</option>
                    <option value="RECURSO_EXAME">Recurso de Exame</option>
                    <option value="FOLHA_PROVA">Folha de Prova</option>
                    <option value="OUTRO">Outro Emolumento</option>
                  </select>
                </div>

                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome Oficial do Serviço / Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Propina Mensal Regular, Taxa de Confirmação 10ª Classe..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as FinancialService['category'] })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {SERVICE_CATEGORIES.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Base Price */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Preço Base (Kz) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={formData.basePrice}
                    onChange={e => setFormData({ ...formData, totalPrice: Number(e.target.value), basePrice: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                {/* Target Audience */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Destinatários / Público-Alvo *
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={e => setFormData({ ...formData, targetAudience: e.target.value as ServiceTargetAudience })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    {AUDIENCE_OPTIONS.map(a => (
                      <option key={a.key} value={a.key}>{a.label} — {a.desc}</option>
                    ))}
                  </select>
                </div>

                {/* Course Selection if specific */}
                {formData.targetAudience === 'CURSO_ESPECIFICO' && (
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Selecionar Curso Curricular *
                    </label>
                    <select
                      value={formData.targetCourseId}
                      onChange={e => setFormData({ ...formData, targetCourseId: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Selecione o Curso</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Class Selection if specific */}
                {formData.targetAudience === 'CLASSE_ESPECIFICA' && (
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Selecionar Classe / Nível *
                    </label>
                    <select
                      value={formData.targetClassId}
                      onChange={e => setFormData({ ...formData, targetClassId: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Selecione a Classe</option>
                      {classes.map(cl => (
                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Fine Configuration Section */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-amber-900">Configuração de Multas por Mora</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.fineEnabled}
                      onChange={e => setFormData({ ...formData, fineEnabled: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-bold text-slate-800">Ativar Multa</span>
                  </label>
                </div>

                {formData.fineEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">
                        Percentual de Multa (%) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.finePercentage}
                        onChange={e => setFormData({ ...formData, finePercentage: Number(e.target.value) })}
                        className="w-full p-2 border border-amber-300 rounded-lg bg-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">
                        Dia de Vencimento do Mês *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.fineDueDay}
                        onChange={e => setFormData({ ...formData, fineDueDay: Number(e.target.value) })}
                        placeholder="Ex: 10"
                        className="w-full p-2 border border-amber-300 rounded-lg bg-white font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-amber-900 mb-1">
                        Descrição da Multa no Recibo
                      </label>
                      <input
                        type="text"
                        value={formData.fineDescription}
                        onChange={e => setFormData({ ...formData, fineDescription: e.target.value })}
                        placeholder="Ex: Multa de 10% por atraso após dia 10 (Regulamento Art. 14º)"
                        className="w-full p-2 border border-amber-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estado do Serviço no Sistema
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'ATIVO'}
                      onChange={() => setFormData({ ...formData, status: 'ATIVO' })}
                      className="text-emerald-600"
                    />
                    <span className="font-semibold text-emerald-700">Ativo (Disponível no Caixa)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'INATIVO'}
                      onChange={() => setFormData({ ...formData, status: 'INATIVO' })}
                      className="text-slate-500"
                    />
                    <span className="font-semibold text-slate-600">Inativo</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs active:scale-98 transition-all cursor-pointer"
                >
                  {editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
