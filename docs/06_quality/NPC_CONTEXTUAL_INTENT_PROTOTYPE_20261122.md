# Contextual NPC intent prototype — isolated QA, not game canon

This isolated experiment adds an **open-language, source-bounded intention preview** alongside the existing `recommendNPCIntentReviews` / `assessNPCDecisions` path. It does not replace the coordinator, create story events or choose NPC outcomes automatically.

**Baseline comparator:** Current deterministic recommendation prioritizes recorded obligations, then first applicable role routine. It is useful for plausible everyday life, but it does not itself enumerate entirely new authored intentions.

**Prototype difference:** `inspectNPCContextualChoices` returns each existing actor's personal goal, plan, needs, known events, literal memory, resources, relationships and commitments, without an action menu. `reviewNPCFreeformIntent` accepts a new free-text intention, checks actor-owned event references and graph reachability, rejects stale evidence, and returns an unresolved private proposal. No direct contacts, deliveries, truth, access, time passage or success are inferred.

**QA scenarios:** comparative alternative intentions; actor-specific private knowledge; known event citation; unknown/future event rejection; graph-only potential travel; tampered and stale packet rejection; fourteen hypothetical day observations without autonomous time ticks or canonical changes.

**What this does NOT prove:** convincing long-horizon agent initiative, unattended simulation, verified semantic fidelity of natural-language reasoning, independent generation of intention text, real NPC success, or integration into player-turn save. The prose and reasoning still require an editorial agent; they are not produced by a deterministic action planner.

**Next recommended experiment:** With an explicitly cloned, synthetic checkpoint, stage reviewed actor events and measure whether selecting from context yields better continuity than the existing priority selector across multiple turns. Require provenance and no invented physical access. Do not advance real CH-000 turn 9.

**Protected scope:** A new tool module and test plus documentation/index/inventory entries only. No changes to game/, chapters/, existing NPC code, main, or world canon.

## Evento compartido no equivale a conocer el resultado privado (QA, 2026-11-24)

La vista `knownEvents` para generar intenciones debe separar dos cosas:
una referencia `known_to` al evento y la evidencia del **contenido** que
realmente conoce cada actor. El hecho de figurar en `known_to` no certifica
que un NPC recibió el texto íntegro de `intent` o `outcome` de otra persona.

- Los eventos **del propio actor** conservan su `intent`/`outcome` literal y
  `contentScope:'actor_owned_event'`. Esto preserva su memoria de las
  decisiones personales ya guardadas.
- Los eventos **de otro actor** se mantienen como referencia histórica
  con `contentScope:'reference_only_not_full_event_knowledge'`, sin
  `intent` ni `outcome` completos. El narrador puede consultar las
  observaciones y declaraciones guardadas en `actor.knowledge` y sus
  pruebas de transmisión para saber qué fragmento recibió realmente.
- El alcance se conserva dentro de `prepareNPCIntentionRequests`, que no
  debe transmitir el desenlace privado de Elena a Rosa solo porque un evento
  liste a Rosa en `known_to`.

Las regresiones usan los registros **históricos reales** EV-000025 de Elena
y su inclusión de Rosa en `known_to`, sin modificar el guardado. Ninguna
prueba supone que los pensamientos internos de Elena se convirtieron en
conocimiento de Rosa. La selección de intenciones sigue abierta: un NPC
puede actuar, cambiar de prioridad o abstenerse, pero los hechos privados
de otra persona requieren una fuente propia y un juicio causal.

**Límite:** esto evita la exposición **literal** del campo de resultado
ajeno dentro de los contextos generativos. No es un detector de paráfrasis,
verificador de veracidad, ni ejecución autónoma. Las decisiones requieren
revisión editorial y guardado del turno jugador antes de ser canon.
