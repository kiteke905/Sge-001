export function formatKz(amount: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('AOA', 'Kz');
}

export function formatDateAO(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTimeAO(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function calculateGradeStatus(mt: number): {
  label: 'Aprovado' | 'Recurso' | 'Reprovado' | 'Pendente';
  colorClass: string;
  badgeClass: string;
} {
  if (mt === undefined || mt === null || isNaN(mt)) {
    return {
      label: 'Pendente',
      colorClass: 'text-slate-500',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }
  if (mt >= 13.5) {
    return {
      label: 'Aprovado',
      colorClass: 'text-emerald-700 font-semibold',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  } else if (mt >= 9.5) {
    return {
      label: 'Aprovado',
      colorClass: 'text-blue-700 font-medium',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  } else if (mt >= 7.0) {
    return {
      label: 'Recurso',
      colorClass: 'text-amber-700 font-medium',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  } else {
    return {
      label: 'Reprovado',
      colorClass: 'text-rose-700 font-bold',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }
}

export function calculateMT(mac: number, npt: number): number {
  const vMac = Number(mac) || 0;
  const vNpt = Number(npt) || 0;
  const mt = (vMac * 0.5) + (vNpt * 0.5);
  return Math.round(mt * 100) / 100;
}

export function generateVerificationHash(): string {
  const chars = '0123456789ABCDEF';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment()}-${segment()}-${segment()}-${segment()}`;
}

/**
 * Alterna automaticamente as iniciais de nomes próprios para maiúsculas e o restante para minúsculas
 * ao deslizar ou inserir espaço (Title Case para nomes pessoais).
 * Ex: "adão mukendi" -> "Adão Mukendi", "JOÃO BAPTISTA" -> "João Baptista"
 */
export function formatNameInput(value: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/(?:^|[\s\-'’])[\p{L}]/gu, (match) => match.toUpperCase());
}
