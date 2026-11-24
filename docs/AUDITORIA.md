# Auditoría Técnica y de UX de PLAN.md

## 1. Resumen ejecutivo (5 líneas)
El plan presenta una arquitectura sólida, bien desacoplada y con un enfoque excelente en accesibilidad cognitiva y baja fricción para estudiantes con TDAH.
Sin embargo, se detectaron inconsistencias críticas en el modelo de datos (falta de inicialización de la fila única en `settings` y borrado en cascada destructivo en `study_sessions`).
La fórmula de urgencia no resuelve formalmente los exámenes ya transcurridos, lo que provocaría alarmas permanentes indebidas.
Existen componentes desfasados en navegación (tab `timeline` presente en el árbol pero diferida a v1.1 en el backlog).
Se proponen 6 mejoras de alto impacto y bajo costo orientadas a destrabar la parálisis de inicio y asegurar la integridad de datos.

---

## 2. Hallazgos técnicos y de producto

| ID | Prioridad | Sección PLAN.md | Problema detectado | Corrección propuesta | Esfuerzo estimado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H-001** | **Crítico** | 3. Modelo de datos | La tabla `settings` tiene restricción `CHECK (id = 1)` pero no se define el `INSERT` inicial en la migración v1. Cualquier consulta devolverá vacío y fallará la configuración inicial. | Agregar `INSERT OR IGNORE INTO settings (id) VALUES (1);` en la migración inicial. | 15 min |
| **H-002** | **Crítico** | 4. Lógica de negocio (A) | Examen con fecha pasada ($diasHastaExamen < 0$): la fórmula $D = \max(1, \text{dias})$ asigna $D = 1$, provocando urgencia máxima artificial perpetua ("Hoy toca"). | En `urgencyEngine`, detectar si `diasHastaExamen < 0` y categorizarlo con estado `EXAM_PASSED`, excluyéndolo de la sugerencia activa y ofreciendo archivar. | 30 min |
| **H-003** | **Importante** | 3. Modelo de datos | `study_sessions` tiene `FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE`. Si el estudiante borra o depura un tema, se borra su historial de tiempo estudiado. | Cambiar a `topic_id TEXT NULL REFERENCES topics(id) ON DELETE SET NULL` y añadir `subject_id TEXT NOT NULL` o títulos desnormalizados para preservar métricas históricas. | 25 min |
| **H-004** | **Importante** | 7 y 8. Arquitectura y Sprints | `app/(tabs)/timeline.tsx` figura en el árbol de rutas activas pero fue pospuesto a v1.1. Una pestaña inerte en el menú principal añade sobrecarga y confusión visual. | Ocultar la pestaña `timeline` en `app/(tabs)/_layout.tsx` para v1 (`href: null`), manteniendo solo "Hoy" y "Ajustes". | 10 min |
| **H-005** | **Importante** | 3 y 4. Modelo y Urgencia | Posible división por cero si `daily_capacity_units` se configura en 0 en la tabla `settings`. | Añadir restricción `CHECK (daily_capacity_units > 0)` en SQLite y proteger con `Math.max(0.5, capacity)` en `urgencyEngine`. | 10 min |
| **H-006** | **Importante** | 6. Notificaciones | En Android 8+ es obligatorio registrar el canal con `setNotificationChannelAsync`, y en Android 13+ el permiso `POST_NOTIFICATIONS` en runtime; sin canal, Android descarta notificaciones locales en silencio. | Explicitizar en US-1.1 y US-4.2 la creación obligatoria del canal con importancia moderada antes de programar cualquier notificación. | 25 min |
| **H-007** | **Menor** | 4. Lógica de negocio (B) | Empate triple en sugerencia: si dos materias tienen igual urgencia máxima e igual fecha de examen, el desempate no es determinista y puede oscilar entre renders. | Añadir criterio terciario determinista de desempate en la recomendación (ej. orden alfabético por nombre o `id`). | 10 min |
| **H-008** | **Menor** | 4. Lógica de negocio (C) | El parser de importación masiva podría limpiar de más en numeraciones jerárquicas usuales en programas de estudio (ej: "1.1 Conceptos básicos"). | Refinar la expresión regular para que limpie viñetas (`-`, `*`, `•`) y numeraciones de primer nivel (`1.`, `a)`), preservando subunidades ("Unidad 1", "1.1"). | 20 min |

---

## 3. Propuestas de mejora e innovación (TDAH & Accesibilidad)

### P-001: Materia de bienvenida interactiva (Onboarding sin fricción)
- **Tipo:** Mejora de UX.
- **Problema u oportunidad:** Al abrir la app por primera vez, el usuario se encuentra con la pantalla vacía ("lienzo en blanco"), detonante clásico de parálisis por análisis y abandono en usuarios con TDAH.
- **Propuesta:** Mostrar en estado vacío inicial un botón primario: "Cargar materia de ejemplo (Álgebra)", que precarga 3 temas listos para probar el flujo de estudio en 1 toque.
- **Beneficio para el usuario:** El usuario experimenta el valor y el alivio inmediato de la app en menos de 10 segundos sin tener que tipear ni configurar nada.
- **Costo:** 45 min, complejidad baja, sin dependencias nuevas.
- **Riesgos y alternativas:** Que el usuario piense que no puede borrarla; mitigación: botón de eliminar/archivar accesible con 1 toque.
- **Recomendación:** Aprobar para Sprint 1.

### P-002: Guardado de tiempo parcial en temporizador interrumpido
- **Tipo:** Corrección / Mejora funcional.
- **Problema u oportunidad:** Si un estudiante con TDAH se distrae, atiende una urgencia o se detiene a los 18 de 25 minutos, el temporizador actual podría descartar la sesión al no "completarse".
- **Propuesta:** Si la sesión dura más de 2 minutos y se interrumpe o se cierra la app, registrar los minutos reales estudiados en `study_sessions` y mostrar: "Sumaste X min de foco".
- **Beneficio para el usuario:** Cero culpa: todo esfuerzo cuenta, evitando la frustración de sentir que el tiempo dedicado "no sirvió para nada".
- **Costo:** 1 hora, complejidad baja.
- **Riesgos y alternativas:** Registrar sesiones involuntarias de pocos segundos; mitigación: umbral mínimo de 120 segundos.
- **Recomendación:** Aprobar para Sprint 4 (US-4.1).

### P-003: Ocultar tab "Timeline" de la barra de navegación en v1
- **Tipo:** Corrección de UX.
- **Problema u oportunidad:** `timeline.tsx` figura en la barra inferior pero el feature fue movido a v1.1. Una tab vacía o deshabilitada genera distracción.
- **Propuesta:** Ocultar el botón de la pestaña en `app/(tabs)/_layout.tsx` (`href: null`), dejando una navegación limpia con solo 2 pestañas ("Hoy" y "Ajustes").
- **Beneficio para el usuario:** Menor carga visual y foco absoluto en las materias y el estudio.
- **Costo:** 10 min, impacto nulo en el cronograma.
- **Riesgos y alternativas:** Dejarla con un texto "Próximamente" (agrega ruido innecesario).
- **Recomendación:** Aprobar para Sprint 1.

### P-004: Desacoplar sesiones de estudio del borrado de temas (`ON DELETE SET NULL`)
- **Tipo:** Corrección de arquitectura.
- **Problema u oportunidad:** Con `ON DELETE CASCADE` en `study_sessions`, eliminar un tema rendido borra todo el historial de tiempo estudiado asociado.
- **Propuesta:** Permitir `topic_id TEXT NULL` con `ON DELETE SET NULL`, almacenando adicionalmente el `subject_id` para conservar estadísticas globales de la materia.
- **Beneficio para el usuario:** Sus estadísticas y horas de estudio permanecen intactas aunque limpie o reestructure su temario.
- **Costo:** 30 min en la migración inicial.
- **Riesgos y alternativas:** Ninguno.
- **Recomendación:** Aprobar para Sprint 1 (US-1.2).

### P-005: Micro-bloque anti-procrastinación ("Arrancar con 5 minutos")
- **Tipo:** Innovación de UX para TDAH.
- **Problema u oportunidad:** En días de parálisis severa, comprometerse a 25 minutos genera una barrera mental enorme.
- **Propuesta:** En la tarjeta de sugerencia ("Hoy"), agregar una opción sutil debajo del botón principal: "¿Cuesta arrancar? Probá solo 5 min". Inicia el timer en 5 minutos.
- **Beneficio para el usuario:** Reduce al mínimo la resistencia neurológica al inicio (técnica del pie en la puerta).
- **Costo:** 45 min, reutiliza la misma pantalla `focus-timer.tsx` recibiendo la duración por parámetro.
- **Riesgos y alternativas:** Ofrecer demasiados botones; mitigación: enlace secundario discreto, no botón grande competidor.
- **Recomendación:** Aprobar para Sprint 3 (US-3.2).

### P-006: Estado de materia explícito "Listo" y "Examen pasado" en tarjetas
- **Tipo:** Mejora de UX.
- **Problema u oportunidad:** Cuando todos los temas están en `REVIEWED`, la urgencia da $U = 0$ ("Con margen"), sin transmitir la sensación de objetivo cumplido. Cuando el examen ya pasó, la tarjeta no debe verse como activa.
- **Propuesta:** Crear dos estados visuales dedicados en `SubjectCard`: badge "Completada" (verde esmeralda con ícono de check) y "Examen rendido / Pasado" (gris tenue con acción de archivar).
- **Beneficio para el usuario:** Refuerzo positivo inmediato y orden mental al terminar una materia.
- **Costo:** 40 min en `SubjectCard.tsx` y `urgencyEngine.ts`.
- **Riesgos y alternativas:** Ninguno.
- **Recomendación:** Aprobar para Sprint 1 y Sprint 3.

---

## 4. Preguntas abiertas para el usuario

1. **Onboarding (P-001):** ¿Preferís que al abrir por primera vez la app ofrezca crear una materia de ejemplo con 1 toque, o preferís que vaya directo al formulario de crear materia?
2. **Duración de Snackbar de Deshacer (US-2.3):** El plan original estipula 5 segundos. Para usuarios con TDAH o dificultades motrices, ¿te parece extenderlo a 7-8 segundos o mantener los 5 segundos?
3. **Manejo de exámenes vencidos (H-002 / P-006):** Si un examen ya pasó su fecha, ¿preferís que se muestre un aviso discreto sugiriendo "Mover fecha o Archivar" y no participe de las sugerencias del día?
