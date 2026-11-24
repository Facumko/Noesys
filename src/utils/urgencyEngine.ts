/**
 * US-3.1 y US-3.2: Motor de urgencia y recomendación de estudio ("¿Por dónde arranco?").
 * Lógica pura sin dependencias de React ni SQLite.
 */

import type {
  Subject,
  Topic,
  UrgencyLevel,
  SubjectUrgencyInfo,
  RecommendationCandidate,
} from '../types/models';
import { getDaysUntilExam, isExamPassed } from './dateHelpers';

export function calculateWeightedProgress(topics: Topic[]): {
  percentage: number;
  reviewedPercent: number;
  studiedPercent: number;
  totalTopics: number;
  reviewedTopics: number;
  studiedTopics: number;
} {
  if (topics.length === 0) {
    return {
      percentage: 0,
      reviewedPercent: 0,
      studiedPercent: 0,
      totalTopics: 0,
      reviewedTopics: 0,
      studiedTopics: 0,
    };
  }

  let totalMaxScore = 0;
  let earnedScore = 0;
  let reviewedScore = 0;
  let studiedScore = 0;

  let reviewedTopics = 0;
  let studiedTopics = 0;

  for (const t of topics) {
    const diff = t.difficulty;
    totalMaxScore += diff;

    if (t.status === 'REVIEWED') {
      earnedScore += diff * 1.0;
      reviewedScore += diff * 1.0;
      reviewedTopics++;
    } else if (t.status === 'STUDIED') {
      earnedScore += diff * 0.6;
      studiedScore += diff * 0.6;
      studiedTopics++;
    }
  }

  const percentage =
    totalMaxScore > 0 ? Math.min(100, Math.round((earnedScore / totalMaxScore) * 100)) : 0;
  const reviewedPercent =
    totalMaxScore > 0 ? Math.min(100, Math.round((reviewedScore / totalMaxScore) * 100)) : 0;
  const studiedPercent =
    totalMaxScore > 0 ? Math.min(100, Math.round((studiedScore / totalMaxScore) * 100)) : 0;

  return {
    percentage,
    reviewedPercent,
    studiedPercent,
    totalTopics: topics.length,
    reviewedTopics,
    studiedTopics,
  };
}

export function calculateSubjectUrgency(
  subject: Subject,
  topics: Topic[],
  dailyCapacity = 2.0,
  referenceDateStr?: string
): SubjectUrgencyInfo {
  const daysRemaining = getDaysUntilExam(subject.exam_date, referenceDateStr);
  const progressStats = calculateWeightedProgress(topics);

  // 1. Caso borde: Examen pasado (H-002 / P-006)
  if (isExamPassed(subject.exam_date, referenceDateStr)) {
    return {
      subject,
      urgency: 0,
      urgencyLevel: 'EXAM_PASSED',
      urgencyLabel: 'Examen pasado',
      daysRemaining,
      totalTopics: topics.length,
      completedTopics: progressStats.reviewedTopics,
      progressPercent: progressStats.percentage,
    };
  }

  // 2. Caso borde: Materia sin temas cargados
  if (topics.length === 0) {
    return {
      subject,
      urgency: 0,
      urgencyLevel: 'NO_TOPICS',
      urgencyLabel: 'Cargá los temas',
      daysRemaining,
      totalTopics: 0,
      completedTopics: 0,
      progressPercent: 0,
    };
  }

  // 3. Caso borde: Todos los temas en REVIEWED ("Listo")
  const allReviewed = topics.every((t) => t.status === 'REVIEWED');
  if (allReviewed) {
    return {
      subject,
      urgency: 0,
      urgencyLevel: 'COMPLETED',
      urgencyLabel: 'Listo',
      daysRemaining,
      totalTopics: topics.length,
      completedTopics: topics.length,
      progressPercent: 100,
    };
  }

  // 4. Cálculo matemático formal de urgencia U
  const effectiveDays = Math.max(1, daysRemaining);
  const safeCapacity = Math.max(0.5, dailyCapacity); // H-005: protección división por cero

  let pendingLoad = 0;
  for (const t of topics) {
    const diff = t.difficulty;
    if (t.status === 'NOT_STARTED') {
      pendingLoad += 1.0 * diff;
    } else if (t.status === 'STUDIED') {
      pendingLoad += 0.4 * diff;
    }
  }

  const rawUrgency = pendingLoad / (effectiveDays * safeCapacity);
  const urgency = Math.round(rawUrgency * 100) / 100;

  let urgencyLevel: UrgencyLevel;
  let urgencyLabel: string;

  if (urgency >= 1.0) {
    urgencyLevel = 'TODAY';
    urgencyLabel = 'Hoy toca';
  } else if (urgency >= 0.5) {
    urgencyLevel = 'STEADY';
    urgencyLabel = 'Ritmo estable';
  } else {
    urgencyLevel = 'MARGIN';
    urgencyLabel = 'Con margen';
  }

  return {
    subject,
    urgency,
    urgencyLevel,
    urgencyLabel,
    daysRemaining,
    totalTopics: topics.length,
    completedTopics: progressStats.reviewedTopics,
    progressPercent: progressStats.percentage,
  };
}

/**
 * US-3.2: Motor de recomendación ("¿Por dónde arranco?").
 * Elige una única sugerencia determinista y permite ciclar con "Otra".
 */
export function getRecommendation(
  subjects: Subject[],
  topicsBySubject: Record<string, Topic[]>,
  dailyCapacity = 2.0,
  excludeTopicIds: string[] = [],
  referenceDateStr?: string
): RecommendationCandidate | null {
  // Filtrar materias activas con temas y que no hayan finalizado
  const activeCandidates = subjects
    .filter((s) => s.is_archived === 0 && !isExamPassed(s.exam_date, referenceDateStr))
    .map((s) => {
      const topics = topicsBySubject[s.id] ?? [];
      const urgencyInfo = calculateSubjectUrgency(
        s,
        topics,
        dailyCapacity,
        referenceDateStr
      );
      return { subject: s, topics, urgencyInfo };
    })
    .filter((c) => c.topics.length > 0 && c.urgencyInfo.urgencyLevel !== 'COMPLETED');

  if (activeCandidates.length === 0) {
    return null;
  }

  // Ordenar materias por mayor urgencia U; desempatar por examen más cercano; luego orden alfabético
  activeCandidates.sort((a, b) => {
    if (b.urgencyInfo.urgency !== a.urgencyInfo.urgency) {
      return b.urgencyInfo.urgency - a.urgencyInfo.urgency;
    }
    if (a.urgencyInfo.daysRemaining !== b.urgencyInfo.daysRemaining) {
      return a.urgencyInfo.daysRemaining - b.urgencyInfo.daysRemaining;
    }
    return a.subject.name.localeCompare(b.subject.name);
  });

  // Iterar materias en orden de prioridad hasta encontrar un tema elegible
  for (const candidate of activeCandidates) {
    const { subject, topics, urgencyInfo } = candidate;

    let availableTopics = topics.filter((t) => !excludeTopicIds.includes(t.id));
    if (availableTopics.length === 0) {
      // Si ya se ciclaron todos los temas de esta materia, reiniciar para esta materia
      availableTopics = topics;
    }

    // Regla 1: Si faltan <= 3 días: tema STUDIED con last_studied_at más viejo (repaso final)
    if (urgencyInfo.daysRemaining <= 3) {
      const studiedCandidates = availableTopics.filter((t) => t.status === 'STUDIED');
      if (studiedCandidates.length > 0) {
        studiedCandidates.sort((a, b) => {
          if (!a.last_studied_at) return -1;
          if (!b.last_studied_at) return 1;
          return a.last_studied_at.localeCompare(b.last_studied_at);
        });
        return {
          subject,
          topic: studiedCandidates[0],
          reason: 'FINAL_REVIEW',
        };
      }
    }

    // Regla 2: Tema NOT_STARTED con menor dificultad (1 primero para baja fricción, luego 2, luego 3)
    const notStartedCandidates = availableTopics.filter(
      (t) => t.status === 'NOT_STARTED'
    );

    if (notStartedCandidates.length > 0) {
      notStartedCandidates.sort((a, b) => {
        if (a.difficulty !== b.difficulty) {
          return a.difficulty - b.difficulty;
        }
        return a.order_index - b.order_index;
      });

      const selected = notStartedCandidates[0];
      return {
        subject,
        topic: selected,
        reason: selected.difficulty === 1 ? 'LOW_FRICTION_START' : 'STANDARD_STUDY',
      };
    }

    // Regla 3: Si no hay temas NOT_STARTED, buscar el tema STUDIED para afianzar
    const studiedTopics = availableTopics.filter((t) => t.status === 'STUDIED');
    if (studiedTopics.length > 0) {
      studiedTopics.sort((a, b) => {
        if (!a.last_studied_at) return -1;
        if (!b.last_studied_at) return 1;
        return a.last_studied_at.localeCompare(b.last_studied_at);
      });
      return {
        subject,
        topic: studiedTopics[0],
        reason: 'FINAL_REVIEW',
      };
    }
  }

  return null;
}
