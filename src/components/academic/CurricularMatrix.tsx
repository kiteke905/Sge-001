import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { CurricularAssignment } from '../../types';
import { 
  Layers, Plus, Trash2, BookOpen, 
  GraduationCap, Clock, AlertTriangle, ShieldCheck 
} from 'lucide-react';

export const CurricularMatrix: React.FC = () => {
  const { 
    assignments, subjects, teachers, turmas, courses, 
    addAssignment, removeAssignment, canAssignDiscipline, isGestorReadOnly 
  } = useSchool();

  const [selectedTurmaFilter, setSelectedTurmaFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState<CurricularAssignment | null>(null);

  const [formData, setFormData] = useState({
    turmaId: turmas[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    teacherId: teachers[0]?.id || '',
    weeklyHours: 4,
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAssignDiscipline) {
      return;
    }

    addAssignment(formData);
    setModalOpen(false);
  };

  const filteredAssignments = assignments.filter(a => 
    selectedTurmaFilter === 'ALL' || a.turmaId === selectedTurmaFilter
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Matriz Curricular & Atribuição de Disciplinas
            </h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              {assignments.length} Atribuições Ativas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mapeamento oficial de planos de estudo, turmas, disciplinas e docentes responsáveis
          </p>
        </div>

        {canAssignDiscipline && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-2 transition-all bg-blue-600 hover:bg-blue-700 active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Atribuição Curricular
          </button>
        )}
      </div>

      {/* Filter by Turma */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-700">Filtrar por Turma:</label>
        <select
          value={selectedTurmaFilter}
          onChange={e => setSelectedTurmaFilter(e.target.value)}
          className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="ALL">Todas as Turmas</option>
          {turmas.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.shift})</option>
          ))}
        </select>
      </div>

      {/* Grid of assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssignments.map(asg => {
          const turma = turmas.find(t => t.id === asg.turmaId);
          const sub = subjects.find(s => s.id === asg.subjectId);
          const teacher = teachers.find(tch => tch.id === asg.teacherId);
          const course = courses.find(c => c.id === turma?.courseId);

          return (
            <div key={asg.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                      {sub?.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{sub?.name}</h3>
                      <span className="text-[11px] text-blue-600 font-semibold">{turma?.name} ({turma?.shift})</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Curso:</span>
                    <strong className="text-slate-800 truncate max-w-[140px]">{course?.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Docente:</span>
                    <strong className="text-slate-900">{teacher?.name || 'Não Atribuído'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Carga Horária:</span>
                    <strong className="text-blue-700">{asg.weeklyHours} Horas / Semana</strong>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">{asg.id}</span>
                <button
                  onClick={() => {
                    if (isGestorReadOnly) {
                      alert('Aviso RBAC: Gestor não pode remover atribuições.');
                      return;
                    }
                    setAssignmentToRemove(asg);
                  }}
                  disabled={isGestorReadOnly}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isGestorReadOnly ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                  }`}
                  title="Remover Atribuição"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Nova Atribuição Curricular</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Turma Destino *</label>
                <select
                  value={formData.turmaId}
                  onChange={e => setFormData({ ...formData, turmaId: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.shift})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disciplina Curricular *</label>
                <select
                  value={formData.subjectId}
                  onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Docente Responsável *</label>
                <select
                  value={formData.teacherId}
                  onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {teachers.map(tch => (
                    <option key={tch.id} value={tch.id}>{tch.name} ({tch.specialty})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Carga Horária Semanal (Horas) *</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.weeklyHours}
                  onChange={e => setFormData({ ...formData, weeklyHours: Number(e.target.value) })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                >
                  Gravar Atribuição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Assignment Modal */}
      {assignmentToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Remover Disciplina da Turma
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Matriz Curricular • Desvinculação Docente
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem a certeza que deseja desvincular a disciplina <strong>{assignmentToRemove.subjectName}</strong> da turma <strong>{assignmentToRemove.turmaName}</strong> (Docente: {assignmentToRemove.teacherName})?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignmentToRemove(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  removeAssignment(assignmentToRemove.id);
                  setAssignmentToRemove(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Remover</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
