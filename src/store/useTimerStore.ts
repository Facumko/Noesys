import { create } from 'zustand';

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  showNumbers: boolean; // P-005 / US-4.1: Opción de ocultar números para reducir ansiedad
  subjectId: string | null;
  topicId: string | null;
  topicTitle: string | null;
  subjectName: string | null;
  targetSeconds: number;
  startedAtTimestamp: number | null; // Guardar hora de inicio (inmune a background)
  accumulatedSeconds: number; // Segundos acumulados antes de pausar

  startTimer: (params: {
    subjectId: string;
    topicId?: string | null;
    subjectName?: string;
    topicTitle?: string;
    durationMinutes: number;
  }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  extendTimer: (additionalMinutes: number) => void;
  stopTimer: () => { elapsedSeconds: number; startedAtIso: string };
  toggleShowNumbers: () => void;
  getElapsedSeconds: () => number;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  showNumbers: true,
  subjectId: null,
  topicId: null,
  topicTitle: null,
  subjectName: null,
  targetSeconds: 25 * 60,
  startedAtTimestamp: null,
  accumulatedSeconds: 0,

  startTimer: ({ subjectId, topicId, subjectName, topicTitle, durationMinutes }) => {
    set({
      isRunning: true,
      isPaused: false,
      subjectId,
      topicId: topicId ?? null,
      subjectName: subjectName ?? null,
      topicTitle: topicTitle ?? null,
      targetSeconds: durationMinutes * 60,
      startedAtTimestamp: Date.now(),
      accumulatedSeconds: 0,
    });
  },

  pauseTimer: () => {
    const { startedAtTimestamp, accumulatedSeconds, isRunning, isPaused } = get();
    if (!isRunning || isPaused || !startedAtTimestamp) return;

    const currentSegment = Math.floor((Date.now() - startedAtTimestamp) / 1000);
    set({
      isPaused: true,
      accumulatedSeconds: accumulatedSeconds + currentSegment,
      startedAtTimestamp: null,
    });
  },

  resumeTimer: () => {
    const { isRunning, isPaused } = get();
    if (!isRunning || !isPaused) return;

    set({
      isPaused: false,
      startedAtTimestamp: Date.now(),
    });
  },

  extendTimer: (additionalMinutes) => {
    set((state) => ({
      targetSeconds: state.targetSeconds + additionalMinutes * 60,
      isPaused: false,
      startedAtTimestamp: Date.now(),
    }));
  },

  stopTimer: () => {
    const { startedAtTimestamp, accumulatedSeconds } = get();
    let totalElapsed = accumulatedSeconds;
    if (startedAtTimestamp) {
      totalElapsed += Math.floor((Date.now() - startedAtTimestamp) / 1000);
    }

    const startedAtIso = new Date(
      Date.now() - totalElapsed * 1000
    ).toISOString();

    set({
      isRunning: false,
      isPaused: false,
      startedAtTimestamp: null,
      accumulatedSeconds: 0,
    });

    return { elapsedSeconds: totalElapsed, startedAtIso };
  },

  toggleShowNumbers: () => {
    set((state) => ({ showNumbers: !state.showNumbers }));
  },

  getElapsedSeconds: () => {
    const { startedAtTimestamp, accumulatedSeconds, isPaused } = get();
    if (isPaused || !startedAtTimestamp) {
      return accumulatedSeconds;
    }
    return accumulatedSeconds + Math.floor((Date.now() - startedAtTimestamp) / 1000);
  },
}));
