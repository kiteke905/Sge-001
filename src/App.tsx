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

  // Render active view based on tab
  const renderActiveView = () => {
    switch ((activeTab || 'dashboard').toLowerCase()) {
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
