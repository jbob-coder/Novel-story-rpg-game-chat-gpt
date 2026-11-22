# Lote 13 — Admisión causal y verificable de un NPC nuevo

**Fecha:** 2026-11-22. **Repositorio:** `jbob-coder/Novel-story-rpg-game-chat-gpt`. **Base fija:** [PR #138](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/138), HEAD `e9ff3c7496495c77e338654ed9045fa3d66aac64`, dependiente de PR #127, #118, #108, #98, #82. **Integración propuesta únicamente en rama independiente** `work/npc-actor-introduction-events-20261122`.

## Problema comprobado

Los módulos modernos permitían resolver acciones y recuerdos para los siete NPC actuales, pero cualquier actor adicional carecía de mecanismo para crear **un evento inicial con identidad y evidencia**. El ancla de conocimientos del turno 9 rechaza correctamente los actores sin causa; eliminar la comprobación permitiría fabricar NPC y recuerdos en el estado final.

El Lote 13 incorpora un mecanismo mínimo que **no presupone que Jack conoce, ha visto o ha hablado con el NPC**. Se admiten identidades privadas según revisión editorial de una observación directa de un testigo ya registrado y presente en el mismo lugar. No hay procesos en segundo plano, NPC decorativos automáticos ni aparición sin registro.

## Nuevo contrato: `tools/living_world_npc_introduction.mjs`

Tres funciones, separadas de la escritura remota:

- `draftReviewedNPCIntroduction({state,actor,observation,initialKnowledge,reviewed,outcome})`: propuesta **pura**, para el siguiente ID libre secuencial (p. ej., `NPC-008`), ocho campos de identidad (`id`, nombre, edad, oficio, localización, objetivo, plan, descripción). Se exige ubicación admitida, edad válida, testigo existente **co-localizado**, atribución y evidencia actual revisadas, y un resultado privado. El perfil inicial evita poderes, XP, relaciones, condiciones, recursos o secretos inventados: sus campos técnicos tienen valores vacíos y explícitos.
- `stageReviewedNPCIntroduction({state,event,proposal})`: revisa de nuevo la propuesta completa antes de alterar exclusivamente el **snapshot candidato en memoria**. Almacena `npc_introduction` como el primer cambio del evento privado dedicado `kind:npc_introduction`, `actor_ids:[NPC-ID]`, `known_to:[NPC-ID]`. El evento conserva `before:null`, perfil inicial inmutable y observación del testigo. Los hasta tres conocimientos iniciales se escriben como **cambios `knowledge` del mismo evento y propietario**, cada uno con fuente e identificador `EV-` explícitos, mediante `applyStateChanges`.
- `verifyNPCIntroductionHistory(snapshot)`: reconstruye **todas** las incorporaciones del historial global `allEvents`, incluidos archivos cerrados. Exige ID secuencial y único, evento posterior al límite sellado `EV-000029`, revisión y testigo co-localizado en el momento registrado (incluso si viaja después), turno que incluye una acción del jugador, privacidad, perfil inicial estable, conocimientos correspondientes a ese evento y registro final de actores **exactamente igual a los siete originales más las admisiones documentadas**. Rechaza eliminación o inserción sin evento.

**Temporalidad del testigo:** la validación de recuperación examina los eventos de viaje del observador para reconstruir su localización **antes** de cada admisión, en lugar de usar su ubicación final y asumir que nunca viajó.

## Puntos de integración revisados

- `tools/turn_engine.mjs`: acepta `turn.npc_introductions` con **máximo una** propuesta por turno revisado, crea un evento privado después del acto del jugador y antes de las resoluciones offscreen, registra la evidencia y prohíbe trasladar literalmente resultados y hechos privados a la narración. La verificación de snapshots invoca la custodia histórica de actores y la reconciliación de sus conocimientos.
- `tools/living_world_coordinator.mjs`: añade el desplazamiento del ID `EV-` de los actos de otros NPC cuando se introduce un actor. Los actores preexistentes siguen pudiendo actuar con sus propios eventos y el orden es estable.
- `tools/state_changes.mjs`: permite `npc_introduction` en la lista de efectos históricos **solo** para derivarlo a la comprobación estricta de creación. No habilita el campo en `applyStateChanges` arbitrario ni autoriza a un NPC a crear otro por cambios genéricos.
- `tools/living_world_social.mjs`: la memoria sellada acepta nuevos actores **solo** si poseen evento de incorporación verificado; inicia su conocimiento en vacío y reproduce exclusivamente las adquisiciones `knowledge` respaldadas por eventos. El nuevo NPC puede posteriormente participar en un encuentro social atribuido, sin compartir información automáticamente con Jack.

## Pruebas y custodia

`tests/npc_actor_introduction_admitted.test.mjs` contiene **17 escenarios sintéticos**: no modificación de propuesta, nacimiento de identidad en un evento, secuencia de dos admisiones, compatibilidad con otras acciones del mundo, identidad duplicada, edad/ubicación/testigo inválido, fuente y límite de conocimientos, perfil adulterado, actor sin evento, recuperación adulterada, persistencia en capítulo cerrado, recorrido temporal de testigo tras su viaje, identidad inmutable, testimonio social en turno posterior, no divulgación al jugador, límite de una admisión y compatibilidad del turno 9. La historia del propietario **no** se desarrolla durante estas pruebas.

No se cambian `game/STATE.json`, `game/SAVE_MANIFEST.json`, `chapters/CH-000.*`, el journal ni el motor de guardado GitHub; no se crean NPC en el canon durante este lote. Solo un turno auténtico resuelto y guardado con journal, commit atómico y readback podría materializar una admisión después de la revisión correspondiente.

## Límites y siguiente fase

El contrato es conservador: **solo una admisión por turno**, testigo directo, ID numérico secuencial; no se permite introducir memorias históricas sin eventos ni poner poderes, inventarios o vínculos iniciales arbitrarios. Esta operación es la **admisión de identidad a la simulación**, no un nacimiento biológico ni una declaración de que el personaje surgió físicamente de la nada. El evento indica el momento en que se registró su presencia en el mundo conocido.

La migración de la referencia original del Lote 12 **permanece separada y bloqueada** para `register_npc`. Aceptar el evento de creación en la simulación no autoriza promover un nuevo checkpoint de referencia; ese trabajo requerirá verificar independientemente el árbol remoto, la procedencia y aprobación del propietario.

**QA requerida:** ejecutar Node, Python, `tools/validate_state.py` en GitHub Actions sobre el HEAD exacto, inventariar el árbol, comprobar los hashes canónicos y mantener la PR de desarrollo apilada sobre #138. Una PR QA-only temporal contra `main` debe cerrarse sin fusionar.

## QA inicial: hallazgo y corrección de contrato

La primera ejecución de CI [#45084263570](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45084263570) terminó con **512/513 JavaScript PASS** y una prueba heredada del Lote 12 fallida, por lo que no llegó a Python ni al validador. Las **15 pruebas iniciales de Lote 13 pasaron**. La prueba antigua esperaba una respuesta de migración `status=blocked` para un actor añadido sin evento, pero el validador de snapshot ahora **rechaza antes** el estado fraudulento con `NPC actor roster has unsourced additions or removals`. Se actualizó **solo la expectativa del test heredado en esta rama** para exigir el rechazo estricto; el código de validación no se relajó. Se añadieron además dos regresiones de ubicación del testigo tras viaje y estabilidad de nombre/objetivo, quedando **17 pruebas nuevas**. La ejecución inicial no certifica el HEAD corregido; hay que repetir CI.
