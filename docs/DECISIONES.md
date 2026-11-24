# Registro de Decisiones de Arquitectura y Producto (ADR)

Este archivo registra las decisiones clave tomadas, los cambios aprobados sobre `PLAN.md` y su justificación técnica o de UX.

---

### [2026-11-24] - Aprobación de Auditoría Inicial y Propuestas P-001 a P-006

#### 1. Inserción inicial de configuración (H-001)
- **Decisión:** En la migración inicial (v1), se ejecuta `INSERT OR IGNORE INTO settings (id) VALUES (1);`.
- **Motivo:** Evita errores de puntero nulo y garantiza valores por defecto consistentes para el temporizador y el cálculo de capacidad.

#### 2. Exclusión y tratamiento de exámenes pasados (H-002, P-006)
- **Decisión:** Cuando `diasHastaExamen < 0`, el cálculo clasifica la materia como `EXAM_PASSED`. No participa del motor de urgencia ni de la tarjeta "Hoy". En la lista de materias se muestra al final con badge gris tenue y opciones de un toque: "Archivar" o "Cambiar fecha".
- **Motivo:** Cero culpa (principio 3). Mostrar un examen pasado como ultra-urgente genera ansiedad paralisante innecesaria para un estudiante con TDAH.

#### 3. Preservación del histórico de sesiones de estudio (H-003, P-004)
- **Decisión:** En la tabla `study_sessions`, cambiar `topic_id` a nullable con `ON DELETE SET NULL`, e incorporar `subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE`.
- **Motivo:** Si el estudiante borra o depura un tema ya rendido, las horas y sesiones de estudio acumuladas en la materia no se pierden.

#### 4. Ocultamiento de la pestaña "Timeline" en v1 (H-004, P-003)
- **Decisión:** En `app/(tabs)/_layout.tsx`, la ruta `timeline` tendrá `href: null` en la barra inferior de navegación.
- **Motivo:** Evitar ruido visual y opciones muertas; focalizar al usuario únicamente en "Hoy" (estudio/materias) y "Ajustes".

#### 5. Protección contra divisiones por cero en capacidad (H-005)
- **Decisión:** Agregar `CHECK (daily_capacity_units > 0)` en SQLite y blindar `urgencyEngine` con `Math.max(0.5, capacity)`.
- **Motivo:** Evitar valores `Infinity` o `NaN` en cálculos matemáticos si la configuración se altera.

#### 6. Notificaciones en Android (H-006)
- **Decisión:** Registrar el canal de notificaciones de Android con prioridad moderada en la inicialización y solicitar `POST_NOTIFICATIONS` de forma contextual (al configurar recordatorios o iniciar timer), no al abrir la app.
- **Motivo:** Cumplir requisitos de Android 8+ y Android 13+ sin generar fricción en el primer arranque.

#### 7. Determinismo en desempates del motor de recomendación (H-007)
- **Decisión:** Si dos materias empatan en urgencia $U$ y fecha de examen, el desempate se resuelve por orden alfabético de nombre y finalmente por `id`.
- **Motivo:** Consistencia visual: evitar que la tarjeta "Hoy" oscile erráticamente entre renders o sesiones.

#### 8. Robustez del parser de importación (H-008)
- **Decisión:** El regex de limpieza sólo removerá viñetas (`-`, `*`, `•`) y numeraciones de primer orden (`1.`, `a)`), preservando expresiones jerárquicas como "1.1" o "Unidad 2".
- **Motivo:** No mutilar títulos legítimos de unidades y subunidades académicas.

#### 9. Onboarding interactivo en un toque (P-001)
- **Decisión:** En el estado vacío de la pantalla de inicio, ofrecer un botón destacado: "Cargar materia de prueba (Álgebra)", que precarga 3 temas de muestra.
- **Motivo:** Derribar el "bloqueo del lienzo en blanco" y permitir al estudiante probar el flujo completo en menos de 10 segundos.

#### 10. Guardado de tiempo parcial en temporizador (P-002)
- **Decisión:** Si el temporizador se interrumpe tras al menos 120 segundos de foco efectivo, registrar la sesión parcial y mostrar feedback positivo ("Sumaste X min de foco").
- **Motivo:** Cero culpa: valorar todo esfuerzo genuino aunque no se alcance el bloque completo.

#### 11. Ventana de deshacer extendida a 7-8 segundos (US-2.3)
- **Decisión:** El snackbar de "Deshacer" para eliminaciones durará 8 segundos en lugar de 5.
- **Motivo:** Adaptación cognitiva a usuarios con TDAH o dificultades motrices/atencionales para evitar pérdidas accidentales.

#### 12. Micro-bloque anti-procrastinación de 5 minutos (P-005)
- **Decisión:** En la tarjeta "Hoy", incluir un acceso secundario discreto: "¿Cuesta arrancar? Probá 5 min".
- **Motivo:** Reducir la resistencia neurológica al mínimo ("técnica del pie en la puerta") en días de bloqueo severo.
