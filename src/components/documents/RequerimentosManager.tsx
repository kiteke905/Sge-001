import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { DocumentRequest } from '../../types';
import { 
  FileText, Plus, Search, CheckCircle2, Clock, 
  Download, Filter, AlertTriangle, Printer, Award, 
  ChevronRight, ShieldCheck, User, X
} from 'lucide-react';
import { formatDateAO, formatDateTimeAO } from '../../utils/formatters';
import { generateDeclarationPDF } from '../../utils/pdfGenerator';

export const RequerimentosManager: React.FC = () => {
  const { 
    requests, students, turmas, courses, createDocumentRequest, 
    updateRequestStatus, institution, isGestorReadOnly 
  } = useSchool();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStudentSearch, setModalStudentSearch] = useState('');

  const [formData, setFormData] = useState({
    studentId: students[0]?.id || '',
    type: 'DECLARACAO_SEM_NOTAS' as DocumentRequest['type'],
    purpose: 'Para efeitos de prova junto do Serviço de Migração e Estrangeiros (SME)',
    notes: '',
  });

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === formData.studentId);
  }, [students, formData.studentId]);

  const filteredModalStudents = useMemo(() => {
    if (!modalStudentSearch.trim()) return students;
    const term = modalStudentSearch.toLowerCase().trim();
    return students.filter(s => 
      (s.fullName || '').toLowerCase().includes(term) ||
      (s.id || '').toLowerCase().includes(term) ||
      (s.biNumber || '').toLowerCase().includes(term)
    );
  }, [students, modalStudentSearch]);

  const handleOpenModal = () => {
    setModalStudentSearch('');
    if (!formData.studentId && students.length > 0) {
      setFormData(prev => ({ ...prev, studentId: students[0].id }));
    }
    setModalOpen(true);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGestorReadOnly) {
      alert('Aviso RBAC: Gestor não tem autorização para emitir novos requerimentos.');
      return;
    }

    if (!formData.studentId) {
      alert('Por favor, selecione um estudante solicitante.');
      return;
    }

    createDocumentRequest(formData);
    setModalOpen(false);
    alert('Requerimento registado com sucesso na Secretaria Geral!');
  };

  const handleDownloadOfficialPDF = (req: DocumentRequest) => {
    const student = students.find(s => s.id === req.studentId);
    if (!student) return;

    const turma = turmas.find(t => t.id === student.turmaId);
    const course = courses.find(c => c.id === student.courseId);

    generateDeclarationPDF(
      student,
      req,
      turma?.name || 'Turma A',
      course?.name || 'Geral',
      institution
    );
  };

  const filteredRequests = requests.filter(r => {
    if (!searchQuery) return true;
    const term = (searchQuery || '').toLowerCase().trim();
    return (
      (r.protocolNumber || '').toLowerCase().includes(term) ||
      (r.studentName || '').toLowerCase().includes(term) ||
      (r.studentBi || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Requerimentos & Emissão de Declarações Oficiais
            </h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              {requests.length} Requerimentos Registados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fluxo de pedidos de certidões, declarações com/sem notas e guias de transferência com timbre oficial
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          disabled={isGestorReadOnly}
          className={`
            px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-2 transition-all
            ${isGestorReadOnly ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
          `}
        >
          <Plus className="w-4 h-4" />
          Novo Requerimento / Pedido
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por protocolo, nome do aluno ou BI..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Nº Protocolo</th>
                <th className="p-3">Data do Pedido</th>
                <th className="p-3">Estudante</th>
                <th className="p-3">Tipo de Documento</th>
                <th className="p-3">Finalidade / Efeito</th>
                <th className="p-3 text-center">Estado Atual</th>
                <th className="p-3 text-right">Ações & Emissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-900">{r.protocolNumber}</td>
                  <td className="p-3 text-slate-500">{formatDateAO(r.requestedAt)}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{r.studentName}</div>
                    <span className="text-[10px] text-slate-500 font-mono">{r.studentBi}</span>
                  </td>
                  <td className="p-3 font-medium text-slate-800">
                    {r.type === 'DECLARACAO_SEM_NOTAS' && 'Declaração de Matrícula (Sem Notas)'}
                    {r.type === 'DECLARACAO_COM_NOTAS' && 'Declaração com Notas Trimestrais'}
                    {r.type === 'CERTIFICADO' && 'Certificado de Habilitações'}
                    {r.type === 'GUIA_TRANSFERENCIA' && 'Guia de Transferência Escolar'}
                    {r.type === 'CARTAO_2VIA' && '2ª Via do Cartão Magnético'}
                  </td>
                  <td className="p-3 text-slate-600 max-w-[200px] truncate">{r.purpose}</td>
                  
                  <td className="p-3 text-center">
                    <select
                      value={r.status}
                      disabled={isGestorReadOnly}
                      onChange={e => updateRequestStatus(r.id, e.target.value as any)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border bg-white focus:outline-hidden ${
                        r.status === 'PRONTO' || r.status === 'ENTREGUE'
                          ? 'text-emerald-700 border-emerald-200'
                          : r.status === 'EM_PROCESSAMENTO'
                            ? 'text-blue-700 border-blue-200'
                            : 'text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="EM_PROCESSAMENTO">Em Processamento</option>
                      <option value="PRONTO">Pronto para Entrega</option>
                      <option value="ENTREGUE">Entregue ao Aluno</option>
                    </select>
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDownloadOfficialPDF(r)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto transition-colors"
                      title="Gerar e Descarregar Declaração Timbrada em PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Emitir PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Novo Requerimento Escolar</h2>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 text-xs">
              {/* Student Search & Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    Estudante Solicitante *
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {filteredModalStudents.length} estudante(s) disponível(is)
                  </span>
                </div>

                {/* Search Bar for Student */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar estudante por Nome, Nº de Processo (ID) ou BI..."
                    value={modalStudentSearch}
                    onChange={e => {
                      const val = e.target.value;
                      setModalStudentSearch(val);
                      if (val.trim()) {
                        const term = val.toLowerCase().trim();
                        const match = students.find(s => 
                          (s.fullName || '').toLowerCase().includes(term) ||
                          (s.id || '').toLowerCase().includes(term) ||
                          (s.biNumber || '').toLowerCase().includes(term)
                        );
                        if (match) {
                          setFormData(prev => ({ ...prev, studentId: match.id }));
                        }
                      }
                    }}
                    className="w-full pl-8 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                  {modalStudentSearch && (
                    <button
                      type="button"
                      onClick={() => setModalStudentSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Selector */}
                <select
                  value={formData.studentId}
                  onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
                >
                  <option value="">-- Selecione o Estudante --</option>
                  {filteredModalStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.id} • BI: {s.biNumber} • {s.status})
                    </option>
                  ))}
                </select>

                {filteredModalStudents.length === 0 && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Nenhum estudante encontrado com o critério pesquisado.
                  </p>
                )}

                {/* Student Info Card */}
                {selectedStudent && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={selectedStudent.photoUrl}
                        alt={selectedStudent.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-blue-200 shadow-2xs"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{selectedStudent.fullName}</span>
                        <span className="text-[10px] text-slate-600">
                          {selectedStudent.id} • BI: {selectedStudent.biNumber} • {selectedStudent.turmaName}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedStudent.status === 'MATRICULADO' || selectedStudent.status === 'CONFIRMADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedStudent.status === 'PENDENTE_PAGAMENTO'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-200 text-slate-700'
                    }`}>
                      {selectedStudent.status === 'PENDENTE_PAGAMENTO' ? 'Pendente' : selectedStudent.status}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Documento Requerido *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="DECLARACAO_SEM_NOTAS">Declaração de Matrícula (Sem Notas)</option>
                  <option value="DECLARACAO_COM_NOTAS">Declaração com Notas Trimestrais</option>
                  <option value="CERTIFICADO">Certificado de Habilitações</option>
                  <option value="GUIA_TRANSFERENCIA">Guia de Transferência Escolar</option>
                  <option value="CARTAO_2VIA">2ª Via do Cartão Magnético</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Finalidade / Efeito do Documento *</label>
                <input
                  type="text"
                  required
                  value={formData.purpose}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Ex: Para efeitos de apresentação ao Serviço Militar / Embaixada"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações Adicionais (Opcional)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais para a secretaria..."
                  rows={2}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Emitir Requerimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
