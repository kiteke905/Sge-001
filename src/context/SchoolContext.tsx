import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  User, UserRole, AcademicYear, Course, SchoolClass, Turma, 
  Teacher, Subject, CurricularAssignment, Student, GradeRecord, AssessmentSchedule,
  PaymentReceipt, PaymentItem, ExpenseRecord, DocumentRequest, 
  TimetableSlot, ExamSchedule, AuditLog, PaymentMethod, InstitutionInfo,
  FinancialService, ROLE_QUOTAS, ROLE_LABELS
} from '../types';
import { 
  INITIAL_USERS, INITIAL_ACADEMIC_YEARS, INITIAL_COURSES, INITIAL_CLASSES, 
  INITIAL_TURMAS, INITIAL_TEACHERS, INITIAL_SUBJECTS, INITIAL_ASSIGNMENTS, 
  INITIAL_STUDENTS, INITIAL_GRADES, INITIAL_RECEIPTS, INITIAL_EXPENSES, 
  INITIAL_REQUESTS, INITIAL_TIMETABLE, INITIAL_EXAMS, INITIAL_AUDIT_LOGS,
  INITIAL_ASSESSMENT_SCHEDULES, INITIAL_FINANCIAL_SERVICES
} from '../data/mockInitialData';
import { generateVerificationHash, calculateMT } from '../utils/formatters';
import { isEnrollmentRequirementsFulfilled } from '../utils/academicUtils';

export const INSTITUTION_INFO: InstitutionInfo = {
  name: 'Complexo Escolar Girassol do Saber',
  subTitle: 'Ensino Primário, Iº e IIº Ciclos do Ensino Secundário Geral e Técnico',
  logoUrl: '', // Can be customized by Admin
  republicHeader: 'REPÚBLICA DE ANGOLA',
  ministryHeader: 'MINISTÉRIO DA EDUCAÇÃO',
  provincialHeader: 'GOVERNO PROVINCIAL DE LUANDA - GABINETE PROVINCIAL DE EDUCAÇÃO',
  nif: '5417098231',
  decreeNumber: 'Dec. Executivo Nº 142/2018 - MED',
  address: 'Rua Direita do Patriota, Luanda Sul, Luanda - Angola',
  city: 'Luanda',
  province: 'Luanda',
  phone: '+244 923 000 111 / +244 912 000 222',
  email: 'direcao@girassoldosaber.edu.ao',
  directorGeneral: 'Dra. Maria Antónia Kiala',
  directorName: 'Dra. Maria Antónia Kiala',
  directorPedagogico: 'Prof. Mestre Sebastião Vunge',
  pedagogicalDirectorName: 'Prof. Mestre Sebastião Vunge',
  chiefSecretaria: 'Sandra Varela Neto',
  secretariatHeadName: 'Sandra Varela Neto',
  currency: 'Kwanza (Kz)',
};

interface SchoolContextType {
  // Authentication & Users
  currentUser: User;
  users: User[];
  allUsers: User[]; // Alias for backward compatibility
  isAuthenticated: boolean;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  login: (usernameOrEmail: string, password?: string) => { success: boolean; message?: string };
  logout: () => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => { success: boolean; message?: string; user?: User };
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => { success: boolean; message?: string };
  updateUserProfile: (userId: string, data: Partial<User>) => void;
  getRoleUserCount: (role: UserRole) => number;
  isRoleQuotaReached: (role: UserRole) => boolean;
  
  // Institution
  institution: InstitutionInfo;
  updateInstitution: (info: Partial<InstitutionInfo>) => void;
  
  // Academic Years & Structure
  academicYears: AcademicYear[];
  activeAcademicYear: AcademicYear;
  courses: Course[];
  classes: SchoolClass[];
  turmas: Turma[];
  setActiveAcademicYearId: (id: string) => void;
  setActiveAcademicYear: (id: string) => void;
  addAcademicYear: (year: Omit<AcademicYear, 'id'>) => void;
  updateAcademicYear: (id: string, year: Partial<AcademicYear>) => void;
  toggleEnrollmentPeriod: (academicYearId: string) => void;
  toggleConfirmationPeriod: (academicYearId: string) => void;
  addTurma: (turma: Omit<Turma, 'id'>) => void;
  
  // Teachers & Curriculum
  teachers: Teacher[];
  subjects: Subject[];
  assignments: CurricularAssignment[];
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  addCurricularAssignment: (assignment: Omit<CurricularAssignment, 'id'>) => void;
  addAssignment: (assignment: Omit<CurricularAssignment, 'id'>) => void;
  deleteCurricularAssignment: (id: string) => void;
  removeAssignment: (id: string) => void;
  
  // Students & Enrollment
  students: Student[];
  enrollStudent: (studentData: Omit<Student, 'id' | 'studentNumber' | 'enrollmentDate'>) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  
  // Grades & Minipauta
  grades: GradeRecord[];
  saveMinipautaGrades: (newOrUpdatedGrades: Omit<GradeRecord, 'id' | 'updatedAt' | 'updatedBy'>[]) => void;
  assessmentSchedules: AssessmentSchedule[];
  updateAssessmentSchedule: (assignmentId: string, trimester: 1 | 2 | 3, macDate: string, nptDate: string) => void;
  
  // Financial Services & Fines Management (Admin & Gestor exclusive)
  financialServices: FinancialService[];
  addFinancialService: (serviceData: Omit<FinancialService, 'id' | 'createdAt' | 'updatedAt'>) => FinancialService;
  updateFinancialService: (id: string, data: Partial<FinancialService>) => void;
  deleteFinancialService: (id: string) => void;
  toggleFinancialServiceStatus: (id: string) => void;

  // Payments & Cash POS
  receipts: PaymentReceipt[];
  processMultiPayment: (
    studentId: string,
    items: Omit<PaymentItem, 'id'>[],
    paymentMethod: PaymentMethod,
    bankReference?: string
  ) => PaymentReceipt;
  cancelReceipt: (receiptId: string, reason: string) => void;
  
  // Expenses & Cash Flow
  expenses: ExpenseRecord[];
  addExpense: (expenseData: Omit<ExpenseRecord, 'id' | 'registeredBy' | 'date'> & { date?: string }) => void;
  
  // Document Requests
  requests: DocumentRequest[];
  createDocumentRequest: (reqData: any) => DocumentRequest;
  updateRequestStatus: (id: string, status: DocumentRequest['status'], notes?: string) => void;
  
  // Timetables & Exams
  timetable: TimetableSlot[];
  examSchedules: ExamSchedule[];
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => void;
  deleteTimetableSlot: (id: string) => void;
  addExamSchedule: (exam: Omit<ExamSchedule, 'id'>) => void;
  
  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (module: AuditLog['module'], action: string, details: string) => void;
  
  // RBAC Permission check helpers
  canEnrollStudent: boolean;
  canProcessPayments: boolean;
  canRegisterTeacher: boolean;
  canAssignCurricular: boolean;
  canAssignDiscipline: boolean;
  canEnterGrades: boolean;
  canManageFinances: boolean;
  canManageAcademicYears: boolean;
  canManageFinancialServices: boolean;
  canManageUsers: boolean;
  isGestorReadOnly: boolean;
  
  // Reset
  resetToDefaultData: () => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const STORAGE_KEY = 'SIGE_ANGOLA_DATA_V5';

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default Admin
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Starts unauthenticated to show Login Form
  const [institution, setInstitution] = useState<InstitutionInfo>(INSTITUTION_INFO);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(INITIAL_ACADEMIC_YEARS);
  const [courses] = useState<Course[]>(INITIAL_COURSES);
  const [classes] = useState<SchoolClass[]>(INITIAL_CLASSES);
  const [turmas, setTurmas] = useState<Turma[]>(INITIAL_TURMAS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [subjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [assignments, setAssignments] = useState<CurricularAssignment[]>(INITIAL_ASSIGNMENTS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [grades, setGrades] = useState<GradeRecord[]>(INITIAL_GRADES);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(INITIAL_RECEIPTS);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [financialServices, setFinancialServices] = useState<FinancialService[]>(INITIAL_FINANCIAL_SERVICES);
  const [requests, setRequests] = useState<DocumentRequest[]>(INITIAL_REQUESTS);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(INITIAL_TIMETABLE);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>(INITIAL_EXAMS);
  const [assessmentSchedules, setAssessmentSchedules] = useState<AssessmentSchedule[]>(INITIAL_ASSESSMENT_SCHEDULES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Load from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.users && parsed.users.length > 0) setUsers(parsed.users);
        if (parsed.currentUserId) {
          const userFound = (parsed.users || INITIAL_USERS).find((u: User) => u.id === parsed.currentUserId);
          if (userFound) setCurrentUser(userFound);
        }
        if (typeof parsed.isAuthenticated === 'boolean') {
          setIsAuthenticated(parsed.isAuthenticated);
        }
        if (parsed.institution) setInstitution(parsed.institution);
        if (parsed.academicYears) setAcademicYears(parsed.academicYears);
        if (parsed.financialServices) setFinancialServices(parsed.financialServices);
        if (parsed.turmas) setTurmas(parsed.turmas);
        if (parsed.teachers) setTeachers(parsed.teachers);
        if (parsed.assignments) setAssignments(parsed.assignments);
        if (parsed.students) setStudents(parsed.students);
        if (parsed.grades) setGrades(parsed.grades);
        if (parsed.receipts) setReceipts(parsed.receipts);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.requests) setRequests(parsed.requests);
        if (parsed.timetable) setTimetable(parsed.timetable);
        if (parsed.examSchedules) setExamSchedules(parsed.examSchedules);
        if (parsed.assessmentSchedules) setAssessmentSchedules(parsed.assessmentSchedules);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      const stateToSave = {
        users,
        currentUserId: currentUser?.id,
        isAuthenticated,
        institution,
        academicYears,
        financialServices,
        turmas,
        teachers,
        assignments,
        students,
        grades,
        receipts,
        expenses,
        requests,
        timetable,
        examSchedules,
        assessmentSchedules,
        auditLogs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
  }, [users, currentUser, isAuthenticated, institution, academicYears, financialServices, turmas, teachers, assignments, students, grades, receipts, expenses, requests, timetable, examSchedules, assessmentSchedules, auditLogs]);

  const activeAcademicYear = academicYears.find(y => y.status === 'ATIVO') || academicYears[0];

  const addAuditLog = useCallback((module: AuditLog['module'], action: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'SISTEMA',
      userName: currentUser?.name || 'Sistema SIGE',
      userRole: currentUser?.role || 'ADMIN',
      module,
      action,
      details,
      description: details,
      ipAddress: '192.168.1.' + (10 + Math.floor(Math.random() * 80)),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // Role quota calculation
  const getRoleUserCount = useCallback((role: UserRole): number => {
    return users.filter(u => u.role === role && u.status === 'ATIVO').length;
  }, [users]);

  const isRoleQuotaReached = useCallback((role: UserRole): boolean => {
    const max = ROLE_QUOTAS[role] || 999;
    const current = getRoleUserCount(role);
    return current >= max;
  }, [getRoleUserCount]);

  // Auth: Login
  const login = useCallback((usernameOrEmail: string, password?: string): { success: boolean; message?: string } => {
    const trimmed = (usernameOrEmail || '').trim().toLowerCase();
    const user = users.find(u => 
      ((u.username || '').toLowerCase() === trimmed || (u.email || '').toLowerCase() === trimmed)
    );

    if (!user) {
      return { success: false, message: 'Utilizador não encontrado no sistema.' };
    }

    if (user.status !== 'ATIVO') {
      return { success: false, message: 'Conta de utilizador inativa ou suspensa. Contacte a Administração.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Palavra-passe incorreta.' };
    }

    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString(),
    };

    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    addAuditLog('AUTENTICACAO', 'Início de Sessão', `Utilizador ${user.name} (${user.role}) iniciou sessão com sucesso.`);
    return { success: true };
  }, [users, addAuditLog]);

  // Auth: Logout
  const logout = useCallback(() => {
    if (currentUser) {
      addAuditLog('AUTENTICACAO', 'Encerramento de Sessão', `Utilizador ${currentUser.name} encerrou a sessão.`);
    }
    setIsAuthenticated(false);
  }, [currentUser, addAuditLog]);

  // Switch role helper for quick testing
  const switchRole = useCallback((role: UserRole) => {
    const safeRole = role || 'ADMIN';
    const roleLower = String(safeRole).toLowerCase();
    const matchedUser = users.find(u => u.role === safeRole) || INITIAL_USERS.find(u => u.role === safeRole) || {
      id: `USR-${safeRole}`,
      name: `Utilizador (${ROLE_LABELS[safeRole] || safeRole})`,
      username: roleLower,
      email: `${roleLower}@sige.edu.ao`,
      role: safeRole,
      status: 'ATIVO' as const,
    };
    setCurrentUser(matchedUser);
    setIsAuthenticated(true);
    addAuditLog('AUTENTICACAO', 'Troca de Perfil de Utilizador', `Sessão alterada para perfil: ${safeRole} (${matchedUser.name})`);
  }, [users, addAuditLog]);

  // Add User with strict quota enforcement & validation
  const addUser = useCallback((userData: Omit<User, 'id' | 'createdAt'>): { success: boolean; message?: string; user?: User } => {
    // Check if current user is allowed to register users (only ADMIN or GESTOR)
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'GESTOR') {
      return { success: false, message: 'Apenas Administradores e Gestores têm permissão para registar novos utilizadores.' };
    }

    // Check Role Quota
    const currentCount = getRoleUserCount(userData.role);
    const maxQuota = ROLE_QUOTAS[userData.role] || 999;
    if (currentCount >= maxQuota) {
      return { 
        success: false, 
        message: `Limite de utilizadores para o perfil "${ROLE_LABELS[userData.role]}" atingido (${currentCount}/${maxQuota}). O sistema não permite registar mais utilizadores com este cargo.` 
      };
    }

    // Check unique username and email
    const safeUsername = (userData.username || '').toLowerCase().trim();
    const safeEmail = (userData.email || '').toLowerCase().trim();

    if (safeUsername && users.some(u => (u.username || '').toLowerCase().trim() === safeUsername)) {
      return { success: false, message: `O nome de utilizador "${userData.username}" já está a ser utilizado.` };
    }
    if (safeEmail && users.some(u => (u.email || '').toLowerCase().trim() === safeEmail)) {
      return { success: false, message: `O e-mail "${userData.email}" já está registado.` };
    }

    const newId = `USR-${userData.role.substring(0, 3)}-${String(Date.now()).slice(-4)}`;
    const newUser: User = {
      ...userData,
      password: userData.password?.trim() || 'chave123',
      id: newId,
      createdAt: new Date().toISOString(),
      status: 'ATIVO',
    };

    setUsers(prev => [...prev, newUser]);
    addAuditLog('SISTEMA', 'Registo de Utilizador', `Novo utilizador criado: ${newUser.name} (${newUser.role}) com anexos de Foto tipo passe, BI e Certificado.`);
    return { success: true, user: newUser };
  }, [currentUser, getRoleUserCount, users, addAuditLog]);

  // Update user
  const updateUser = useCallback((id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...data };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return u;
    }));
    addAuditLog('SISTEMA', 'Atualização de Utilizador', `Dados do utilizador ID ${id} atualizados.`);
  }, [currentUser, addAuditLog]);

  // Delete user
  const deleteUser = useCallback((id: string): { success: boolean; message?: string } => {
    if (currentUser?.id === id) {
      return { success: false, message: 'Não pode eliminar o seu próprio utilizador atualmente ligado.' };
    }
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) {
      return { success: false, message: 'Utilizador não encontrado.' };
    }
    if (userToDelete.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length <= 1) {
      return { success: false, message: 'Não é possível eliminar o único Administrador do sistema.' };
    }

    setUsers(prev => prev.filter(u => u.id !== id));
    addAuditLog('SISTEMA', 'Eliminação de Utilizador', `Utilizador removido: ${userToDelete.name} (${userToDelete.role})`);
    return { success: true };
  }, [currentUser, users, addAuditLog]);

  // Update own user profile
  const updateUserProfile = useCallback((userId: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, ...data };
        setCurrentUser(updated);
        return updated;
      }
      return u;
    }));
    addAuditLog('SISTEMA', 'Atualização de Perfil Próprio', `Utilizador ${currentUser?.name} atualizou os seus dados de conta e credenciais.`);
  }, [currentUser?.name, addAuditLog]);

  const updateInstitution = useCallback((info: Partial<InstitutionInfo>) => {
    setInstitution(prev => ({ ...prev, ...info }));
    addAuditLog('CONFIGURACOES', 'Atualização dos Dados da Instituição', 'Dados cadastrais, logotipo e cabeçalho oficial atualizados pelo Administrador.');
  }, [addAuditLog]);

  const setActiveAcademicYearId = useCallback((id: string) => {
    setAcademicYears(prev => prev.map(y => ({
      ...y,
      status: y.id === id ? 'ATIVO' : (y.status === 'ATIVO' ? 'PLANEADO' : y.status),
    })));
    addAuditLog('CONFIGURACOES', 'Alteração de Ano Letivo Ativo', `Ano letivo ID ${id} definido como ativo.`);
  }, [addAuditLog]);

  const addAcademicYear = useCallback((yearData: Omit<AcademicYear, 'id'>) => {
    const id = `AY-${yearData.code.replace('/', '-')}`;
    const newYear: AcademicYear = { 
      ...yearData, 
      id, 
      name: yearData.name || yearData.code,
      enrollmentStatus: yearData.enrollmentStatus || 'ABERTO',
      confirmationStatus: yearData.confirmationStatus || 'ABERTO',
    };
    setAcademicYears(prev => [newYear, ...prev]);
    addAuditLog('CONFIGURACOES', 'Criação de Ano Letivo', `Ano letivo ${yearData.code} adicionado.`);
  }, [addAuditLog]);

  const updateAcademicYear = useCallback((id: string, yearData: Partial<AcademicYear>) => {
    setAcademicYears(prev => prev.map(y => y.id === id ? { ...y, ...yearData } : y));
    addAuditLog('CONFIGURACOES', 'Edição de Ano Letivo', `Ano letivo ID ${id} atualizado.`);
  }, [addAuditLog]);

  const toggleEnrollmentPeriod = useCallback((academicYearId: string) => {
    setAcademicYears(prev => prev.map(y => {
      if (y.id === academicYearId) {
        const nextStatus = y.enrollmentStatus === 'ABERTO' ? 'FECHADO' : 'ABERTO';
        addAuditLog('SECRETARIA', 'Alteração do Período de Matrículas', `Período de Matrículas do ano ${y.code} alterado para: ${nextStatus}`);
        return { ...y, enrollmentStatus: nextStatus };
      }
      return y;
    }));
  }, [addAuditLog]);

  const toggleConfirmationPeriod = useCallback((academicYearId: string) => {
    setAcademicYears(prev => prev.map(y => {
      if (y.id === academicYearId) {
        const nextStatus = y.confirmationStatus === 'ABERTO' ? 'FECHADO' : 'ABERTO';
        addAuditLog('SECRETARIA', 'Alteração do Período de Confirmações', `Período de Confirmações do ano ${y.code} alterado para: ${nextStatus}`);
        return { ...y, confirmationStatus: nextStatus };
      }
      return y;
    }));
  }, [addAuditLog]);

  // Financial Services Management (Admin & Gestor)
  const addFinancialService = useCallback((serviceData: Omit<FinancialService, 'id' | 'createdAt' | 'updatedAt'>): FinancialService => {
    const id = `SRV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const newService: FinancialService = {
      ...serviceData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setFinancialServices(prev => [newService, ...prev]);
    addAuditLog('FINANCEIRO', 'Cadastro de Serviço Financeiro', `Novo serviço/produto cadastrado: ${newService.name} (${newService.basePrice} Kz)`);
    return newService;
  }, [addAuditLog]);

  const updateFinancialService = useCallback((id: string, data: Partial<FinancialService>) => {
    const now = new Date().toISOString();
    setFinancialServices(prev => prev.map(s => s.id === id ? { ...s, ...data, updatedAt: now } : s));
    addAuditLog('FINANCEIRO', 'Atualização de Serviço Financeiro', `Serviço financeiro ID ${id} atualizado.`);
  }, [addAuditLog]);

  const deleteFinancialService = useCallback((id: string) => {
    const srv = financialServices.find(s => s.id === id);
    setFinancialServices(prev => prev.filter(s => s.id !== id));
    addAuditLog('FINANCEIRO', 'Remoção de Serviço Financeiro', `Serviço financeiro ${srv?.name || id} removido do catálogo.`);
  }, [financialServices, addAuditLog]);

  const toggleFinancialServiceStatus = useCallback((id: string) => {
    setFinancialServices(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
        addAuditLog('FINANCEIRO', 'Alteração de Estado de Serviço', `Serviço ${s.name} alterado para: ${nextStatus}`);
        return { ...s, status: nextStatus, updatedAt: new Date().toISOString() };
      }
      return s;
    }));
  }, [addAuditLog]);

  const addTurma = useCallback((turmaData: Omit<Turma, 'id'>) => {
    const id = `TRM-${Date.now()}`;
    const newTurma: Turma = { ...turmaData, id };
    setTurmas(prev => [...prev, newTurma]);
    addAuditLog('PEDAGOGICO', 'Criação de Turma', `Nova turma criada: ${newTurma.name} (${newTurma.shift})`);
  }, [addAuditLog]);

  const addTeacher = useCallback((teacherData: Omit<Teacher, 'id'>) => {
    const id = `TCH-${String(Date.now()).slice(-4)}`;
    const newTeacher: Teacher = { ...teacherData, id };
    setTeachers(prev => [...prev, newTeacher]);
    addAuditLog('PEDAGOGICO', 'Registo de Docente', `Professor registado: ${newTeacher.name} (BI: ${newTeacher.biNumber})`);
  }, [addAuditLog]);

  const updateTeacher = useCallback((id: string, teacherData: Partial<Teacher>) => {
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...teacherData } : t));
    addAuditLog('PEDAGOGICO', 'Atualização de Docente', `Dados do professor ID ${id} atualizados.`);
  }, [addAuditLog]);

  const addCurricularAssignment = useCallback((assignmentData: Omit<CurricularAssignment, 'id'>) => {
    const id = `ASG-${Date.now()}`;
    const newAssignment: CurricularAssignment = { ...assignmentData, id };
    setAssignments(prev => [...prev, newAssignment]);
    addAuditLog('PEDAGOGICO', 'Atribuição Docente', `Docente atribuído à disciplina ID ${assignmentData.subjectId} na turma ID ${assignmentData.turmaId}`);
  }, [addAuditLog]);

  const deleteCurricularAssignment = useCallback((id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    addAuditLog('PEDAGOGICO', 'Remoção de Atribuição Docente', `Atribuição ID ${id} removida.`);
  }, [addAuditLog]);

  const enrollStudent = useCallback((studentData: Omit<Student, 'id' | 'studentNumber' | 'enrollmentDate'>): Student => {
    const currentNumber = students.length + 1;
    const id = `EST-${new Date().getFullYear()}-${String(currentNumber).padStart(3, '0')}`;
    
    const newStudent: Student = {
      ...studentData,
      id,
      studentNumber: currentNumber,
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'PENDENTE_PAGAMENTO',
    };

    setStudents(prev => [newStudent, ...prev]);
    addAuditLog('SECRETARIA', 'Nova Inscrição / Matrícula', `Estudante registado com estado PENDENTE DE PAGAMENTO: ${newStudent.fullName} (Aguardando 1ª propina e cartão).`);
    return newStudent;
  }, [students.length, addAuditLog]);

  const updateStudent = useCallback((id: string, data: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    addAuditLog('SECRETARIA', 'Atualização de Estudante', `Ficha do estudante ID ${id} atualizada.`);
  }, [addAuditLog]);

  const updateAssessmentSchedule = useCallback((assignmentId: string, trimester: 1 | 2 | 3, macDate: string, nptDate: string) => {
    if (currentUser?.role !== 'DIRECAO_PEDAGOGICA') {
      return;
    }
    setAssessmentSchedules(prev => {
      const idx = prev.findIndex(s => s.assignmentId === assignmentId && s.trimester === trimester);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], macDate, nptDate };
        return updated;
      }
      return [
        ...prev,
        {
          id: `SCH-${Date.now()}`,
          assignmentId,
          trimester,
          macDate,
          nptDate,
        }
      ];
    });
    addAuditLog('PEDAGOGICO', 'Alteração do Calendário de Avaliações', `Datas marcadas de MAC (${macDate}) e NPT (${nptDate}) atualizadas pelo Diretor Pedagógico (${currentUser?.name}).`);
  }, [currentUser?.role, currentUser?.name, addAuditLog]);

  const saveMinipautaGrades = useCallback((newOrUpdatedGrades: Omit<GradeRecord, 'id' | 'updatedAt' | 'updatedBy'>[]) => {
    setGrades(prev => {
      const updated = [...prev];
      const now = new Date().toISOString();
      const updatedBy = currentUser?.name || 'Docente';

      for (const item of newOrUpdatedGrades) {
        const index = updated.findIndex(g => 
          g.studentId === item.studentId &&
          g.assignmentId === item.assignmentId &&
          g.trimester === item.trimester
        );

        if (index >= 0) {
          updated[index] = {
            ...updated[index],
            ...item,
            mt: calculateMT(item.mac, item.npt),
            updatedAt: now,
            updatedBy,
          };
        } else {
          updated.push({
            ...item,
            id: `GRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            mt: calculateMT(item.mac, item.npt),
            updatedAt: now,
            updatedBy,
          });
        }
      }
      return updated;
    });

    addAuditLog('PEDAGOGICO', 'Lançamento de Notas na Minipauta', `Lançadas/atualizadas notas de ${newOrUpdatedGrades.length} registo(s) de avaliação (Fórmula MT = MAC 50% + NPT 50%).`);
  }, [currentUser?.name, addAuditLog]);

  const processMultiPayment = useCallback((
    studentId: string,
    items: Omit<PaymentItem, 'id'>[],
    paymentMethod: PaymentMethod,
    bankReference?: string
  ): PaymentReceipt => {
    const student = students.find(s => s.id === studentId);
    if (!student) throw new Error('Estudante não encontrado.');

    const receiptSeq = receipts.length + 1;
    const receiptNumber = `RC-${new Date().getFullYear()}/${String(receiptSeq).padStart(5, '0')}`;
    const issuedAt = new Date().toISOString();
    
    const subtotal = items.reduce((acc, item) => acc + item.baseAmount, 0);
    const totalLateFee = items.reduce((acc, item) => acc + item.lateFee, 0);
    const totalPaid = items.reduce((acc, item) => acc + item.totalAmount, 0);

    const fullItems: PaymentItem[] = items.map((it, idx) => ({
      ...it,
      id: `ITEM-${Date.now()}-${idx}`,
    }));

    const hashVerification = generateVerificationHash();

    const newReceipt: PaymentReceipt = {
      id: `RCP-${Date.now()}`,
      receiptNumber,
      studentId: student.id,
      studentName: student.fullName,
      studentBi: student.biNumber,
      turmaName: student.turmaName || 'Turma Atribuída',
      courseName: student.courseName || 'Geral',
      issuedAt,
      cashierUserId: currentUser?.id || 'USR-OP',
      cashierName: currentUser?.name || 'Operador de Caixa',
      items: fullItems,
      subtotal,
      totalLateFee,
      totalPaid,
      paymentMethod,
      bankReference,
      status: 'EMITIDO',
      hashVerification,
    };

    setReceipts(prev => [newReceipt, ...prev]);

    // Auto-activate enrollment if student was pending and now paid 1st month tuition and student card
    if (student.status === 'PENDENTE_PAGAMENTO') {
      const allUpdatedReceipts = [newReceipt, ...receipts];
      const check = isEnrollmentRequirementsFulfilled(student.id, allUpdatedReceipts, activeAcademicYear);
      if (check.fulfilled) {
        setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: 'MATRICULADO' } : s));
        addAuditLog('SECRETARIA', 'Efetivação de Matrícula', `Matrícula ativada com sucesso para ${student.fullName} (${student.id}) após liquidação da 1ª propina e cartão.`);
      }
    }

    addAuditLog('CAIXA_FINANCAS', 'Emissão de Recibo de Pagamento', `Recibo ${receiptNumber} emitido no valor de ${totalPaid} Kz para ${student.fullName}`);
    return newReceipt;
  }, [students, receipts, activeAcademicYear, currentUser?.id, currentUser?.name, addAuditLog]);

  const cancelReceipt = useCallback((receiptId: string, reason: string) => {
    setReceipts(prev => prev.map(r => r.id === receiptId ? {
      ...r,
      status: 'ANULADO',
    } : r));

    addAuditLog('CAIXA_FINANCAS', 'Anulação de Recibo', `Recibo ID ${receiptId} anulado. Motivo: ${reason}`);
  }, [addAuditLog]);

  const addExpense = useCallback((expenseData: Omit<ExpenseRecord, 'id' | 'registeredBy' | 'date'> & { date?: string }) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: `EXP-${Date.now()}`,
      registeredBy: currentUser?.name || 'Tesouraria',
      date: expenseData.date || new Date().toISOString().split('T')[0],
    };

    setExpenses(prev => [newExpense, ...prev]);
    addAuditLog('FINANCEIRO', 'Registo de Despesa', `Despesa de ${newExpense.amount} Kz registada: ${newExpense.description}`);
  }, [currentUser?.name, addAuditLog]);

  const createDocumentRequest = useCallback((reqData: any): DocumentRequest => {
    const seq = requests.length + 1;
    const requestNumber = `REQ-${new Date().getFullYear()}/${String(seq).padStart(4, '0')}`;
    const student = students.find(s => s.id === reqData.studentId);
    const turma = turmas.find(t => t.id === student?.turmaId);
    const course = courses.find(c => c.id === student?.courseId);
    
    const newReq: DocumentRequest = {
      ...reqData,
      id: `REQ-${Date.now()}`,
      requestNumber,
      protocolNumber: requestNumber,
      studentName: student?.fullName || reqData.studentName || 'Estudante',
      studentBi: student?.biNumber || reqData.studentBi || '',
      turmaName: turma?.name || student?.turmaName || 'Turma Geral',
      courseName: course?.name || student?.courseName || 'Ensino Geral',
      requestDate: new Date().toISOString().split('T')[0],
      requestedAt: new Date().toISOString(),
      status: 'PENDENTE',
      documentType: reqData.type || reqData.documentType || 'DECLARACAO_SEM_NOTAS',
      type: reqData.type || reqData.documentType || 'DECLARACAO_SEM_NOTAS',
    };

    setRequests(prev => [newReq, ...prev]);
    addAuditLog('DOCUMENTOS', 'Solicitação de Documento', `Requerimento ${requestNumber} emitido para estudante ${student?.fullName || reqData.studentId}`);
    return newReq;
  }, [requests.length, students, turmas, courses, addAuditLog]);

  const updateRequestStatus = useCallback((id: string, status: DocumentRequest['status'], notes?: string) => {
    setRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status,
      notes: notes || r.notes,
    } : r));

    addAuditLog('DOCUMENTOS', 'Atualização de Estado de Requerimento', `Requerimento ID ${id} alterado para estado: ${status}`);
  }, [addAuditLog]);

  const addTimetableSlot = useCallback((slotData: Omit<TimetableSlot, 'id'>) => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `SLOT-${Date.now()}`,
    };
    setTimetable(prev => [...prev, newSlot]);
    addAuditLog('PEDAGOGICO', 'Adição de Horário Escolar', `Tempo lectivo adicionado: ${slotData.dayOfWeek} (${slotData.periodTime})`);
  }, [addAuditLog]);

  const deleteTimetableSlot = useCallback((id: string) => {
    setTimetable(prev => prev.filter(s => s.id !== id));
    addAuditLog('PEDAGOGICO', 'Remoção de Horário Escolar', `Tempo lectivo ID ${id} removido.`);
  }, [addAuditLog]);

  const addExamSchedule = useCallback((examData: Omit<ExamSchedule, 'id'>) => {
    const newExam: ExamSchedule = {
      ...examData,
      id: `EXAM-${Date.now()}`,
    };
    setExamSchedules(prev => [...prev, newExam]);
    addAuditLog('PEDAGOGICO', 'Calendário de Provas', `Prova agendada para ${examData.examDate} (${examData.examTime})`);
  }, [addAuditLog]);

  const resetToDefaultData = useCallback(() => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setIsAuthenticated(false);
    setInstitution(INSTITUTION_INFO);
    setAcademicYears(INITIAL_ACADEMIC_YEARS);
    setFinancialServices(INITIAL_FINANCIAL_SERVICES);
    setTurmas(INITIAL_TURMAS);
    setTeachers(INITIAL_TEACHERS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setStudents(INITIAL_STUDENTS);
    setGrades(INITIAL_GRADES);
    setReceipts(INITIAL_RECEIPTS);
    setExpenses(INITIAL_EXPENSES);
    setRequests(INITIAL_REQUESTS);
    setTimetable(INITIAL_TIMETABLE);
    setExamSchedules(INITIAL_EXAMS);
    setAssessmentSchedules(INITIAL_ASSESSMENT_SCHEDULES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // RBAC Flags
  const role = currentUser?.role;
  const isGestorReadOnly = role === 'GESTOR';

  const canEnrollStudent = (role === 'SECRETARIA' || role === 'ADMIN') && !isGestorReadOnly;
  const canProcessPayments = (role === 'SECRETARIA' || role === 'ADMIN') && !isGestorReadOnly;
  const canRegisterTeacher = (role === 'DIRECAO_PEDAGOGICA' || role === 'ADMIN') && !isGestorReadOnly;
  const canAssignCurricular = (role === 'DIRECAO_PEDAGOGICA' || role === 'ADMIN') && !isGestorReadOnly;
  const canEnterGrades = (role === 'PROFESSOR') && !isGestorReadOnly;
  const canManageFinances = (role === 'FINANCAS' || role === 'ADMIN') && !isGestorReadOnly;
  const canManageAcademicYears = role === 'ADMIN' || role === 'GESTOR';
  const canManageFinancialServices = role === 'ADMIN' || role === 'GESTOR';
  const canManageUsers = (role === 'ADMIN' || role === 'GESTOR');

  return (
    <SchoolContext.Provider
      value={{
        currentUser,
        users,
        allUsers: users,
        isAuthenticated,
        setCurrentUser,
        switchRole,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        updateUserProfile,
        getRoleUserCount,
        isRoleQuotaReached,
        institution,
        updateInstitution,
        academicYears,
        activeAcademicYear,
        courses,
        classes,
        turmas,
        setActiveAcademicYearId,
        setActiveAcademicYear: setActiveAcademicYearId,
        addAcademicYear,
        updateAcademicYear,
        toggleEnrollmentPeriod,
        toggleConfirmationPeriod,
        addTurma,
        teachers,
        subjects,
        assignments,
        addTeacher,
        updateTeacher,
        addCurricularAssignment,
        addAssignment: addCurricularAssignment,
        deleteCurricularAssignment,
        removeAssignment: deleteCurricularAssignment,
        students,
        enrollStudent,
        updateStudent,
        grades,
        saveMinipautaGrades,
        assessmentSchedules,
        updateAssessmentSchedule,
        financialServices,
        addFinancialService,
        updateFinancialService,
        deleteFinancialService,
        toggleFinancialServiceStatus,
        receipts,
        processMultiPayment,
        cancelReceipt,
        expenses,
        addExpense,
        requests,
        createDocumentRequest,
        updateRequestStatus,
        timetable,
        examSchedules,
        addTimetableSlot,
        deleteTimetableSlot,
        addExamSchedule,
        auditLogs,
        addAuditLog,
        canEnrollStudent,
        canProcessPayments,
        canRegisterTeacher,
        canAssignCurricular,
        canAssignDiscipline: canAssignCurricular,
        canEnterGrades,
        canManageFinances,
        canManageAcademicYears,
        canManageFinancialServices,
        canManageUsers,
        isGestorReadOnly,
        resetToDefaultData,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = (): SchoolContextType => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
