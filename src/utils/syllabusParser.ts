/**
 * US-2.2: Pegado inteligente de programas de estudio (syllabus parser).
 * Función pura sin dependencias de React ni SQLite.
 */

export interface ParseResult {
  topics: string[];
  warning?: string;
}

export function parseSyllabusText(rawText: string): ParseResult {
  if (!rawText || !rawText.trim()) {
    return { topics: [] };
  }

  const rawLines = rawText.split(/\r?\n/);
  const seen = new Set<string>();
  const topics: string[] = [];

  // Expresión regular que quita viñetas (- , * , •) o numeración simple (1. , 1) , a. , a) )
  // Preserva intencionalmente subunidades jerárquicas como "1.1" o "2.3.1"
  const bulletOrSimpleNumberRegex = /^[\s\t]*([•\-\*\–\—\>]|(\d{1,2}|[a-zA-Z])[\.\)])\s+/;

  for (let line of rawLines) {
    line = line.trim();
    if (!line) continue;

    // Quitar viñetas o números de primer nivel simples
    line = line.replace(bulletOrSimpleNumberRegex, '').trim();

    // Limitar longitud a 120 caracteres
    if (line.length > 120) {
      line = line.substring(0, 120).trim();
    }

    if (line.length > 0 && !seen.has(line.toLowerCase())) {
      seen.add(line.toLowerCase());
      topics.push(line);
    }
  }

  let warning: string | undefined;
  if (topics.length > 60) {
    warning = 'Se detectaron más de 60 líneas. Verificá que no hayas pegado bibliografía o texto no temático.';
  }

  return { topics, warning };
}
