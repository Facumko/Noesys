import { parseSyllabusText } from '../src/utils/syllabusParser';

describe('syllabusParser pure logic tests (US-2.2)', () => {
  test('Removes standard bullet points (-, *, •)', () => {
    const raw = `
      - Matrices y determinantes
      * Sistemas de ecuaciones lineales
      • Espacios vectoriales
    `;
    const result = parseSyllabusText(raw);
    expect(result.topics).toEqual([
      'Matrices y determinantes',
      'Sistemas de ecuaciones lineales',
      'Espacios vectoriales',
    ]);
  });

  test('Removes simple numbered lists (1., 2), a., b))', () => {
    const raw = `
      1. Cinemática del punto
      2) Dinámica de la partícula
      a. Trabajo y energía
      B) Cantidad de movimiento
    `;
    const result = parseSyllabusText(raw);
    expect(result.topics).toEqual([
      'Cinemática del punto',
      'Dinámica de la partícula',
      'Trabajo y energía',
      'Cantidad de movimiento',
    ]);
  });

  test('Preserves hierarchical subunit numbering like "1.1" and unit names', () => {
    const raw = `
      1.1 Conceptos fundamentales de límites
      Unidad 2: Cálculo diferencial e integral
      3.2.1 Teorema del valor medio
    `;
    const result = parseSyllabusText(raw);
    expect(result.topics).toContain('1.1 Conceptos fundamentales de límites');
    expect(result.topics).toContain('Unidad 2: Cálculo diferencial e integral');
    expect(result.topics).toContain('3.2.1 Teorema del valor medio');
  });

  test('Eliminates exact case-insensitive duplicates while preserving order', () => {
    const raw = `
      Álgebra de Boole
      Compuertas lógicas
      álgebra de boole
      Circuitos combinacionales
    `;
    const result = parseSyllabusText(raw);
    expect(result.topics).toEqual([
      'Álgebra de Boole',
      'Compuertas lógicas',
      'Circuitos combinacionales',
    ]);
  });

  test('Limits line length to 120 characters', () => {
    const veryLongTitle = 'A'.repeat(150);
    const result = parseSyllabusText(veryLongTitle);
    expect(result.topics[0].length).toBe(120);
  });

  test('Generates warning when content exceeds 60 lines', () => {
    const manyLines = Array.from({ length: 65 }, (_, i) => `Tema número ${i + 1}`).join('\n');
    const result = parseSyllabusText(manyLines);
    expect(result.topics.length).toBe(65);
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain('más de 60');
  });

  test('Gracefully handles empty text and whitespace-only lines', () => {
    expect(parseSyllabusText('').topics).toEqual([]);
    expect(parseSyllabusText('   \n\n\t  \n').topics).toEqual([]);
  });
});
