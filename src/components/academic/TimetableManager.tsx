import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  Clock, Calendar, BookOpen, Layers, 
  Download, Printer, CheckCircle, ShieldCheck, 
  MapPin, GraduationCap, Plus, Edit3, Trash2,
  Lock, AlertCircle, Save, X, Sparkles, Filter
} from 'lucide-react';
import { formatDateAO } from '../../utils/formatters';

const DAYS_OF_WEEK = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
const TIME_SLOTS = [
  '07:30 - 08:15 (1º Tempo)',
  '08:20 - 09:05 (2º Tempo)',
  '09:10 - 09:55 (3º Tempo)',
  '10:15 - 11:00 (4º Tempo - Intervalo)',
  '11:05 - 11:50 (5º Tempo)',
  '11:55 - 12:40 (6º Tempo)',
];

export interface ExamEntry {
  id: string;
  date: string;
  day: string;
  time: string;
  subject: string;
  room: string;
  type: string;
  turmaId?: string;
}

export interface TimetableCell {
  subject: string;
  teacher: string;
  room?: string;
}

export const TimetableManager: React.FC = () => {
  const { turmas, courses, subjects, teachers, activeAcademicYear, currentUser, isGestorReadOnly, addAuditLog } = useSchool();
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>(turmas[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'AULAS' | 'EXAMES'>('AULAS');
  
  // Exclusive permission check: Direção Pedagógica (and Administrator)
  const isPedagogicoOrAdmin = (currentUser.role === 'DIRECAO_PEDAGOGICA' || currentUser.role === 'ADMIN') && !isGestorReadOnly;

  // Timetable grid state per Turma
  const [schedulesByTurma, setSchedulesByTurma] = useState<Record<string, Record<string, Record<number, TimetableCell>>>>(() => {
    const saved = localStorage.getItem('sige_angola_timetables');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    
    // Default initial grid template
    const defaultGrid: Record<string, Record<number, TimetableCell>> = {
      'Segunda-feira': {
        0: { subject: 'Língua Portuguesa', teacher: 'Prof. Sebastião Vunge' },
        1: { subject: 'Língua Portuguesa', teacher: 'Prof. Sebastião Vunge' },
        2: { subject: 'Matemática', teacher: 'Prof. Sebastião Vunge' },
        3: { subject: 'Matemática', teacher: 'Prof. Sebastião Vunge' },
        4: { subject: 'Educação Física', teacher: 'Prof.ª Domingas Quaresma' },
        5: { subject: 'Educação Física', teacher: 'Prof.ª Domingas Quaresma' },
      },
      'Terça-feira': {
        0: { subject: 'Física', teacher: 'Prof. Sebastião Vunge' },
        1: { subject: 'Física', teacher: 'Prof. Sebastião Vunge' },
        2: { subject: 'Química', teacher: 'Prof. Manuel Kiala' },
        3: { subject: 'Química', teacher: 'Prof. Manuel Kiala' },
        4: { subject: 'Língua Inglesa', teacher: 'Prof.ª Graça Afonso' },
        5: { subject: 'Língua Inglesa', teacher: 'Prof.ª Graça Afonso' },
      },
      'Quarta-feira': {
        0: { subject: 'Biologia', teacher: 'Prof.ª Graça Afonso' },
        1: { subject: 'Biologia', teacher: 'Prof.ª Graça Afonso' },
        2: { subject: 'História', teacher: 'Prof. Manuel Kiala' },
        3: { subject: 'Geografia', teacher: 'Prof. Manuel Kiala' },
        4: { subject: 'Informática', teacher: 'Prof. Manuel Kiala' },
        5: { subject: 'Informática', teacher: 'Prof. Manuel Kiala' },
      },
      'Quinta-feira': {
        0: { subject: 'Matemática', teacher: 'Prof. Sebastião Vunge' },
        1: { subject: 'Matemática', teacher: 'Prof. Sebastião Vunge' },
        2: { subject: 'Língua Portuguesa', teacher: 'Prof. Sebastião Vunge' },
        3: { subject: 'Educação Moral e Cívica', teacher: 'Prof.ª Graça Afonso' },
        4: { subject: 'Desenho Geométrico', teacher: 'Prof. Sebastião Vunge' },
        5: { subject: 'Desenho Geométrico', teacher: 'Prof. Sebastião Vunge' },
      },
      'Sexta-feira': {
        0: { subject: 'Física', teacher: 'Prof. Sebastião Vunge' },
        1: { subject: 'Química', teacher: 'Prof. Manuel Kiala' },
        2: { subject: 'Biologia', teacher: 'Prof.ª Graça Afonso' },
        3: { subject: 'Língua Francesa', teacher: 'Prof.ª Graça Afonso' },
        4: { subject: 'Empreendedorismo', teacher: 'Prof. Manuel Kiala' },
        5: { subject: 'Formação de Atitudes', teacher: 'Prof.ª Graça Afonso' },
      },
    };

    const initial: Record<string, Record<string, Record<number, TimetableCell>>> = {};
    turmas.forEach(t => {
      initial[t.id] = defaultGrid;
    });
    return initial;
  });

  // Exam Calendar State
  const [examCalendar, setExamCalendar] = useState<ExamEntry[]>(() => {
    const saved = localStorage.getItem('sige_angola_exam_calendar');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'EX-1', date: '2025-11-24', day: 'Segunda-feira', time: '08:00 - 10:00', subject: 'Língua Portuguesa', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
      { id: 'EX-2', date: '2025-11-25', day: 'Terça-feira', time: '08:00 - 10:00', subject: 'Matemática', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
      { id: 'EX-3', date: '2025-11-26', day: 'Quarta-feira', time: '08:00 - 10:00', subject: 'Física', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
      { id: 'EX-4', date: '2025-11-27', day: 'Quinta-feira', time: '08:00 - 10:00', subject: 'Química', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
      { id: 'EX-5', date: '2025-11-28', day: 'Sexta-feira', time: '08:00 - 10:00', subject: 'Biologia', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
      { id: 'EX-6', date: '2025-12-01', day: 'Segunda-feira', time: '08:00 - 10:00', subject: 'Língua Inglesa', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
    ];
  });

  // Save schedules when changed
  useEffect(() => {
    localStorage.setItem('sige_angola_timetables', JSON.stringify(schedulesByTurma));
  }, [schedulesByTurma]);

  // Save exams when changed
  useEffect(() => {
    localStorage.setItem('sige_angola_exam_calendar', JSON.stringify(examCalendar));
  }, [examCalendar]);

  const currentTurma = turmas.find(t => t.id === selectedTurmaId) || turmas[0];
  const activeGrid = (currentTurma && schedulesByTurma[currentTurma.id]) || {};

  // Timetable Slot Modal State
  const [editingSlot, setEditingSlot] = useState<{ day: string; slotIdx: number; cell?: TimetableCell } | null>(null);
  const [slotSubject, setSlotSubject] = useState('');
  const [slotTeacher, setSlotTeacher] = useState('');
  const [slotRoom, setSlotRoom] = useState('');

  // Exam Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examForm, setExamForm] = useState({
    date: '2025-11-24',
    time: '08:00 - 10:00',
    subject: subjects[0]?.name || 'Língua Portuguesa',
    type: 'Prova do 1º Trimestre',
    room: 'Sala 01',
    turmaId: '',
  });

  // Open Edit Slot Modal
  const handleOpenEditSlot = (day: string, slotIdx: number) => {
    if (!isPedagogicoOrAdmin) return;
    const existing = activeGrid[day]?.[slotIdx];
    setEditingSlot({ day, slotIdx, cell: existing });
    setSlotSubject(existing?.subject || subjects[0]?.name || '');
    setSlotTeacher(existing?.teacher || teachers[0]?.name || '');
    setSlotRoom(existing?.room || currentTurma?.roomNumber || 'Sala 01');
  };

  // Save Slot
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !currentTurma) return;

    setSchedulesByTurma(prev => {
      const turmaData = { ...(prev[currentTurma.id] || {}) };
      const dayData = { ...(turmaData[editingSlot.day] || {}) };
      
      if (slotSubject.trim()) {
        dayData[editingSlot.slotIdx] = {
          subject: slotSubject,
          teacher: slotTeacher || 'Docente Não Atribuído',
          room: slotRoom,
        };
      } else {
        delete dayData[editingSlot.slotIdx];
      }

      turmaData[editingSlot.day] = dayData;
      return { ...prev, [currentTurma.id]: turmaData };
    });

    addAuditLog(
      'PEDAGOGICO',
      'Edição de Horário de Aulas',
      `Horário atualizado na turma ${currentTurma.name} (${editingSlot.day}, ${TIME_SLOTS[editingSlot.slotIdx]}): ${slotSubject}`
    );

    setEditingSlot(null);
  };

  // Remove Slot
  const handleClearSlot = () => {
    if (!editingSlot || !currentTurma) return;
    setSchedulesByTurma(prev => {
      const turmaData = { ...(prev[currentTurma.id] || {}) };
      const dayData = { ...(turmaData[editingSlot.day] || {}) };
      delete dayData[editingSlot.slotIdx];
      turmaData[editingSlot.day] = dayData;
      return { ...prev, [currentTurma.id]: turmaData };
    });
    setEditingSlot(null);
  };

  // Open Exam Create/Edit Modal
  const handleOpenExamModal = (exam?: ExamEntry) => {
    if (!isPedagogicoOrAdmin) return;
    if (exam) {
      setEditingExamId(exam.id);
      setExamForm({
        date: exam.date,
        time: exam.time,
        subject: exam.subject,
        type: exam.type,
        room: exam.room,
        turmaId: exam.turmaId || '',
      });
    } else {
      setEditingExamId(null);
      setExamForm({
        date: '2025-11-24',
        time: '08:00 - 10:00',
        subject: subjects[0]?.name || 'Língua Portuguesa',
        type: 'Prova do 1º Trimestre',
        room: 'Sala 01',
        turmaId: selectedTurmaId || '',
      });
    }
    setIsExamModalOpen(true);
  };

  // Save Exam Form
  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPedagogicoOrAdmin) return;

    const dateObj = new Date(examForm.date + 'T12:00:00');
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const computedDay = dayNames[dateObj.getDay()] || 'Segunda-feira';

    if (editingExamId) {
      setExamCalendar(prev => prev.map(ex => ex.id === editingExamId ? {
        ...ex,
        date: examForm.date,
        day: computedDay,
        time: examForm.time,
        subject: examForm.subject,
        type: examForm.type,
        room: examForm.room,
        turmaId: examForm.turmaId || undefined,
      } : ex));
      addAuditLog('PEDAGOGICO', 'Edição de Calendário de Provas', `Prova de ${examForm.subject} atualizada para ${examForm.date}`);
    } else {
      const newExam: ExamEntry = {
        id: `EX-${Date.now()}`,
        date: examForm.date,
        day: computedDay,
        time: examForm.time,
        subject: examForm.subject,
        type: examForm.type,
        room: examForm.room,
        turmaId: examForm.turmaId || undefined,
      };
      setExamCalendar(prev => [...prev, newExam]);
      addAuditLog('PEDAGOGICO', 'Agendamento de Prova', `Nova prova de ${examForm.subject} agendada para ${examForm.date} (${examForm.time})`);
    }

    setIsExamModalOpen(false);
  };

  // Delete Exam
  const handleDeleteExam = (examId: string, subjectName: string) => {
    if (!isPedagogicoOrAdmin) return;
    if (confirm(`Tem a certeza de que deseja remover a avaliação de ${subjectName} do calendário de provas?`)) {
      setExamCalendar(prev => prev.filter(ex => ex.id !== examId));
      addAuditLog('PEDAGOGICO', 'Exclusão de Prova', `Avaliação de ${subjectName} removida do calendário de provas.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Horários Escolares & Calendário de Provas
            </h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              Ano Letivo {activeAcademicYear?.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribuição de tempos letivos semanais e planeamento oficial de provas trimestrais
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('AULAS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'AULAS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Horário Semanal de Aulas
          </button>
          <button
            onClick={() => setActiveTab('EXAMES')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'EXAMES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calendário de Provas & Exames
          </button>
        </div>
      </div>

      {/* Role Exclusive Notice Banner */}
      {isPedagogicoOrAdmin ? (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-700 shrink-0" />
            <div>
              <span className="font-bold block">Painel Exclusivo da Direção Pedagógica Ativo</span>
              <p className="text-[11px] text-indigo-700">
                Tem permissão oficial para criar, editar e publicar a grade horária das turmas e o calendário de provas trimestrais.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] tracking-wide shrink-0">
            Modo Edição Ativo
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <p className="text-[11px]">
            <strong>Modo de Consulta:</strong> A definição e alteração dos horários de aulas e calendários de provas são de competência e gestão exclusiva da <strong>Direção Pedagógica</strong>.
          </p>
        </div>
      )}

      {activeTab === 'AULAS' ? (
        <div className="space-y-4">
          {/* Turma Selector & Print */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">Selecione a Turma:</label>
              <select
                value={selectedTurmaId}
                onChange={e => setSelectedTurmaId(e.target.value)}
                className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                {turmas.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.shift}) — {t.roomNumber}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {isPedagogicoOrAdmin && (
                <span className="text-[11px] text-indigo-700 font-medium bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
                  💡 Dica: Clique em qualquer tempo letivo abaixo para editar/atribuir disciplina e docente
                </span>
              )}
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Horário
              </button>
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-semibold">
                  <tr>
                    <th className="p-3 w-40 border-r border-slate-800 text-center">Tempos / Horas</th>
                    {DAYS_OF_WEEK.map(day => (
                      <th key={day} className="p-3 text-center border-r border-slate-800 min-w-[180px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {TIME_SLOTS.map((slot, slotIdx) => (
                    <tr key={slotIdx} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-700 bg-slate-50 border-r border-slate-200 text-center text-[11px]">
                        {slot}
                      </td>

                      {DAYS_OF_WEEK.map(day => {
                        const cell = activeGrid[day]?.[slotIdx];
                        return (
                          <td 
                            key={day} 
                            onClick={() => isPedagogicoOrAdmin && handleOpenEditSlot(day, slotIdx)}
                            className={`p-2.5 border-r border-slate-100 align-top transition-colors ${
                              isPedagogicoOrAdmin ? 'cursor-pointer hover:bg-indigo-50/40 group' : ''
                            }`}
                          >
                            {cell ? (
                              <div className="p-2.5 rounded-xl bg-blue-50/90 border border-blue-200/80 space-y-1 relative group">
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-bold text-blue-950 block text-[11px] leading-tight">
                                    {cell.subject}
                                  </span>
                                  {isPedagogicoOrAdmin && (
                                    <Edit3 className="w-3 h-3 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                  )}
                                </div>
                                <span className="text-[9.5px] text-blue-700 block truncate font-medium">
                                  {cell.teacher}
                                </span>
                                {cell.room && (
                                  <span className="text-[9px] text-blue-600/80 flex items-center gap-0.5">
                                    <MapPin className="w-2.5 h-2.5" /> {cell.room}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className={`p-3 rounded-xl border border-dashed text-center text-[10px] transition-all ${
                                isPedagogicoOrAdmin 
                                  ? 'border-indigo-200 text-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/50 hover:border-indigo-400' 
                                  : 'border-slate-200 bg-slate-50/50 text-slate-300'
                              }`}>
                                {isPedagogicoOrAdmin ? '+ Atribuir Aula' : '- Livre -'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Exam Schedule Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Calendário Oficial de Provas & Avaliações ({activeAcademicYear?.code})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total de {examCalendar.length} provas oficiais agendadas
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isPedagogicoOrAdmin && (
                <button
                  onClick={() => handleOpenExamModal()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Agendar Nova Prova
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Calendário
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Dia da Semana</th>
                  <th className="p-3">Horário</th>
                  <th className="p-3">Disciplina</th>
                  <th className="p-3">Tipo de Avaliação</th>
                  <th className="p-3">Sala Atribuída</th>
                  {isPedagogicoOrAdmin && <th className="p-3 text-right">Ações Pedagógicas</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examCalendar.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{formatDateAO(ex.date)}</td>
                    <td className="p-3 font-medium text-slate-700">{ex.day}</td>
                    <td className="p-3 font-mono text-indigo-700 font-bold">{ex.time}</td>
                    <td className="p-3 font-bold text-slate-900">{ex.subject}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {ex.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{ex.room}</td>
                    {isPedagogicoOrAdmin && (
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenExamModal(ex)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Prova"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(ex.id, ex.subject)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Prova"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Slot Modal (Direção Pedagógica Exclusive) */}
      {editingSlot && currentTurma && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Atribuir Tempo Letivo</h3>
                  <p className="text-[11px] text-slate-500">
                    {currentTurma.name} • {editingSlot.day} ({TIME_SLOTS[editingSlot.slotIdx]})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSlot(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disciplina *
                </label>
                <select
                  value={slotSubject}
                  onChange={e => setSlotSubject(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Docente Responsável *
                </label>
                <select
                  value={slotTeacher}
                  onChange={e => setSlotTeacher(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.academicDegree})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sala / Espaço de Aula
                </label>
                <input
                  type="text"
                  value={slotRoom}
                  onChange={e => setSlotRoom(e.target.value)}
                  placeholder="Ex: Sala 05, Lab de Informática, Campo Desportivo"
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingSlot.cell ? (
                  <button
                    type="button"
                    onClick={handleClearSlot}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Desocupar Tempo
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Salvar no Horário
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Create Exam Modal (Direção Pedagógica Exclusive) */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingExamId ? 'Editar Prova Agendada' : 'Agendar Nova Avaliação'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Direção Pedagógica • Calendário Oficial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Prova *
                  </label>
                  <input
                    type="date"
                    required
                    value={examForm.date}
                    onChange={e => setExamForm({ ...examForm, date: e.target.value })}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horário (Início - Fim) *
                  </label>
                  <input
                    type="text"
                    required
                    value={examForm.time}
                    onChange={e => setExamForm({ ...examForm, time: e.target.value })}
                    placeholder="08:00 - 10:00"
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disciplina da Avaliação *
                </label>
                <select
                  value={examForm.subject}
                  onChange={e => setExamForm({ ...examForm, subject: e.target.value })}
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Prova *
                  </label>
                  <select
                    value={examForm.type}
                    onChange={e => setExamForm({ ...examForm, type: e.target.value })}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Prova do 1º Trimestre">Prova do 1º Trimestre</option>
                    <option value="Prova do 2º Trimestre">Prova do 2º Trimestre</option>
                    <option value="Prova do 3º Trimestre">Prova do 3º Trimestre</option>
                    <option value="Prova de Recuperação">Prova de Recuperação</option>
                    <option value="Exame Nacional">Exame Nacional</option>
                    <option value="Prova Global">Prova Global</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sala Atribuída *
                  </label>
                  <input
                    type="text"
                    required
                    value={examForm.room}
                    onChange={e => setExamForm({ ...examForm, room: e.target.value })}
                    placeholder="Ex: Sala 05, Anfiteatro"
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar no Calendário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
