# Registro de Propuestas de Mejora e Innovación

Conforme a la sección 10 de `AGENTS.md`, este archivo registra todas las propuestas analizadas en el proyecto y su estado de decisión.

| ID | Título | Tipo | Estado | Decisión / Fecha |
| :--- | :--- | :--- | :--- | :--- |
| **P-001** | Materia de bienvenida interactiva (Onboarding sin fricción) | Mejora | Aprobada | 2026-11-24: Incorporada a Sprint 1 (US-1.3) |
| **P-002** | Guardado de tiempo parcial en temporizador interrumpido | Corrección / Mejora | Aprobada | 2026-11-24: Incorporada a Sprint 4 (US-4.1) |
| **P-003** | Ocultar tab "Timeline" de la barra de navegación en v1 | Corrección | Aprobada | 2026-11-24: Incorporada a Sprint 1 (US-1.1) |
| **P-004** | Desacoplar sesiones de estudio del borrado de temas (`ON DELETE SET NULL`) | Corrección | Aprobada | 2026-11-24: Incorporada a Sprint 1 (US-1.2) |
| **P-005** | Micro-bloque anti-procrastinación ("Arrancar con 5 minutos") | Innovación | Aprobada | 2026-11-24: Incorporada a Sprint 3 (US-3.2) |
| **P-006** | Estado de materia explícito "Listo" y "Examen pasado" en tarjetas | Mejora | Aprobada | 2026-11-24: Incorporada a Sprint 1 y Sprint 3 |

---

### Detalle de Propuestas

#### P-001: Materia de bienvenida interactiva (Onboarding sin fricción)
- **Tipo:** Mejora de UX.
- **Problema u oportunidad:** Al abrir la app por primera vez, el usuario se encuentra con la pantalla vacía ("lienzo en blanco"), detonante clásico de parálisis por análisis y abandono en usuarios con TDAH.
- **Propuesta:** Mostrar en estado vacío inicial un botón primario: "Cargar materia de ejemplo (Álgebra)", que precarga 3 temas listos para probar el flujo de estudio en 1 toque.
- **Beneficio para el usuario:** El usuario experimenta el valor y el alivio inmediato de la app en menos de 10 segundos sin tener que tipear ni configurar nada.
- **Costo:** 45 min, complejidad baja, sin dependencias nuevas.
- **Riesgos y alternativas:** Que el usuario piense que no puede borrarla; mitigación: botón de eliminar/archivar accesible con 1 toque.
- **Recomendación:** Aprobar para Sprint 1.
- **Estado:** **Aprobada** (2026-11-24).

#### P-002: Guardado de tiempo parcial en temporizador interrumpido
- **Tipo:** Corrección / Mejora funcional.
- **Problema u oportunidad:** Si un estudiante con TDAH se distrae, atiende una urgencia o se detiene a los 18 de 25 minutos, el temporizador actual podría descartar la sesión al no "completarse".
- **Propuesta:** Si la sesión dura más de 2 minutos y se interrumpe o se cierra la app, registrar los minutos reales estudiados en `study_sessions` y mostrar: "Sumaste X min de foco".
- **Beneficio para el usuario:** Cero culpa: todo esfuerzo cuenta, evitando la frustración de sentir que el tiempo dedicado "no sirvió para nada".
- **Costo:** 1 hora, complejidad baja.
- **Riesgos y alternativas:** Registrar sesiones involuntarias de pocos segundos; mitigación: umbral mínimo de 120 segundos.
- **Recomendación:** Aprobar para Sprint 4 (US-4.1).
- **Estado:** **Aprobada** (2026-11-24).

#### P-003: Ocultar tab "Timeline" de la barra de navegación en v1
- **Tipo:** Corrección de UX.
- **Problema u oportunidad:** `timeline.tsx` figura en la barra inferior pero el feature fue movido a v1.1. Una tab vacía o deshabilitada genera distracción.
- **Propuesta:** Ocultar el botón de la pestaña en `app/(tabs)/_layout.tsx` (`href: null`), dejando una navegación limpia con solo 2 pestañas ("Hoy" y "Ajustes").
- **Beneficio para el usuario:** Menor carga visual y foco absoluto en las materias y el estudio.
- **Costo:** 10 min, impacto nulo en el cronograma.
- **Riesgos y alternativas:** Dejarla con un texto "Próximamente" (agrega ruido innecesario).
- **Recomendación:** Aprobar para Sprint 1.
- **Estado:** **Aprobada** (2026-11-24).

#### P-004: Desacoplar sesiones de estudio del borrado de temas (`ON DELETE SET NULL`)
- **Tipo:** Corrección de arquitectura.
- **Problema u oportunidad:** Con `ON DELETE CASCADE` en `study_sessions`, eliminar un tema rendido borra todo el historial de tiempo estudiado asociado.
- **Propuesta:** Permitir `topic_id TEXT NULL` con `ON DELETE SET NULL`, almacenando adicionalmente el `subject_id` para conservar estadísticas globales de la materia.
- **Beneficio para el usuario:** Sus estadísticas y horas de estudio permanecen intactas aunque limpie o reestructure su temario.
- **Costo:** 30 min en la migración inicial.
- **Riesgos y alternativas:** Ninguno.
- **Recomendación:** Aprobar para Sprint 1 (US-1.2).
- **Estado:** **Aprobada** (2026-11-24).

#### P-005: Micro-bloque anti-procrastinación ("Arrancar con 5 minutos")
- **Tipo:** Innovación de UX para TDAH.
- **Problema u oportunidad:** En días de parálisis severa, comprometerse a 25 minutos genera una barrera mental enorme.
- **Propuesta:** En la tarjeta de sugerencia ("Hoy"), agregar una opción sutil debajo del botón principal: "¿Cuesta arrancar? Probá solo 5 min". Inicia el timer en 5 minutos.
- **Beneficio para el usuario:** Reduce al mínimo la resistencia neurológica al inicio (técnica del pie en la puerta).
- **Costo:** 45 min, reutiliza la misma pantalla `focus-timer.tsx` recibiendo la duración por parámetro.
- **Riesgos y alternativas:** Ofrecer demasiados botones; mitigación: enlace secundario discreto, no botón grande competidor.
- **Recomendación:** Aprobar para Sprint 3 (US-3.2).
- **Estado:** **Aprobada** (2026-11-24).

#### P-006: Estado de materia explícito "Listo" y "Examen pasado" en tarjetas
- **Tipo:** Mejora de UX.
- **Problema u oportunidad:** Cuando todos los temas están en `REVIEWED`, la urgencia da $U = 0$ ("Con margen"), sin transmitir la sensación de objetivo cumplido. Cuando el examen ya pasó, la tarjeta no debe verse como activa.
- **Propuesta:** Crear dos estados visuales dedicados en `SubjectCard`: badge "Completada" (verde esmeralda con ícono de check) y "Examen rendido / Pasado" (gris tenue con acción de archivar).
- **Beneficio para el usuario:** Refuerzo positivo inmediato y orden mental al terminar una materia.
- **Costo:** 40 min en `SubjectCard.tsx` y `urgencyEngine.ts`.
- **Riesgos y alternativas:** Ninguno.
- **Recomendación:** Aprobar para Sprint 1 y Sprint 3.
- **Estado:** **Aprobada** (2026-11-24).
