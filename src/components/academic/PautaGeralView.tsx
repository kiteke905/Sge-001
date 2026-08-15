import React, { useState, useMemo, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { Turma, Course, GradeRecord, Student, CurricularAssignment, Subject } from '../../types';
import { 
  BookOpen, Download, Filter, Award, 
  TrendingUp, Users, CheckCircle, XCircle,
  ShieldCheck, Lock, UserCheck
} from 'lucide-react';
import { generatePautaGeralPDF } from '../../utils/pdfGenerator';

export const PautaGeralView: React.FC = () => {
  const { currentUser, turmas, courses, students, assignments, subjects, grades, institution } = useSchool();

  const isTeacher = currentUser?.role === 'PROFESSOR';
  const teacherId = currentUser?.teacherId;

  // Filter accessible turmas if logged in as a teacher
  const accessibleTurmas = useMemo(() => {
    if (isTeacher && teacherId) {
      const teacherTurmaIds = assignments
        .filter(a => a.teacherId === teacherId)
        .map(a => a.turmaId);
      return turmas.filter(t => teacherTurmaIds.includes(t.id));
    }
    return turmas;
  }, [turmas, assignments, isTeacher, teacherId]);

  const [selectedTurmaId, setSelectedTurmaId] = useState<string>(accessibleTurmas[0]?.id || turmas[0]?.id || '');
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(1);

  // Sync selected turma if it falls out of range
  useEffect(() => {
    if (accessibleTurmas.length > 0 && !accessibleTurmas.some(t => t.id === selectedTurmaId)) {
      setSelectedTurmaId(accessibleTurmas[0].id);
    }
  }, [accessibleTurmas, selectedTurmaId]);

  const currentTurma = turmas.find(t => t.id === selectedTurmaId);
  const currentCourse = courses.find(c => c.id === currentTurma?.courseId);

  // Turma Students
  const turmaStudents = useMemo(() => {
    if (!currentTurma) return [];
    return students
      .filter(s => s.turmaId === currentTurma.id)
      .sort((a, b) => a.studentNumber - b.studentNumber);
  }, [students, currentTurma]);

  // If teacher, strictly restrict visible assignments to the teacher's own discipline
  const turmaAssignments = useMemo(() => {
    if (!currentTurma) return [];
    const allTurmaAssignments = assignments.filter(a => a.turmaId === currentTurma.id);
    if (isTeacher && teacherId) {
      return allTurmaAssignments.filter(a => a.teacherId === teacherId);
    }
    return allTurmaAssignments;
  }, [assignments, currentTurma, isTeacher, teacherId]);

  // Disciplinary subjects of the teacher
  const teacherSubjectNames = useMemo(() => {
    return turmaAssignments.map(asg => {
      const sub = subjects.find(s => s.id === asg.subjectId);
      return sub?.name || sub?.code || 'Disciplina';
    }).join(', ');
  }, [turmaAssignments, subjects]);

  // Statistics calculation across the accessible assignments
  const stats = useMemo(() => {
    if (turmaStudents.length === 0 || turmaAssignments.length === 0) {
      return { globalAverage: 0, passCount: 0, failCount: 0, passRate: 0 };
    }

    let globalSum = 0;
    let studentsWithGrades = 0;
    let passCount = 0;
    let failCount = 0;

    turmaStudents.forEach(st => {
      let stSum = 0;
      let count = 0;
      turmaAssignments.forEach(asg => {
        const g = grades.find(
          gr => gr.studentId === st.id && 
                gr.assignmentId === asg.id && 
                gr.trimester === selectedTrimester
        );
        if (g) {
          stSum += g.mt;
          count++;
        }
      });

      if (count > 0) {
        const studentAvg = stSum / count;
        globalSum += studentAvg;
        studentsWithGrades++;
        if (studentAvg >= 9.5) passCount++;
        else failCount++;
      }
    });

    const globalAverage = studentsWithGrades > 0 ? globalSum / studentsWithGrades : 0;
    const passRate = studentsWithGrades > 0 ? (passCount / studentsWithGrades) * 100 : 0;

    return {
      globalAverage: Math.round(globalAverage * 100) / 100,
      passCount,
      failCount,
      passRate: Math.round(passRate * 10) / 10,
    };
  }, [turmaStudents, turmaAssignments, grades, selectedTrimester]);

  const handleExportPDF = () => {
    if (!currentTurma || !currentCourse) return;
    generatePautaGeralPDF(
      currentTurma,
      currentCourse,
      selectedTrimester,
      students,
      turmaAssignments,
      subjects,
      grades,
      institution
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isTeacher ? 'Pauta de Aproveitamento • Minha Disciplina' : 'Pauta Geral de Aproveitamento Consolidada'}
            </h2>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isTeacher 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {isTeacher ? 'Visualização Restrita ao Docente' : 'Modo Leitura Institucional'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTeacher 
              ? `Acesso exclusivo às notas da sua disciplina sob regência (${teacherSubjectNames || 'Disciplina atribuída'}).`
              : 'Módulo de consolidação trimestral com cálculo automático de médias globais por turma.'}
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={!currentTurma || turmaStudents.length === 0 || turmaAssignments.length === 0}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          {isTeacher ? 'Exportar Pauta da Disciplina em PDF' : 'Exportar Pauta Geral em PDF (A4 Paisagem)'}
        </button>
      </div>

      {/* Teacher Policy Banner if applicable */}
      {isTeacher && (
        <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Política de Privacidade & Integridade de Notas: </span>
            <span>Como Docente Titular ({currentUser?.name}), a visualização na pauta está rigorosamente restrita apenas à sua disciplina atribuída: <strong>{teacherSubjectNames || 'Nenhuma disciplina atribuída'}</strong>. As notas de outras disciplinas permanecem protegidas.</span>
          </div>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Selecione a Turma *
          </label>
          <select
            value={selectedTurmaId}
            onChange={e => setSelectedTurmaId(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium"
          >
            {accessibleTurmas.length === 0 ? (
              <option value="">Nenhuma turma com disciplinas sob sua regência</option>
            ) : (
              accessibleTurmas.map(t => {
                const c = courses.find(course => course.id === t.courseId);
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} • {c?.code} ({t.shift})
                  </option>
                );
              })
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Trimestre Curricular *
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map(trim => (
              <button
                key={trim}
                type="button"
                onClick={() => setSelectedTrimester(trim as 1 | 2 | 3)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Alunos na Turma
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {turmaStudents.length} Alunos
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            {isTeacher ? 'Média da Disciplina' : 'Média Global da Turma'}
          </span>
          <span className={`text-xl font-extrabold font-mono mt-1 block ${
            stats.globalAverage >= 9.5 ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {stats.globalAverage.toFixed(2)} Valores
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Aproveitamento (≥ 9.5)
          </span>
          <span className="text-xl font-extrabold font-mono text-emerald-700 mt-1 block">
            {stats.passCount} Alunos ({stats.passRate}%)
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Insuficientes (&lt; 9.5)
          </span>
          <span className="text-xl font-extrabold font-mono text-rose-700 mt-1 block">
            {stats.failCount} Alunos
          </span>
        </div>
      </div>

      {/* Consolidated Master Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-extrabold tracking-wide text-sm">{currentTurma?.name || 'Turma'}</span>
            <span className="text-blue-300 ml-2">• {currentCourse?.name} ({selectedTrimester}º Trimestre)</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            {isTeacher 
              ? `${turmaAssignments.length} Disciplina sob sua Regência`
              : `${turmaAssignments.length} Disciplinas Curriculares Mapeadas`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">Nº</th>
                <th className="p-3 min-w-[200px]">Nome do Estudante</th>
                {turmaAssignments.map(asg => {
                  const sub = subjects.find(s => s.id === asg.subjectId);
                  return (
                    <th key={asg.id} className="p-2 text-center min-w-[90px] font-bold text-slate-800">
                      {sub?.name || sub?.code || 'DISC'} (MT)
                    </th>
                  );
                })}
                <th className="p-3 text-center bg-slate-200 font-bold min-w-[80px]">
                  {isTeacher ? 'Nota MT' : 'M.Global'}
                </th>
                {!isTeacher && (
                  <>
                    <th className="p-3 text-center min-w-[60px]">Posit.</th>
                    <th className="p-3 text-center min-w-[60px]">Negat.</th>
                  </>
                )}
                <th className="p-3 text-center min-w-[90px]">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {turmaStudents.length === 0 || turmaAssignments.length === 0 ? (
                <tr>
                  <td colSpan={turmaAssignments.length + 6} className="p-8 text-center text-slate-400">
                    {turmaAssignments.length === 0 
                      ? 'Nenhuma disciplina sob sua regência nesta turma.' 
                      : 'Nenhum aluno matriculado nesta turma.'}
                  </td>
                </tr>
              ) : (
                turmaStudents.map(student => {
                  let sumMT = 0;
                  let countMT = 0;
                  let posCount = 0;
                  let negCount = 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center font-mono font-bold text-slate-400">
                        {student.studentNumber}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{student.fullName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{student.id}</span>
                      </td>

                      {/* Subject Marks */}
                      {turmaAssignments.map(asg => {
                        const g = grades.find(
                          gr => gr.studentId === student.id && 
                                gr.assignmentId === asg.id && 
                                gr.trimester === selectedTrimester
                        );

                        if (g) {
                          sumMT += g.mt;
                          countMT++;
                          if (g.mt >= 9.5) posCount++;
                          else negCount++;
                        }

                        return (
                          <td key={asg.id} className="p-2 text-center font-mono font-bold">
                            {g ? (
                              <span className={g.mt >= 9.5 ? 'text-blue-700' : 'text-rose-600'}>
                                {g.mt.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Media Global / Disciplina */}
                      <td className="p-3 text-center bg-slate-50 font-mono font-extrabold text-sm">
                        {countMT > 0 ? (
                          <span className={(sumMT / countMT) >= 9.5 ? 'text-emerald-700' : 'text-rose-600'}>
                            {(sumMT / countMT).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {!isTeacher && (
                        <>
                          {/* Positive count */}
                          <td className="p-3 text-center font-bold text-emerald-700 font-mono">
                            {posCount}
                          </td>

                          {/* Negative count */}
                          <td className="p-3 text-center font-bold text-rose-600 font-mono">
                            {negCount}
                          </td>
                        </>
                      )}

                      {/* Final Result */}
                      <td className="p-3 text-center">
                        {countMT > 0 ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (sumMT / countMT) >= 9.5 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {(sumMT / countMT) >= 9.5 ? 'Apto' : 'Não Apto'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Sem Notas</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
