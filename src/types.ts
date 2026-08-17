export type UserRole = 
  | 'ADMIN' 
  | 'GESTOR' 
  | 'DIRECAO_PEDAGOGICA' 
  | 'PROFESSOR' 
  | 'SECRETARIA' 
  | 'FINANCAS';

export const ROLE_QUOTAS: Record<UserRole, number> = {
  ADMIN: 1,
  GESTOR: 1,
  DIRECAO_PEDAGOGICA: 1,
  FINANCAS: 1,
  SECRETARIA: 2,
  PROFESSOR: 50,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador do Sistema',
  GESTOR: 'Gestor (Supervisão)',
  DIRECAO_PEDAGOGICA: 'Direção Pedagógica',
  FINANCAS: 'Tesouraria & Finanças',
  SECRETARIA: 'Secretaria Geral',
  PROFESSOR: 'Docente Titular',
};

export interface UserDocumentAttachment {
  name: string;
  url: string;
  size?: string;
  uploadDate: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  role: UserRole;
  avatar?: string;
  biNumber?: string;
  academicDegree?: 'BACHAREL' | 'LICENCIATURA' | 'MESTRADO' | 'DOUTORAMENTO' | 'ENSINO_MEDIO';
  teacherId?: string; // If role === 'PROFESSOR'
  phone?: string;
  status: 'ATIVO' | 'INATIVO';
  createdAt?: string;
  lastLogin?: string;
  
  // Mandatory Document Attachments for registration
  documents?: {
    passPhoto?: string;
    biDocument?: UserDocumentAttachment;
    certificateDoc?: UserDocumentAttachment;
    diplomaDoc?: UserDocumentAttachment;
  };
}

export interface InstitutionInfo {
  name: string;
  subTitle?: string;
  logoUrl?: string; // Custom Logo for header & official documents
  republicHeader?: string;
  ministryHeader?: string;
  provincialHeader?: string;
  nif: string;
  decreeNumber: string;
  address: string;
  city?: string;
  province: string;
  phone: string;
  email: string;
  directorName?: string;
  directorGeneral?: string;
  directorPedagogico?: string;
  pedagogicalDirectorName?: string;
  chiefSecretaria?: string;
  secretariatHeadName?: string;
  currency?: string;
}

export interface AcademicYear {
  id: string;
  code: string; // e.g. "2025/2026"
  name?: string; // Alias
  startDate: string;
  endDate: string;
  status: 'PLANEADO' | 'ATIVO' | 'ENCERRADO';
  currentTrimester: 1 | 2 | 3;
  // Enrollment and Confirmation Periods (Admin/Gestor exclusive control)
  enrollmentStartDate?: string;
  enrollmentEndDate?: string;
  enrollmentStatus?: 'ABERTO' | 'FECHADO';
  confirmationStartDate?: string;
  confirmationEndDate?: string;
  confirmationStatus?: 'ABERTO' | 'FECHADO';
  startMonth?: string;
  tuitionMonths?: string[]; // 10 months list for this academic year
}

export interface Course {
  id: string;
  name: string;
  code: string; // e.g. "CFB", "CEJ", "INF", "EG"
  type: 'PUNIV' | 'TECNICO' | 'ENSINO_GERAL' | 'PRIMARIO';
  durationYears: number;
  description?: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "10ª Classe", "11ª Classe", "12ª Classe"
  level: number; // 1 to 13
}

export interface Turma {
  id: string;
  name: string; // e.g. "10ª A", "11ª B - Informática"
  academicYearId: string;
  classId: string;
  courseId: string;
  shift: 'MANHA' | 'TARDE' | 'NOITE';
  roomNumber: string;
  maxCapacity: number;
  directorTeacherId?: string;
}

export interface Teacher {
  id: string;
  name: string;
  biNumber: string;
  academicDegree: 'BACHAREL' | 'LICENCIATURA' | 'MESTRADO' | 'DOUTORAMENTO';
  specialty: string;
  phone: string;
  email: string;
  category: 'EFETIVO' | 'COLABORADOR' | 'CONTRATADO';
  status: 'ATIVO' | 'INATIVO';
  joinDate: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  category: 'NUCLEAR' | 'COMPLEMENTAR' | 'TECNICA' | 'EXTRA';
}

export interface CurricularAssignment {
  id: string;
  academicYearId: string;
  turmaId: string;
  subjectId: string;
  teacherId: string;
  weeklyHours: number;
}

export interface Student {
  id: string; // e.g. "EST-2025-001"
  fullName: string;
  biNumber: string;
  birthDate: string;
  gender: 'M' | 'F';
  naturality: string; // e.g. "Luanda", "Benguela", "Huíla"
  province: string;
  address: string;
  phone: string;
  email?: string;
  photoUrl: string;
  
  // Guardian / Encarregado
  guardianName: string;
  guardianPhone: string;
  guardianKinship: string; // e.g. "Pai", "Mãe", "Tio", "Tutor Legal"
  guardianProfession?: string;
  
  // Academic allocation
  academicYearId: string;
  courseId: string;
  classId: string;
  turmaId: string;
  turmaName?: string;
  courseName?: string;
  shift: 'MANHA' | 'TARDE' | 'NOITE';
  studentNumber: number; // Número de ordem na turma
  enrollmentDate: string;
  status: 'PENDENTE_PAGAMENTO' | 'MATRICULADO' | 'CONFIRMADO' | 'TRANSFERIDO' | 'DESISTENTE' | 'SUSPENSO';
  
  // Document checklist
  documentsSubmitted: {
    biCopy: boolean;
    passPhoto: boolean;
    previousCertificate: boolean;
    medicalAttestation: boolean;
    militaryDeclaration?: boolean;
  };
}

export interface GradeRecord {
  id: string;
  studentId: string;
  assignmentId: string; // Links to Turma + Subject + Teacher
  trimester: 1 | 2 | 3;
  mac: number; // Média de Avaliação Contínua (0 - 20) [50%]
  npt: number; // Nota de Prova Trimestral (0 - 20) [50%]
  mt: number;  // Média Trimestral calculada = MAC*50% + NPT*50%
  npp?: number; // Antigo campo opcional/legado (descontinuado)
  observations?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ExamGradeRecord {
  id: string;
  studentId: string;
  assignmentId: string; // Links to Turma + Subject + Teacher
  ne?: number;          // Nota de Exame (0 - 20)
  ner?: number;         // Nota de Exame de Recurso (0 - 20)
  observations?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AssessmentSchedule {
  id: string;
  assignmentId: string; // Links to Turma + Subject + Teacher
  trimester: 1 | 2 | 3;
  macDate: string; // Data marcada para Avaliação Contínua (YYYY-MM-DD)
  nptDate: string; // Data marcada para Prova Trimestral (YYYY-MM-DD)
}

export type PaymentServiceType = 
  | 'PROPINA_MENSAL' 
  | 'MATRICULA' 
  | 'CONFIRMACAO' 
  | 'CARTAO_ESTUDANTE' 
  | 'UNIFORME' 
  | 'DECLARACAO' 
  | 'CERTIFICADO' 
  | 'FOLHA_PROVA' 
  | 'RECURSO_EXAME' 
  | 'OUTRO';

export interface PaymentItem {
  id: string;
  serviceType: PaymentServiceType;
  description: string;
  targetMonth?: string; // e.g. "Outubro / 2025" for propinas
  baseAmount: number; // in Kz
  lateFee: number; // Multa in Kz
  quantity: number;
  totalAmount: number;
}

export type PaymentMethod = 'TPA' | 'TRANSFERENCIA' | 'DEPOSITO' | 'NUMERARIO';

export interface PaymentReceipt {
  id: string; // e.g. "REC-2025-00842"
  receiptNumber: string;
  studentId: string;
  studentName: string;
  studentBi: string;
  turmaName: string;
  courseName: string;
  items: PaymentItem[];
  subtotal: number;
  totalLateFee: number;
  totalPaid: number;
  paymentMethod: PaymentMethod;
  bankReference?: string;
  cashierUserId: string;
  cashierName: string;
  issuedAt: string;
  hashVerification: string;
  status: 'EMITIDO' | 'ANULADO';
}

export type ExpenseCategory = 
  | 'SALARIOS' 
  | 'MANUTENCAO' 
  | 'MATERIAL_ESCRITORIO' 
  | 'SERVICOS_PUBLICOS' 
  | 'SERVICOS' 
  | 'EVENTOS' 
  | 'OUTROS'
  | 'OUTRO';

export interface ExpenseRecord {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  recipient: string;
  receiptReference?: string;
  notes?: string;
  registeredBy: string;
}

export type Expense = ExpenseRecord;

export type DocumentRequestType = 
  | 'DECLARACAO_COM_NOTAS' 
  | 'DECLARACAO_SEM_NOTAS' 
  | 'CERTIFICADO_HABILITACOES' 
  | 'CERTIFICADO'
  | 'GUIA_TRANSFERENCIA' 
  | 'CARTAO_2VIA'
  | 'SEGUNDA_VIA_CARTAO';

export interface DocumentRequest {
  id: string;
  requestNumber: string; // e.g. "REQ-2025-0145"
  protocolNumber?: string;
  studentId: string;
  studentName: string;
  studentBi?: string;
  turmaName?: string;
  courseName?: string;
  type?: DocumentRequestType;
  documentType: DocumentRequestType;
  purpose: string; // e.g. "Para efeitos de emprego / Fins bancários / Visto"
  requestDate: string;
  requestedAt?: string;
  deliveryEstimateDate?: string;
  status: 'PENDENTE' | 'EM_PROCESSAMENTO' | 'PRONTO' | 'ENTREGUE';
  issuedAt?: string;
  issuedBy?: string;
  feePaid?: boolean;
  notes?: string;
}

export interface TimetableSlot {
  id: string;
  turmaId: string;
  dayOfWeek: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO';
  periodTime: string; // e.g. "07:30 - 08:15"
  subjectId: string;
  teacherId: string;
}

export interface ExamSchedule {
  id: string;
  academicYearId: string;
  trimester: 1 | 2 | 3;
  turmaId: string;
  subjectId: string;
  examDate: string;
  examTime: string;
  room: string;
  supervisorTeacherId: string;
}

export type ServiceTargetAudience = 
  | 'TODOS' 
  | 'PRIMARIO' 
  | 'I_CICLO' 
  | 'II_CICLO_GERAL' 
  | 'II_CICLO_TECNICO' 
  | 'CURSO_ESPECIFICO' 
  | 'CLASSE_ESPECIFICA';

export interface FinancialService {
  id: string;
  code: string;
  name: string;
  serviceType: PaymentServiceType;
  category: 'PROPINA' | 'MATRICULA' | 'CONFIRMACAO' | 'CARTAO' | 'DOCUMENTO' | 'UNIFORME' | 'OUTRO';
  basePrice: number;
  description?: string;
  isMonthly?: boolean;
  targetAudience: ServiceTargetAudience;
  targetCourseId?: string;
  targetClassId?: string;
  fineEnabled: boolean;
  finePercentage?: number; // e.g. 10 (%)
  fineFixedAmount?: number; // in Kz
  fineDueDay?: number; // e.g. 10 (dia de vencimento do mês)
  fineDescription?: string;
  status: 'ATIVO' | 'INATIVO';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  module: 'AUTENTICACAO' | 'SECRETARIA' | 'PEDAGOGICO' | 'CAIXA_FINANCAS' | 'FINANCEIRO' | 'CONFIGURACOES' | 'DOCUMENTOS' | 'SISTEMA';
  action: string;
  details: string;
  description?: string;
  ipAddress: string;
}
