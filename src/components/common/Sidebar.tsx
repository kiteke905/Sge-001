import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  Home, LayoutDashboard, Users, UserPlus, CreditCard, 
  FileText, GraduationCap, BookOpen, Calendar, 
  Clock, DollarSign, ShieldAlert, Settings, 
  Award, Layers, CheckCircle2, Lock, UserCheck, Shield,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  mobileOpen, 
  setMobileOpen 
}) => {
  const { currentUser, isGestorReadOnly, logout } = useSchool();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const role = currentUser.role;

  // Define Navigation Sections with Strict Role Filtering
  const navSections = [
    {
      title: 'PRINCIPAL',
      items: [
        {
          id: 'dashboard',
          label: 'Início (Meus Módulos)',
          icon: <Home className="w-4 h-4" />,
          allowed: true,
        },
      ],
    },
    {
      title: 'SECRETARIA ESCOLAR',
      items: [
        {
          id: 'estudantes',
          label: 'Estudantes & Matrículas',
          icon: <Users className="w-4 h-4" />,
          badge: 'Secretaria',
          allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'SECRETARIA' || role === 'DIRECAO_PEDAGOGICA',
        },
        {
          id: 'caixa',
          label: 'Caixa & Pagamentos (POS)',
          icon: <CreditCard className="w-4 h-4" />,
          badge: 'Secretaria',
          allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'SECRETARIA' || role === 'FINANCAS',
        },
        {
          id: 'requerimentos',
          label: 'Requerimentos & Documentos',
          icon: <FileText className="w-4 h-4" />,
          allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'SECRETARIA' || role === 'DIRECAO_PEDAGOGICA',
        },
      ],
    },
    {
      title: 'PEDAGÓGICO & AVALIAÇÃO',
      items: [
        {
          id: 'minipauta',
          label: 'Minipauta de Notas (MAC/NPP/NPT)',
          icon: <Award className="w-4 h-4" />,
          badge: role === 'PROFESSOR' ? 'Docente' : undefined,
          allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'DIRECAO_PEDAGOGICA' || role === 'PROFESSOR',
        },
        {
          id: 'pauta_geral',
          label: 'Pauta Geral Consolidada',
          icon: <BookOpen className="w-4 h-4" />,
          allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'DIRECAO_PEDAGOGICA' || role === 'PROFESSOR',
        },
        {
          id: 'professores',
          label: 'Registo de Professores',
          icon: <GraduationCap className="w-4 h-4" />,
          allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'DIRECAO_PEDAGOGICA',
        },
        {
          id: 'matriz_curricular',
          label: 'Matriz Curricular & Disciplinas',
          icon: <Layers className="w-4 h-4" />,
          allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'DIRECAO_PEDAGOGICA',
        },
        {
          id: 'anos_letivos',
          label: 'Anos Letivos, Cursos & Turmas',
          icon: <Calendar className="w-4 h-4" />,
          allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'DIRECAO_PEDAGOGICA',
        },
        {
          id: 'horarios_provas',
          label: 'Horários & Calendário de Provas',
          icon: <Clock className="w-4 h-4" />,
          allowed: true, // Consultable by all roles
        },
      ],
    },
    {
      title: 'FINANÇAS & TESOURARIA',
      items: [
        {
          id: 'financas',
          label: 'Fluxo de Caixa & Despesas',
          icon: <DollarSign className="w-4 h-4" />,
          allowed: role === 'ADMIN' || role === 'GESTOR' || role === 'FINANCAS',
        },
      ],
    },
    {
      title: 'UTILIZADORES & SEGURANÇA',
      items: [
        {
          id: 'utilizadores',
          label: 'Gestão de Utilizadores',
          icon: <UserCheck className="w-4 h-4" />,
          badge: 'Admin / Gestor',
          allowed: role === 'ADMIN' || role === 'GESTOR',
        },
        {
          id: 'auditoria',
          label: 'Trilha de Auditoria (Logs)',
          icon: <ShieldAlert className="w-4 h-4" />,
          allowed: role === 'ADMIN' || role === 'GESTOR',
        },
        {
          id: 'configuracoes',
          label: 'Timbre & Identidade Escolar',
          icon: <Shield className="w-4 h-4" />,
          badge: 'Admin',
          allowed: role === 'ADMIN', // Exclusive to Admin
        },
      ],
    },
  ];

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed top-[57px] bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {navSections.map((section, idx) => {
            const allowedItems = section.items.filter(it => it.allowed);
            if (allowedItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </div>
                <div className="space-y-0.5 mt-1">
                  {allowedItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group
                          ${isActive 
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'}`}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold shrink-0 ${
                            isActive 
                              ? 'bg-slate-950 text-amber-400' 
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info: Role badge, quick legal notice & Logout */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate">Sessão: <strong className="text-white">{currentUser.name.split(' ')[0]}</strong></span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
              {role}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            id="sidebar-btn-logout"
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-900/50 text-xs font-semibold transition-all cursor-pointer group"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
            <span>Terminar Sessão</span>
          </button>

          <div className="text-[9px] text-slate-500 text-center">
            SIGE Angola • Sistema Seguro com Auditoria
          </div>
        </div>
      </aside>

      {/* Sidebar Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Terminar Sessão
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  SIGE Angola • Encerramento Seguro de Acesso
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem a certeza de que deseja terminar a sessão de <strong>{currentUser.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sim, Terminar Sessão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
