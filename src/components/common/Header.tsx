import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { UserRole } from '../../types';
import { 
  Shield, UserCheck, GraduationCap, Users, 
  FileText, DollarSign, Building2, Calendar, 
  RotateCcw, AlertTriangle, 
  Settings, Sparkles, Menu, X 
} from 'lucide-react';
import { UserProfileModal } from '../profile/UserProfileModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab,
  onToggleMobileMenu,
  mobileMenuOpen 
}) => {
  const { 
    currentUser, 
    institution, 
    activeAcademicYear, 
    isGestorReadOnly, 
    resetToDefaultData 
  } = useSchool();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Administrador Geral',
          icon: <Shield className="w-3.5 h-3.5" />,
          classes: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'GESTOR':
        return {
          label: 'Gestor (Consulta / Supervisão)',
          icon: <UserCheck className="w-3.5 h-3.5" />,
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'DIRECAO_PEDAGOGICA':
        return {
          label: 'Direção Pedagógica',
          icon: <GraduationCap className="w-3.5 h-3.5" />,
          classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'PROFESSOR':
        return {
          label: 'Docente Titular',
          icon: <Users className="w-3.5 h-3.5" />,
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'SECRETARIA':
        return {
          label: 'Secretaria & Atendimento',
          icon: <FileText className="w-3.5 h-3.5" />,
          classes: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'FINANCAS':
        return {
          label: 'Tesouraria & Finanças',
          icon: <DollarSign className="w-3.5 h-3.5" />,
          classes: 'bg-violet-50 text-violet-700 border-violet-200',
        };
    }
  };

  const badge = getRoleBadge(currentUser?.role || 'ADMIN');

  const handleConfirmReset = () => {
    setShowResetConfirm(false);
    resetToDefaultData();
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        {/* Gestor strict restriction banner if active */}
        {isGestorReadOnly && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modo de Consulta Gerencial (RBAC Gestor):</strong> Restrições ativas — Não tem permissão para matricular estudantes, lançar notas, cobrar em caixa ou registar docentes.
              </span>
            </div>
          </div>
        )}

        <div className="px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Mobile Toggle + School identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Sidebar Toggle Button */}
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                title={mobileMenuOpen ? 'Fechar Menu' : 'Abrir Menu'}
                aria-label="Alternar Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {/* School Brand / Logo */}
            <button
              onClick={() => setActiveTab('dashboard')}
              title="Ir para o Painel Principal"
              className="flex items-center gap-2.5 text-left group p-1 -m-1 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs overflow-hidden p-1 group-hover:ring-2 group-hover:ring-amber-400/50 transition-all shrink-0">
                {institution.logoUrl ? (
                  <img src={institution.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight tracking-tight truncate max-w-[180px] sm:max-w-[280px] group-hover:text-amber-600 transition-colors">
                    {institution.name}
                  </h1>
                  <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {activeAcademicYear?.code || '2025/2026'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                  SIGE Angola • Sistema Integrado de Gestão Escolar
                </p>
              </div>
            </button>
          </div>

          {/* Right: Action Controls & User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Reset Demo Data Button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              title="Restaurar dados de demonstração padrão"
              className="hidden sm:flex p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* User Profile Button with Photo */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              id="btn-meu-perfil"
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group shadow-2xs"
              title="Meu Perfil - Editar Dados e Palavra-passe"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'Utilizador'}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="hidden md:block">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {currentUser?.name || 'Utilizador'}
                  </span>
                  <Settings className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
                </div>
                <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.2 rounded border ${badge.classes} mt-0.5`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Custom In-App Modal: Confirm Reset Data */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Restaurar Demonstração
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reposição dos Dados Originais do Sistema
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja repor a base de dados de demonstração padrão do SIGE Angola? Todos os estudantes, recibos e notas voltarão aos valores iniciais de exemplo.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Restaurar Dados Padrão
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
