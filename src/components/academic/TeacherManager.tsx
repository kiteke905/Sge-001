import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Teacher } from '../../types';
import { 
  GraduationCap, Plus, Search, Edit3, 
  ShieldCheck, Phone, Mail, Award, AlertTriangle 
} from 'lucide-react';
import { formatDateAO } from '../../utils/formatters';

export const TeacherManager: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, canRegisterTeacher, isGestorReadOnly, assignments, subjects, turmas } = useSchool();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    biNumber: '',
    academicDegree: 'LICENCIATURA' as Teacher['academicDegree'],
    specialty: '',
    phone: '+244 9',
    email: '',
    category: 'EFETIVO' as Teacher['category'],
    status: 'ATIVO' as Teacher['status'],
    joinDate: new Date().toISOString().split('T')[0],
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      biNumber: '',
      academicDegree: 'LICENCIATURA',
      specialty: '',
      phone: '+244 9',
      email: '',
      category: 'EFETIVO',
      status: 'ATIVO',
      joinDate: new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData({
      name: t.name,
      biNumber: t.biNumber,
      academicDegree: t.academicDegree,
      specialty: t.specialty,
      phone: t.phone,
      email: t.email,
      category: t.category,
      status: t.status,
      joinDate: t.joinDate,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRegisterTeacher) {
      return;
    }

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, formData);
    } else {
      addTeacher(formData);
    }
    setModalOpen(false);
  };

  const filteredTeachers = teachers.filter(t => {
    if (!searchQuery) return true;
    const term = (searchQuery || '').toLowerCase().trim();
    return (
      (t.name || '').toLowerCase().includes(term) ||
      (t.specialty || '').toLowerCase().includes(term) ||
      (t.biNumber || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Registo & Gestão do Corpo Docente
            </h2>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {teachers.length} Professores Cadastrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Módulo da Direção Pedagógica para enquadramento, habilitações e especialidades do corpo docente
          </p>
        </div>

        {canRegisterTeacher && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-2 transition-all bg-indigo-600 hover:bg-indigo-700 active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Professor
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar docente por nome, especialidade ou bilhete de identidade..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map(teacher => {
          const teacherAssignments = assignments.filter(a => a.teacherId === teacher.id);
          const totalWeeklyHours = teacherAssignments.reduce((acc, a) => acc + a.weeklyHours, 0);

          return (
            <div key={teacher.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{teacher.name}</h3>
                      <span className="text-[11px] font-mono text-slate-500">{teacher.biNumber}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {teacher.category}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Habilitação:</span>
                    <strong className="text-slate-800">{teacher.academicDegree}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Especialidade:</span>
                    <strong className="text-indigo-900">{teacher.specialty}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Carga Semanal:</span>
                    <strong className="text-slate-900">{totalWeeklyHours} Horas/Semana</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{teacher.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {teacherAssignments.length} Turmas Atribuídas
                </span>
                <button
                  onClick={() => handleOpenEdit(teacher)}
                  disabled={isGestorReadOnly}
                  className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
                    isGestorReadOnly ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editar Cadastro
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingTeacher ? 'Editar Docente' : 'Cadastrar Novo Docente'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo do Docente *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Prof. Dr. Sebastião Vunge"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nº de Bilhete de Identidade *</label>
                  <input
                    type="text"
                    required
                    value={formData.biNumber}
                    onChange={e => setFormData({ ...formData, biNumber: e.target.value.toUpperCase() })}
                    placeholder="Ex: 003847291LA039"
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Habilitação Académica</label>
                  <select
                    value={formData.academicDegree}
                    onChange={e => setFormData({ ...formData, academicDegree: e.target.value as any })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="BACHAREL">Bacharel</option>
                    <option value="LICENCIATURA">Licenciatura</option>
                    <option value="MESTRADO">Mestrado</option>
                    <option value="DOUTORAMENTO">Doutoramento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Especialidade / Área de Formação *</label>
                <input
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Ex: Ensino da Matemática e Física"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone Directo</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Correio Electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Categoria Contratual</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="EFETIVO">Quadro Efetivo</option>
                  <option value="COLABORADOR">Docente Colaborador</option>
                  <option value="CONTRATADO">Contrato a Termo</option>
                </select>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Gravar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
