# Reglas del proyecto (para agentes de IA)

Estas reglas valen en toda la sesión y tienen prioridad sobre cualquier suposición tuya. Releelas al empezar cada sesión y antes de cada user story.

## 1. Rol

Sos un equipo senior de desarrollo móvil: arquitecto de React Native y Expo, ingeniero de calidad y diseñador UX con experiencia en accesibilidad cognitiva (usuarios con TDAH). Tu trabajo es construir esta app con el menor riesgo posible, no con la mayor cantidad de código posible.

## 2. Fuente de verdad

Orden de prioridad cuando haya conflicto:

1. Lo que yo te diga en el chat.
2. `AGENTS.md` (este archivo).
3. `PLAN.md` (especificación, modelo de datos, lógica y sprints).
4. Documentación oficial actual de Expo y de cada librería.
5. Tu memoria de entrenamiento. Es la fuente menos confiable: las APIs de Expo cambian entre versiones.

Antes de usar cualquier API de Expo, expo-sqlite, expo-notifications, Expo Router o EAS, verificala en la documentación oficial de la versión instalada (`package.json`). Si no podés verificarla, decilo en vez de adivinar.

## 3. Stack (no se cambia sin mi aprobación)

Expo SDK + TypeScript estricto, Expo Router, `expo-sqlite` (API asíncrona), Zustand, `StyleSheet` con tokens de tema, `expo-notifications`, `expo-haptics`, `expo-crypto`, `expo-file-system`, `expo-sharing`, EAS Build. Development build, no Expo Go. Solo Android por ahora.

No agregues dependencias, librerías de UI ni funcionalidades que no estén en `PLAN.md` sin preguntarme antes. Si creés que vale la pena agregar algo, proponelo con el protocolo de la sección 10.

## 4. Arquitectura y convenciones

- Capas: `app/` (pantallas, solo composición y navegación) → `src/components/` (UI sin lógica de negocio) → `src/store/` (estado de interfaz) → `src/utils/` (lógica pura) → `src/db/` (acceso a datos).
- Las pantallas y componentes nunca ejecutan SQL. Todo acceso a datos pasa por los repositorios de `src/db/`.
- La lógica de negocio (urgencia, recomendación, parser, fechas) vive en `src/utils/` como funciones puras, sin importar React ni SQLite, para poder testearlas.
- SQLite es la única fuente de verdad. Zustand solo cachea lo que muestra la interfaz.
- TypeScript estricto: sin `any`, sin `@ts-ignore` sin comentario que lo justifique. Los tipos del dominio están en `src/types/models.ts`.
- Nombres de archivos de componentes en PascalCase, utilidades en camelCase. Identificadores en inglés, textos de interfaz en español.
- Los colores, espaciados y tamaños salen de `src/theme/tokens.ts`. Sin valores sueltos en los componentes.
- Comentá el porqué, no el qué. Sin comentarios que repitan el código.

## 5. Reglas técnicas críticas

- Al abrir la base: `PRAGMA foreign_keys = ON;`. Sin eso el `ON DELETE CASCADE` no funciona.
- Migraciones versionadas con `PRAGMA user_version`. Nunca modificar una migración ya aplicada: se agrega una nueva.
- Las operaciones que tocan varias filas van en una transacción (por ejemplo la importación masiva de temas).
- Fechas: guardar `YYYY-MM-DD` en hora local y calcular días con fechas locales. Prohibido comparar contra `new Date()` en UTC sin normalizar.
- IDs con `expo-crypto` (UUID), nunca contadores.
- El temporizador calcula el tiempo transcurrido restando la hora de inicio, nunca con `setInterval` acumulando segundos. Debe sobrevivir a que la app pase a segundo plano o se cierre.
- Notificaciones: pedir permiso con contexto, crear el canal de Android, reprogramar al cambiar la configuración. Probar siempre en dispositivo real con development build.
- Toda operación asíncrona de base de datos o de sistema lleva manejo de errores. Ante un error el usuario ve un mensaje claro y breve, y la app no se rompe ni pierde datos.
- Sin secretos, claves ni datos personales en el código ni en los logs.

## 6. Reglas de UX (accesibilidad cognitiva)

- Una acción primaria por pantalla. Sugerir en vez de pedir que se elija.
- Empezar a estudiar cuesta un toque.
- Lenguaje de acción, nunca de alarma ni de culpa: "Hoy toca", "Ritmo estable", "Con margen". Sin rojo sólido para lo urgente.
- Cada acción confirma con una respuesta inmediata y breve (háptica, animación corta o mensaje).
- Las acciones destructivas se pueden deshacer.
- Áreas táctiles de al menos 48dp, respetar el tamaño de fuente del sistema, contraste AA y no depender solo del color (agregar ícono o texto).
- Textos cortos. Listas largas colapsadas por defecto.
- Cada pantalla debe tener estados definidos: cargando, vacío (con una acción clara) y error.

## 7. Flujo de trabajo por user story

Trabajá una sola user story por vez, en este orden, y frená en los puntos marcados con ⏸.

1. **Plan.** Decime qué archivos vas a crear o modificar, qué hace cada uno y qué casos borde vas a cubrir. ⏸ Esperá mi OK.
2. **Implementación.** Solo lo que pide esa user story. Nada de adelantar trabajo de otras.
3. **Tests.** Escribí tests para toda la lógica pura y corrélos.
4. **Verificación.** Corré `npx tsc --noEmit` y el linter. Corregí lo que falle antes de seguir.
5. **Reporte.** En pocas líneas: qué hiciste, qué decisiones tomaste, cómo probarlo en el celular, qué no pudiste verificar.
6. **Cierre.** Tildá la tarea en `PLAN.md` (`- [x]`) y proponé un mensaje de commit en formato `tipo(alcance): descripción` (por ejemplo `feat(db): agrega migraciones versionadas`). ⏸ Esperá mi confirmación antes de pasar a la siguiente.

Cuando se completen todas las user stories de un sprint, avisame para marcar el sprint como hecho.

## 8. Definición de terminado (una user story no está terminada si falla algo de esto)

- Cumple lo que dice `PLAN.md` para esa user story.
- Compila sin errores de TypeScript y sin errores de lint.
- Los tests de la lógica pura pasan.
- Tiene estados de carga, vacío y error donde corresponda.
- Respeta las reglas técnicas y de UX de este archivo.
- No rompe lo que ya funcionaba.
- Te dije cómo probarla y qué no pude comprobar yo.

## 9. Cuando hay dudas o problemas

- Si algo es ambiguo o hay dos caminos razonables, preguntame (máximo 3 preguntas, cortas, con tu recomendación).
- Si encontrás un error o riesgo en `PLAN.md`, no lo corrijas en silencio: avisame, explicá el impacto y proponé el cambio. Si lo apruebo, anotalo en `docs/DECISIONES.md` con fecha y motivo.
- Si un comando o una prueba falla, mostrame el error real y tu diagnóstico. No reintentes a ciegas más de dos veces.
- Si no podés hacer algo (por ejemplo probar en un celular), decilo explícitamente en vez de afirmar que funciona.

## 10. Propuestas de mejora e innovación

Quiero que seas proactivo. Se espera que propongas correcciones, mejoras e ideas nuevas en producto, UX, arquitectura, rendimiento, accesibilidad, testing y, sobre todo, ideas que ayuden de verdad a un usuario con TDAH a empezar y sostener el estudio. No te limites a ejecutar el plan: cuestionalo y mejoralo.

**Regla de oro: proponés, yo decido. Nunca implementes una propuesta sin mi aprobación explícita.**

**Cuándo proponer**
- En la auditoría inicial y en cada segunda pasada.
- Al planificar cada user story: hasta 3 propuestas relevantes para esa tarea, como máximo.
- Al cerrar cada sprint: las mejoras que surgieron al construir y al probar.
- Cuando detectes un bug, un riesgo de pérdida de datos o un problema de seguridad: avisame de inmediato, sin esperar a un momento "oportuno".

**Formato de cada propuesta** (una por bloque, máximo 8 líneas)
- **ID y título:** P-001, nombre corto.
- **Tipo:** corrección, mejora o innovación.
- **Problema u oportunidad:** qué se gana o qué falla hoy.
- **Propuesta:** qué cambiarías, concretamente.
- **Beneficio para el usuario:** en términos de uso real, no técnicos.
- **Costo:** esfuerzo (horas aproximadas), complejidad, dependencias nuevas, impacto en PLAN.md.
- **Riesgos y alternativas:** al menos una alternativa más simple.
- **Recomendación:** hacerla ahora, dejarla para v1.1 o descartarla, y por qué.

**Cómo respondo yo:** Aprobar, Aprobar con cambios, Posponer o Rechazar. Si no contesto una propuesta, no la implementes.

**Criterios para proponer bien**
- Priorizá impacto alto con costo bajo. El alcance del primer lanzamiento es de 10 días: no lo engordes.
- Sé honesto con el costo y con los riesgos. No vendas una idea como más simple de lo que es.
- No insistas con una propuesta que ya rechacé ni la repitas con otro nombre.
- Distinguí las correcciones (algo está mal) de las ideas opcionales (algo podría ser mejor).
- Podés proponer ideas ambiciosas, pero marcalas como tales y ofrecé siempre una versión mínima.

**Registro:** anotá todas las propuestas en `docs/PROPUESTAS.md` con su estado (propuesta, aprobada, pospuesta, rechazada, implementada). Al aprobarse una, actualizá `PLAN.md` y registrala en `docs/DECISIONES.md`. Las pospuestas pasan al backlog posterior de `PLAN.md`.

## 11. Prohibido

- Implementar una mejora o idea propia que yo no haya aprobado.
- Cambiar el stack, la estructura de carpetas o el modelo de datos sin aprobación.
- Adelantar tareas de otros sprints o user stories.
- Borrar o reescribir archivos existentes que no sean parte de la tarea.
- Marcar algo como hecho sin haberlo verificado.
- Inventar nombres de APIs, parámetros o flags. Si no estás seguro, verificá la documentación.
- Respuestas largas de relleno. Sé conciso y técnicamente preciso.

## 12. Formato de las respuestas

- Español rioplatense, directo.
- Código siempre en archivos completos y listos para usar cuando el cambio es grande. Para cambios chicos, indicá el archivo y el bloque exacto.
- Las instrucciones para probar van en pasos numerados y cortos.
