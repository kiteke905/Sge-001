import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { AcademicYear, Turma, Course } from '../../types';
import { 
  Calendar, Layers, Plus, Users, 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  Building, BookOpen 
} from 'lucide-react';
import { formatDateAO } from '../../utils/formatters';

export const AcademicYearManager: React.FC = () => {
  const { 
    academicYears, activeAcademicYear, courses, classes, 
    turmas, addTurma, setActiveAcademicYear, isGestorReadOnly 
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<'YEARS' | 'TURMAS' | 'COURSES'>('TURMAS');
  const [turmaModalOpen, setTurmaModalOpen] = useState(false);

  const [turmaForm, setTurmaForm] = useState({
    name: '',
    academicYearId: activeAcademicYear?.id || 'AY-2025-2026',
    courseId: courses[0]?.id || '',
    classId: classes[0]?.id || 'CLS-10',
    shift: 'MANHA' as Turma['shift'],
    roomNumber: 'Sala 05',
    maxCapacity: 45,
  });

  const handleAddTurma = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGestorReadOnly) {
      alert('Aviso RBAC: Gestor não tem autorização para criar turmas.');
      return;
    }

    addTurma(turmaForm);
    setTurmaModalOpen(false);
    alert(`Turma ${turmaForm.name} criada com sucesso!`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Estrutura Escolar, Anos Letivos & Turmas
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Ano Vigente: {activeAcademicYear?.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mapeamento da organização pedagógica, salas de aulas, cursos e turnos
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('TURMAS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'TURMAS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Turmas ({turmas.length})
          </button>
          <button
            onClick={() => setActiveSubTab('YEARS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'YEARS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anos Letivos ({academicYears.length})
          </button>
          <button
            onClick={() => setActiveSubTab('COURSES')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'COURSES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cursos ({courses.length})
          </button>
        </div>
      </div>

      {isGestorReadOnly && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Restrição RBAC: Gestor tem acesso de consulta e não pode alterar turmas nem anos letivos.</span>
        </div>
      )}

      {activeSubTab === 'TURMAS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Turmas Cadastradas para o Ano Letivo {activeAcademicYear?.code}
            </h3>
            <button
              onClick={() => setTurmaModalOpen(true)}
              disabled={isGestorReadOnly}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-all
                ${isGestorReadOnly ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              <Plus className="w-3.5 h-3.5" /> Criar Nova Turma
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {turmas.map(t => {
              const course = courses.find(c => c.id === t.courseId);
              const cls = classes.find(c => c.id === t.classId);

              return (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
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

      {activeSubTab === 'YEARS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Histórico & Gestão de Anos Letivos
          </h3>

          <div className="space-y-3">
            {academicYears.map(ay => (
              <div key={ay.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${ay.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Ano Letivo {ay.name} ({ay.code})</h4>
                    <p className="text-xs text-slate-500">
                      Período Oficial: {formatDateAO(ay.startDate)} até {formatDateAO(ay.endDate)}
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

                  {ay.status !== 'ATIVO' && !isGestorReadOnly && (
                    <button
                      onClick={() => setActiveAcademicYear(ay.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
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
              <button onClick={() => setTurmaModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
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
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Criar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
