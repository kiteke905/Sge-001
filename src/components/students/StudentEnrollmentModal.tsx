import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Student } from '../../types';
import { 
  X, UserPlus, Upload, CheckSquare, Square, 
  AlertTriangle, Check, Camera, FileCheck 
} from 'lucide-react';
import { generateEnrollmentFormPDF } from '../../utils/pdfGenerator';
import { formatNameInput } from '../../utils/formatters';

interface StudentEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export const StudentEnrollmentModal: React.FC<StudentEnrollmentModalProps> = ({ 
  isOpen, 
  onClose, 
  studentToEdit 
}) => {
  const { 
    courses, classes, turmas, activeAcademicYear, students,
    enrollStudent, updateStudent, canEnrollStudent, isGestorReadOnly, institution 
  } = useSchool();

  const [formData, setFormData] = useState({
    fullName: studentToEdit?.fullName || '',
    biNumber: studentToEdit?.biNumber || '',
    birthDate: studentToEdit?.birthDate || '2008-05-15',
    gender: (studentToEdit?.gender || 'M') as 'M' | 'F',
    naturality: studentToEdit?.naturality || 'Luanda',
    province: studentToEdit?.province || 'Luanda',
    address: studentToEdit?.address || '',
    phone: studentToEdit?.phone || '+244 9',
    email: studentToEdit?.email || '',
    photoUrl: studentToEdit?.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    
    // Guardian
    guardianName: studentToEdit?.guardianName || '',
    guardianPhone: studentToEdit?.guardianPhone || '+244 9',
    guardianKinship: studentToEdit?.guardianKinship || 'Pai',
    guardianProfession: studentToEdit?.guardianProfession || '',

    // Academic
    enrollmentType: (studentToEdit?.enrollmentType || 'NOVA_MATRICULA') as 'NOVA_MATRICULA' | 'CONFIRMACAO',
    academicYearId: studentToEdit?.academicYearId || activeAcademicYear?.id || 'AY-2025-2026',
    courseId: studentToEdit?.courseId || (courses[0]?.id || ''),
    classId: studentToEdit?.classId || 'CLS-10',
    turmaId: studentToEdit?.turmaId || (turmas[0]?.id || ''),
    shift: (studentToEdit?.shift || 'MANHA') as 'MANHA' | 'TARDE' | 'NOITE',
    status: (studentToEdit?.status || 'PENDENTE_PAGAMENTO') as Student['status'],

    // Documents Checklist
    documentsSubmitted: {
      biCopy: studentToEdit?.documentsSubmitted?.biCopy ?? true,
      passPhoto: studentToEdit?.documentsSubmitted?.passPhoto ?? true,
      previousCertificate: studentToEdit?.documentsSubmitted?.previousCertificate ?? true,
      medicalAttestation: studentToEdit?.documentsSubmitted?.medicalAttestation ?? true,
      militaryDeclaration: studentToEdit?.documentsSubmitted?.militaryDeclaration ?? false,
    },
  });

  const [downloadPdfAfter, setDownloadPdfAfter] = useState(true);

  if (!isOpen) return null;

  // Duplicate Check: compare normalized name and BI
  const normalizedInputName = (formData.fullName || '').trim().toLowerCase();
  const normalizedInputBi = (formData.biNumber || '').trim().toUpperCase();

  const duplicateStudent = (normalizedInputName.length > 2 && normalizedInputBi.length > 3)
    ? students.find(s => 
        (!studentToEdit || s.id !== studentToEdit.id) &&
        s.fullName.trim().toLowerCase() === normalizedInputName &&
        s.biNumber.trim().toUpperCase() === normalizedInputBi
      )
    : undefined;

  // Filter turmas by course/class
  const filteredTurmas = turmas.filter(t => 
    (!formData.courseId || t.courseId === formData.courseId) &&
    (!formData.classId || t.classId === formData.classId)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEnrollStudent) {
      alert('Aviso de Restrição RBAC: O seu perfil atual não tem permissão para realizar matrículas ou alterações de estudantes.');
      return;
    }

    if (!formData.fullName || !formData.biNumber || !formData.guardianName || !formData.turmaId) {
      alert('Por favor, preencha todos os campos obrigatórios assinalados com (*).');
      return;
    }

    // Strict validation: Prevent duplicate registration if name and BI are equal
    if (duplicateStudent) {
      alert(
        `⚠️ REGISTO NÃO PERMITIDO (DUPLICIDADE DETETADA):\n\n` +
        `Já existe um estudante registado no sistema com o mesmo Nome Completo ("${duplicateStudent.fullName}") e mesmo Número de BI ("${duplicateStudent.biNumber}").\n\n` +
        `• Número de Processo: ${duplicateStudent.id}\n` +
        `• Turma Atual: ${duplicateStudent.turmaName || 'N/A'}\n` +
        `• Estado Atual: ${duplicateStudent.status}\n\n` +
        `O sistema não permite duplicar matrículas com nome e BI idênticos.`
      );
      return;
    }

    try {
      if (studentToEdit) {
        updateStudent(studentToEdit.id, formData);
        alert(`Dados do estudante ${formData.fullName} atualizados com sucesso!`);
      } else {
        const newStudent = enrollStudent(formData);
        if (downloadPdfAfter) {
          const turma = turmas.find(t => t.id === newStudent.turmaId);
          const course = courses.find(c => c.id === newStudent.courseId);
          const cls = classes.find(c => c.id === newStudent.classId);
          generateEnrollmentFormPDF(
            newStudent, 
            turma?.name || 'Turma A', 
            course?.name || 'Geral', 
            cls?.name || '10ª Classe',
            institution
          );
        }
        alert(
          `Matrícula/Inscrição registada com sucesso!\n\n` +
          `• Nome: ${newStudent.fullName}\n` +
          `• Nº de Processo: ${newStudent.id}\n` +
          `• Estado: Pendente de Pagamento\n\n` +
          `ℹ️ A matrícula ficará pendente até que sejam liquidados no Caixa POS os 3 pagamentos obrigatórios:\n` +
          `1. ${formData.enrollmentType === 'CONFIRMACAO' ? 'Taxa de Confirmação de Matrícula' : 'Taxa de Nova Matrícula'}\n` +
          `2. 1º Mês de Propinas (${activeAcademicYear?.tuitionMonths?.[0] || 'Setembro'})\n` +
          `3. Cartão de Estudante`
        );
      }
      onClose();
    } catch (err: any) {
      alert(err.message || 'Ocorreu um erro ao processar a matrícula.');
    }
  };

  const handleDocToggle = (key: keyof typeof formData.documentsSubmitted) => {
    setFormData(prev => ({
      ...prev,
      documentsSubmitted: {
        ...prev.documentsSubmitted,
        [key]: !prev.documentsSubmitted[key],
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {studentToEdit ? 'Editar Dados do Estudante' : 'Registo de Nova Matrícula & Confirmação'}
              </h2>
              <p className="text-xs text-slate-500">
                Módulo da Secretaria Geral • Ano Letivo {activeAcademicYear?.code || '2025/2026'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notice */}
        {!studentToEdit && (
          <div className="bg-amber-50/90 border-b border-amber-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-start sm:items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <strong>Regulamento de Efetivação de Matrícula:</strong> A inscrição é registada como <strong>Pendente de Pagamento</strong> e apenas é ativada após liquidação obrigatória de:
                <span className="font-semibold text-amber-950"> 1. Taxa de {formData.enrollmentType === 'CONFIRMACAO' ? 'Confirmação' : 'Matrícula'}</span> + 
                <span className="font-semibold text-amber-950"> 2. 1ª Propina ({activeAcademicYear?.tuitionMonths?.[0] || 'Setembro'})</span> + 
                <span className="font-semibold text-amber-950"> 3. Cartão de Estudante</span>.
              </div>
            </div>
            {activeAcademicYear?.enrollmentStatus === 'FECHADO' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0 self-start sm:self-auto">
                Período Encerrado
              </span>
            )}
          </div>
        )}

        {/* Real-time duplicate error banner */}
        {duplicateStudent && (
          <div className="bg-rose-50 border-b border-rose-300 px-6 py-3 flex items-start gap-3 text-xs text-rose-900 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-black text-rose-950">
                Atenção: Estudante Já Registado no Sistema!
              </strong>
              <p className="mt-0.5 text-rose-800">
                Já existe um estudante com o mesmo Nome Completo (<strong>{duplicateStudent.fullName}</strong>) e mesmo BI (<strong>{duplicateStudent.biNumber}</strong>) registado sob o Nº de Processo <strong>{duplicateStudent.id}</strong> na turma <strong>{duplicateStudent.turmaName || 'N/A'}</strong>. O sistema não permite registar uma nova matrícula para este aluno.
              </p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 0: Tipo de Inscrição */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">
              Tipo de Processo / Inscrição *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                formData.enrollmentType === 'NOVA_MATRICULA' 
                  ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20' 
                  : 'border-slate-200 bg-white hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="enrollmentType"
                  value="NOVA_MATRICULA"
                  checked={formData.enrollmentType === 'NOVA_MATRICULA'}
                  onChange={() => setFormData({ ...formData, enrollmentType: 'NOVA_MATRICULA' })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <strong className="block text-xs font-bold text-slate-900">Nova Matrícula (Estudante Novo)</strong>
                  <span className="text-[11px] text-slate-500">Aplica Taxa de Matrícula + 1ª Propina + Cartão</span>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                formData.enrollmentType === 'CONFIRMACAO' 
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20' 
                  : 'border-slate-200 bg-white hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  name="enrollmentType"
                  value="CONFIRMACAO"
                  checked={formData.enrollmentType === 'CONFIRMACAO'}
                  onChange={() => setFormData({ ...formData, enrollmentType: 'CONFIRMACAO' })}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <strong className="block text-xs font-bold text-slate-900">Confirmação de Matrícula (Renovação / Transição)</strong>
                  <span className="text-[11px] text-slate-500">Aplica Taxa de Confirmação + 1ª Propina + Cartão</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 1: Personal Data & Photo */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">1</span>
              Dados Pessoais do Estudante
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Photo selector */}
              <div className="md:col-span-1 flex flex-col items-center justify-center p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50">
                <img
                  src={formData.photoUrl}
                  alt="Foto tipo passe"
                  className="w-24 h-28 object-cover rounded-lg border-2 border-white shadow-md mb-2"
                />
                <label className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> Alterar Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setFormData(prev => ({ ...prev, photoUrl: url }));
                      }
                    }}
                  />
                </label>
                <span className="text-[10px] text-slate-400 mt-1">Formato 3x4 Tipo Passe</span>
              </div>

              {/* Personal fields */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo do Estudante *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: formatNameInput(e.target.value) })}
                    placeholder="Ex: Adão Baptista Mukendi"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bilhete de Identidade (BI) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.biNumber}
                    onChange={e => setFormData({ ...formData, biNumber: e.target.value.toUpperCase() })}
                    placeholder="Ex: 004829104LA042"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gênero *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="M">Masculino (M)</option>
                    <option value="F">Feminino (F)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Naturalidade / Província
                  </label>
                  <input
                    type="text"
                    value={formData.naturality}
                    onChange={e => setFormData({ ...formData, naturality: formatNameInput(e.target.value) })}
                    placeholder="Ex: Maianga, Luanda"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço de Residência
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ex: Bairro Alvalade, Rua Comandante Gika, Casa 45"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone de Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+244 9XX XXX XXX"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correio Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="aluno@email.com"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Encarregado de Educação */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">2</span>
              Filiação & Encarregado de Educação
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Encarregado(a) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.guardianName}
                  onChange={e => setFormData({ ...formData, guardianName: formatNameInput(e.target.value) })}
                  placeholder="Ex: João Baptista Mukendi"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grau de Parentesco *
                </label>
                <select
                  value={formData.guardianKinship}
                  onChange={e => setFormData({ ...formData, guardianKinship: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Pai">Pai</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Tio(a)">Tio(a)</option>
                  <option value="Irmão/Irmã">Irmão/Irmã</option>
                  <option value="Tutor Legal">Tutor Legal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone Encarregado *
                </label>
                <input
                  type="text"
                  required
                  value={formData.guardianPhone}
                  onChange={e => setFormData({ ...formData, guardianPhone: e.target.value })}
                  placeholder="+244 9XX XXX XXX"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profissão do Encarregado
                </label>
                <input
                  type="text"
                  value={formData.guardianProfession}
                  onChange={e => setFormData({ ...formData, guardianProfession: formatNameInput(e.target.value) })}
                  placeholder="Ex: Engenheiro Civil / Docente"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Academic Allocation */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">3</span>
              Enquadramento Curricular & Turma
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Curso / Ramo *
                </label>
                <select
                  value={formData.courseId}
                  onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Classe *
                </label>
                <select
                  value={formData.classId}
                  onChange={e => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {classes.map(cl => (
                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Turma Atribuída *
                </label>
                <select
                  required
                  value={formData.turmaId}
                  onChange={e => setFormData({ ...formData, turmaId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Selecione a Turma...</option>
                  {(filteredTurmas.length > 0 ? filteredTurmas : turmas).map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.shift})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Turno
                </label>
                <select
                  value={formData.shift}
                  onChange={e => setFormData({ ...formData, shift: e.target.value as any })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="MANHA">Manhã (07:30 - 12:30)</option>
                  <option value="TARDE">Tarde (13:00 - 18:00)</option>
                  <option value="NOITE">Noite (18:30 - 22:30)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Document Verification Checklist */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">4</span>
              Conferência & Checklist de Documentos (Secretaria)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Marque os documentos físicos entregues e conferidos pela secretaria:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div 
                onClick={() => handleDocToggle('biCopy')}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer"
              >
                {formData.documentsSubmitted.biCopy ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="text-xs text-slate-700 font-medium">Cópia do Bilhete de Identidade / Assento</span>
              </div>

              <div 
                onClick={() => handleDocToggle('passPhoto')}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer"
              >
                {formData.documentsSubmitted.passPhoto ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="text-xs text-slate-700 font-medium">4 Fotografias Tipo Passe</span>
              </div>

              <div 
                onClick={() => handleDocToggle('previousCertificate')}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer"
              >
                {formData.documentsSubmitted.previousCertificate ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="text-xs text-slate-700 font-medium">Certificado / Declaração com Notas Anterior</span>
              </div>

              <div 
                onClick={() => handleDocToggle('medicalAttestation')}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 cursor-pointer"
              >
                {formData.documentsSubmitted.medicalAttestation ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="text-xs text-slate-700 font-medium">Atestado Médico de Aptidão</span>
              </div>
            </div>

            {!studentToEdit && (
              <label className="flex items-center gap-2 mt-3 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={downloadPdfAfter}
                  onChange={e => setDownloadPdfAfter(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-blue-900">
                  Gerar e descarregar automaticamente a Ficha Oficial de Matrícula em PDF após gravar
                </span>
              </label>
            )}
          </div>

          {/* Footer Submit */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isGestorReadOnly}
              className={`
                px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-2 transition-colors
                ${isGestorReadOnly 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              <Check className="w-4 h-4" />
              {studentToEdit ? 'Salvar Alterações' : 'Concluir Matrícula & Emitir Ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
