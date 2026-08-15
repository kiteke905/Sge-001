import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Student } from '../../types';
import { 
  Users, UserPlus, Search, Filter, Download, 
  CreditCard, FileText, Award, Eye, Edit3, 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { StudentEnrollmentModal } from './StudentEnrollmentModal';
import { StudentCardModal } from './StudentCardModal';
import { StudentHistoryModal } from './StudentHistoryModal';
import { generateEnrollmentFormPDF, generateBoletimNotasPDF } from '../../utils/pdfGenerator';
import { formatDateAO } from '../../utils/formatters';

export const StudentList: React.FC = () => {
  const { 
    students, courses, classes, turmas, canEnrollStudent, 
    assignments, subjects, grades, institution, isGestorReadOnly 
  } = useSchool();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedTurma, setSelectedTurma] = useState('ALL');
  const [selectedShift, setSelectedShift] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal states
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [cardModalStudent, setCardModalStudent] = useState<Student | null>(null);
  const [historyModalStudent, setHistoryModalStudent] = useState<Student | null>(null);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = 
        !searchQuery ||
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.biNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.guardianName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCourse = selectedCourse === 'ALL' || s.courseId === selectedCourse;
      const matchClass = selectedClass === 'ALL' || s.classId === selectedClass;
      const matchTurma = selectedTurma === 'ALL' || s.turmaId === selectedTurma;
      const matchShift = selectedShift === 'ALL' || s.shift === selectedShift;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

      return matchSearch && matchCourse && matchClass && matchTurma && matchShift && matchStatus;
    });
  }, [students, searchQuery, selectedCourse, selectedClass, selectedTurma, selectedShift, selectedStatus]);

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEnrollModalOpen(true);
  };

  const handleOpenNewEnrollment = () => {
    setEditingStudent(null);
    setEnrollModalOpen(true);
  };

  const handleDownloadFicha = (student: Student) => {
    const turma = turmas.find(t => t.id === student.turmaId);
    const course = courses.find(c => c.id === student.courseId);
    const cls = classes.find(c => c.id === student.classId);
    generateEnrollmentFormPDF(
      student, 
      turma?.name || 'Turma A', 
      course?.name || 'Geral', 
      cls?.name || '10ª Classe', 
      institution
    );
  };

  const handleDownloadBoletim = (student: Student) => {
    const turma = turmas.find(t => t.id === student.turmaId);
    const course = courses.find(c => c.id === student.courseId);
    if (turma && course) {
      generateBoletimNotasPDF(
        student, 
        turma, 
        course, 
        assignments, 
        subjects, 
        grades, 
        institution
      );
    } else {
      alert('Turma ou curso do estudante não encontrados para gerar o boletim.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Gestão de Estudantes & Matrículas
            </h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              {filteredStudents.length} Alunos Listados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Módulo oficial da Secretaria Geral para registo, confirmação e emissão de cartões e fichas
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenNewEnrollment}
            disabled={isGestorReadOnly}
            className={`
              px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-2 transition-all
              ${isGestorReadOnly 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98'}
            `}
          >
            <UserPlus className="w-4 h-4" />
            Nova Matrícula / Inscrição
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por Nome, Nº Processo, BI ou Encarregado..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Todos os Cursos</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Todas as Classes</option>
              {classes.map(cl => (
                <option key={cl.id} value={cl.id}>{cl.name}</option>
              ))}
            </select>
          </div>

          {/* Turma Filter */}
          <div>
            <select
              value={selectedTurma}
              onChange={e => setSelectedTurma(e.target.value)}
              className="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Todas as Turmas</option>
              {turmas.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.shift})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary quick filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-semibold">Turno:</span>
            {['ALL', 'MANHA', 'TARDE', 'NOITE'].map(sh => (
              <button
                key={sh}
                onClick={() => setSelectedShift(sh)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedShift === sh 
                    ? 'bg-slate-900 text-white font-bold' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sh === 'ALL' ? 'Todos' : sh}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-semibold">Estado:</span>
            {['ALL', 'CONFIRMADO', 'MATRICULADO'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedStatus === st 
                    ? 'bg-blue-600 text-white font-bold' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Todos' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-12 text-center">Nº</th>
                <th className="p-3.5">Estudante & Processo</th>
                <th className="p-3.5">Bilhete de Identidade</th>
                <th className="p-3.5">Turma & Curso</th>
                <th className="p-3.5">Encarregado</th>
                <th className="p-3.5 text-center">Doc. Entregues</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    Nenhum estudante encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const turma = turmas.find(t => t.id === student.turmaId);
                  const course = courses.find(c => c.id === student.courseId);

                  const docsCount = Object.values(student.documentsSubmitted).filter(Boolean).length;
                  const totalDocs = Object.keys(student.documentsSubmitted).length;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-center font-mono text-slate-400 font-bold">
                        {student.studentNumber}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.photoUrl}
                            alt={student.fullName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              {student.fullName}
                            </span>
                            <span className="text-[10px] font-mono text-blue-600 font-semibold">
                              {student.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-700">
                        {student.biNumber}
                      </td>

                      <td className="p-3.5">
                        <span className="font-medium text-slate-800 block">
                          {turma?.name || 'Turma A'}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block max-w-[140px]">
                          {course?.name}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-medium text-slate-800 block">
                          {student.guardianName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {student.guardianPhone}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          docsCount >= 4 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {docsCount}/{totalDocs} Docs
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {student.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Cartão de Estudante */}
                          <button
                            onClick={() => setCardModalStudent(student)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Ver Cartão Magnético do Estudante"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          {/* Ficha de Matrícula PDF */}
                          <button
                            onClick={() => handleDownloadFicha(student)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Descarregar Ficha Oficial de Matrícula (PDF)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Boletim de Notas PDF */}
                          <button
                            onClick={() => handleDownloadBoletim(student)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Descarregar Boletim de Notas (PDF)"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>

                          {/* Histórico Financeiro */}
                          <button
                            onClick={() => setHistoryModalStudent(student)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                            title="Ver Histórico de Pagamentos & Propinas"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => handleOpenEdit(student)}
                            disabled={isGestorReadOnly}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isGestorReadOnly 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                            title="Editar Cadastro"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <StudentEnrollmentModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        studentToEdit={editingStudent}
      />

      <StudentCardModal
        isOpen={!!cardModalStudent}
        onClose={() => setCardModalStudent(null)}
        student={cardModalStudent}
      />

      <StudentHistoryModal
        isOpen={!!historyModalStudent}
        onClose={() => setHistoryModalStudent(null)}
        student={historyModalStudent}
      />
    </div>
  );
};
