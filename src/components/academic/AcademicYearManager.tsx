import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { AcademicYear, Turma, Course } from '../../types';
import { 
  Calendar, Layers, Plus, Users, 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  Building, BookOpen, ToggleLeft, ToggleRight,
  Sparkles, Check, X, ArrowRight, UserCheck, UserPlus
} from 'lucide-react';
import { formatDateAO } from '../../utils/formatters';
import { generateAcademicYearTuitionMonths } from '../../utils/academicUtils';

export const AcademicYearManager: React.FC = () => {
  const { 
    academicYears, activeAcademicYear, courses, classes, 
    turmas, addTurma, addAcademicYear, updateAcademicYear, 
    setActiveAcademicYear, toggleEnrollmentPeriod, toggleConfirmationPeriod,
    canManageAcademicYears
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<'TURMAS' | 'YEARS' | 'PERIODS' | 'COURSES'>('TURMAS');
  const [turmaModalOpen, setTurmaModalOpen] = useState(false);
  const [yearModalOpen, setYearModalOpen] = useState(false);

  // Turma Form
  const [turmaForm, setTurmaForm] = useState({
    name: '',
    academicYearId: activeAcademicYear?.id || 'AY-2025-2026',
    courseId: courses[0]?.id || '',
    classId: classes[0]?.id || 'CLS-10',
    shift: 'MANHA' as Turma['shift'],
    roomNumber: 'Sala 05',
    maxCapacity: 45,
  });

  // Year Form
  const [yearForm, setYearForm] = useState({
    code: '2026/2027',
    name: '2026/2027',
    startDate: '2026-09-01',
    endDate: '2027-06-30',
    startMonth: 'Setembro',
    status: 'PLANEADO' as AcademicYear['status'],
    enrollmentStatus: 'ABERTO' as 'ABERTO' | 'FECHADO',
    confirmationStatus: 'ABERTO' as 'ABERTO' | 'FECHADO',
  });

  const handleAddTurma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!turmaForm.name.trim()) return;

    addTurma(turmaForm);
    setTurmaModalOpen(false);
    setTurmaForm({
      name: '',
      academicYearId: activeAcademicYear?.id || 'AY-2025-2026',
      courseId: courses[0]?.id || '',
      classId: classes[0]?.id || 'CLS-10',
      shift: 'MANHA',
      roomNumber: 'Sala 05',
      maxCapacity: 45,
    });
  };

  const handleAddAcademicYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.code.trim()) return;

    const startYear = new Date(yearForm.startDate).getFullYear() || 2026;
    const tuitionMonths = generateAcademicYearTuitionMonths(yearForm.startMonth, startYear);

    addAcademicYear({
      code: yearForm.code,
      name: yearForm.name || yearForm.code,
      startDate: yearForm.startDate,
      endDate: yearForm.endDate,
      startMonth: yearForm.startMonth,
      status: yearForm.status,
      currentTrimester: 1,
      enrollmentStatus: yearForm.enrollmentStatus,
      confirmationStatus: yearForm.confirmationStatus,
      tuitionMonths,
    });

    setYearModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Estrutura Escolar, Anos Letivos & Períodos
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Ano Vigente: {activeAcademicYear?.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Parametrização do calendário letivo, abertura/fecho de matrículas e confirmações, e turmas
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('TURMAS')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'TURMAS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Turmas ({turmas.length})
          </button>
          <button
            onClick={() => setActiveSubTab('PERIODS')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'PERIODS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matrículas & Confirmações
          </button>
          <button
            onClick={() => setActiveSubTab('YEARS')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'YEARS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anos Letivos ({academicYears.length})
          </button>
          <button
            onClick={() => setActiveSubTab('COURSES')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'COURSES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cursos ({courses.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB: TURMAS */}
      {activeSubTab === 'TURMAS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Turmas Cadastradas para o Ano Letivo {activeAcademicYear?.code}
            </h3>
            {canManageAcademicYears && (
              <button
                onClick={() => setTurmaModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Criar Nova Turma
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {turmas.map(t => {
              const course = courses.find(c => c.id === t.courseId);
              const cls = classes.find(c => c.id === t.classId);

              return (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{t.name}</h4>
                        <span className="text-[11px] text-blue-600 font-semibold">{cls?.name} • {course?.code}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {t.shift}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{course?.name}</p>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Sala de Aula</span>
                        <strong className="text-slate-800">{t.roomNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Capacidade Máxima</span>
                        <strong className="text-slate-800">{t.maxCapacity} Alunos</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>ID: {t.id}</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ativa
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: PERIODS (MATRÍCULAS E CONFIRMAÇÕES) */}
      {activeSubTab === 'PERIODS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 mb-1">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Abertura e Encerramento dos Períodos de Matrículas e Confirmações
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Controlo em tempo real para permitir ou suspender a receção de novas candidaturas/matrículas e confirmações de alunos veteranos por ano letivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {academicYears.map(ay => (
              <div 
                key={ay.id} 
                className={`bg-white p-5 rounded-2xl border shadow-xs space-y-4 ${
                  ay.status === 'ATIVO' ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Ano Letivo {ay.name}</h4>
                    <span className="text-[11px] text-slate-500">
                      {formatDateAO(ay.startDate)} até {formatDateAO(ay.endDate)}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    ay.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ay.status}
                  </span>
                </div>

                {/* Enrollment & Confirmation Toggles */}
                <div className="space-y-3">
                  {/* Matriculas */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">Período de Matrículas</span>
                        <span className="text-[10px] text-slate-500">Novos Estudantes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        ay.enrollmentStatus === 'ABERTO' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {ay.enrollmentStatus === 'ABERTO' ? 'Aberto' : 'Encerrado'}
                      </span>

                      {canManageAcademicYears && (
                        <button
                          onClick={() => toggleEnrollmentPeriod(ay.id)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                            ay.enrollmentStatus === 'ABERTO'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {ay.enrollmentStatus === 'ABERTO' ? 'Encerrar' : 'Abrir'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Confirmacoes */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">Período de Confirmações</span>
                        <span className="text-[10px] text-slate-500">Alunos Veteranos</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        ay.confirmationStatus === 'ABERTO' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {ay.confirmationStatus === 'ABERTO' ? 'Aberto' : 'Encerrado'}
                      </span>

                      {canManageAcademicYears && (
                        <button
                          onClick={() => toggleConfirmationPeriod(ay.id)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                            ay.confirmationStatus === 'ABERTO'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {ay.confirmationStatus === 'ABERTO' ? 'Encerrar' : 'Abrir'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 10 Tuition Months Summary */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                    Meses de Propina Regulamentares (10 Meses)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(ay.tuitionMonths || generateAcademicYearTuitionMonths(ay.startMonth || 'Setembro')).map((m, idx) => (
                      <span 
                        key={idx} 
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                          idx === 0 ? 'bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}
                        title={idx === 0 ? 'Primeiro mês letivo obrigatório na matrícula' : `Mês ${idx + 1}`}
                      >
                        {idx + 1}º {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB: YEARS */}
      {activeSubTab === 'YEARS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Histórico & Registo de Anos Letivos
            </h3>
            {canManageAcademicYears && (
              <button
                onClick={() => setYearModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Registar Novo Ano Letivo
              </button>
            )}
          </div>

          <div className="space-y-3">
            {academicYears.map(ay => (
              <div key={ay.id} className="p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${ay.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Ano Letivo {ay.name} ({ay.code})</h4>
                    <p className="text-xs text-slate-500">
                      Período Oficial: {formatDateAO(ay.startDate)} até {formatDateAO(ay.endDate)} • 10 Meses de Cobrança
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    ay.status === 'ATIVO' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : ay.status === 'PLANEADO'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ay.status}
                  </span>

                  {ay.status !== 'ATIVO' && canManageAcademicYears && (
                    <button
                      onClick={() => setActiveAcademicYear(ay.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Definir como Ativo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB: COURSES */}
      {activeSubTab === 'COURSES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs border border-violet-200">
                    {c.code}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">Código: {c.code}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                  {c.durationYears} Anos
                </span>
              </div>
              <p className="text-xs text-slate-600">{c.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Turma Modal */}
      {turmaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Criar Nova Turma</h2>
              <button onClick={() => setTurmaModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddTurma} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome / Designação da Turma *</label>
                <input
                  type="text"
                  required
                  value={turmaForm.name}
                  onChange={e => setTurmaForm({ ...turmaForm, name: e.target.value })}
                  placeholder="Ex: 10ª Classe - CFB Turma B"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Curso *</label>
                  <select
                    value={turmaForm.courseId}
                    onChange={e => setTurmaForm({ ...turmaForm, courseId: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Classe *</label>
                  <select
                    value={turmaForm.classId}
                    onChange={e => setTurmaForm({ ...turmaForm, classId: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {classes.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Turno *</label>
                  <select
                    value={turmaForm.shift}
                    onChange={e => setTurmaForm({ ...turmaForm, shift: e.target.value as any })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="MANHA">Manhã</option>
                    <option value="TARDE">Tarde</option>
                    <option value="NOITE">Noite</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sala de Aula</label>
                  <input
                    type="text"
                    value={turmaForm.roomNumber}
                    onChange={e => setTurmaForm({ ...turmaForm, roomNumber: e.target.value })}
                    placeholder="Ex: Sala 12"
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lotação Máxima (Alunos)</label>
                <input
                  type="number"
                  min="10"
                  max="65"
                  value={turmaForm.maxCapacity}
                  onChange={e => setTurmaForm({ ...turmaForm, maxCapacity: Number(e.target.value) })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTurmaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Criar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Year Modal */}
      {yearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Registar Novo Ano Letivo</h2>
              <button onClick={() => setYearModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddAcademicYear} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código / Designação *</label>
                <input
                  type="text"
                  required
                  value={yearForm.code}
                  onChange={e => setYearForm({ ...yearForm, code: e.target.value, name: e.target.value })}
                  placeholder="Ex: 2026/2027"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Início *</label>
                  <input
                    type="date"
                    required
                    value={yearForm.startDate}
                    onChange={e => setYearForm({ ...yearForm, startDate: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Término *</label>
                  <input
                    type="date"
                    required
                    value={yearForm.endDate}
                    onChange={e => setYearForm({ ...yearForm, endDate: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mês de Abertura do Ano Letivo (1º Mês de Propina) *</label>
                <select
                  value={yearForm.startMonth}
                  onChange={e => setYearForm({ ...yearForm, startMonth: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                >
                  <option value="Setembro">Setembro (Início Tradicional do Ano Letivo)</option>
                  <option value="Outubro">Outubro</option>
                  <option value="Janeiro">Janeiro</option>
                  <option value="Fevereiro">Fevereiro</option>
                  <option value="Março">Março</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  O sistema gerará automaticamente os 10 meses consecutivos de cobrança a partir deste mês.
                </p>
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setYearModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Registar Ano Letivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
