// Crea el árbol de carpetas y archivos VACÍOS del proyecto.
// Uso (desde la raíz del proyecto Expo, p. ej. finales-app/):
//   node scaffold.js
// No pisa archivos que ya existen.

const fs = require("fs");
const path = require("path");

const files = [
  // Rutas (Expo Router)
  "app/_layout.tsx",
  "app/(tabs)/_layout.tsx",
  "app/(tabs)/index.tsx",
  "app/(tabs)/timeline.tsx",
  "app/(tabs)/settings.tsx",
  "app/subject/[id].tsx",
  "app/subject/create.tsx",
  "app/subject/import.tsx",
  "app/topic/[id].tsx",
  "app/focus-timer.tsx",

  // Componentes
  "src/components/ui/Button.tsx",
  "src/components/ui/Badge.tsx",
  "src/components/ui/Card.tsx",
  "src/components/ui/ProgressBar.tsx",
  "src/components/SubjectCard.tsx",
  "src/components/TopicItem.tsx",
  "src/components/SubtaskList.tsx",
  "src/components/SuggestionCard.tsx",

  // Base de datos
  "src/db/client.ts",
  "src/db/migrations.ts",
  "src/db/subjectsRepo.ts",
  "src/db/topicsRepo.ts",
  "src/db/subtasksRepo.ts",
  "src/db/sessionsRepo.ts",
  "src/db/backup.ts",

  // Estado
  "src/store/useAppStore.ts",
  "src/store/useTimerStore.ts",

  // Utilidades
  "src/utils/urgencyEngine.ts",
  "src/utils/syllabusParser.ts",
  "src/utils/dateHelpers.ts",
  "src/utils/notifications.ts",

  // Tema y tipos
  "src/theme/tokens.ts",
  "src/types/models.ts",

  // Tests
  "__tests__/urgencyEngine.test.ts",
  "__tests__/syllabusParser.test.ts",
  "__tests__/dateHelpers.test.ts",
];

let created = 0;
let skipped = 0;

for (const file of files) {
  const fullPath = path.join(process.cwd(), file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  if (fs.existsSync(fullPath)) {
    skipped++;
    console.log("existe, se omite:", file);
  } else {
    fs.writeFileSync(fullPath, "");
    created++;
    console.log("creado:", file);
  }
}

console.log(`\nListo. Creados: ${created}. Omitidos (ya existían): ${skipped}.`);
