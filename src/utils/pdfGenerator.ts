import { jsPDF } from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';
import { 
  Student, PaymentReceipt, GradeRecord, Turma, Course, 
  CurricularAssignment, Subject, ExpenseRecord, AuditLog, 
  DocumentRequest, InstitutionInfo 
} from '../types';
import { INSTITUTION_INFO } from '../context/SchoolContext';
import { formatKz, formatDateAO, formatDateTimeAO } from './formatters';

// Initialize and apply plugin to jsPDF prototype if available
try {
  applyPlugin(jsPDF);
} catch (e) {
  // Plugin applied or standalone mode
}

// Extend jsPDF with autotable types
interface ExtendedJSPDF extends jsPDF {
  lastAutoTable?: { finalY: number };
  autoTable?: (options: any) => ExtendedJSPDF;
}

/**
 * Draws standard Official Angolan Institutional Header
 */
function drawAngolanHeader(doc: jsPDF, institution: InstitutionInfo, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Republic Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(institution.republicHeader, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  // Ministry
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(institution.ministryHeader, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // Provincial
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(institution.provincialHeader, pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  // School Name
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Deep Navy/Slate 900
  doc.text(institution.name.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // Decree & NIF
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${institution.subTitle} | ${institution.decreeNumber} | NIF: ${institution.nif}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  // Divider line
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 7;

  // Document Title Box
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // Blue 900
  doc.text(title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;
  } else {
    currentY += 2;
  }

  return currentY;
}

/**
 * 1. OFFICIAL CAIXA RECEIPT PDF GENERATION
 */
export function generateReceiptPDF(receipt: PaymentReceipt, institution: InstitutionInfo = INSTITUTION_INFO): void {
  const doc = new jsPDF() as ExtendedJSPDF;
  let y = drawAngolanHeader(
    doc, 
    institution, 
    'RECIBO OFICIAL DE CAIXA', 
    `Nº: ${receipt.receiptNumber} • Autenticação: ${receipt.hashVerification}`
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  // Student & Payment Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text('Estudante:', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${receipt.studentName} (${receipt.studentId})`, 40, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Nº de B.I.:', 18, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.studentBi || '-', 40, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Turma / Curso:', 18, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`${receipt.turmaName} • ${receipt.courseName}`, 45, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('Data / Hora:', pageWidth / 2 + 10, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateTimeAO(receipt.issuedAt), pageWidth / 2 + 35, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Forma Pagam.:', pageWidth / 2 + 10, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${receipt.paymentMethod} ${receipt.bankReference ? `(Ref: ${receipt.bankReference})` : ''}`, pageWidth / 2 + 38, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Operador/Caixa:', pageWidth / 2 + 10, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.cashierName, pageWidth / 2 + 40, y + 18);

  y += 34;

  // Table of Items
  const tableData = receipt.items.map((item, index) => [
    (index + 1).toString(),
    item.description,
    item.quantity.toString(),
    formatKz(item.baseAmount),
    item.lateFee > 0 ? formatKz(item.lateFee) : '-',
    formatKz(item.totalAmount),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Discriminação do Serviço / Propina', 'Qtd', 'Preço Base', 'Multa (10%)', 'Total (Kz)']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc.lastAutoTable?.finalY || y) + 8;

  // Totals Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth - 85, finalY, 71, 24, 2, 2, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', pageWidth - 80, finalY + 6);
  doc.text(formatKz(receipt.subtotal), pageWidth - 18, finalY + 6, { align: 'right' });

  doc.text('Total de Multas:', pageWidth - 80, finalY + 12);
  doc.text(formatKz(receipt.totalLateFee), pageWidth - 18, finalY + 12, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL PAGO:', pageWidth - 80, finalY + 20);
  doc.text(formatKz(receipt.totalPaid), pageWidth - 18, finalY + 20, { align: 'right' });

  // Verification Note & Signatures
  const signY = finalY + 40;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(25, signY, 85, signY);
  doc.line(pageWidth - 85, signY, pageWidth - 25, signY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Assinatura do Depositante / Encarregado', 55, signY + 4, { align: 'center' });
  doc.text('O(A) Operador(a) de Caixa Autorizado', pageWidth - 55, signY + 4, { align: 'center' });

  doc.setFontSize(7.5);
  doc.text(
    `Documento processado informaticamente pelo SIGE Angola • Código Hash: ${receipt.hashVerification} • Emitido em ${formatDateTimeAO(receipt.issuedAt)}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  doc.save(`Recibo_${receipt.receiptNumber.replace(/\//g, '_')}.pdf`);
}

/**
 * 2. FICHA OFICIAL DE MATRÍCULA EM PDF
 */
export function generateEnrollmentFormPDF(student: Student, turmaName: string, courseName: string, className: string, institution: InstitutionInfo = INSTITUTION_INFO): void {
  const doc = new jsPDF() as ExtendedJSPDF;
  let y = drawAngolanHeader(
    doc, 
    institution, 
    'FICHA OFICIAL DE MATRÍCULA E INSCRIÇÃO', 
    `Ano Letivo 2025/2026 • Nº de Processo: ${student.id}`
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  // Photo placeholder box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(pageWidth - 45, y, 31, 38, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('FOTO TIPO PASSE', pageWidth - 29.5, y + 20, { align: 'center' });

  // Student details
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('1. DADOS PESSOAIS DO ESTUDANTE', 14, y + 4);
  
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  y += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nome Completo:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.fullName, 42, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Bilhete de Identidade (BI):', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.biNumber, 55, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Data de Nascimento:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDateAO(student.birthDate)} (Gênero: ${student.gender === 'M' ? 'Masculino' : 'Feminino'})`, 48, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Naturalidade / Província:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.naturality} / ${student.province}`, 53, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Residência Atual:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.address, 42, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Contacto Telefónico:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.phone, 47, y);

  // Section 2: Encarregado
  y += 12;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('2. FILIAÇÃO E ENCARREGADO DE EDUCAÇÃO', 14, y);

  y += 8;
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('Encarregado(a):', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.guardianName} (${student.guardianKinship})`, 42, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Telefone Encarregado:', pageWidth / 2 + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.guardianPhone, pageWidth / 2 + 48, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Profissão:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(student.guardianProfession || 'Não Declarada', 32, y);

  // Section 3: Academic Allocation
  y += 12;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('3. ENQUADRAMENTO CURRICULAR E TURMA', 14, y);

  y += 8;
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('Curso / Ramo:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(courseName, 38, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Classe:', pageWidth / 2 + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(className, pageWidth / 2 + 25, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Turma Designada:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(turmaName, 43, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Turno / Nº de Ordem:', pageWidth / 2 + 10, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.shift} • Nº ${student.studentNumber}`, pageWidth / 2 + 46, y);

  // Section 4: Document Checklist
  y += 12;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('4. CONFERÊNCIA DE DOCUMENTOS APRESENTADOS', 14, y);

  y += 8;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const docs = [
    `[${student.documentsSubmitted.biCopy ? 'X' : ' '}] Cópia do Bilhete de Identidade / Assento`,
    `[${student.documentsSubmitted.passPhoto ? 'X' : ' '}] 4 Fotografias Tipo Passe Recentes`,
    `[${student.documentsSubmitted.previousCertificate ? 'X' : ' '}] Certificado ou Declaração com Notas Anterior`,
    `[${student.documentsSubmitted.medicalAttestation ? 'X' : ' '}] Atestado Médico de Aptidão Física`,
  ];

  docs.forEach((item, idx) => {
    const col = idx % 2 === 0 ? 14 : pageWidth / 2 + 10;
    const rowY = y + Math.floor(idx / 2) * 6;
    doc.text(item, col, rowY);
  });

  // Signatures
  const signY = doc.internal.pageSize.getHeight() - 38;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(20, signY, 75, signY);
  doc.line(pageWidth / 2 - 25, signY, pageWidth / 2 + 25, signY);
  doc.line(pageWidth - 75, signY, pageWidth - 20, signY);

  doc.setFontSize(7.5);
  doc.text('O(A) Encarregado(a) de Educação', 47.5, signY + 4, { align: 'center' });
  doc.text('A Secretaria Geral', pageWidth / 2, signY + 4, { align: 'center' });
  doc.text('O Diretor Pedagógico', pageWidth - 47.5, signY + 4, { align: 'center' });

  doc.save(`Ficha_Matricula_${student.id}_${student.fullName.split(' ')[0]}.pdf`);
}

/**
 * 3. BOLETIM DE NOTAS INDIVIDUAL EM PDF
 */
export function generateBoletimNotasPDF(
  student: Student, 
  turma: Turma, 
  course: Course,
  assignments: CurricularAssignment[], 
  subjects: Subject[], 
  grades: GradeRecord[], 
  institution: InstitutionInfo = INSTITUTION_INFO
): void {
  const doc = new jsPDF() as ExtendedJSPDF;
  let y = drawAngolanHeader(
    doc, 
    institution, 
    'BOLETIM DE NOTAS INSTITUCIONAL', 
    `Ano Letivo 2025/2026 • Avaliação Trimestral Contínua`
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  // Student header block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  doc.text('Estudante:', 18, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${student.fullName} (Nº Processo: ${student.id})`, 37, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Turma / Nº:', 18, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${turma.name} • Nº ${student.studentNumber} • Turno: ${student.shift}`, 37, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Curso:', 18, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(course.name, 30, y + 17);

  doc.setFont('helvetica', 'bold');
  doc.text('Data de Emissão:', pageWidth / 2 + 25, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateAO(new Date().toISOString()), pageWidth / 2 + 55, y + 5);

  y += 28;

  // Build subject marks rows
  const turmaAssignments = assignments.filter(a => a.turmaId === turma.id);
  const rows: any[] = [];

  let totalMT1 = 0;
  let totalMT2 = 0;
  let totalMT3 = 0;
  let validCount1 = 0;
  let validCount2 = 0;
  let validCount3 = 0;

  turmaAssignments.forEach(asg => {
    const sub = subjects.find(s => s.id === asg.subjectId);
    if (!sub) return;

    const gT1 = grades.find(g => g.studentId === student.id && g.assignmentId === asg.id && g.trimester === 1);
    const gT2 = grades.find(g => g.studentId === student.id && g.assignmentId === asg.id && g.trimester === 2);
    const gT3 = grades.find(g => g.studentId === student.id && g.assignmentId === asg.id && g.trimester === 3);

    const mt1 = gT1 ? gT1.mt.toFixed(1) : '-';
    const mt2 = gT2 ? gT2.mt.toFixed(1) : '-';
    const mt3 = gT3 ? gT3.mt.toFixed(1) : '-';

    if (gT1) { totalMT1 += gT1.mt; validCount1++; }
    if (gT2) { totalMT2 += gT2.mt; validCount2++; }
    if (gT3) { totalMT3 += gT3.mt; validCount3++; }

    // Final average across available trimesters
    const validTrims = [gT1?.mt, gT2?.mt, gT3?.mt].filter(v => v !== undefined) as number[];
    const mf = validTrims.length > 0 ? (validTrims.reduce((a, b) => a + b, 0) / validTrims.length).toFixed(1) : '-';
    const mfNum = parseFloat(mf);
    const resultado = isNaN(mfNum) ? 'Em Curso' : (mfNum >= 9.5 ? 'Aprovado' : 'Não Aprovado');

    rows.push([
      sub.name,
      `${asg.weeklyHours}h`,
      gT1 ? gT1.mac.toFixed(1) : '-',
      gT1 ? gT1.npt.toFixed(1) : '-',
      mt1,
      mt2,
      mt3,
      mf,
      resultado,
    ]);
  });

  const mediaGlobal1 = validCount1 > 0 ? (totalMT1 / validCount1).toFixed(1) : '-';
  const mediaGlobal2 = validCount2 > 0 ? (totalMT2 / validCount2).toFixed(1) : '-';
  const mediaGlobal3 = validCount3 > 0 ? (totalMT3 / validCount3).toFixed(1) : '-';

  autoTable(doc, {
    startY: y,
    head: [
      [
        { content: 'Disciplina', rowSpan: 2 },
        { content: 'Carga', rowSpan: 2 },
        { content: '1º Trimestre', colSpan: 3, styles: { halign: 'center' } },
        { content: '2º Trim', rowSpan: 2, styles: { halign: 'center' } },
        { content: '3º Trim', rowSpan: 2, styles: { halign: 'center' } },
        { content: 'M.F.', rowSpan: 2, styles: { halign: 'center' } },
        { content: 'Situação', rowSpan: 2, styles: { halign: 'center' } },
      ],
      [
        { content: 'MAC (50%)', styles: { halign: 'center' } },
        { content: 'NPT (50%)', styles: { halign: 'center' } },
        { content: 'MT1', styles: { halign: 'center', fontStyle: 'bold' } },
      ],
    ],
    body: rows,
    foot: [[
      'MÉDIA GERAL DO TRIMESTRE',
      '',
      '',
      '',
      mediaGlobal1,
      mediaGlobal2,
      mediaGlobal3,
      '-',
      '-',
    ]],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8 },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 23, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc.lastAutoTable?.finalY || y) + 12;

  // Evaluation Scale Guide & Signatures
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Legenda: MAC (Avaliação Contínua 50%) • NPT (Prova Trimestral 50%) • MT (Média Trimestral = MAC 50% + NPT 50%)', 14, finalY);

  const signY = finalY + 28;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(20, signY, 70, signY);
  doc.line(pageWidth / 2 - 25, signY, pageWidth / 2 + 25, signY);
  doc.line(pageWidth - 70, signY, pageWidth - 20, signY);

  doc.text('O Diretor de Turma', 45, signY + 4, { align: 'center' });
  doc.text('O Encarregado de Educação', pageWidth / 2, signY + 4, { align: 'center' });
  doc.text('O Diretor Pedagógico', pageWidth - 45, signY + 4, { align: 'center' });

  doc.save(`Boletim_${student.id}_${student.fullName.split(' ')[0]}.pdf`);
}

/**
 * 4. PAUTA GERAL DE APROVEITAMENTO CONSOLIDADA (TURMA) EM PDF (Landscape)
 */
export function generatePautaGeralPDF(
  turma: Turma,
  course: Course,
  trimester: 1 | 2 | 3,
  students: Student[],
  assignments: CurricularAssignment[],
  subjects: Subject[],
  grades: GradeRecord[],
  institution: InstitutionInfo = INSTITUTION_INFO
): void {
  // Use Landscape for Wide Grid
  const doc = new jsPDF({ orientation: 'landscape' }) as ExtendedJSPDF;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(institution.republicHeader, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(11);
  doc.text(institution.name.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.text(`PAUTA GERAL DE APROVEITAMENTO • ${trimester}º TRIMESTRE • ANO LETIVO 2025/2026`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Turma: ${turma.name} | Curso: ${course.name} | Turno: ${turma.shift}`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  const turmaStudents = students.filter(s => s.turmaId === turma.id).sort((a, b) => a.studentNumber - b.studentNumber);
  const turmaAssignments = assignments.filter(a => a.turmaId === turma.id);

  const headRow1 = ['Nº', 'Nome Completo do Estudante'];
  turmaAssignments.forEach(asg => {
    const sub = subjects.find(s => s.id === asg.subjectId);
    headRow1.push(sub?.code || 'DISC');
  });
  headRow1.push('M.Global', 'Posit.', 'Negat.', 'Resultado');

  const rows = turmaStudents.map(student => {
    let sumMT = 0;
    let countMT = 0;
    let posCount = 0;
    let negCount = 0;

    const row = [student.studentNumber.toString(), student.fullName];

    turmaAssignments.forEach(asg => {
      const grade = grades.find(g => g.studentId === student.id && g.assignmentId === asg.id && g.trimester === trimester);
      if (grade) {
        row.push(grade.mt.toFixed(1));
        sumMT += grade.mt;
        countMT++;
        if (grade.mt >= 9.5) posCount++;
        else negCount++;
      } else {
        row.push('-');
      }
    });

    const mGlobal = countMT > 0 ? (sumMT / countMT).toFixed(1) : '-';
    const mNum = parseFloat(mGlobal);
    const result = isNaN(mNum) ? '-' : (mNum >= 9.5 ? 'Apto' : 'Não Apto');

    row.push(mGlobal, posCount.toString(), negCount.toString(), result);
    return row;
  });

  autoTable(doc, {
    startY: y,
    head: [headRow1],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 65 },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc.lastAutoTable?.finalY || y) + 15;
  const signY = Math.min(finalY + 10, doc.internal.pageSize.getHeight() - 25);

  doc.setDrawColor(148, 163, 184);
  doc.line(30, signY, 90, signY);
  doc.line(pageWidth / 2 - 30, signY, pageWidth / 2 + 30, signY);
  doc.line(pageWidth - 90, signY, pageWidth - 30, signY);

  doc.setFontSize(7.5);
  doc.text('O Diretor de Turma', 60, signY + 4, { align: 'center' });
  doc.text('A Comissão de Avaliação', pageWidth / 2, signY + 4, { align: 'center' });
  doc.text('O Diretor Pedagógico', pageWidth - 60, signY + 4, { align: 'center' });

  doc.save(`Pauta_Geral_${turma.name.replace(/\s+/g, '_')}_Trimestre_${trimester}.pdf`);
}

/**
 * 5. BALANCETE FINANCEIRO EM PDF
 */
export function generateFinancialBalanceSheetPDF(
  receipts: PaymentReceipt[], 
  expenses: ExpenseRecord[], 
  institution: InstitutionInfo = INSTITUTION_INFO
): void {
  const doc = new jsPDF() as ExtendedJSPDF;
  let y = drawAngolanHeader(
    doc, 
    institution, 
    'BALANCETE FINANCEIRO CONSOLIDADO', 
    `Gestão de Tesouraria e Fluxo de Caixa Escolar`
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  const totalInflow = receipts.filter(r => r.status === 'EMITIDO').reduce((acc, r) => acc + r.totalPaid, 0);
  const totalLateFees = receipts.filter(r => r.status === 'EMITIDO').reduce((acc, r) => acc + r.totalLateFee, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalInflow - totalExpenses;

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  doc.text('Arrecadação Total (Entradas):', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(formatKz(totalInflow), 70, y + 6);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Multas por Atraso Cobradas:', 18, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(formatKz(totalLateFees), 70, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Total de Despesas Pagas:', pageWidth / 2 + 10, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(225, 29, 72); // Rose
  doc.text(formatKz(totalExpenses), pageWidth / 2 + 55, y + 6);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('Saldo Líquido em Caixa:', pageWidth / 2 + 10, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 58, 138); // Navy
  doc.text(formatKz(netBalance), pageWidth / 2 + 55, y + 13);

  y += 34;

  // Recent Receipts Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('Últimas Entradas / Recibos Processados', 14, y);

  y += 4;
  const receiptsRows = receipts.slice(0, 8).map(r => [
    r.receiptNumber,
    r.studentName,
    r.paymentMethod,
    formatDateAO(r.issuedAt),
    formatKz(r.totalPaid),
    r.status,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Nº Recibo', 'Estudante', 'Método', 'Data', 'Total Pago (Kz)', 'Estado']],
    body: receiptsRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    margin: { left: 14, right: 14 },
  });

  const nextY = (doc.lastAutoTable?.finalY || y) + 8;

  // Expenses Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('Despesas Operacionais Registadas', 14, nextY);

  const expRows = expenses.map(e => [
    formatDateAO(e.date),
    e.description,
    e.category,
    e.recipient,
    formatKz(e.amount),
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Data', 'Descrição da Despesa', 'Categoria', 'Beneficiário / Fornecedor', 'Valor (Kz)']],
    body: expRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`Balancete_Financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * 6. AUDIT LOG REPORT IN PDF
 */
export function generateAuditLogPDF(logs: AuditLog[], institution: InstitutionInfo = INSTITUTION_INFO): void {
  const doc = new jsPDF({ orientation: 'landscape' }) as ExtendedJSPDF;
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(institution.republicHeader, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.text('LIVRO OFICIAL DE AUDITORIA E SEGURANÇA DO SISTEMA', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Rastreamento de Atividades e Logs de Controlo de Acesso (RBAC) • Gerado em ${formatDateTimeAO(new Date().toISOString())}`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  const rows = logs.map(log => [
    formatDateTimeAO(log.timestamp),
    log.userName,
    log.userRole,
    log.module,
    log.action,
    log.details,
    log.ipAddress,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Data / Hora', 'Utilizador', 'Perfil', 'Módulo', 'Ação Realizada', 'Detalhes do Evento', 'IP Origem']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 35 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 25 },
      4: { cellWidth: 40 },
      5: { cellWidth: 95 },
      6: { cellWidth: 22, halign: 'center' },
    },
    margin: { left: 10, right: 10 },
  });

  doc.save(`Livro_Auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * 7. OFFICIAL STUDENT DECLARATION DOCUMENT IN PDF
 */
export function generateOfficialDeclarationPDF(
  request: DocumentRequest, 
  student: Student, 
  institution: InstitutionInfo = INSTITUTION_INFO
): void {
  const doc = new jsPDF() as ExtendedJSPDF;
  let y = drawAngolanHeader(
    doc, 
    institution, 
    'DECLARAÇÃO INSTITUCIONAL', 
    `Registo Nº: ${request.requestNumber} • Emitido pela Secretaria Geral`
  );

  const pageWidth = doc.internal.pageSize.getWidth();
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  const bodyText = `Para os devidos efeitos e a pedido do interessado, declara-se que ${student.fullName.toUpperCase()}, filho(a) de ${student.guardianName}, portador(a) do Bilhete de Identidade nº ${student.biNumber}, natural de ${student.naturality}, Província de ${student.province}, nascido(a) aos ${formatDateAO(student.birthDate)}, encontra-se regularmente MATRICULADO(A) e a frequentar as aulas neste estabelecimento de ensino sob o número de processo ${student.id}, inserido(a) no curso de ${student.courseName || student.courseId}, na ${student.turmaName || 'sua respectiva turma'}, no corrente Ano Letivo 2025/2026.`;

  const splitText = doc.splitTextToSize(bodyText, pageWidth - 36);
  doc.text(splitText, 18, y, { lineHeightFactor: 1.6 });

  y += splitText.length * 7 + 10;

  const purposeText = `A presente declaração é emitida para o fim específico de: "${request.purpose.toUpperCase()}" e é válida por 90 (noventa) dias a contar da data da sua emissão.`;
  const splitPurpose = doc.splitTextToSize(purposeText, pageWidth - 36);
  doc.setFont('helvetica', 'bold');
  doc.text(splitPurpose, 18, y, { lineHeightFactor: 1.5 });

  y += splitPurpose.length * 7 + 20;

  doc.setFont('helvetica', 'normal');
  doc.text(`${institution.city || 'Luanda'}, aos ${formatDateAO(new Date().toISOString())}.`, pageWidth - 20, y, { align: 'right' });

  // Signatures
  const signY = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(148, 163, 184);
  doc.line(25, signY, 80, signY);
  doc.line(pageWidth - 80, signY, pageWidth - 25, signY);

  doc.setFontSize(8);
  doc.text('A Chefe de Secretaria', 52.5, signY + 4, { align: 'center' });
  doc.text('O Diretor Geral / Pedagógico', pageWidth - 52.5, signY + 4, { align: 'center' });

  doc.save(`Declaracao_${request.requestNumber.replace(/\//g, '_')}_${student.fullName.split(' ')[0]}.pdf`);
}

export function generateBalancetePDF(
  yearOrReceipts: string | PaymentReceipt[],
  totalRevenueOrExpenses?: number | ExpenseRecord[],
  totalExpensesOrInst?: number | InstitutionInfo,
  totalLateFees?: number,
  netBalance?: number,
  receiptsList?: PaymentReceipt[],
  expensesList?: ExpenseRecord[],
  institutionInfo?: InstitutionInfo
): void {
  if (Array.isArray(yearOrReceipts)) {
    generateFinancialBalanceSheetPDF(
      yearOrReceipts, 
      (totalRevenueOrExpenses as ExpenseRecord[]) || [], 
      (totalExpensesOrInst as InstitutionInfo) || INSTITUTION_INFO
    );
  } else {
    generateFinancialBalanceSheetPDF(
      receiptsList || [], 
      expensesList || [], 
      institutionInfo || INSTITUTION_INFO
    );
  }
}

export function generateDeclarationPDF(
  student: Student,
  request: DocumentRequest,
  turmaName: string,
  courseName: string,
  institution: InstitutionInfo = INSTITUTION_INFO
): void {
  generateOfficialDeclarationPDF({
    ...request,
    turmaName,
    courseName,
  }, {
    ...student,
    turmaName,
    courseName,
  }, institution);
}

/**
 * 8. OFFICIAL MINIPAUTA DOCENTE EM PDF
 */
export function generateMinipautaPDF(
  turma: Turma,
  subject: Subject,
  teacherName: string,
  trimester: 1 | 2 | 3,
  students: Student[],
  grades: GradeRecord[],
  assignmentId: string,
  institution: InstitutionInfo = INSTITUTION_INFO
): void {
  const doc = new jsPDF() as ExtendedJSPDF;
  let y = drawAngolanHeader(
    doc,
    institution,
    'MINIPAUTA DO DOCENTE • AVALIAÇÃO TRIMESTRAL',
    `Fórmula Oficial: MT = MAC (50%) + NPT (50%)`
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  // Assignment metadata box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);

  doc.text('Disciplina:', 18, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${subject.name} (${subject.code})`, 37, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Turma / Turno:', 18, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${turma.name} • ${turma.shift}`, 42, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Professor(a):', pageWidth / 2 + 10, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(teacherName, pageWidth / 2 + 35, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Trimestre:', pageWidth / 2 + 10, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${trimester}º Trimestre (Ano Letivo 2025/2026)`, pageWidth / 2 + 30, y + 11);

  y += 26;

  const sortedStudents = [...students].sort((a, b) => a.studentNumber - b.studentNumber);

  let totalMT = 0;
  let validCount = 0;
  let posCount = 0;
  let negCount = 0;

  const rows = sortedStudents.map(st => {
    const g = grades.find(
      gr => gr.studentId === st.id && gr.assignmentId === assignmentId && gr.trimester === trimester
    );

    const macStr = g && !isNaN(g.mac) ? g.mac.toFixed(1) : '-';
    const nptStr = g && !isNaN(g.npt) ? g.npt.toFixed(1) : '-';
    const mtStr = g && !isNaN(g.mt) ? g.mt.toFixed(1) : '-';

    if (g && !isNaN(g.mt)) {
      totalMT += g.mt;
      validCount++;
      if (g.mt >= 9.5) posCount++;
      else negCount++;
    }

    const resultado = g && !isNaN(g.mt) ? (g.mt >= 9.5 ? 'Positivo' : 'Negativo') : '-';

    return [
      st.studentNumber.toString(),
      st.fullName,
      macStr,
      nptStr,
      mtStr,
      resultado,
      g?.observations || '',
    ];
  });

  const mediaTurma = validCount > 0 ? (totalMT / validCount).toFixed(1) : '-';

  autoTable(doc, {
    startY: y,
    head: [[
      'Nº',
      'Nome Completo do Estudante',
      'MAC (50%)\nAv. Contínua',
      'NPT (50%)\nPrv. Trimestral',
      'M.T.\nMédia Trim.',
      'Aproveitamento',
      'Observações',
    ]],
    body: rows,
    foot: [[
      '',
      `MÉDIA DA TURMA (${validCount} avaliados | ${posCount} Positivas, ${negCount} Negativas)`,
      '',
      '',
      mediaTurma,
      '',
      '',
    ]],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8, halign: 'center' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 58 },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 24 },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc.lastAutoTable?.finalY || y) + 12;

  // Signatures
  const signY = Math.min(finalY + 15, doc.internal.pageSize.getHeight() - 25);
  doc.setDrawColor(148, 163, 184);
  doc.line(25, signY, 80, signY);
  doc.line(pageWidth - 80, signY, pageWidth - 25, signY);

  doc.setFontSize(7.5);
  doc.text('O(A) Professor(a) Titular', 52.5, signY + 4, { align: 'center' });
  doc.text('O Diretor Pedagógico', pageWidth - 52.5, signY + 4, { align: 'center' });

  doc.save(`Minipauta_${subject.code}_${turma.name.replace(/\s+/g, '_')}_Trim_${trimester}.pdf`);
}


