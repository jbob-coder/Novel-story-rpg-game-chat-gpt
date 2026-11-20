# Lote funcional 01 — dependencias de agendas, decisiones, relaciones y cola diferida (20-11-2026)

**Estado:** revisión de archivos fuente, contratos e inventario de pruebas. **Sin ejecución funcional sobre los HEAD históricos**; no integrar antes de probar en rama aislada.

**Base verificada:** `main` `019175c6463ff31807a0f7013d91299add94913c`, con `tools/living_world_coordinator.mjs` blob `723bc9e2e9b1e905f4f80168ae31394cd3324373` y `tools/turn_engine.mjs` blob `173e9d0e06ec6a85ea75d46ca39890a04b640b2a`.

## Ramas examinadas con código

| Rama / HEAD | Archivos y evidencia | Compatibilidad con `main` | Dictamen |
|---|---|---|---|
| `work/meridian-bay-causal-routines-20261112` @ `7301f2b511db` (PR #11) | `tools/living_world_agenda.mjs`, `tests/meridian_bay_agenda.test.mjs`; 15 plantillas civiles. | Agenda ausente en `main`. El test histórico parte de 9 ubicaciones, la partida actual tiene 15. En `main`, `reviewNPCCommitments` acepta `elapsedDays` y examina obligaciones de todos los propietarios, no la firma anterior. | **Portación selectiva bajo revisión en PR #82**, sin fusión ni ejecución de turnos. No reutilizar el archivo antiguo directamente. |
| `work/meridian-bay-causal-decisions-20261112` @ `7b0c6ddf9c07` (PR #12) | `tools/living_world_decisions.mjs` (186 líneas) y `tests/living_world_decisions.test.mjs` (189 líneas, 13 casos). | Requiere `living_world_agenda.mjs` (ausente en `main`, PR #82 borrador). Sus borradores adjuntan `review_metadata`; `prepareLivingWorldTurn` actual reconstruye los registros NPC solo con `actor_id`, `intent`, `outcome`, `changes`, sin ese campo. | **No listo para integrar**: adaptar dependencias y decidir persistencia/auditoría de metadatos de revisión; reprobar cambios y no asumir éxito. |
| `work/meridian-bay-social-relations-20261112` @ `cc1fbdf149fc` (PR #13) | `tools/living_world_social.mjs` (236 líneas, blob `971cf964a45fe1842c986288212543c198f8f63a`); `tests/living_world_social.test.mjs` (246 líneas, blob `c8bc14d84ae45d217fa41470b5c710ed840c9099`, 14 casos). | La rama antigua modifica explícitamente `living_world_coordinator.mjs` para llamar `validateSocialResolutionBatch` y transferir `social_context`, y `turn_engine.mjs` para conservar `social_context` y validar `verifySocialEventHistory`. Esas llamadas **no existen** en las versiones actuales de `main`. Las modificaciones antiguas completas de motor tampoco deben sobrescribir el nuevo guardado/servicios. | **Integración por adaptación, no merge directo**: extraer pareja social, procedencia y validación replay; probar junto a necesidades/servicios y chapter history actuales. |
| `work/living-world-between-turns-20261112` @ `000b912ce792` (sin PR histórica) | `tools/living_world_deferred.mjs` (122 líneas, blob `69d477d7c89b59f312426fd36108f4a877ba12e4`). En su `living_world_coordinator.mjs` antiguo hay imports de `consumedDeferredNPCReviews` y `planDeferredNPCReviews`; el turn engine antiguo llama `validateDeferredNPCReviews`. | Ninguno de esos hooks existe en los archivos actuales de `main`. La cola propuesta vive en `state.pending.npc_review_queue`, máximo 12 pendientes y 3 nuevos por turno; el `pending` vigente representa espera de acción libre. No se identificó una suite dedicada `tests/living_world_deferred.test.mjs` en su árbol. | **No listo**: definir compatibilidad del estado `pending`, pruebas de serialización, transición entre capítulos, consumo de un solo uso y recuperación transaccional sin perder tareas. |

## Contratos narrativos que deben mantenerse

1. **No ejecutar una intención por pasar el tiempo**: toda agenda, evaluación o cola es privada y no equivale a llegada, trato, reparación, conocimiento adquirido ni turno nuevo.
2. **No filtrar conocimiento entre NPC o hacia Jack**: para relaciones, un contacto exige co-ubicación guardada, observación causal revisada, eventos atribuidos a cada participante, y procedencia de hechos comunicados. Los tests históricos simulan transferencias sintéticas; no acreditan hechos de la partida.
3. **No sobreescribir `turn_engine.mjs` ni `state_changes.mjs` antiguos**: el código vigente valida guardados, admisión del mundo, necesidades, servicios, planes y replay. Las integraciones de PR #12/#13 requieren transportar solo los campos y validaciones compatibles.
4. **No reabrir en bloque PR #10/#14/#15/#27**: obligaciones, necesidades y casos de servicios ya tienen implementaciones selectivas en `main`. La cobertura debe compararse por comportamientos, no por números de PR.
5. **Respetar la rama narrativa y la prueba de cinco archivos**: `work/chat-narrative-foundation` sigue siendo custodio del turno 9. Esta revisión no mueve el journal ni graba narración.

## Inventario de pruebas históricas (inspeccionadas, NO ejecutadas ahora)

- PR #12: **13** pruebas enumeradas: objetivos/recursos, destino desconocido de Rosa/Elena/Darius, observaciones causales, impedimentos, prioridad, tampering, deferral, escena sintética, paso temporal imposible.
- PR #13: **14** pruebas enumeradas: co-ubicación, par de eventos actor-propietario, relación direccional, observación atribuida, conocimiento del emisor, guardado sintético, duplicados, replay y pruebas negativas de adulteración.
- Rama diferida: el árbol conserva pruebas generales de compromisos, coordinador, rutinas y agendas, pero **no presenta un archivo dedicado al módulo diferido**. Eso no prueba ausencia de cualquier cobertura indirecta.

## Resultado / siguiente lote

**Verificado ahora:** existencia y SHA de módulos; revisión del contenido y firmas; diferencias exactas en hooks del coordinador y validador; enumeración de pruebas históricas. **No verificado:** reproducción de pruebas sobre `main`, guardado/reinicio/transición en HEAD modernos, cobertura mutua de PR #12/#13 y privacidad semántica de narración real.

**Secuencia recomendada:** primero evaluar la PR #82 sin mezclarla, luego hacer adapter de decisiones PR #12, después pareja social PR #13 y finalmente cola diferida. Mantener una prueba sintética de 2 turnos + transición de capítulo + recuperación GitHub antes de declarar cada módulo funcional.

El siguiente lote de **auditoría** (sin integración) debe revisar de forma similar los cortes de mapa y corredores, empezando por `work/meridian-bay-road-growth-slice1-20261116`, `...slice2...`, `...slice3...` y los fragmentos de costa con sus validadores de costura.
