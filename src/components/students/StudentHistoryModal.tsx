import React from 'react';
import { Student } from '../../types';
import { useSchool } from '../../context/SchoolContext';
import { X, CreditCard, Award, FileText, CheckCircle2, Download } from 'lucide-react';
import { formatKz, formatDateAO, formatDateTimeAO } from '../../utils/formatters';
import { generateReceiptPDF, generateBoletimNotasPDF } from '../../utils/pdfGenerator';

interface StudentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({ isOpen, onClose, student }) => {
  const { receipts, turmas, courses, grades, assignments, subjects, institution } = useSchool();

  if (!isOpen || !student) return null;

  const studentReceipts = receipts.filter(r => r.studentId === student.id);
  const turma = turmas.find(t => t.id === student.turmaId);
  const course = courses.find(c => c.id === student.courseId);

  const totalPaid = studentReceipts
    .filter(r => r.status === 'EMITIDO')
    .reduce((acc, r) => acc + r.totalPaid, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={student.photoUrl}
              alt={student.fullName}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h2 className="text-sm font-bold text-slate-900">{student.fullName}</h2>
              <p className="text-xs text-slate-500">
                Nº Processo: <strong className="text-slate-800">{student.id}</strong> • B.I: {student.biNumber} • {turma?.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Pago em Propinas/Taxas</span>
              <span className="text-base font-extrabold text-emerald-700">{formatKz(totalPaid)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Recibos Emitidos</span>
              <span className="text-base font-extrabold text-slate-900">{studentReceipts.length} Recibos</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Encarregado de Educação</span>
              <span className="text-xs font-bold text-slate-800 block truncate">{student.guardianName}</span>
              <span className="text-[10px] text-slate-500">{student.guardianPhone}</span>
            </div>
          </div>

          {/* Payment Receipts History */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              Histórico Individual de Recibos & Pagamentos em Caixa
            </h3>

            {studentReceipts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Nenhum recibo de pagamento emitido para este estudante até o momento.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Nº Recibo</th>
                      <th className="p-2.5">Data / Hora</th>
                      <th className="p-2.5">Serviços Liquidados</th>
                      <th className="p-2.5">Forma</th>
                      <th className="p-2.5 text-right">Total Pago</th>
                      <th className="p-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentReceipts.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-blue-900">{r.receiptNumber}</td>
                        <td className="p-2.5 text-slate-500">{formatDateTimeAO(r.issuedAt)}</td>
                        <td className="p-2.5 text-slate-700 max-w-[200px] truncate">
                          {r.items.map(it => it.description).join(', ')}
                        </td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px]">
                            {r.paymentMethod}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 text-right">
                          {formatKz(r.totalPaid)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => generateReceiptPDF(r, institution)}
                            className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Descarregar Recibo em PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Academic Actions */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div>
              <h4 className="text-xs font-bold text-blue-900">Boletim de Notas Trimestral</h4>
              <p className="text-[11px] text-blue-700">
                Consulte o aproveitamento pedagógico oficial e emita o boletim em PDF.
              </p>
            </div>
            <button
              onClick={() => {
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
                }
              }}
              className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              Baixar Boletim em PDF
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
