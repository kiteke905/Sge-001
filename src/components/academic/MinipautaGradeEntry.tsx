import React, { useState, useEffect, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { GradeRecord, Turma, CurricularAssignment, Subject, Student, AssessmentSchedule } from '../../types';
import { 
  Award, Save, AlertTriangle, CheckCircle2, 
  BookOpen, UserCheck, ShieldCheck, 
  Layers, Filter, Lock, Unlock, Calendar, 
  FileDown, AlertCircle, Clock, Info, Edit3
} from 'lucide-react';
import { calculateMT, calculateGradeStatus, formatDateAO } from '../../utils/formatters';
import { generateMinipautaPDF } from '../../utils/pdfGenerator';

export const MinipautaGradeEntry: React.FC = () => {
  const { 
    currentUser, turmas, assignments, subjects, students, teachers,
    grades, saveMinipautaGrades, canEnterGrades, isGestorReadOnly,
    assessmentSchedules, updateAssessmentSchedule, institution
  } = useSchool();

  const isTeacherRole = currentUser.role === 'PROFESSOR';
  const isAdminOrPedagogico = currentUser.role === 'ADMIN' || currentUser.role === 'DIRECAO_PEDAGOGICA';
  const isPedagogicoDirector = currentUser.role === 'DIRECAO_PEDAGOGICA';

  // Filter assignments accessible to the logged in user
  // Exclusive to the corresponding teacher when role is PROFESSOR
  const accessibleAssignments = useMemo(() => {
    if (isTeacherRole) {
      if (!currentUser.teacherId) return [];
      return assignments.filter(a => a.teacherId === currentUser.teacherId);
    }
    return assignments;
  }, [assignments, isTeacherRole, currentUser.teacherId]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(1);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Set default selection
  useEffect(() => {
    if (accessibleAssignments.length > 0) {
      if (!selectedAssignmentId || !accessibleAssignments.some(a => a.id === selectedAssignmentId)) {
        setSelectedAssignmentId(accessibleAssignments[0].id);
      }
    } else {
      setSelectedAssignmentId('');
    }
  }, [accessibleAssignments, selectedAssignmentId]);

  const currentAssignment = assignments.find(a => a.id === selectedAssignmentId);
  const currentTurma = turmas.find(t => t.id === currentAssignment?.turmaId);
  const currentSubject = subjects.find(s => s.id === currentAssignment?.subjectId);
  const assignedTeacher = teachers.find(t => t.id === currentAssignment?.teacherId);

  // Verification if the current user is the authorized teacher for this discipline
  // Strict rule: Grade entry is an action EXCLUSIVE to the teacher assigned to each specific discipline
  const isAuthorizedTeacher = useMemo(() => {
    if (isGestorReadOnly) return false;
    if (isTeacherRole) {
      return !!(currentUser.teacherId && currentAssignment?.teacherId === currentUser.teacherId);
    }
    return false; // Admin, Gestor, Direção Pedagógica, etc. have read-only audit access
  }, [isGestorReadOnly, isTeacherRole, currentUser.teacherId, currentAssignment?.teacherId]);

  // Current Assessment Schedule for this assignment and trimester
  const currentSchedule = useMemo(() => {
    if (!selectedAssignmentId) return null;
    const found = assessmentSchedules.find(
      s => s.assignmentId === selectedAssignmentId && s.trimester === selectedTrimester
    );
    if (found) return found;

    // Fallback default schedule if not explicitly defined
    const defaultSchedule: AssessmentSchedule = {
      id: `SCH-${selectedAssignmentId}-T${selectedTrimester}`,
      assignmentId: selectedAssignmentId,
      trimester: selectedTrimester,
      macDate: selectedTrimester === 1 ? '2025-10-20' : selectedTrimester === 2 ? '2026-02-15' : '2026-05-20',
      nptDate: selectedTrimester === 1 ? '2025-11-25' : selectedTrimester === 2 ? '2026-03-20' : '2026-06-25',
    };
    return defaultSchedule;
  }, [assessmentSchedules, selectedAssignmentId, selectedTrimester]);

  // Temporary schedule edit states
  const [scheduleMacDate, setScheduleMacDate] = useState('');
  const [scheduleNptDate, setScheduleNptDate] = useState('');

  useEffect(() => {
    if (currentSchedule) {
      setScheduleMacDate(currentSchedule.macDate);
      setScheduleNptDate(currentSchedule.nptDate);
    }
  }, [currentSchedule]);

  // Check date restrictions
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const isMacUnlocked = useMemo(() => {
    if (!currentSchedule?.macDate) return true;
    return todayStr >= currentSchedule.macDate;
  }, [todayStr, currentSchedule?.macDate]);

  const isNptUnlocked = useMemo(() => {
    if (!currentSchedule?.nptDate) return true;
    return todayStr >= currentSchedule.nptDate;
  }, [todayStr, currentSchedule?.nptDate]);

  // Students in the selected turma
  const turmaStudents = useMemo(() => {
    if (!currentTurma) return [];
    return students
      .filter(s => s.turmaId === currentTurma.id)
      .sort((a, b) => a.studentNumber - b.studentNumber);
  }, [students, currentTurma]);

  // Local state for editing marks: MAC, NPT, Observations (NPP is removed)
  const [editableGrades, setEditableGrades] = useState<Record<string, { mac: string; npt: string; obs: string }>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Populate local state when assignment or trimester changes
  useEffect(() => {
    if (!selectedAssignmentId || !currentTurma) {
      setEditableGrades({});
      setHasUnsavedChanges(false);
      return;
    }

    const initialMap: Record<string, { mac: string; npt: string; obs: string }> = {};

    turmaStudents.forEach(st => {
      const g = grades.find(
        gr => gr.studentId === st.id && 
              gr.assignmentId === selectedAssignmentId && 
              gr.trimester === selectedTrimester
      );

      initialMap[st.id] = {
        mac: g !== undefined && g.mac !== undefined && !isNaN(g.mac) ? g.mac.toString() : '',
        npt: g !== undefined && g.npt !== undefined && !isNaN(g.npt) ? g.npt.toString() : '',
        obs: g?.observations || '',
      };
    });

    setEditableGrades(initialMap);
    setHasUnsavedChanges(false);
  }, [selectedAssignmentId, selectedTrimester, currentTurma, turmaStudents, grades]);

  const handleMarkChange = (studentId: string, field: 'mac' | 'npt' | 'obs', val: string) => {
    if (!isAuthorizedTeacher) return;

    // Check date lock for the specific field
    if (field === 'mac' && !isMacUnlocked) return;
    if (field === 'npt' && !isNptUnlocked) return;

    if (field !== 'obs') {
      if (val !== '') {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0 || num > 20) {
          return; // Guard 0-20 scale
        }
      }
    }

    setEditableGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: val,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveGrades = () => {
    if (!isAuthorizedTeacher) {
      alert('Aviso de Segurança: Apenas o professor titular desta disciplina tem autorização para lançar notas na Minipauta.');
      return;
    }
    if (!selectedAssignmentId) return;

    const gradesToSave: Omit<GradeRecord, 'id' | 'updatedAt' | 'updatedBy'>[] = [];

    turmaStudents.forEach(st => {
      const row = editableGrades[st.id];
      if (row && (row.mac !== '' || row.npt !== '')) {
        const vMac = row.mac !== '' ? parseFloat(row.mac) : 0;
        const vNpt = row.npt !== '' ? parseFloat(row.npt) : 0;
        const vMt = calculateMT(vMac, vNpt);

        gradesToSave.push({
          studentId: st.id,
          assignmentId: selectedAssignmentId,
          trimester: selectedTrimester,
          mac: vMac,
          npt: vNpt,
          mt: vMt,
          observations: row.obs,
        });
      }
    });

    saveMinipautaGrades(gradesToSave);
    setHasUnsavedChanges(false);
    alert(`Minipauta de ${currentSubject?.name} (${selectedTrimester}º Trimestre) gravada com sucesso!\nFórmula aplicada: MT = MAC(50%) + NPT(50%).`);
  };

  const handleSaveScheduleDates = () => {
    if (!isPedagogicoDirector) {
      alert('Aviso RBAC: O ajuste das datas para abertura do campo de atribuição de notas é exclusivo ao Diretor Pedagógico.');
      return;
    }
    if (!selectedAssignmentId || !scheduleMacDate || !scheduleNptDate) return;
    updateAssessmentSchedule(selectedAssignmentId, selectedTrimester, scheduleMacDate, scheduleNptDate);
    setShowScheduleModal(false);
    alert('Calendário de abertura de notas atualizado com sucesso pela Direção Pedagógica!');
  };

  const handleExportPDF = () => {
    if (!currentTurma || !currentSubject || !selectedAssignmentId) return;
    const teacherName = assignedTeacher?.name || currentUser.name;
    generateMinipautaPDF(
      currentTurma,
      currentSubject,
      teacherName,
      selectedTrimester,
      turmaStudents,
      grades,
      selectedAssignmentId,
      institution
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Minipauta do Docente & Atribuição de Notas
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Fórmula Oficial: MT = MAC (50%) + NPT (50%)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacherRole 
              ? `Acesso exclusivo ao docente ${currentUser.name} para as disciplinas sob sua regência` 
              : 'Lançamento curricular e auditoria pedagógica conforme o calendário de avaliações'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedAssignmentId && currentTurma && (
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar PDF</span>
            </button>
          )}

          <button
            onClick={handleSaveGrades}
            disabled={!isAuthorizedTeacher || !selectedAssignmentId}
            className={`
              px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer
              ${!isAuthorizedTeacher || !selectedAssignmentId 
                ? 'bg-slate-400 cursor-not-allowed opacity-70' 
                : hasUnsavedChanges 
                  ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'}
            `}
          >
            <Save className="w-4 h-4" />
            {hasUnsavedChanges ? 'Gravar Alterações *' : 'Minipauta Salva'}
          </button>
        </div>
      </div>

      {/* Exclusivity Notice Banner */}
      {!isAuthorizedTeacher && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-start gap-3.5 text-xs text-slate-200 shadow-xs">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400 uppercase tracking-wide text-[11px]">
                Regra de Segurança: Ação Exclusiva do Professor Titular
              </span>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700 font-semibold">
                Modo Leitura / Auditoria
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              A atribuição e edição de notas na minipauta é uma ação <strong>estritamente exclusiva</strong> ao professor responsável por cada disciplina 
              {assignedTeacher ? ` (${assignedTeacher.name})` : ''}. Outros utilizadores (Administração, Direção Pedagógica e Secretaria) têm permissão de consulta, auditoria e exportação, não podendo lançar notas diretamente.
            </p>
          </div>
        </div>
      )}

      {/* Warning for Teacher exclusivity restriction */}
      {isTeacherRole && accessibleAssignments.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Nenhuma disciplina atribuída</p>
            <p className="mt-0.5">O seu utilizador não possui disciplinas ou turmas atribuídas na Direção Pedagógica para este ano letivo.</p>
          </div>
        </div>
      )}

      {/* Filter and Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        {/* Assignment Selector */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Disciplina & Turma sob Regência Docente *
          </label>
          <select
            value={selectedAssignmentId}
            onChange={e => setSelectedAssignmentId(e.target.value)}
            disabled={accessibleAssignments.length === 0}
            className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium disabled:bg-slate-100"
          >
            {accessibleAssignments.map(asg => {
              const t = turmas.find(turma => turma.id === asg.turmaId);
              const s = subjects.find(sub => sub.id === asg.subjectId);
              const tch = teachers.find(teacher => teacher.id === asg.teacherId);
              return (
                <option key={asg.id} value={asg.id}>
                  {s?.name} • {t?.name} ({asg.weeklyHours}h/sem) — Prof. {tch?.name || 'Docente'}
                </option>
              );
            })}
          </select>
        </div>

        {/* Trimester Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Período Trimestral
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map(trim => (
              <button
                key={trim}
                type="button"
                onClick={() => setSelectedTrimester(trim as 1 | 2 | 3)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTrimester === trim
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {trim}º Trim
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assessment Schedule & Dates Lock Status Banner */}
      {selectedAssignmentId && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Calendário de Provas & Regra de Lançamento por Data
              </span>
            </div>
            <p className="text-xs text-slate-300">
              A atribuição de notas apenas é permitida após a realização da data marcada de cada prova.
            </p>
          </div>

          {/* Assessment components status */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* MAC Date Status */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
              isMacUnlocked 
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' 
                : 'bg-amber-950/60 border-amber-800/80 text-amber-300'
            }`}>
              {isMacUnlocked ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <div>
                <span className="font-bold">MAC (50%): </span>
                <span>{isMacUnlocked ? `Aberto (${formatDateAO(currentSchedule?.macDate || '')})` : `Bloqueado até ${formatDateAO(currentSchedule?.macDate || '')}`}</span>
              </div>
            </div>

            {/* NPT Date Status */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 ${
              isNptUnlocked 
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' 
                : 'bg-amber-950/60 border-amber-800/80 text-amber-300'
            }`}>
              {isNptUnlocked ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <div>
                <span className="font-bold">NPT (50%): </span>
                <span>{isNptUnlocked ? `Aberto (${formatDateAO(currentSchedule?.nptDate || '')})` : `Bloqueado até ${formatDateAO(currentSchedule?.nptDate || '')}`}</span>
              </div>
            </div>

            {/* Schedule Edit Button - Exclusive to DIRECAO_PEDAGOGICA */}
            {isPedagogicoDirector ? (
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Configurar datas oficiais para abertura de MAC e NPT (Exclusivo da Direção Pedagógica)"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ajustar Datas (Dir. Pedagógica)</span>
              </button>
            ) : (
              <div 
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-[11px] flex items-center gap-1.5"
                title="O ajuste das datas para abertura do campo de atribuição de notas é exclusivo ao diretor pedagógico"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400/80" />
                <span>Ajuste exclusivo ao Dir. Pedagógico</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minipauta Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>{currentSubject?.name || 'Disciplina'} • {currentTurma?.name || 'Turma'} • {selectedTrimester}º Trimestre</span>
            {assignedTeacher && (
              <span className="text-slate-500 font-normal">
                (Docente: <strong>{assignedTeacher.name}</strong>)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-600 text-[11px]">
            <span>Total Alunos: <strong>{turmaStudents.length}</strong></span>
            <span>Escala: <strong>0 a 20 Valores</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-12 text-center">Nº</th>
                <th className="p-3">Nome Completo do Estudante</th>
                
                {/* MAC Column */}
                <th className="p-3 w-32 text-center bg-blue-50/60">
                  <div className="flex items-center justify-center gap-1">
                    <span>MAC (50%)</span>
                    {!isMacUnlocked && <Lock className="w-3 h-3 text-amber-600" />}
                  </div>
                  <span className="block text-[9px] font-normal text-slate-500">
                    Aval. Contínua {currentSchedule?.macDate ? `(${formatDateAO(currentSchedule.macDate)})` : ''}
                  </span>
                </th>

                {/* NPT Column */}
                <th className="p-3 w-32 text-center bg-violet-50/60">
                  <div className="flex items-center justify-center gap-1">
                    <span>NPT (50%)</span>
                    {!isNptUnlocked && <Lock className="w-3 h-3 text-amber-600" />}
                  </div>
                  <span className="block text-[9px] font-normal text-slate-500">
                    Prova Trimestral {currentSchedule?.nptDate ? `(${formatDateAO(currentSchedule.nptDate)})` : ''}
                  </span>
                </th>

                {/* MT Column */}
                <th className="p-3 w-28 text-center bg-emerald-50/60">
                  <span>M.T.</span>
                  <span className="block text-[9px] font-normal text-slate-500">50% MAC + 50% NPT</span>
                </th>

                <th className="p-3 w-28 text-center">Aproveitamento</th>
                <th className="p-3">Observações Pedagógicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {turmaStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhum estudante matriculado nesta turma.
                  </td>
                </tr>
              ) : (
                turmaStudents.map(student => {
                  const row = editableGrades[student.id] || { mac: '', npt: '', obs: '' };
                  const vMac = row.mac !== '' ? parseFloat(row.mac) : NaN;
                  const vNpt = row.npt !== '' ? parseFloat(row.npt) : NaN;

                  const hasAny = !isNaN(vMac) || !isNaN(vNpt);
                  const calcMT = hasAny ? calculateMT(isNaN(vMac) ? 0 : vMac, isNaN(vNpt) ? 0 : vNpt) : null;
                  const status = calcMT !== null ? calculateGradeStatus(calcMT) : null;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70">
                      <td className="p-3 text-center font-mono font-bold text-slate-400">
                        {student.studentNumber}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{student.fullName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{student.id}</span>
                      </td>

                      {/* MAC Input */}
                      <td className="p-2 text-center bg-blue-50/30">
                        <div className="relative inline-block">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.1"
                            disabled={!isAuthorizedTeacher || !isMacUnlocked}
                            value={row.mac}
                            onChange={e => handleMarkChange(student.id, 'mac', e.target.value)}
                            placeholder="0.0"
                            title={!isMacUnlocked ? `Bloqueado até ${formatDateAO(currentSchedule?.macDate || '')}` : 'Nota MAC (0-20)'}
                            className={`w-18 text-center py-1.5 px-1 border rounded-lg text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                              !isMacUnlocked 
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          {!isMacUnlocked && (
                            <Lock className="w-3 h-3 text-amber-500 absolute right-1.5 top-2.5 pointer-events-none opacity-60" />
                          )}
                        </div>
                      </td>

                      {/* NPT Input */}
                      <td className="p-2 text-center bg-violet-50/30">
                        <div className="relative inline-block">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.1"
                            disabled={!isAuthorizedTeacher || !isNptUnlocked}
                            value={row.npt}
                            onChange={e => handleMarkChange(student.id, 'npt', e.target.value)}
                            placeholder="0.0"
                            title={!isNptUnlocked ? `Bloqueado até ${formatDateAO(currentSchedule?.nptDate || '')}` : 'Nota NPT (0-20)'}
                            className={`w-18 text-center py-1.5 px-1 border rounded-lg text-xs font-bold font-mono focus:ring-2 focus:ring-violet-500 focus:outline-hidden ${
                              !isNptUnlocked 
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          {!isNptUnlocked && (
                            <Lock className="w-3 h-3 text-amber-500 absolute right-1.5 top-2.5 pointer-events-none opacity-60" />
                          )}
                        </div>
                      </td>

                      {/* MT Calculated (50% MAC + 50% NPT) */}
                      <td className="p-3 text-center bg-emerald-50/30 font-mono font-extrabold text-sm">
                        {calcMT !== null ? (
                          <span className={status?.colorClass}>{calcMT.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3 text-center">
                        {status ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.badgeClass}`}>
                            {status.label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Sem Notas</span>
                        )}
                      </td>

                      {/* Observations */}
                      <td className="p-2">
                        <input
                          type="text"
                          disabled={!isAuthorizedTeacher}
                          value={row.obs}
                          onChange={e => handleMarkChange(student.id, 'obs', e.target.value)}
                          placeholder="Anotação pedagógica..."
                          className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Adjustment Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Datas Marcadas de Avaliação ({selectedTrimester}º Trimestre)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Defina as datas oficiais para conclusão da <strong>MAC</strong> (Avaliação Contínua) e realização da <strong>NPT</strong> (Prova Trimestral). O sistema apenas desbloqueará o lançamento após a data especificada.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Marcada para MAC (Avaliação Contínua)
                </label>
                <input
                  type="date"
                  value={scheduleMacDate}
                  onChange={e => setScheduleMacDate(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Marcada para NPT (Prova Trimestral)
                </label>
                <input
                  type="date"
                  value={scheduleNptDate}
                  onChange={e => setScheduleNptDate(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveScheduleDates}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all cursor-pointer"
              >
                Guardar Datas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

