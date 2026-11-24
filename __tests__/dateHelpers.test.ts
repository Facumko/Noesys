import {
  formatLocalDate,
  parseLocalDate,
  getDaysUntilExam,
  isExamPassed,
  formatDisplayDate,
  getRelativeExamLabel,
} from '../src/utils/dateHelpers';

describe('dateHelpers pure logic tests (US-1.3)', () => {
  test('formatLocalDate formats year-month-day with padded zeroes', () => {
    const d = new Date(2026, 4, 3); // 3 de Mayo 2026
    expect(formatLocalDate(d)).toBe('2026-05-03');
  });

  test('parseLocalDate creates local midnight date', () => {
    const d = parseLocalDate('2026-11-24');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10); // Noviembre es 10 (base 0)
    expect(d.getDate()).toBe(24);
    expect(d.getHours()).toBe(0);
  });

  test('getDaysUntilExam calculates accurate difference in days', () => {
    expect(getDaysUntilExam('2026-11-24', '2026-11-24')).toBe(0);
    expect(getDaysUntilExam('2026-11-25', '2026-11-24')).toBe(1);
    expect(getDaysUntilExam('2026-12-04', '2026-11-24')).toBe(10);
    expect(getDaysUntilExam('2026-11-20', '2026-11-24')).toBe(-4);
  });

  test('isExamPassed returns true strictly when days are negative', () => {
    expect(isExamPassed('2026-11-20', '2026-11-24')).toBe(true);
    expect(isExamPassed('2026-11-24', '2026-11-24')).toBe(false);
    expect(isExamPassed('2026-11-25', '2026-11-24')).toBe(false);
  });

  test('formatDisplayDate formats in friendly Spanish format', () => {
    expect(formatDisplayDate('2026-12-15')).toBe('15 dic 2026');
    expect(formatDisplayDate('2026-01-08')).toBe('8 ene 2026');
  });

  test('getRelativeExamLabel produces action-oriented, zero-guilt text', () => {
    expect(getRelativeExamLabel('2026-11-24', '2026-11-24')).toBe('Rinde hoy');
    expect(getRelativeExamLabel('2026-11-25', '2026-11-24')).toBe('Rinde mañana');
    expect(getRelativeExamLabel('2026-11-28', '2026-11-24')).toBe('En 4 días');
    expect(getRelativeExamLabel('2026-11-10', '2026-11-24')).toBe('Examen pasado');
  });
});
