export const theme = {
  colors: {
    background: {
      primary: '#121417',
      card: '#1C1F26',
      cardHighlight: '#242832',
      input: '#171A21',
      overlay: 'rgba(0, 0, 0, 0.75)',
    },
    border: {
      subtle: '#2A2F3A',
      focus: '#3B82F6',
      divider: '#1F242E',
    },
    text: {
      primary: '#F3F4F6',
      secondary: '#9CA3AF',
      muted: '#64748B',
      inverse: '#121417',
    },
    brand: {
      primary: '#3B82F6',
      primaryDark: '#2563EB',
      primaryLight: '#60A5FA',
    },
    status: {
      notStarted: '#64748B',
      studied: '#F59E0B',
      reviewed: '#10B981',
      completed: '#10B981',
      examPassed: '#475569',
      todayUrgent: '#F59E0B',
      steadyPace: '#3B82F6',
      withMargin: '#10B981',
      badgeOpacity: 0.15,
    },
    difficulty: {
      easy: '#10B981',
      medium: '#F59E0B',
      hard: '#EF4444',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      title: 24,
      hero: 32,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  accessibility: {
    minTouchTarget: 48,
  },
} as const;

export type Theme = typeof theme;
