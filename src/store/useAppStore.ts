import { create } from 'zustand';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Subject, Topic, TopicStatus, TopicDifficulty } from '../types/models';
import * as subjectsRepo from '../db/subjectsRepo';
import * as topicsRepo from '../db/topicsRepo';

interface AppState {
  subjects: Subject[];
  topicsBySubject: Record<string, Topic[]>;
  isLoading: boolean;
  error: string | null;

  loadSubjects: (db: SQLiteDatabase) => Promise<void>;
  createSubject: (
    db: SQLiteDatabase,
    input: { name: string; exam_date: string; color_hex?: string }
  ) => Promise<Subject>;
  updateSubject: (
    db: SQLiteDatabase,
    id: string,
    input: Partial<Pick<Subject, 'name' | 'exam_date' | 'color_hex' | 'is_archived'>>
  ) => Promise<void>;
  deleteSubject: (db: SQLiteDatabase, id: string) => Promise<void>;
  seedDemo: (db: SQLiteDatabase) => Promise<Subject>;

  loadTopics: (db: SQLiteDatabase, subjectId: string) => Promise<Topic[]>;
  createTopic: (
    db: SQLiteDatabase,
    input: { subject_id: string; title: string; difficulty?: TopicDifficulty }
  ) => Promise<Topic>;
  cycleTopicStatus: (
    db: SQLiteDatabase,
    topicId: string,
    subjectId: string
  ) => Promise<TopicStatus>;
  cycleTopicDifficulty: (
    db: SQLiteDatabase,
    topicId: string,
    subjectId: string
  ) => Promise<TopicDifficulty>;
  deleteTopic: (
    db: SQLiteDatabase,
    topicId: string,
    subjectId: string
  ) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  subjects: [],
  topicsBySubject: {},
  isLoading: false,
  error: null,

  loadSubjects: async (db: SQLiteDatabase) => {
    try {
      set({ isLoading: true, error: null });
      const subjects = await subjectsRepo.getSubjects(db);
      set({ subjects, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al cargar materias',
        isLoading: false,
      });
    }
  },

  createSubject: async (db, input) => {
    const newSubject = await subjectsRepo.createSubject(db, input);
    set((state) => ({
      subjects: [...state.subjects, newSubject].sort(
        (a, b) => a.exam_date.localeCompare(b.exam_date)
      ),
    }));
    return newSubject;
  },

  updateSubject: async (db, id, input) => {
    await subjectsRepo.updateSubject(db, id, input);
    set((state) => ({
      subjects: state.subjects
        .map((s) => (s.id === id ? { ...s, ...input } : s))
        .filter((s) => s.is_archived === 0)
        .sort((a, b) => a.exam_date.localeCompare(b.exam_date)),
    }));
  },

  deleteSubject: async (db, id) => {
    await subjectsRepo.deleteSubject(db, id);
    set((state) => {
      const nextTopics = { ...state.topicsBySubject };
      delete nextTopics[id];
      return {
        subjects: state.subjects.filter((s) => s.id !== id),
        topicsBySubject: nextTopics,
      };
    });
  },

  seedDemo: async (db) => {
    set({ isLoading: true });
    const demo = await subjectsRepo.seedDemoSubject(db);
    const demoTopics = await topicsRepo.getTopicsBySubjectId(db, demo.id);
    set((state) => ({
      subjects: [...state.subjects, demo].sort((a, b) =>
        a.exam_date.localeCompare(b.exam_date)
      ),
      topicsBySubject: {
        ...state.topicsBySubject,
        [demo.id]: demoTopics,
      },
      isLoading: false,
    }));
    return demo;
  },

  loadTopics: async (db, subjectId) => {
    const topics = await topicsRepo.getTopicsBySubjectId(db, subjectId);
    set((state) => ({
      topicsBySubject: {
        ...state.topicsBySubject,
        [subjectId]: topics,
      },
    }));
    return topics;
  },

  createTopic: async (db, input) => {
    const newTopic = await topicsRepo.createTopic(db, input);
    set((state) => {
      const current = state.topicsBySubject[input.subject_id] ?? [];
      return {
        topicsBySubject: {
          ...state.topicsBySubject,
          [input.subject_id]: [...current, newTopic],
        },
      };
    });
    return newTopic;
  },

  cycleTopicStatus: async (db, topicId, subjectId) => {
    const topic = (get().topicsBySubject[subjectId] ?? []).find(
      (t) => t.id === topicId
    );
    if (!topic) return 'NOT_STARTED';

    const nextStatus = await topicsRepo.cycleTopicStatus(
      db,
      topicId,
      topic.status
    );

    set((state) => {
      const list = state.topicsBySubject[subjectId] ?? [];
      return {
        topicsBySubject: {
          ...state.topicsBySubject,
          [subjectId]: list.map((t) =>
            t.id === topicId ? { ...t, status: nextStatus } : t
          ),
        },
      };
    });

    return nextStatus;
  },

  cycleTopicDifficulty: async (db, topicId, subjectId) => {
    const topic = (get().topicsBySubject[subjectId] ?? []).find(
      (t) => t.id === topicId
    );
    if (!topic) return 1;

    const nextDifficulty = await topicsRepo.cycleTopicDifficulty(
      db,
      topicId,
      topic.difficulty
    );

    set((state) => {
      const list = state.topicsBySubject[subjectId] ?? [];
      return {
        topicsBySubject: {
          ...state.topicsBySubject,
          [subjectId]: list.map((t) =>
            t.id === topicId ? { ...t, difficulty: nextDifficulty } : t
          ),
        },
      };
    });

    return nextDifficulty;
  },

  deleteTopic: async (db, topicId, subjectId) => {
    await topicsRepo.deleteTopic(db, topicId);
    set((state) => {
      const list = state.topicsBySubject[subjectId] ?? [];
      return {
        topicsBySubject: {
          ...state.topicsBySubject,
          [subjectId]: list.filter((t) => t.id !== topicId),
        },
      };
    });
  },
}));
