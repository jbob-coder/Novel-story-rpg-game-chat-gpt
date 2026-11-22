# Lote 10 — cronología de testimonios NPC y persistencia entre capítulos

**Fecha:** 2026-11-22. **Repositorio:** `jbob-coder/Novel-story-rpg-game-chat-gpt`.
**Rama de desarrollo:** `work/npc-social-provenance-chapter-20261122`.
**Base fijada:** [PR #108](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/108) @ `bf2edd9c6e86240c2ef81a4c43d11e4fad49f1c7`, a su vez dependiente de [PR #98](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/98) y [PR #82](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/82). **Todas las PR siguen aisladas y no se deben fusionar individualmente a main**.

## Problema original verificado

`verifySocialEventHistory(snapshot)` revisaba pares sociales, testimonios, destinatarios y eventos de `allEvents(snapshot)` de capítulos abiertos/cerrados, pero **no comprobaba que el emisor hubiese adquirido el texto comunicado antes del intercambio**. Una partida hipotética alterada podría presentar una afirmación aprendida después como si ya se hubiera conocido en el encuentro anterior.

La comprobación al *crear* el encuentro `draftReviewedSocialContact` sí exigía que el texto figurase en el conocimiento actual del emisor; el problema era de **recuperación histórica y revalidación temporal**, no de falta de validación editorial inicial.

## Adaptación mínima y verificable

`tools/living_world_social.mjs` añade `verifySocialKnowledgeChronology`, un verificador interno de **solo lectura** llamado desde la revalidación de historial social. Revisa `allEvents(snapshot)` en orden cronológico y reconstruye la información que cada NPC podía conocer:

1. Distingue el conocimiento actual de los hechos añadidos mediante `state_changes` con `field=knowledge` y `after` materializado. Recompone los añadidos a partir de `fact`, `source` y el `EV-` del propio evento. El conocimiento final **no basta** como prueba de conocimiento anterior.
2. Parte de las entradas previas que no tienen una nueva adquisición respaldada por el historial y va incorporando los `after` a medida que ocurren eventos. Antes de un intercambio exige que `transfer.known_entry` pertenezca al conjunto temporal del **emisor específico**. Una noticia obtenida después no puede retroceder en el tiempo.
3. Los testimonios retransmitidos siguen siendo informes **atribuidos y no verificados independientemente**, no verdades objetivas. Las relaciones continúan siendo direccionales y los cambios pertenecen al actor de su evento.
4. Solo se invoca si existe un contexto social; la partida sin encuentros sociales sigue utilizando la validación de capítulo/cambios ya presente. No altera `STATE.json`, las reglas de narración, los recursos ni el journal.

**Compatibilidad deliberada:** algunos eventos del checkpoint anterior al turno 7 incluyen cambios históricos de conocimiento **sin** el campo `after` moderno. No es seguro reconstruir su orden exacto a partir de estos datos. Esos hechos quedan dentro del conocimiento heredado, sin declarar falsa certificación retroactiva. Los eventos modernos materializados sí se comprueban secuencialmente. Para una garantía más fuerte frente a ataques que reescriban tanto el estado final como el historial, se necesitaría una raíz de partida inicial sellada / prueba independiente de la adquisición original. La inmutabilidad de archivos cerrados sigue a cargo de `verifyChapterHistory`.

## Regresiones sintéticas añadidas

`tests/npc_social_cross_chapter_provenance.test.mjs` tiene seis casos nuevos, sin actividad de jugador ni guardado remoto:

- Un testimonio aprendido mediante encuentro en CH-000 puede retransmitirse por su nuevo propietario en **CH-001**, preservando el vínculo causal y la procedencia de ambos eventos.
- Un relato adquirido **después** de un intercambio no puede presentarse como su fuente previa, aunque figure en la memoria final del NPC.
- La modificación de información social en un capítulo cerrado se rechaza tanto por el verificador social como por la custodia de hashes del archivo.
- Reutilizar el mismo ID de encuentro en distintos capítulos no puede duplicar su identidad ni colapsar dos parejas en un solo contacto.
- Un turno posterior sin encuentro conserva las trazas privadas históricas sin generar una conversación nueva.
- Un texto de conocimiento que falsifique el identificador EV de su adquisición se rechaza durante la recuperación social.

**Separación de autoridad:** todos los turnos CH-001, CH-000 turno 10 y cualquier `EV-` adicional de la suite son **solo objetos en memoria**; los archivos `game/STATE.json`, `game/SAVE_MANIFEST.json`, `chapters/CH-000.*` y el journal real no se han modificado.

## QA y siguientes riesgos

Requerido antes de considerar la rama lista para revisión: comparar los cinco SHA de blob canónicos con `main`/PR #108, inventariar exhaustivamente el nuevo árbol, ejecutar toda la suite JavaScript, Python y `tools/validate_state.py` sobre el HEAD exacto; registrar CI real y fallos en la descripción de la PR. Si hace falta un workflow, usar una PR QA-only clonada del mismo commit, cerrarla **sin fusionar** después de verificar.

**Siguiente tarea recomendada:** endurecer la reconciliación de la primera adquisición de conocimiento con un origen del checkpoint sellado, sin inferir automáticamente secretos ni modificar registros legacy sin pruebas de migración. Evaluar también interacciones sociales con testigos y cambios de ubicación durante el intervalo solo mediante eventos explícitos, no por proximidad casual.
