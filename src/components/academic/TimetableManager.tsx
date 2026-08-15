import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  Clock, Calendar, BookOpen, Layers, 
  Download, Printer, CheckCircle, ShieldCheck, 
  MapPin, GraduationCap 
} from 'lucide-react';
import { formatDateAO } from '../../utils/formatters';

const DAYS_OF_WEEK = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
const TIME_SLOTS = [
  '07:30 - 08:15',
  '08:20 - 09:05',
  '09:10 - 09:55',
  '10:15 - 11:00 (Intervalo 10:00)',
  '11:05 - 11:50',
  '11:55 - 12:40',
];

export const TimetableManager: React.FC = () => {
  const { turmas, courses, subjects, teachers, activeAcademicYear } = useSchool();
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>(turmas[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'AULAS' | 'EXAMES'>('AULAS');

  const currentTurma = turmas.find(t => t.id === selectedTurmaId);

  // Mock schedule mapping for the selected turma
  const timetableGrid: Record<string, Record<number, { subject: string; teacher: string }>> = {
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

  const examCalendar = [
    { date: '2025-11-24', day: 'Segunda-feira', time: '08:00 - 10:00', subject: 'Língua Portuguesa', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
    { date: '2025-11-25', day: 'Terça-feira', time: '08:00 - 10:00', subject: 'Matemática', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
    { date: '2025-11-26', day: 'Quarta-feira', time: '08:00 - 10:00', subject: 'Física', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
    { date: '2025-11-27', day: 'Quinta-feira', time: '08:00 - 10:00', subject: 'Química', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
    { date: '2025-11-28', day: 'Sexta-feira', time: '08:00 - 10:00', subject: 'Biologia', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
    { date: '2025-12-01', day: 'Segunda-feira', time: '08:00 - 10:00', subject: 'Língua Inglesa', room: 'Sala 05', type: 'Prova do 1º Trimestre' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Horários Escolares & Calendário de Avaliações
            </h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              Ano Letivo {activeAcademicYear?.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribuição de tempos letivos semanais e calendário de provas trimestrais
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

      {activeTab === 'AULAS' ? (
        <div className="space-y-4">
          {/* Turma Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">Selecione a Turma:</label>
              <select
                value={selectedTurmaId}
                onChange={e => setSelectedTurmaId(e.target.value)}
                className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                {turmas.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.shift})</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Horário
            </button>
          </div>

          {/* Timetable Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-semibold">
                  <tr>
                    <th className="p-3 w-36 border-r border-slate-800 text-center">Tempos / Horas</th>
                    {DAYS_OF_WEEK.map(day => (
                      <th key={day} className="p-3 text-center border-r border-slate-800 min-w-[170px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {TIME_SLOTS.map((slot, slotIdx) => (
                    <tr key={slotIdx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700 bg-slate-50 border-r border-slate-200 text-center text-[11px]">
                        {slot}
                      </td>

                      {DAYS_OF_WEEK.map(day => {
                        const cell = timetableGrid[day]?.[slotIdx];
                        return (
                          <td key={day} className="p-2.5 border-r border-slate-100 align-top">
                            {cell ? (
                              <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200/80 space-y-1">
                                <span className="font-bold text-blue-950 block text-[11px] leading-tight">
                                  {cell.subject}
                                </span>
                                <span className="text-[9.5px] text-blue-700 block truncate">
                                  {cell.teacher}
                                </span>
                              </div>
                            ) : (
                              <div className="p-2 rounded-lg bg-slate-50 text-slate-300 text-center text-[10px]">
                                - Livre -
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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Calendário Oficial de Provas do 1º Trimestre ({activeAcademicYear?.code})
            </h3>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Calendário
            </button>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examCalendar.map((ex, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{formatDateAO(ex.date)}</td>
                    <td className="p-3 font-medium text-slate-700">{ex.day}</td>
                    <td className="p-3 font-mono text-blue-700">{ex.time}</td>
                    <td className="p-3 font-bold text-slate-900">{ex.subject}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {ex.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{ex.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
