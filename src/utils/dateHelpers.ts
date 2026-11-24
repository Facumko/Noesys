/**
 * Utilidades puras de fecha para cálculo en tiempo local (YYYY-MM-DD).
 * Regla técnica crítica 4: Prohibido comparar contra UTC sin normalizar.
 */

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    throw new Error(`Formato de fecha inválido: ${dateStr}. Se esperaba YYYY-MM-DD`);
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}

export function getTodayLocalDateString(): string {
  return formatLocalDate(new Date());
}

/**
 * Calcula los días enteros entre la fecha de referencia y el examen.
 * Devuelve 0 si es hoy, 1 si es mañana, negativo si ya pasó.
 */
export function getDaysUntilExam(examDateStr: string, referenceDateStr?: string): number {
  const refStr = referenceDateStr ?? getTodayLocalDateString();
  const examDate = parseLocalDate(examDateStr);
  const refDate = parseLocalDate(refStr);

  const diffTime = examDate.getTime() - refDate.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function isExamPassed(examDateStr: string, referenceDateStr?: string): boolean {
  return getDaysUntilExam(examDateStr, referenceDateStr) < 0;
}

const MONTH_NAMES_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

export function formatDisplayDate(dateStr: string): string {
  try {
    const date = parseLocalDate(dateStr);
    const day = date.getDate();
    const month = MONTH_NAMES_ES[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

export function getRelativeExamLabel(examDateStr: string, referenceDateStr?: string): string {
  const days = getDaysUntilExam(examDateStr, referenceDateStr);
  if (days < 0) {
    return 'Examen pasado';
  }
  if (days === 0) {
    return 'Rinde hoy';
  }
  if (days === 1) {
    return 'Rinde mañana';
  }
  return `En ${days} días`;
}
