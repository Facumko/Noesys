# App de Gestión de Finales: especificación y plan

## Progreso

- [x] Sprint 1: Base y corte vertical (días 1 a 3)
- [x] Sprint 2: Importación y progreso (días 4 a 5)
- [x] Sprint 3: Motor de urgencia y sugerencia (días 6 a 7)
- [x] Sprint 4: Temporizador, notificaciones y backup (días 8 a 10)

---

## 1. Visión y principios de diseño

App Android offline-first para estudiantes que necesitan pasar de "tengo que estudiar todo" a "hago esto ahora". Principios:

1. **Una decisión por pantalla.** Nunca pedir elegir cuando se puede sugerir.
2. **Empezar es un toque.** Lo más difícil es arrancar, así que arrancar tiene que costar un toque.
3. **Cero culpa.** Lenguaje de acción, no de alarma. Sin rojos agresivos ni contadores que castiguen.
4. **Feedback inmediato.** Cada acción confirma con una microrespuesta (háptica, animación breve, mensaje corto).
5. **Todo recuperable.** Nada se pierde: backup en JSON y deshacer en acciones destructivas.

---

## 2. Stack tecnológico

- Expo SDK (última estable) + TypeScript estricto + Expo Router.
- Usar development build (`expo-dev-client`) desde el día 1, no Expo Go: las notificaciones locales en Android no son confiables en Expo Go.
- `expo-sqlite` con la API asíncrona nueva. SQLite es la única fuente de verdad; Zustand solo cachea lo que la UI muestra.
- Zustand para estado de UI y temporizador.
- Estilos: `StyleSheet` + tokens de tema propios (menos configuración y menos riesgo que NativeWind en la primera versión). Íconos con `lucide-react-native`.
- `expo-notifications`, `expo-haptics`, `expo-keep-awake` (opcional en el temporizador), `expo-crypto` (UUIDs), `expo-file-system` + `expo-sharing` (backup).
- EAS Build para el `.apk`.

---

## 3. Modelo de datos (SQLite)

Al abrir la base: `PRAGMA foreign_keys = ON;` (sin esto, el `ON DELETE CASCADE` no funciona en SQLite) y migraciones versionadas con `PRAGMA user_version`.

```sql
CREATE TABLE subjects (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  exam_date TEXT NOT NULL,          -- YYYY-MM-DD en hora local
  color_hex TEXT DEFAULT '#3B82F6',
  is_archived INTEGER NOT NULL DEFAULT 0, -- finales ya rendidos/pasados
  created_at TEXT NOT NULL
);

CREATE TABLE topics (
  id TEXT PRIMARY KEY NOT NULL,
  subject_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED', -- NOT_STARTED | STUDIED | REVIEWED
  difficulty INTEGER NOT NULL DEFAULT 1,      -- 1 a 3
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  order_index INTEGER NOT NULL,
  last_studied_at TEXT,                       -- para rotar sugerencias y repasos
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);
CREATE INDEX idx_topics_subject ON topics(subject_id);

CREATE TABLE subtasks (
  id TEXT PRIMARY KEY NOT NULL,
  topic_id TEXT NOT NULL,
  title TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- Historial de sesiones: preserva historial aunque se borre un tema individual (P-004)
CREATE TABLE study_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  subject_id TEXT NOT NULL,
  topic_id TEXT,
  started_at TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
);

CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  daily_reminder_enabled INTEGER DEFAULT 1,
  daily_reminder_time TEXT DEFAULT '18:00',
  default_timer_minutes INTEGER DEFAULT 25,
  daily_capacity_units REAL DEFAULT 2.0 CHECK (daily_capacity_units > 0),
  haptics_enabled INTEGER DEFAULT 1
);

-- Inserción garantizada en migración inicial (H-001):
-- INSERT OR IGNORE INTO settings (id) VALUES (1);
```

---

## 4. Lógica de negocio

### A. Índice de urgencia (por materia)
- **Días restantes:** $D = \text{diasHastaExamen}$, calculado con fecha local normalizada (evita errores de zona horaria al comparar fechas ISO).
  - Si $D < 0$ (examen ya pasó): estado `EXAM_PASSED` (H-002, P-006). Queda excluido del ranking de urgencia activa y de las sugerencias del día. En la lista de materias se muestra al final con badge gris y opción de archivar.
  - Si $D \ge 0$: se utiliza $D_{\text{efectivo}} = \max(1, D)$.
- **Carga pendiente:** $C = \sum(\text{peso} \times \text{dificultad})$ con peso 1.0 (no visto), 0.4 (estudiado), 0.0 (repasado).
- **Capacidad diaria:** $U = C / (D_{\text{efectivo}} \times \max(0.5, \text{capacidad}))$.
- **Umbrales y estados:**
  - Si todos los temas están en `REVIEWED`: estado **Listo** (`COMPLETED`).
  - Materia sin temas: muestra acción "Cargá los temas".
  - $U \ge 1.0 \rightarrow$ **Hoy toca**
  - $0.5 \le U < 1.0 \rightarrow$ **Ritmo estable**
  - $U < 0.5 \rightarrow$ **Con margen**
- **Casos borde:**
  - Exámenes a menos de 4 días entre sí: la tarjeta "Hoy" considera la carga de ambos.

### B. Motor de recomendación ("¿Por dónde arranco?")
Devuelve una sola sugerencia, sin menú de modos:
1. Elegir la materia con mayor $U$ (desempate: examen más cercano; segundo desempate: orden alfabético por nombre y `id`).
2. Dentro de esa materia:
   - Si faltan $\le 3$ días: tema en `STUDIED` con `last_studied_at` más viejo o nulo (repaso final).
   - Si no: tema `NOT_STARTED` de menor dificultad (1 primero, luego 2, luego 3) y menor `order_index`.
3. Botón principal "Empezar" (abre el temporizador con duración por defecto) y acceso secundario sutil "¿Cuesta arrancar? Probá 5 min" (P-005).
4. Botón "Otra" para ciclar candidatos sin repetir en la misma sesión; al agotar los temas disponibles, vuelve a iniciar el ciclo con aviso no intrusivo.
5. Si no hay candidatos o la base está vacía: mensaje positivo y acceso de 1 toque a cargar temas o materia de ejemplo (P-001).

### C. Importación masiva (pegado inteligente)
`parseSyllabusText(rawText: string): string[]`:
- Dividir por saltos de línea, recortar espacios.
- Limpiar viñetas (`-`, `*`, `•`) y numeraciones de primer orden (`1.`, `1)`, `a)`), preservando subunidades académicas (ej: "1.1", "Unidad 2:").
- Eliminar duplicados exactos, limitar títulos a 120 caracteres y avisar si hay más de 60 líneas (probable pegado equivocado).
- Vista previa editable con tachar/editar por línea; inserción en una única transacción SQLite.
- Tests unitarios con textos reales de programas.

---

## 5. UX y accesibilidad cognitiva

- **Pantalla de inicio:** tarjeta "Hoy" arriba con el próximo paso concreto y botón "Empezar" (más acceso a micro-bloque de 5 min). Debajo, materias ordenadas por urgencia (con materias completadas y exámenes pasados al final).
- **Onboarding de 1 toque (P-001):** si no hay materias cargadas, botón primario para precargar materia de prueba con 3 temas.
- **Temporizador robusto:** 
  - Cálculo de tiempo por diferencia de timestamps (`started_at`).
  - Guardado de tiempo parcial: si la sesión supera 120 segundos y se interrumpe, se guarda el progreso en `study_sessions` (P-002).
  - Al terminar: mensaje de logro corto y "¿Seguimos 5 min más?".
  - Opción de ocultar números y ver solo un anillo de progreso (reduce ansiedad).
- **Lenguaje y estados:** "Hoy toca", "Ritmo estable", "Con margen", "Listo", "Examen pasado". "No visto" en gris neutro. Sin rojos sólidos ni lenguaje de castigo.
- **Feedback:** háptica suave al cambiar estado, animación breve, snackbar de deshacer de 8 segundos para borrados (H-003, US-2.3).
- **Accesibilidad:** áreas táctiles de $\ge 48\text{dp}$, contraste AA, tipografía del sistema, sin depender solo del color.
- **Tokens de diseño (modo oscuro base):**
  - `background.primary` #121417, `background.card` #1C1F26, `border.subtle` #2A2F3A, `text.primary` #F3F4F6, `text.secondary` #9CA3AF.
  - Estados: No visto #64748B, Estudiado #F59E0B, Repasado / Listo #10B981, Examen pasado #475569.

---

## 6. Notificaciones

- Pedir permiso `POST_NOTIFICATIONS` (Android 13+) con contexto en pantalla de ajustes o al iniciar temporizador, nunca al arranque en frío.
- Crear canal obligatorio de Android (`Notifications.setNotificationChannelAsync`) con importancia moderada.
- Reprogramar la notificación diaria al cambiar la hora o editar materias.
- Contenido directo: "Hoy: Unidad 3 de Álgebra, 25 min". Si ya estudió hoy, no insistir.

---

## 7. Arquitectura y árbol de archivos

```text
finales-app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Tabs "Hoy" y "Ajustes" (Timeline con href: null en v1)
│   │   ├── index.tsx          # Hoy + lista de materias por urgencia
│   │   ├── timeline.tsx       # Ruta reservada para v1.1 (oculta de tabs)
│   │   └── settings.tsx       # Recordatorios, timer, capacidad, backup
│   ├── subject/[id].tsx
│   ├── subject/create.tsx
│   ├── subject/import.tsx
│   ├── topic/[id].tsx
│   ├── focus-timer.tsx
│   └── _layout.tsx          # Inicializa DB, migraciones, tema y ErrorBoundary
├── src/
│   ├── components/          # ui/, SubjectCard, TopicItem, SubtaskList, SuggestionCard
│   ├── db/                  # client, migrations, subjectsRepo, topicsRepo, subtasksRepo, sessionsRepo, backup
│   ├── store/               # useAppStore, useTimerStore
│   ├── utils/               # urgencyEngine, syllabusParser, dateHelpers, notifications
│   ├── theme/tokens.ts
│   └── types/models.ts
└── __tests__/               # urgencyEngine, syllabusParser, dateHelpers
```

---

## 8. Backlog y sprints

### Sprint 1: Base y corte vertical (días 1-3)
- [x] US-1.1: Proyecto Expo + TypeScript + Expo Router + development build + tokens de tema + canal de notificaciones y tabs (Timeline oculta con `href: null`).
- [x] US-1.2: expo-sqlite, `PRAGMA foreign_keys = ON;`, migraciones versionadas con insert inicial de `settings` y esquema preservando sesiones (`ON DELETE SET NULL`).
- [x] US-1.3: CRUD de materias con selector de fecha, badges ("Completada", "Examen pasado") y botón de materia demo en un toque (P-001).
- [x] US-1.4: Detalle de materia con input rápido para agregar temas.
- [x] US-1.5: Cambio de estado en un toque y dificultad (⚡) por tema.

### Sprint 2: Importación y progreso (días 4-5)
- [x] US-2.1: Barra de progreso segmentada con porcentaje ponderado.
- [x] US-2.2: Pegado inteligente con vista previa editable y tests del parser (regex preservando subunidades).
- [x] US-2.3: Deshacer al eliminar materias/temas (snackbar de 8 segundos).

### Sprint 3: Motor de urgencia y sugerencia (días 6-7)
- [x] US-3.1: `urgencyEngine.ts` con tests (incluye casos borde: exámenes pasados, completadas, división segura) y tarjeta "Hoy".
- [x] US-3.2: Sugerencia única determinista con "Empezar", micro-bloque de 5 minutos (P-005) y ciclado "Otra".
- [x] US-3.3: Detalle de tema con micro-pasos y notas/links clicables.

### Sprint 4: Temporizador, notificaciones y backup (días 8-10)
- [x] US-4.1: Temporizador con inicio en un toque, cálculo por timestamp, registro de sesiones completas o parciales $\ge 120$ s (P-002).
- [x] US-4.2: Notificaciones locales (permiso contextual, canal Android, reprogramación, un paso concreto).
- [x] US-4.3: Backup y restauración en JSON (exportar/compartir e importar) para no perder datos al cambiar de teléfono.
- [x] US-4.4: Pruebas offline, accesibilidad (48dp, fuente del sistema) y .apk con EAS Build.

### Backlog posterior (v1.1)
- Línea de tiempo con alerta de finales superpuestos (activar tab `timeline.tsx`).
- Modo claro.
- Widget de inicio con el próximo paso.
- Racha suave (días con al menos una sesión, sin penalizar los días en blanco).

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
| :--- | :--- |
| **Cronograma optimista** | Cortes verticales por sprint; la línea de tiempo ya fue diferida a v1.1. |
| **Temporizador impreciso en segundo plano** | Cálculo por timestamp, no por `setInterval`. |
| **Notificaciones que no llegan** | Development build, canal Android registrado de inicio, permiso con contexto. |
| **Pérdida de datos** | Backup JSON, migraciones versionadas, sesiones preservadas (`ON DELETE SET NULL`), snackbar de deshacer de 8 s. |
| **Errores de fechas por zona horaria** | Fechas locales `YYYY-MM-DD` en `dateHelpers.ts` y exclusión formal de exámenes pasados. |
