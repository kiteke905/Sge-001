import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { UserRole } from '../../types';
import { 
  Users, CreditCard, Award, GraduationCap, 
  Layers, TrendingUp, AlertTriangle, ShieldCheck, 
  Clock, CheckCircle2, FileText, ArrowUpRight, DollarSign,
  BookOpen, Calendar, ShieldAlert, Shield, UserCheck, 
  Sparkles, Lock, ArrowRight, Check, Compass, LayoutGrid
} from 'lucide-react';
import { formatKz, formatDateAO, formatDateTimeAO } from '../../utils/formatters';

interface OverviewDashboardProps {
  onNavigateTab: (tab: string) => void;
}

interface AccessibleModule {
  id: string;
  name: string;
  category: 'SECRETARIA' | 'PEDAGOGICO' | 'FINANCAS' | 'SEGURANCA';
  categoryLabel: string;
  icon: React.ReactNode;
  description: string;
  permissionLabel: string;
  permissionBadgeColor: string;
  themeColor: string;
  stats?: string;
  allowed: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigateTab }) => {
  const { 
    currentUser, students, teachers, turmas, receipts, 
    expenses, activeAcademicYear, isGestorReadOnly, 
    requests, auditLogs, subjects, assignments, grades, courses, classes
  } = useSchool();

  const [categoryFilter, setCategoryFilter] = useState<'TODOS' | 'SECRETARIA' | 'PEDAGOGICO' | 'FINANCAS' | 'SEGURANCA'>('TODOS');

  const role = currentUser.role;
  const isTeacher = role === 'PROFESSOR';
  const teacherId = currentUser.teacherId;

  // Teacher specific assignments, turmas and students
  const teacherAssignments = useMemo(() => {
    if (!isTeacher || !teacherId) return [];
    return assignments.filter(a => a.teacherId === teacherId);
  }, [isTeacher, teacherId, assignments]);

  const teacherTurmaIds = useMemo(() => {
    if (!isTeacher) return [];
    return Array.from(new Set(teacherAssignments.map(a => a.turmaId)));
  }, [isTeacher, teacherAssignments]);

  const teacherStudents = useMemo(() => {
    if (!isTeacher) return students;
    return students.filter(s => teacherTurmaIds.includes(s.turmaId));
  }, [isTeacher, teacherTurmaIds, students]);

  const teacherTurmas = useMemo(() => {
    if (!isTeacher) return turmas;
    return turmas.filter(t => teacherTurmaIds.includes(t.id));
  }, [isTeacher, teacherTurmaIds, turmas]);

  const teacherGradesCount = useMemo(() => {
    if (!isTeacher) return grades.length;
    const assignmentIds = teacherAssignments.map(a => a.id);
    return grades.filter(g => assignmentIds.includes(g.assignmentId)).length;
  }, [isTeacher, teacherAssignments, grades]);

  // Overall metric sums (for non-teachers)
  const totalStudents = isTeacher ? teacherStudents.length : students.length;
  const confirmedStudents = isTeacher 
    ? teacherStudents.filter(s => s.status === 'CONFIRMADO' || s.status === 'MATRICULADO').length 
    : students.filter(s => s.status === 'CONFIRMADO' || s.status === 'MATRICULADO').length;
  const totalTeachers = teachers.length;
  const totalTurmas = isTeacher ? teacherTurmas.length : turmas.length;

  const totalRevenue = receipts
    .filter(r => r.status === 'EMITIDO')
    .reduce((acc, r) => acc + r.totalPaid, 0);

  const totalLateFees = receipts
    .filter(r => r.status === 'EMITIDO')
    .reduce((acc, r) => acc + r.totalLateFee, 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalRevenue - totalExpenses;

  // Master definition of all system modules and accessibility by role
  // Rule: Teacher has access EXCLUSIVELY to pedagogical modules (minipauta, pauta_geral, horarios_provas)
  const allModules: AccessibleModule[] = [
    {
      id: 'estudantes',
      name: 'Estudantes & Matrículas',
      category: 'SECRETARIA',
      categoryLabel: 'Secretaria Escolar',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      description: 'Gestão de matrículas, emissão de termos, fichas biográficas e confirmações de matrícula por turma.',
      permissionLabel: isGestorReadOnly ? 'Consulta e Análise' : (role === 'SECRETARIA' || role === 'ADMIN' ? 'Acesso Total (Registo)' : 'Consulta Pedagógica'),
      permissionBadgeColor: isGestorReadOnly ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800',
      themeColor: 'hover:border-blue-300 hover:bg-blue-50/30',
      stats: `${students.length} estudantes cadastrados`,
      allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'SECRETARIA' || role === 'DIRECAO_PEDAGOGICA',
    },
    {
      id: 'caixa',
      name: 'Caixa & Pagamentos (POS)',
      category: 'SECRETARIA',
      categoryLabel: 'Secretaria & Caixa',
      icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
      description: 'Cobrança de propinas, confirmações e multas de atraso (10%), emissão e impressão de recibos com código de validação.',
      permissionLabel: isGestorReadOnly ? 'Consulta e Auditoria' : 'Operações de Caixa',
      permissionBadgeColor: isGestorReadOnly ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
      themeColor: 'hover:border-emerald-300 hover:bg-emerald-50/30',
      stats: `${receipts.length} recibos emitidos`,
      allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'SECRETARIA' || role === 'FINANCAS',
    },
    {
      id: 'requerimentos',
      name: 'Requerimentos & Declarações',
      category: 'SECRETARIA',
      categoryLabel: 'Secretaria Escolar',
      icon: <FileText className="w-5 h-5 text-amber-600" />,
      description: 'Emissão de declarações com/sem notas, certificados de habilitações e guias de transferência com timbre oficial.',
      permissionLabel: 'Emissão e Validação',
      permissionBadgeColor: 'bg-amber-100 text-amber-800',
      themeColor: 'hover:border-amber-300 hover:bg-amber-50/30',
      stats: `${requests.length} solicitações`,
      allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'SECRETARIA' || role === 'DIRECAO_PEDAGOGICA',
    },
    {
      id: 'minipauta',
      name: 'Minipauta de Avaliação (MAC/NPP/NPT)',
      category: 'PEDAGOGICO',
      categoryLabel: 'Pedagógico & Avaliação',
      icon: <Award className="w-5 h-5 text-indigo-600" />,
      description: 'Lançamento de notas contínuas por trimestre (MAC, NPP e NPT), cálculo automático da MT com validação MED.',
      permissionLabel: isGestorReadOnly ? 'Consulta de Notas' : (role === 'PROFESSOR' ? 'Lançamento Docente' : 'Supervisão Geral'),
      permissionBadgeColor: 'bg-indigo-100 text-indigo-800',
      themeColor: 'hover:border-indigo-300 hover:bg-indigo-50/30',
      stats: isTeacher ? `${teacherTurmas.length} turmas atribuídas` : `${turmas.length} turmas ativas`,
      allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'DIRECAO_PEDAGOGICA' || role === 'PROFESSOR',
    },
    {
      id: 'pauta_geral',
      name: 'Pauta Geral Consolidada',
      category: 'PEDAGOGICO',
      categoryLabel: 'Pedagógico & Avaliação',
      icon: <BookOpen className="w-5 h-5 text-violet-600" />,
      description: 'Mapa oficial de aproveitamento escolar, médias finais, cálculo de transitados/reprovados e exportação para impressão.',
      permissionLabel: 'Visualização e Impressão',
      permissionBadgeColor: 'bg-violet-100 text-violet-800',
      themeColor: 'hover:border-violet-300 hover:bg-violet-50/30',
      stats: 'Consolidação Trimestral',
      allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'DIRECAO_PEDAGOGICA' || role === 'PROFESSOR',
    },
    {
      id: 'professores',
      name: 'Registo de Professores',
      category: 'PEDAGOGICO',
      categoryLabel: 'Corpo Docente',
      icon: <GraduationCap className="w-5 h-5 text-teal-600" />,
      description: 'Cadastro de docentes, número de agente, qualificações académicas, especialidades e distribuição curricular.',
      permissionLabel: isGestorReadOnly ? 'Consulta Docente' : 'Gestão Pedagógica',
      permissionBadgeColor: 'bg-teal-100 text-teal-800',
      themeColor: 'hover:border-teal-300 hover:bg-teal-50/30',
      stats: `${totalTeachers} professores`,
      allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'DIRECAO_PEDAGOGICA',
    },
    {
      id: 'matriz_curricular',
      name: 'Matriz Curricular & Disciplinas',
      category: 'PEDAGOGICO',
      categoryLabel: 'Pedagógico & Ensino',
      icon: <Layers className="w-5 h-5 text-cyan-600" />,
      description: 'Planos curriculares, carga horária semanal e vinculação de disciplinas às turmas e docentes titulares.',
      permissionLabel: 'Configuração Curricular',
      permissionBadgeColor: 'bg-cyan-100 text-cyan-800',
      themeColor: 'hover:border-cyan-300 hover:bg-cyan-50/30',
      stats: `${subjects.length} disciplinas`,
      allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'DIRECAO_PEDAGOGICA',
    },
    {
      id: 'anos_letivos',
      name: 'Anos Letivos, Cursos & Turmas',
      category: 'PEDAGOGICO',
      categoryLabel: 'Estrutura Escolar',
      icon: <Calendar className="w-5 h-5 text-sky-600" />,
      description: 'Organização dos anos letivos, períodos, cursos técnicos, classes, salas e turnos (Manhã, Tarde, Noite).',
      permissionLabel: 'Administração Escolar',
      permissionBadgeColor: 'bg-sky-100 text-sky-800',
      themeColor: 'hover:border-sky-300 hover:bg-sky-50/30',
      stats: `${turmas.length} turmas distribuídas`,
      allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'DIRECAO_PEDAGOGICA',
    },
    {
      id: 'horarios_provas',
      name: 'Horários & Calendário de Provas',
      category: 'PEDAGOGICO',
      categoryLabel: 'Organização Escolar',
      icon: <Clock className="w-5 h-5 text-rose-600" />,
      description: 'Distribuição dos tempos letivos diários, mapa de salas e calendário geral de provas e exames trimestrais.',
      permissionLabel: 'Acesso Geral',
      permissionBadgeColor: 'bg-slate-100 text-slate-800',
      themeColor: 'hover:border-rose-300 hover:bg-rose-50/30',
      stats: 'Grade Horária Completa',
      allowed: true, // All roles can view timetables & exam schedules
    },
    {
      id: 'financas',
      name: 'Fluxo de Caixa & Despesas',
      category: 'FINANCAS',
      categoryLabel: 'Tesouraria & Finanças',
      icon: <DollarSign className="w-5 h-5 text-emerald-700" />,
      description: 'Demonstração de resultados, despesas operacionais, balancetes de receita e saldo bancário institucional.',
      permissionLabel: isGestorReadOnly ? 'Supervisão Financeira' : 'Gestão Orçamental',
      permissionBadgeColor: 'bg-emerald-100 text-emerald-800',
      themeColor: 'hover:border-emerald-300 hover:bg-emerald-50/30',
      stats: formatKz(netBalance),
      allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'FINANCAS',
    },
    {
      id: 'utilizadores',
      name: 'Gestão de Utilizadores & Quotas',
      category: 'SEGURANCA',
      categoryLabel: 'Segurança & Contas',
      icon: <UserCheck className="w-5 h-5 text-indigo-700" />,
      description: 'Controlo de contas, cumprimento de quotas estritas por cargo, uploads obrigatórios de BI e certificados.',
      permissionLabel: role === 'ADMIN' ? 'Administrador Pleno' : 'Supervisão Gestor',
      permissionBadgeColor: 'bg-indigo-100 text-indigo-800',
      themeColor: 'hover:border-indigo-300 hover:bg-indigo-50/30',
      stats: 'Quotas Rigorosas Ativas',
      allowed: role === 'ADMIN' || role === 'GESTOR',
    },
    {
      id: 'auditoria',
      name: 'Trilha de Auditoria (Logs)',
      category: 'SEGURANCA',
      categoryLabel: 'Segurança & Controlo',
      icon: <ShieldAlert className="w-5 h-5 text-purple-700" />,
      description: 'Registo histórico imutável de todas as ações de utilizadores, endereços IP, acessos e operações críticas.',
      permissionLabel: 'Registo de Conformidade',
      permissionBadgeColor: 'bg-purple-100 text-purple-800',
      themeColor: 'hover:border-purple-300 hover:bg-purple-50/30',
      stats: `${auditLogs.length} registos de log`,
      allowed: role === 'ADMIN' || role === 'GESTOR',
    },
    {
      id: 'configuracoes',
      name: 'Timbre & Identidade Escolar',
      category: 'SEGURANCA',
      categoryLabel: 'Identidade Oficial',
      icon: <Shield className="w-5 h-5 text-rose-700" />,
      description: 'Personalização de logótipo, cabeçalhos da República de Angola, Decretos Executivos, NIF e assinaturas oficiais.',
      permissionLabel: 'Exclusivo Administrador',
      permissionBadgeColor: 'bg-rose-100 text-rose-800',
      themeColor: 'hover:border-rose-300 hover:bg-rose-50/30',
      stats: 'Timbre & Assinaturas',
      allowed: role === 'ADMIN',
    },
  ];

  // Filter modules accessible by the current user
  const accessibleModules = allModules.filter(m => m.allowed);

  const filteredModules = categoryFilter === 'TODOS' 
    ? accessibleModules 
    : accessibleModules.filter(m => m.category === categoryFilter);

  // Recent 5 receipts (non-teacher)
  const recentReceipts = receipts.slice(0, 5);

  // Recent 5 students (non-teacher)
  const recentStudents = students.slice(-5).reverse();

  // Teacher recent students
  const teacherRecentStudents = teacherStudents.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-2xs">
                {currentUser.role}
              </span>
              <span className="text-xs font-semibold text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                Ano Letivo: {activeAcademicYear?.code || '2025/2026'}
              </span>
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                {accessibleModules.length} Módulos Disponíveis
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isTeacher ? `Painel Docente • Olá, ${currentUser.name}` : `Painel Inicial • Olá, ${currentUser.name}`}
            </h1>

            <p className="text-xs sm:text-sm text-blue-200/90 max-w-2xl leading-relaxed">
              {isTeacher && 'Módulo Pedagógico Docente: Acesso restrito e exclusivo às suas turmas, disciplinas atribuídas e lançamento de minipautas de avaliação.'}
              {currentUser.role === 'ADMIN' && 'Tem acesso irrestrito a todos os módulos pedagógicos, financeiros, cadastrais, de auditoria e configurações de timbre.'}
              {currentUser.role === 'GESTOR' && 'Painel Gerencial de Supervisão • Acesso em modo de leitura e auditoria para supervisão estratégica da instituição.'}
              {currentUser.role === 'DIRECAO_PEDAGOGICA' && 'Gestão pedagógica integral: distribuição de disciplinas, supervisão de pautas, turmas e acompanhamento docente.'}
              {currentUser.role === 'SECRETARIA' && 'Secretaria Escolar & Atendimento: matrículas de alunos, caixa POS para cobrança de propinas e emissão de declarações.'}
              {currentUser.role === 'FINANCAS' && 'Tesouraria & Controlo Financeiro: cobrança no caixa POS, registo de despesas e acompanhamento do saldo líquido.'}
            </p>
          </div>

          {/* Quick stats in banner */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 px-4 py-3 rounded-xl text-center min-w-[85px]">
              <span className="text-[10px] text-blue-200 uppercase font-bold block tracking-wider">
                {isTeacher ? 'Seus Alunos' : 'Alunos'}
              </span>
              <span className="text-xl font-black text-white">{totalStudents}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 px-4 py-3 rounded-xl text-center min-w-[85px]">
              <span className="text-[10px] text-blue-200 uppercase font-bold block tracking-wider">
                {isTeacher ? 'Disciplinas' : 'Docentes'}
              </span>
              <span className="text-xl font-black text-white">{isTeacher ? teacherAssignments.length : totalTeachers}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 px-4 py-3 rounded-xl text-center min-w-[85px]">
              <span className="text-[10px] text-blue-200 uppercase font-bold block tracking-wider">
                {isTeacher ? 'Suas Turmas' : 'Turmas'}
              </span>
              <span className="text-xl font-black text-white">{totalTurmas}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Gestor banner alert if active */}
      {isGestorReadOnly && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <strong className="block font-bold text-amber-950">Modo de Consulta Gerencial Ativo (Perfil GESTOR)</strong>
              <span className="text-amber-800">
                Pode visualizar e emitir relatórios de todos os módulos, mas as ações de alteração de dados, cobrança em caixa, matrículas e lançamento de notas estão bloqueadas para manter a segregação de funções.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECÇÃO PRINCIPAL: HUB DE MÓDULOS A QUE O UTILIZADOR TEM ACESSO           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-400/20 text-slate-900">
                <Compass className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {isTeacher ? 'Módulos Pedagógicos Autorizados' : 'Módulos & Serviços Autorizados para o seu Perfil'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTeacher 
                ? 'Como docente titular, o seu acesso é exclusivo ao Módulo Pedagógico e às turmas sob a sua responsabilidade.' 
                : 'Selecione qualquer módulo abaixo para entrar diretamente na área de trabalho correspondente.'}
            </p>
          </div>

          {/* Category Filter Chips - Only show relevant chips */}
          {!isTeacher && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setCategoryFilter('TODOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  categoryFilter === 'TODOS'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({accessibleModules.length})
              </button>
              <button
                onClick={() => setCategoryFilter('SECRETARIA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  categoryFilter === 'SECRETARIA'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Secretaria
              </button>
              <button
                onClick={() => setCategoryFilter('PEDAGOGICO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  categoryFilter === 'PEDAGOGICO'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pedagógico
              </button>
              <button
                onClick={() => setCategoryFilter('FINANCAS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  categoryFilter === 'FINANCAS'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Finanças
              </button>
              {(role === 'ADMIN' || role === 'GESTOR') && (
                <button
                  onClick={() => setCategoryFilter('SEGURANCA')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    categoryFilter === 'SEGURANCA'
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Segurança
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modules Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod) => (
            <div
              key={mod.id}
              onClick={() => onNavigateTab(mod.id)}
              className={`group bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between ${mod.themeColor}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition-colors shrink-0">
                    {mod.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mod.permissionBadgeColor}`}>
                      {mod.permissionLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {mod.categoryLabel}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
                    {mod.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {mod.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[170px]">
                  {mod.stats}
                </span>
                <span className="font-bold text-slate-900 group-hover:text-amber-600 flex items-center gap-1 transition-colors text-xs">
                  Entrar <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Main Summary KPI Cards (Adaptive for Teacher vs Other Roles) */}
      {isTeacher ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Alunos nas Suas Turmas */}
          <div 
            onClick={() => onNavigateTab('minipauta')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Alunos nas Suas Turmas</span>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {teacherStudents.length}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>{confirmedStudents} Estudantes Ativos</span>
              <span className="text-indigo-600 font-semibold flex items-center">
                Minipauta <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Suas Turmas Atribuídas */}
          <div 
            onClick={() => onNavigateTab('minipauta')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Suas Turmas Atribuídas</span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-700">
              {teacherTurmas.length}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>Classes & Turnos atribuídos</span>
              <span className="text-blue-700 font-semibold flex items-center">
                Ver Turmas <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Card 3: Disciplinas / Carga Letiva */}
          <div 
            onClick={() => onNavigateTab('minipauta')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Disciplinas Atribuídas</span>
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-teal-700">
              {teacherAssignments.length}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>Carga Curricular Ativa</span>
              <span className="text-teal-700 font-semibold flex items-center">
                Avaliar <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Card 4: Pauta Geral & Notas */}
          <div 
            onClick={() => onNavigateTab('pauta_geral')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-violet-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pauta Geral Consolidada</span>
              <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xl font-black text-violet-900">
              {teacherGradesCount} Notas
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>Aproveitamento Trimestral</span>
              <span className="text-violet-700 font-semibold flex items-center">
                Ver Pauta <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Estudantes */}
          <div 
            onClick={() => onNavigateTab('estudantes')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Estudantes Matriculados</span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {totalStudents}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>{confirmedStudents} Confirmados/Matriculados</span>
              <span className="text-blue-600 font-semibold flex items-center">
                Ver lista <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Receita Arrecadada */}
          <div 
            onClick={() => onNavigateTab(role === 'FINANCAS' || role === 'ADMIN' || role === 'GESTOR' ? 'financas' : 'caixa')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Arrecadação de Propinas</span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-emerald-700">
              {formatKz(totalRevenue)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>{receipts.length} Recibos emitidos</span>
              <span className="text-emerald-700 font-semibold flex items-center">
                Balancete <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Card 3: Multas de Atraso */}
          <div 
            onClick={() => onNavigateTab('caixa')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Multas por Atraso (10%)</span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-amber-700">
              {formatKz(totalLateFees)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>Regulamento de Propinas</span>
              <span className="text-amber-700 font-semibold flex items-center">
                Caixa POS <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Card 4: Saldo Líquido */}
          <div 
            onClick={() => onNavigateTab(role === 'FINANCAS' || role === 'ADMIN' || role === 'GESTOR' ? 'financas' : 'caixa')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Saldo Líquido em Caixa</span>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-indigo-900">
              {formatKz(netBalance)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>Despesas: -{formatKz(totalExpenses)}</span>
              <span className="text-indigo-700 font-semibold flex items-center">
                Extrato <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2 Tables in Split View: Adaptive for Teacher vs Other Roles */}
      {isTeacher ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Teacher's Students */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Estudantes nas Suas Turmas Atribuídas ({teacherStudents.length})
              </h3>
              <button
                onClick={() => onNavigateTab('minipauta')}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Abrir Minipauta <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {teacherRecentStudents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                Nenhum estudante encontrado nas turmas atribuídas ao seu utilizador docente.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {teacherRecentStudents.map(s => {
                  const turma = turmas.find(t => t.id === s.turmaId);
                  return (
                    <div key={s.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={s.photoUrl}
                          alt={s.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                            {s.fullName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {s.id} • {turma?.name || s.turmaName || 'Turma Atribuída'}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        s.status === 'CONFIRMADO' || s.status === 'MATRICULADO'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Teacher's Curricular Assignments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-600" />
                Suas Atribuições Curriculares ({teacherAssignments.length})
              </h3>
              <button
                onClick={() => onNavigateTab('minipauta')}
                className="text-xs font-bold text-violet-700 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Lançar Notas <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {teacherAssignments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                Nenhuma disciplina atribuída ao seu perfil no momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {teacherAssignments.map(a => {
                  const turma = turmas.find(t => t.id === a.turmaId);
                  const subject = subjects.find(s => s.id === a.subjectId);
                  const cls = classes.find(c => c.id === turma?.classId);
                  return (
                    <div key={a.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{subject?.name || 'Disciplina'}</div>
                        <span className="text-[10px] text-slate-500">
                          {turma?.name || 'Turma'} • {cls?.name || 'Classe'} ({turma?.shift || 'MANHA'})
                        </span>
                      </div>
                      <button
                        onClick={() => onNavigateTab('minipauta')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors cursor-pointer shrink-0"
                      >
                        Avaliar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Students */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Últimas Matrículas Registadas
              </h3>
              <button
                onClick={() => onNavigateTab('estudantes')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentStudents.map(s => {
                const turma = turmas.find(t => t.id === s.turmaId);
                return (
                  <div key={s.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={s.photoUrl}
                        alt={s.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                          {s.fullName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {s.id} • {turma?.name || 'Turma A'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.status === 'CONFIRMADO' || s.status === 'MATRICULADO'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Receipts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Últimos Recibos Emitidos no Caixa
              </h3>
              <button
                onClick={() => onNavigateTab('caixa')}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Ver livro <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentReceipts.map(r => (
                <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{r.studentName}</div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {r.receiptNumber} • {formatDateAO(r.issuedAt)} ({r.paymentMethod})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 font-mono">{formatKz(r.totalPaid)}</div>
                    <span className="text-[10px] font-bold text-emerald-700">Liquidado</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
