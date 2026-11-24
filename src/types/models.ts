export type TopicStatus = 'NOT_STARTED' | 'STUDIED' | 'REVIEWED';
export type TopicDifficulty = 1 | 2 | 3;

export type UrgencyLevel =
  | 'TODAY'        // U >= 1.0 -> Hoy toca
  | 'STEADY'       // 0.5 <= U < 1.0 -> Ritmo estable
  | 'MARGIN'       // U < 0.5 -> Con margen
  | 'COMPLETED'    // Todos los temas en REVIEWED -> Listo
  | 'EXAM_PASSED'   // Fecha de examen < hoy -> Examen pasado
  | 'NO_TOPICS';   // Materia sin temas

export interface Subject {
  id: string;
  name: string;
  exam_date: string; // YYYY-MM-DD (fecha local)
  color_hex: string;
  is_archived: number; // 0 | 1
  created_at: string; // ISO
}

export interface Topic {
  id: string;
  subject_id: string;
  title: string;
  status: TopicStatus;
  difficulty: TopicDifficulty;
  time_spent_seconds: number;
  notes: string | null;
  order_index: number;
  last_studied_at: string | null; // ISO
}

export interface Subtask {
  id: string;
  topic_id: string;
  title: string;
  is_completed: number; // 0 | 1
}

export interface StudySession {
  id: string;
  subject_id: string;
  topic_id: string | null;
  started_at: string; // ISO
  duration_seconds: number;
}

export interface Settings {
  id: 1;
  daily_reminder_enabled: number; // 0 | 1
  daily_reminder_time: string; // HH:mm
  default_timer_minutes: number;
  daily_capacity_units: number;
  haptics_enabled: number; // 0 | 1
}

export interface SubjectUrgencyInfo {
  subject: Subject;
  urgency: number; // U
  urgencyLevel: UrgencyLevel;
  urgencyLabel: string;
  daysRemaining: number;
  totalTopics: number;
  completedTopics: number;
  progressPercent: number; // ponderado
}

export interface RecommendationCandidate {
  subject: Subject;
  topic: Topic;
  reason: 'FINAL_REVIEW' | 'LOW_FRICTION_START' | 'STANDARD_STUDY';
}
