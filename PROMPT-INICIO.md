# Prompt de arranque para Antigravity

Antes de pegarlo, dejá `AGENTS.md` y `PLAN.md` en la raíz del proyecto (`finales-app/`).
Pegá solo el bloque de abajo. Las reglas de trabajo ya están en `AGENTS.md`, así que el prompt no las repite.

```text
Vas a trabajar como el equipo de desarrollo de esta app. En la raíz del proyecto hay dos archivos que son tu contrato de trabajo:

- AGENTS.md: reglas, convenciones, flujo de trabajo y definición de terminado.
- PLAN.md: especificación del producto, modelo de datos, lógica y sprints.

Leelos completos ahora. No escribas código todavía.

PASO 0: CONFIRMACIÓN
Respondé en máximo 8 líneas: qué es la app, qué problema resuelve, el stack, las 5 reglas técnicas críticas de AGENTS.md y cuál es la primera user story del plan. Si algo no te quedó claro, preguntame ahora (máximo 3 preguntas).

PASO 1: RECONOCIMIENTO DEL PROYECTO
Inspeccioná el estado real del proyecto sin modificar nada:
- versión de Expo SDK y de cada dependencia en package.json,
- qué archivos de la plantilla de create-expo-app siguen existiendo y no forman parte del plan,
- si el árbol de archivos vacíos del plan está completo,
- si hay errores de compilación o advertencias iniciales (npx tsc --noEmit).
Reportalo en una tabla corta.

PASO 2: AUDITORÍA DEL PLAN (sin tocar el código)
Auditá PLAN.md como lo haría un arquitecto senior y un revisor de UX. Buscá:
1. Errores técnicos y APIs que no existan o hayan cambiado en la versión instalada de Expo (verificalo en la documentación oficial, no en tu memoria).
2. Contradicciones entre secciones (modelo de datos, algoritmos, árbol de archivos, sprints).
3. Casos borde sin resolver en la lógica de urgencia, la recomendación y el parser de importación.
4. Riesgos de Android (permisos, notificaciones, ejecución en segundo plano, ahorro de batería).
5. Fricciones de UX que contradigan los principios del plan (una decisión por pantalla, lenguaje sin culpa, empezar en un toque).
6. Dependencias entre user stories mal ordenadas dentro de los sprints.
7. Lo que falta y es necesario para que la app sea usable de punta a punta.
8. Oportunidades de mejora e innovación: funciones, ajustes de UX o ideas que hagan la app más útil para estudiar con TDAH (por ejemplo, cómo ayudar a arrancar, cómo sostener la constancia sin generar culpa, cómo reducir aún más la fricción). Pensá fuera del plan, pero con criterio: priorizá alto impacto y bajo costo, y proponé siempre una versión mínima.

Entregá un informe en docs/AUDITORIA.md con esta estructura:
- Resumen en 5 líneas.
- Hallazgos (puntos 1 a 7) en tabla: ID, prioridad (crítico, importante, menor), dónde está (sección de PLAN.md), problema, corrección propuesta, esfuerzo estimado.
- Propuestas de mejora (punto 8) con el formato de la sección 10 de AGENTS.md (P-001, P-002, ...), máximo 8, ordenadas por relación impacto/costo. Registralas también en docs/PROPUESTAS.md.
- Preguntas abiertas para mí.
No modifiques PLAN.md ni implementes nada. Frená y esperá mi decisión (Aprobar, Aprobar con cambios, Posponer o Rechazar) sobre cada hallazgo y cada propuesta.

PASO 3: ITERACIÓN
Cuando yo apruebe la auditoría:
1. Aplicá solo los cambios y propuestas que yo haya aprobado a PLAN.md y registralos en docs/DECISIONES.md (fecha, cambio, motivo). Las propuestas pospuestas van al backlog posterior del plan y las rechazadas no se vuelven a proponer.
2. Hacé una segunda pasada de auditoría sobre el PLAN.md ya corregido para confirmar que los cambios no generaron nuevas inconsistencias. Repetí hasta que no queden hallazgos críticos ni importantes.
3. Recién ahí, empezá el Sprint 1 siguiendo exactamente el flujo de la sección 7 de AGENTS.md, una user story por vez, con frenos para mi OK.

PASO 4: CIERRE DE CADA SPRINT
Al terminar todas las user stories de un sprint:
- Hacé una revisión de calidad del código del sprint (arquitectura, tipos, casos borde, tests faltantes) y listá deuda técnica si la hay.
- Dame una checklist de prueba manual en el celular de 10 pasos o menos.
- Proponé qué ajustar del plan del sprint siguiente según lo que aprendimos.
- Presentá hasta 3 propuestas de mejora o innovación que surgieron al construir y probar este sprint, con el formato de la sección 10 de AGENTS.md y tu recomendación.
- Esperá mi decisión sobre cada propuesta y mi confirmación antes de empezar el próximo sprint.

Durante todo el proceso, si ves una oportunidad de mejorar algo, proponela con el formato de la sección 10 de AGENTS.md y esperá mi aprobación antes de implementarla. Si detectás un bug, un riesgo de pérdida de datos o un problema de seguridad, avisame de inmediato.

Empezá por el PASO 0.
```

## Cómo usarlo

1. Pegá el bloque en Antigravity (si tiene modo de planificación, usalo para los pasos 0 a 2).
2. Respondé a la confirmación del paso 0. Si está bien, dejá que siga con el reconocimiento y la auditoría.
3. Revisá `docs/AUDITORIA.md` y respondé qué hallazgos aprobás. Podés traerme el informe para que lo revisemos juntos antes de aprobarlo.
4. En cada sesión nueva, pegá solo esta línea: "Leé AGENTS.md y PLAN.md, revisá el estado de los checkboxes de PLAN.md y retomá desde la próxima user story pendiente, siguiendo el flujo de AGENTS.md."
