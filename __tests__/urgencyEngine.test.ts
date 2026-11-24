import {
  calculateSubjectUrgency,
  getRecommendation,
} from '../src/utils/urgencyEngine';
import type { Subject, Topic } from '../src/types/models';

describe('urgencyEngine pure logic tests (US-3.1 y US-3.2)', () => {
  const baseSubject: Subject = {
    id: 'sub-1',
    name: 'Álgebra',
    exam_date: '2026-12-10',
    color_hex: '#3B82F6',
    is_archived: 0,
    created_at: '2026-11-20T00:00:00.000Z',
  };

  test('Subject with 0 topics returns NO_TOPICS without error', () => {
    const result = calculateSubjectUrgency(baseSubject, [], 2.0, '2026-11-24');
    expect(result.urgencyLevel).toBe('NO_TOPICS');
    expect(result.urgencyLabel).toBe('Cargá los temas');
    expect(result.urgency).toBe(0);
  });

  test('Passed exam returns EXAM_PASSED and 0 urgency', () => {
    const passedSubject: Subject = {
      ...baseSubject,
      exam_date: '2026-11-20',
    };
    const topic: Topic = {
      id: 't-1',
      subject_id: passedSubject.id,
      title: 'Tema 1',
      status: 'NOT_STARTED',
      difficulty: 1,
      time_spent_seconds: 0,
      notes: null,
      order_index: 0,
      last_studied_at: null,
    };
    const result = calculateSubjectUrgency(passedSubject, [topic], 2.0, '2026-11-24');
    expect(result.urgencyLevel).toBe('EXAM_PASSED');
    expect(result.urgencyLabel).toBe('Examen pasado');
  });

  test('All topics REVIEWED returns COMPLETED ("Listo")', () => {
    const topic: Topic = {
      id: 't-1',
      subject_id: baseSubject.id,
      title: 'Tema 1',
      status: 'REVIEWED',
      difficulty: 2,
      time_spent_seconds: 1200,
      notes: null,
      order_index: 0,
      last_studied_at: '2026-11-23T00:00:00.000Z',
    };
    const result = calculateSubjectUrgency(baseSubject, [topic], 2.0, '2026-11-24');
    expect(result.urgencyLevel).toBe('COMPLETED');
    expect(result.urgencyLabel).toBe('Listo');
    expect(result.progressPercent).toBe(100);
  });

  test('Calculates Hoy toca (U >= 1.0) when load is high and days are few', () => {
    // 2 días restantes (2026-11-26), carga = 1 tema dif 3 (3.0) + 1 tema dif 2 (2.0) = 5.0
    // capacidad = 2.0 -> divisor = 2 * 2.0 = 4.0 -> U = 5.0 / 4.0 = 1.25 >= 1.0
    const subject: Subject = { ...baseSubject, exam_date: '2026-11-26' };
    const topics: Topic[] = [
      {
        id: 't-1',
        subject_id: subject.id,
        title: 'Tema dif 3',
        status: 'NOT_STARTED',
        difficulty: 3,
        time_spent_seconds: 0,
        notes: null,
        order_index: 0,
        last_studied_at: null,
      },
      {
        id: 't-2',
        subject_id: subject.id,
        title: 'Tema dif 2',
        status: 'NOT_STARTED',
        difficulty: 2,
        time_spent_seconds: 0,
        notes: null,
        order_index: 1,
        last_studied_at: null,
      },
    ];

    const result = calculateSubjectUrgency(subject, topics, 2.0, '2026-11-24');
    expect(result.urgencyLevel).toBe('TODAY');
    expect(result.urgencyLabel).toBe('Hoy toca');
    expect(result.urgency).toBeGreaterThanOrEqual(1.0);
  });

  test('Guards against zero or negative capacity (H-005)', () => {
    const topics: Topic[] = [
      {
        id: 't-1',
        subject_id: baseSubject.id,
        title: 'Tema 1',
        status: 'NOT_STARTED',
        difficulty: 1,
        time_spent_seconds: 0,
        notes: null,
        order_index: 0,
        last_studied_at: null,
      },
    ];
    // Passing 0 capacity should clamp to 0.5 without throwing Infinity or NaN
    const result = calculateSubjectUrgency(baseSubject, topics, 0, '2026-11-24');
    expect(isFinite(result.urgency)).toBe(true);
    expect(result.urgency).toBeGreaterThan(0);
  });

  test('Recommendation: selects low friction difficulty 1 topic first when > 3 days', () => {
    const subject: Subject = { ...baseSubject, exam_date: '2026-12-15' }; // 21 días
    const topics: Topic[] = [
      {
        id: 't-hard',
        subject_id: subject.id,
        title: 'Tema Difícil',
        status: 'NOT_STARTED',
        difficulty: 3,
        time_spent_seconds: 0,
        notes: null,
        order_index: 0,
        last_studied_at: null,
      },
      {
        id: 't-easy',
        subject_id: subject.id,
        title: 'Tema Fácil',
        status: 'NOT_STARTED',
        difficulty: 1,
        time_spent_seconds: 0,
        notes: null,
        order_index: 1,
        last_studied_at: null,
      },
    ];

    const rec = getRecommendation(
      [subject],
      { [subject.id]: topics },
      2.0,
      [],
      '2026-11-24'
    );

    expect(rec).not.toBeNull();
    expect(rec?.topic.id).toBe('t-easy');
    expect(rec?.reason).toBe('LOW_FRICTION_START');
  });

  test('Recommendation: selects STUDIED topic with oldest last_studied_at when <= 3 days', () => {
    const urgentSubject: Subject = { ...baseSubject, exam_date: '2026-11-26' }; // 2 días
    const topics: Topic[] = [
      {
        id: 't-recent',
        subject_id: urgentSubject.id,
        title: 'Estudiado ayer',
        status: 'STUDIED',
        difficulty: 2,
        time_spent_seconds: 1200,
        notes: null,
        order_index: 0,
        last_studied_at: '2026-11-23T10:00:00.000Z',
      },
      {
        id: 't-old',
        subject_id: urgentSubject.id,
        title: 'Estudiado hace una semana',
        status: 'STUDIED',
        difficulty: 2,
        time_spent_seconds: 1200,
        notes: null,
        order_index: 1,
        last_studied_at: '2026-11-17T10:00:00.000Z',
      },
    ];

    const rec = getRecommendation(
      [urgentSubject],
      { [urgentSubject.id]: topics },
      2.0,
      [],
      '2026-11-24'
    );

    expect(rec).not.toBeNull();
    expect(rec?.topic.id).toBe('t-old');
    expect(rec?.reason).toBe('FINAL_REVIEW');
  });
});
