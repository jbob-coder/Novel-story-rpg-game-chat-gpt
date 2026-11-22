# Lote 07 — auditoría de compatibilidad de decisiones y relaciones NPC (PR #12 y #13)

**Fecha:** 2026-11-22. **Alcance:** lectura verificada de GitHub, comparación de árboles, código, pruebas y guardado. **Resultado:** dos PR históricas clasificadas; **ninguna funcionalidad histórica se ha integrado o ejecutado sobre main en este lote**.

**Repositorio:** `jbob-coder/Novel-story-rpg-game-chat-gpt`.
**Base exacta:** [main @ `019175c6463ff31807a0f7013d91299add94913c`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/commit/019175c6463ff31807a0f7013d91299add94913c).
**Trabajo actual relacionado:** [PR #82 — agenda NPC adaptada](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/82), `53f6dcb77965a62cf896be22cd1d97cef2088761`, **draft y no fusionada**. [PR #83 — auditoría general de ramas](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/83), también draft. Este lote amplía la **verificación funcional selectiva**, no vuelve a contar las 108 ramas originales ni modifica el informe de PR #83.

## 1. Cadena de procedencia comprobada

| Fuente | HEAD GitHub leído | Base real de la PR | Delta propio comprobado | Estado |
| --- | --- | --- | --- | --- |
| [PR #11](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/11) rutinas | `7301f2b511dbb6dfdefe065aa9e9a74c600bbd35` | PR #10 | Dependencia histórica, no auditada funcionalmente aquí | draft, abierta |
| [PR #12](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/12) decisiones | `7b0c6ddf9c07192b2e8b2560725712b2efb0f82f` | PR #11 | Git compare: 6 rutas (2 nuevas, 4 modificadas); 9 commits posteriores a la base | draft, abierta |
| [PR #13](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/13) relaciones | `cc1fbdf149fc6ae2ad4703fc4ed14e70a77ec226` | PR #12 | Git compare: 8 rutas (3 nuevas, 5 modificadas); 13 commits posteriores a la base | draft, abierta |
| [PR #82](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/82) agenda adaptada | `53f6dcb77965a62cf896be22cd1d97cef2088761` | main `019175c6` | Reintroduce `tools/living_world_agenda.mjs` con contratos de fecha y propiedad del actor | draft, abierta |

**Código fuente leído por SHA de blob:** PR #12 `tools/living_world_decisions.mjs` = `34ecb0aa60db1bf36bcb7ae4d0c834a295d06398`; `tests/living_world_decisions.test.mjs` = `d0834d41c3f90474df3f4ff117b02613f73c1cdf`. PR #13 `tools/living_world_social.mjs` = `971cf964a45fe1842c986288212543c198f8f63a`; `tests/living_world_social.test.mjs` = `c8bc14d84ae45d217fa41470b5c710ed840c9099`. Estos hashes identifican **archivos históricos**, no garantizan compatibilidad con main.

## 2. Comparación independiente del checkpoint: hallazgo bloqueante

Se leyó el SHA de blob real de los cinco archivos canónicos en main, PR #12, PR #13 y PR #82; no se dedujo equivalencia de las descripciones de las PR.

| Archivo | main y PR #82 | PR #12 y PR #13 | Resultado |
| --- | --- | --- | --- |
| `game/SAVE_MANIFEST.json` | `897ec2e77ece4f8edf506c7058552a5dd3cdb320` | mismo SHA | Igual |
| `game/STATE.json` | `3f4e9c98a7211068faefd31d0a0acbd4260ef589` | `0320a93ebf4a944da97b65dffa6d281acce46d94` | **Distinto** |
| `chapters/CH-000.md` | `e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4` | mismo SHA | Igual |
| `chapters/CH-000.events.json` | `1f40c724e44f70c9b45814dc11ff1f73262c5a5f` | mismo SHA | Igual |
| `chapters/CH-000.transcript.json` | `1350916ead7fb1f2f15fdd635dda42e69a0a3fed` | mismo SHA | Igual |

La comparación estructural JSON entre el `STATE.json` de PR #12 y el de main encontró **9 registros de ubicación** en PR #12/#13 y **15 en main** (14 `LOC-` y el contenedor de ciudad); los 7 actores, día −29, periodo `morning` y último turno 9 coinciden. Los seis lugares adicionales en main son `LOC-MARKET-NOAH-REPAIR`, `LOC-RAILGARDEN-ABARROTES`, `LOC-RAILGARDEN-CLINIC`, `LOC-MARKET-DELIVERY-POINT`, `LOC-MARKET-CULTURE-PASSAGE` y `LOC-MARKET-BUSINESS-OFFICES`. También son nuevos los enlaces `connected_ids` pertinentes y los metadatos `world.prebuilt_design_id` / `world.prebuilt_design_review`.

**Interpretación correcta:** el diferente `STATE.json` es parte del *árbol base histórico heredado*, **no** prueba que PR #12 o #13 hayan editado la partida: sus comparaciones frente a la base inmediata no incluyen ninguno de los cinco archivos canónicos. Pero sus árboles completos no son equivalentes al checkpoint de main. **Prohibido fusionar el stack histórico como sustitución del estado actual.**

## 3. Compatibilidad por componente

### PR #12: evaluación y decisión causal — **portabilidad pendiente**

- `assessNPCDecisions` usa `planNPCAgendas`, `recommendNPCIntentReviews` y `worldRoute`, compara metas y recursos del actor y mantiene el diagnóstico privado; `draftReviewedNPCDecision` requiere evidencia atribuida y revisión editorial para progreso, fracaso o finalización. La existencia de una intención no demuestra ejecución.
- En **main no existe** `tools/living_world_agenda.mjs` ni `tools/living_world_decisions.mjs`. PR #82 sí contiene las dos exportaciones de agenda necesarias, pero **no está integrada** y adapta comprobaciones de fecha `elapsedDays` y pertenencia de compromisos. El módulo de decisiones antiguo debe volver a evaluar sus candidatos con esta agenda moderna en vez de asumir la semántica original de PR #11.
- Revisar la diferencia entre día de inicio y día objetivo, obligaciones vencidas/bloqueadas, ubicaciones admitidas, condiciones de disponibilidad, secretos por actor y ausencia de transacciones automáticas. Probar que una observación falsificada, ajena o sin fuente no habilita cambios.

**Dictamen:** fuente inspeccionada, dependencia identificada, *sin ejecución de la prueba histórica en el checkpoint moderno*. Proponer una adaptación independiente **solo después de resolver/revalidar PR #82**.

### PR #13: encuentro social y relaciones direccionales — **portabilidad pendiente**

- `draftReviewedSocialContact` exige dos NPC existentes, ubicación compartida registrada, observación del turno atribuida y revisada, y efectos diferenciados por actor. `validateSocialResolutionBatch` exige el par de resoluciones; `verifySocialEventHistory` inspecciona los eventos privados y origen de testimonios. Compartir el distrito **no significa** que haya ocurrido una conversación.
- **main no tiene** `tools/living_world_social.mjs`. La PR histórica modifica `living_world_coordinator.mjs` y `turn_engine.mjs`, actualmente diferentes: coordinador main blob `723bc9e2e9b1e905f4f80168ae31394cd3324373` frente al histórico `a2f57640786f62a476b7289b83643364f5bd3f6b`; motor main blob `173e9d0e06ec6a85ea75d46ca39890a04b640b2a` frente al histórico `ce82e0297289dabb61118d59f0ed661f093d0b15`.
- La reimplementación deberá conservar verificación del origen del rumor, perspectivas asimétricas, el orden causal emisor/receptor, privacidad, mutaciones basadas en eventos y validación de replay del motor actual. No copiar esos archivos antiguos completos ni conceder conocimientos automáticamente a Jack.

**Dictamen:** fuente inspeccionada, dependencias y superficies de conflicto identificadas, *sin ejecución de test social contra main*. Mantener la PR histórica en borrador y separada de una futura adaptación.

## 4. Alcance verificable de CI

Los resultados **históricos** citados por las fuentes originales son [CI #43339476274](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43339476274) (PR #12: 208 Node, 24 Python, validador PASS sobre un commit técnico anterior al HEAD actual) y [CI #43341782362](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43341782362) (PR #13: 222 Node, 24 Python, validador PASS sobre commit técnico anterior al HEAD actual). **No son ejecución moderna ni certificación de las PR actuales**. La PR #82 informa de CI propia (432 Node, 47 Python y checkpoint PASS), pero ese resultado no ejercita automáticamente el código antiguo de #12/#13.

Las comprobaciones de este lote consistieron en lecturas del repositorio, SHA de blobs, JSON estructural, comparaciones Git entre bases y HEAD, importaciones, exportaciones y revisión de pruebas antiguas. **No se han corrido Node/Python localmente contra PR #12/#13, ni guardado turno, ni simulación física, ni test de integración cruzada.** Si el CI de *esta PR documental* pasa, certificará sus archivos/documentación y las suites vigentes en la rama de revisión, **no** la funcionalidad de PR #12/#13.

## 5. Siguiente lote recomendado y condiciones de aceptación

1. Resolver primero el contrato de agenda actual (PR #82). Reabrir el origen de las 15 rutinas, compromisos de otros actores, ventanas temporales y no admisión de acciones por simple intención.
2. Adaptar **solo** la evaluación/revisión causal de PR #12 a partir de main actualizado; probar bloqueos, agenda, tiempo, actor, observación auténtica, no mutación, no fuga privada y grafo de 15 ubicaciones. Mantener documentación y código en rama propia.
3. Adaptar las relaciones de PR #13 **después** del módulo causal revisado. Exigir dos efectos actor-owned y correspondencia causal de eventos; demostrar que una co-ubicación sin observación y un secreto no poseído por el emisor se rechazan.
4. Ejecutar suites completas Node/Python, validador, diff exacto de cinco blobs, verificación de index/inventory y CI sobre **el mismo HEAD** antes de plantear integración. Registrar cualquier fallo y repetir. No iniciar turno 10, no tocar journal, no editar canon, no fusionar otros trabajos de agentes.

**Balance del lote:** 2 PR históricas sometidas a auditoría selectiva de compatibilidad; 1 diferencia estructural de checkpoint precisada; 2 componentes pendientes de port; 0 código de producción integrado; 0 archivos narrativos modificados. **El inventario de 108 ramas de PR #83 conserva su propia autoridad y estado.**
