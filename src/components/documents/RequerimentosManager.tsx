import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { DocumentRequest } from '../../types';
import { 
  FileText, Plus, Search, CheckCircle2, Clock, 
  Download, Filter, AlertTriangle, Printer, Award, 
  ChevronRight, ShieldCheck 
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

  const [formData, setFormData] = useState({
    studentId: students[0]?.id || '',
    type: 'DECLARACAO_SEM_NOTAS' as DocumentRequest['type'],
    purpose: 'Para efeitos de prova junto do Serviço de Migração e Estrangeiros (SME)',
    notes: '',
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGestorReadOnly) {
      alert('Aviso RBAC: Gestor não tem autorização para emitir novos requerimentos.');
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

  const filteredRequests = requests.filter(r => 
    !searchQuery ||
    r.protocolNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.studentBi.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          onClick={() => setModalOpen(true)}
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
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Novo Requerimento Escolar</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estudante Solicitante *</label>
                <select
                  value={formData.studentId}
                  onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.id} • B.I: {s.biNumber})
                    </option>
                  ))}
                </select>
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
