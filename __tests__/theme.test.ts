import { theme } from '../src/theme/tokens';

describe('Theme tokens (US-1.1)', () => {
  test('Accessibility: minTouchTarget must be at least 48dp', () => {
    expect(theme.accessibility.minTouchTarget).toBeGreaterThanOrEqual(48);
  });

  test('Colors: background primary is soft dark (#121417, not pure black #000000)', () => {
    expect(theme.colors.background.primary).toBe('#121417');
    expect(theme.colors.background.card).toBe('#1C1F26');
  });

  test('Colors: Status tokens exist for all domain states', () => {
    expect(theme.colors.status.notStarted).toBe('#64748B');
    expect(theme.colors.status.studied).toBe('#F59E0B');
    expect(theme.colors.status.reviewed).toBe('#10B981');
    expect(theme.colors.status.examPassed).toBe('#475569');
    expect(theme.colors.status.todayUrgent).toBe('#F59E0B');
  });

  test('Spacing: multiples of 4dp for visual rhythm', () => {
    expect(theme.spacing.xs % 4).toBe(0);
    expect(theme.spacing.sm % 4).toBe(0);
    expect(theme.spacing.md % 4).toBe(0);
    expect(theme.spacing.lg % 4).toBe(0);
    expect(theme.spacing.xl % 4).toBe(0);
  });
});
