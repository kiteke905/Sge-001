import React, { useRef } from 'react';
import { Student, Turma, Course } from '../../types';
import { useSchool } from '../../context/SchoolContext';
import { X, Printer, Download, CreditCard, ShieldCheck, QrCode } from 'lucide-react';
import { formatDateAO } from '../../utils/formatters';

interface StudentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({ isOpen, onClose, student }) => {
  const { institution, turmas, courses, activeAcademicYear } = useSchool();
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !student) return null;

  const turma = turmas.find(t => t.id === student.turmaId);
  const course = courses.find(c => c.id === student.courseId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cartão Magnético de Identificação do Estudante</h2>
              <p className="text-[11px] text-slate-500">Documento de identificação escolar oficial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-100">
          {/* Physical Badge Layout */}
          <div 
            ref={cardRef}
            className="w-full max-w-[400px] bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-blue-800/60 relative overflow-hidden"
          >
            {/* Holographic badge watermark effect */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-linear-to-r from-amber-400 via-rose-500 to-blue-500" />

            {/* Top School Branding */}
            <div className="flex items-start justify-between gap-2 border-b border-blue-800/60 pb-3 mb-3">
              <div>
                <span className="text-[8px] tracking-widest text-blue-300 font-bold uppercase block">
                  REPÚBLICA DE ANGOLA • MED
                </span>
                <h3 className="font-extrabold text-xs tracking-tight text-white uppercase">
                  {institution.name}
                </h3>
                <span className="text-[9px] text-amber-400 font-mono">
                  CARTÃO DE ESTUDANTE • {activeAcademicYear?.code || '2025/2026'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            {/* Middle Section: Photo & Metadata */}
            <div className="flex gap-3 items-center">
              <div className="relative shrink-0">
                <img
                  src={student.photoUrl}
                  alt={student.fullName}
                  className="w-20 h-24 object-cover rounded-xl border-2 border-white/80 shadow-md"
                />
                <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-blue-600 text-[8px] font-bold rounded-sm text-white">
                  {student.shift}
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-semibold block">Nome Completo</span>
                  <span className="text-xs font-bold text-white leading-tight block truncate">
                    {student.fullName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                  <div>
                    <span className="text-[7.5px] text-slate-400 block uppercase">Nº de Processo</span>
                    <span className="font-mono font-bold text-amber-300">{student.id}</span>
                  </div>
                  <div>
                    <span className="text-[7.5px] text-slate-400 block uppercase">Nº do B.I.</span>
                    <span className="font-mono font-semibold text-slate-200 text-[8.5px] truncate block">{student.biNumber}</span>
                  </div>
                </div>

                <div className="text-[9px]">
                  <span className="text-[7.5px] text-slate-400 block uppercase">Turma / Curso</span>
                  <span className="text-slate-200 font-medium truncate block">
                    {turma?.name || 'Turma A'} ({course?.code || 'CFB'})
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Bar: Barcode representation & QR */}
            <div className="mt-3 pt-2.5 border-t border-blue-800/60 flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="h-5 flex items-center gap-[2px] opacity-80">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-full bg-white ${i % 3 === 0 ? 'w-[2px]' : i % 2 === 0 ? 'w-[1px]' : 'w-[1.5px]'}`} 
                    />
                  ))}
                </div>
                <span className="text-[7px] text-slate-400 font-mono tracking-widest block">
                  * {student.id.replace(/-/g, '')} *
                </span>
              </div>

              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg border border-white/10">
                <QrCode className="w-5 h-5 text-white shrink-0" />
                <div className="text-[7.5px] text-slate-300 leading-tight">
                  <span className="font-bold text-white block">SIGE-QR</span>
                  <span>Válido até Jul/2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Emitido pela Secretaria Geral
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Cartão
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
