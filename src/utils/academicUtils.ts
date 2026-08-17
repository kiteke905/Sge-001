import { AcademicYear, PaymentReceipt, PaymentItem, Student } from '../types';

export const ANGOLAN_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Generates the 10 tuition months for a given academic year starting from a specific opening month.
 */
export function generateAcademicYearTuitionMonths(startMonthName: string = 'Setembro', startYear: number = 2025): string[] {
  const safeStartMonth = (startMonthName || 'Setembro').toLowerCase();
  let monthIdx = ANGOLAN_MONTHS.findIndex(m => (m || '').toLowerCase() === safeStartMonth);
  if (monthIdx === -1) monthIdx = 8; // Default to Setembro

  const months: string[] = [];
  let curYear = startYear;
  let curMonthIdx = monthIdx;

  for (let i = 0; i < 10; i++) {
    months.push(`${ANGOLAN_MONTHS[curMonthIdx]} / ${curYear}`);
    curMonthIdx++;
    if (curMonthIdx > 11) {
      curMonthIdx = 0;
      curYear++;
    }
  }

  return months;
}

/**
 * Generates the 10 tuition months for a given academic year starting from its opening date or configured list.
 */
export function getTuitionMonthsForAcademicYear(academicYear?: AcademicYear): string[] {
  if (academicYear?.tuitionMonths && academicYear.tuitionMonths.length === 10) {
    return academicYear.tuitionMonths;
  }

  const startDateStr = academicYear?.startDate || '2025-09-01';
  const start = new Date(startDateStr);
  let curYear = isNaN(start.getFullYear()) ? 2025 : start.getFullYear();
  let curMonthIdx = isNaN(start.getMonth()) ? 8 : start.getMonth(); // 8 = September

  const months: string[] = [];
  for (let i = 0; i < 10; i++) {
    months.push(`${ANGOLAN_MONTHS[curMonthIdx]} / ${curYear}`);
    curMonthIdx++;
    if (curMonthIdx > 11) {
      curMonthIdx = 0;
      curYear++;
    }
  }

  return months;
}

export interface MonthPaymentStatus {
  monthName: string;
  order: number;
  isPaid: boolean;
  isPayable: boolean;
  isLocked: boolean;
  isFirstMonth: boolean;
  receiptNumber?: string;
  paidDate?: string;
  reason?: string;
}

/**
 * Evaluates the payment status of all 10 tuition months for a given student.
 * Enforces strictly sequential payment: Month N can only be paid if Month N-1 is paid.
 */
export function getStudentTuitionStatus(
  studentId: string,
  receipts: PaymentReceipt[],
  academicYear?: AcademicYear
): MonthPaymentStatus[] {
  const months = getTuitionMonthsForAcademicYear(academicYear);
  const studentReceipts = receipts.filter(r => r.studentId === studentId && r.status === 'EMITIDO');

  // Build a map of paid months
  const paidMonthsMap = new Map<string, { receiptNumber: string; paidDate: string }>();

  for (const receipt of studentReceipts) {
    for (const item of receipt.items) {
      if (item.serviceType === 'PROPINA_MENSAL' && item.targetMonth) {
        // Match either full month string or base month name
        const raw = item.targetMonth.trim();
        paidMonthsMap.set(raw, {
          receiptNumber: receipt.receiptNumber,
          paidDate: receipt.issuedAt,
        });

        // Also index by month name only if formatted with year
        const monthPrefix = raw.split('/')[0].trim();
        paidMonthsMap.set(monthPrefix, {
          receiptNumber: receipt.receiptNumber,
          paidDate: receipt.issuedAt,
        });
      }
    }
  }

  const results: MonthPaymentStatus[] = [];
  let foundFirstUnpaid = false;

  for (let i = 0; i < months.length; i++) {
    const month = months[i];
    const monthPrefix = month.split('/')[0].trim();
    const paidInfo = paidMonthsMap.get(month) || paidMonthsMap.get(monthPrefix);
    const isFirstMonth = i === 0;

    if (paidInfo) {
      results.push({
        monthName: month,
        order: i + 1,
        isPaid: true,
        isPayable: false,
        isLocked: false,
        isFirstMonth,
        receiptNumber: paidInfo.receiptNumber,
        paidDate: paidInfo.paidDate,
      });
    } else if (!foundFirstUnpaid) {
      // This is the next eligible month to pay
      foundFirstUnpaid = true;
      results.push({
        monthName: month,
        order: i + 1,
        isPaid: false,
        isPayable: true,
        isLocked: false,
        isFirstMonth,
      });
    } else {
      // Blocked because previous unpaid months exist
      const prevMonth = months[i - 1];
      results.push({
        monthName: month,
        order: i + 1,
        isPaid: false,
        isPayable: false,
        isLocked: true,
        isFirstMonth,
        reason: `Requer liquidação do mês anterior (${prevMonth})`,
      });
    }
  }

  return results;
}

/**
 * Returns the next payable tuition month name for the student.
 */
export function getNextPayableTuitionMonth(
  studentId: string,
  receipts: PaymentReceipt[],
  academicYear?: AcademicYear
): string | null {
  const statuses = getStudentTuitionStatus(studentId, receipts, academicYear);
  const payable = statuses.find(s => s.isPayable);
  return payable ? payable.monthName : null;
}

/**
 * Validates if a specific tuition month is payable for a student.
 */
export function isTuitionMonthPayable(
  studentId: string,
  targetMonth: string,
  receipts: PaymentReceipt[],
  academicYear?: AcademicYear
): { payable: boolean; reason?: string } {
  const statuses = getStudentTuitionStatus(studentId, receipts, academicYear);
  const safeTargetMonth = (targetMonth || '').toLowerCase().trim();
  const matched = statuses.find(s => {
    const sMonth = (s.monthName || '').toLowerCase().trim();
    if (!safeTargetMonth || !sMonth) return false;
    return sMonth === safeTargetMonth || sMonth.includes(safeTargetMonth) || safeTargetMonth.includes(sMonth);
  });

  if (!matched) {
    return { payable: false, reason: 'Mês não reconhecido no calendário escolar do ano letivo.' };
  }

  if (matched.isPaid) {
    return { payable: false, reason: `A propina de ${matched.monthName} já foi liquidada pelo estudante (Recibo ${matched.receiptNumber}).` };
  }

  if (matched.isLocked) {
    return { payable: false, reason: matched.reason || 'Não é permitido pagar este mês sem antes quitar as propinas anteriores.' };
  }

  return { payable: true };
}

/**
 * Checks if the student has paid both:
 * 1) 1st Month Tuition of the academic year
 * 2) Student Card fee (CARTAO_ESTUDANTE)
 */
export function isEnrollmentRequirementsFulfilled(
  studentId: string,
  receipts: PaymentReceipt[],
  academicYear?: AcademicYear
): { fulfilled: boolean; hasFirstMonth: boolean; hasCard: boolean; missingItems: string[] } {
  const months = getTuitionMonthsForAcademicYear(academicYear);
  const firstMonth = months[0]?.trim() || 'Setembro';
  const firstMonthPrefix = firstMonth.split('/')[0].trim();

  const studentReceipts = receipts.filter(r => r.studentId === studentId && r.status === 'EMITIDO');

  let hasFirstMonth = false;
  let hasCard = false;

  const firstMonthLower = (firstMonth || '').toLowerCase().trim();
  const firstMonthPrefixLower = (firstMonthPrefix || '').toLowerCase().trim();

  for (const r of studentReceipts) {
    for (const item of r.items) {
      if (item.serviceType === 'PROPINA_MENSAL' && item.targetMonth) {
        const itemMonthLower = (item.targetMonth || '').toLowerCase().trim();
        if (
          (firstMonthPrefixLower && itemMonthLower.includes(firstMonthPrefixLower)) ||
          (firstMonthLower && firstMonthLower.includes(itemMonthLower))
        ) {
          hasFirstMonth = true;
        }
      }
      if (item.serviceType === 'CARTAO_ESTUDANTE') {
        hasCard = true;
      }
    }
  }

  const missingItems: string[] = [];
  if (!hasFirstMonth) missingItems.push(`1ª Propina (${firstMonth})`);
  if (!hasCard) missingItems.push('Cartão Magnético de Estudante');

  return {
    fulfilled: hasFirstMonth && hasCard,
    hasFirstMonth,
    hasCard,
    missingItems,
  };
}
