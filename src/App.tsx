import React, { useState } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { LoginPortal } from './components/auth/LoginPortal';

// Views
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { StudentList } from './components/students/StudentList';
import { CashRegisterPOS } from './components/finance/CashRegisterPOS';
import { MinipautaGradeEntry } from './components/academic/MinipautaGradeEntry';
import { PautaGeralView } from './components/academic/PautaGeralView';
import { TeacherManager } from './components/academic/TeacherManager';
import { CurricularMatrix } from './components/academic/CurricularMatrix';
import { AcademicYearManager } from './components/academic/AcademicYearManager';
import { TimetableManager } from './components/academic/TimetableManager';
import { FinancialDashboard } from './components/finance/FinancialDashboard';
import { FinancialServicesManager } from './components/finance/FinancialServicesManager';
import { RequerimentosManager } from './components/documents/RequerimentosManager';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { UserManager } from './components/users/UserManager';
import { InstitutionSettings } from './components/settings/InstitutionSettings';

const MainLayout: React.FC = () => {
  const { currentUser, isAuthenticated } = useSchool();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // If user is not authenticated, show the Login Portal
  if (!isAuthenticated) {
    return <LoginPortal />;
  }

  // Render active view based on tab with strict RBAC enforcement
  const renderActiveView = () => {
    const tab = (activeTab || 'dashboard').toLowerCase();

    // Strict constraint: Teacher role has access EXCLUSIVELY to pedagogical modules
    if (currentUser.role === 'PROFESSOR') {
      const allowedTeacherTabs = ['dashboard', 'minipauta', 'pauta_geral', 'horarios_provas', 'horarios'];
      if (!allowedTeacherTabs.includes(tab)) {
        return (
          <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <span className="text-xl font-black">!</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Acesso Restrito ao Módulo Pedagógico</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                O seu perfil docente (Professor) tem acesso exclusivo ao módulo pedagógico (Minipautas de Avaliação, Pautas Gerais e Horários).
              </p>
            </div>
            <button
              onClick={() => setActiveTab('minipauta')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Ir para a Minipauta de Notas
            </button>
          </div>
        );
      }
    }

    switch (tab) {
      case 'dashboard':
        return <OverviewDashboard onNavigateTab={setActiveTab} />;
      case 'estudantes':
        return <StudentList />;
      case 'caixa':
      case 'caixa_pos':
        return <CashRegisterPOS />;
      case 'minipauta':
        return <MinipautaGradeEntry />;
      case 'pauta_geral':
        return <PautaGeralView />;
      case 'professores':
        return <TeacherManager />;
      case 'matriz_curricular':
        return <CurricularMatrix />;
      case 'anos_letivos':
      case 'anos_turmas':
        return <AcademicYearManager />;
      case 'horarios_provas':
      case 'horarios':
        return <TimetableManager />;
      case 'financas':
        return <FinancialDashboard />;
      case 'servicos_financeiros':
      case 'servicos':
      case 'produtos':
        return <FinancialServicesManager />;
      case 'requerimentos':
        return <RequerimentosManager />;
      case 'utilizadores':
        return <UserManager />;
      case 'auditoria':
        return <AuditLogViewer />;
      case 'configuracoes':
        return <InstitutionSettings />;
      default:
        return <OverviewDashboard onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <SchoolProvider>
      <MainLayout />
    </SchoolProvider>
  );
}
