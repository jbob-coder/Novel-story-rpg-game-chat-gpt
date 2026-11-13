# Canonical data records (checkpoint schema v2)

## Source of truth and relationship graph
- `docs/CANON.md`: approved universe rules (not generated outcomes).
- `docs/DECISIONS.md`: signed-off or superseded project decisions.
- `chapters/CH-NNN.events.json`: ordered story events. Event `EV-000001` affects actor IDs and scene/location IDs, and causes state changes.
- `chapters/CH-NNN.md`: readable chapter prose indexed by the same ID.
- `game/STATE.json`: **materialized latest state** after verified events, not a replacement for event history.
- `game/SAVE_MANIFEST.json`: marker of the most recent **coherent saved turn**, written last.
- `docs/HANDOFF.md`: human-readable, lower-trust summary for quick context loading.

## STATE.json fields (required at present)
`schema_version=2`, `game_id`, `chapter{id,status,last_resolved_event_id}`, `time{day,day_zero_event,calendar_date}`, `player{initialized,id,name,location_id,background,progression}`, `world{shockwave_arrived,humans_with_powers_observed,animals_affected,plants_affected,environment_affected,actors,factions,locations}`, `history{last_event_sequence,completed_chapters}`, `pending`, `save{last_verified_turn,notes}`. Keep the existing branch metadata for provenance.

**Legacy schema, read-only since D-036:** `player.progression={attributes:null|object,skills:{},powers:[],lifetime_skill_xp:0,milestones:[]}` persists solely for backward compatibility with earlier checkpoints. Historical 1–5 attributes, skill XP and derived levels have **no active narrative authority**; do not display, calculate or increment them. Learning is expressed in qualitative story events; structural removal requires separately tested migration.

For future actors in `world.actors`, store stable fictional IDs, location, goals, resources, known facts (with source and certainty), relationships, conditions and progression; do not fabricate missing NPC data. Keep **world truth**, **what the player knows**, and **what each NPC knows** separate; rumors must not be promoted to objective facts.

## Event record format (for future player and NPC actions)
Example format — these are placeholder identifiers, not occurred events:

```json
{
  "id": "EV-000001",
  "chapter_id": "CH-000",
  "turn": 1,
  "day": -30,
  "actor_ids": ["PLAYER-001"],
  "kind": "player_action",
  "intent": "<player's actual action>",
  "outcome": "<resolved observed event>",
  "known_to": ["PLAYER-001"],
  "caused_by": [],
  "state_changes": [],
  "progression_awards": []
}
```

Include offscreen independent acts as their own events where relevant. IDs should never be reused. Advance the sequence monotonically across chapter boundaries. Keep the player input distinguishable from narrator resolution. Record temporal, inventory, injury, faction, relationship and knowledge deltas when they materially change.

## Manifest consistency
`game/SAVE_MANIFEST.json` records `chapter_id`, `last_completed_turn`, `last_event_sequence`, `last_event_id`, `state_schema_version`. It is written **last**. Its turn and sequence must match the saved state and reconstructed history. A mismatch means the checkout may be mid-write or corrupt: do not use it as a verified game state. The manifest is a recovery gate, not an authorization mechanism or an atomic database transaction.

## Constraints
Day -30 is the opening. Before Day 0, `shockwave_arrived=false`, `humans_with_powers_observed=false`, and powers remain empty. Never decrement event IDs or a completed turn counter. A missing reference is not evidence a character never existed; investigate event history and earlier snapshots.


## Extended opening character fields (2026-11-09)

The player may have `appearance`, `personality` (including fictional assisted communication, ADHD portrayal), `personal_history`, `motivations`, `finances`, `family_ids`, `other_connections`, `home_location_id`, `workroom_location_id` and `inventory`. Inventory records contain stable item ID, name, physical size, location, carried status and completion state. **A stored home device is not a carried/installed device**. Nothing in this schema authorizes narrating the player's speech. Pre-existing skill XP is a baseline, not a progress event. Values such as exact bank balance or origin are null/unknown until established in play.


## Background and Aster update
Historical fire incident is `player.personal_history.fire_incident` and uses a `BIO-` identifier, not a played `EV-` sequence. `NPC-004` is 17, younger than Jack. `ITEM-ASTER` is `size=mediano`, `functional_state=incompleto`, `spec_ref=game/ASTER_SPEC.md`. All described systems are target specifications, not activated powers. The owner wrote «UMP resistant»; don't equate with EMP without explicit clarification.


## Narrative transcript v1

Each chapter uses `chapters/CH-NNN.transcript.json`, with `schema_version=1`, `chapter_id`, `last_entry_sequence`, and ordered `entries`. Each `TXT-000001` record contains `chapter_id`, `turn`, `role` (`player`/`assistant`), `kind` (`player_action`/`scene`/`resolution`), `text` (original literal full message), and `event_ids` (existing causal events). `scene` entries have a unique `source_key`. The `manifest.last_transcript_sequence`/`last_transcript_id` and `state.history.last_transcript_sequence` must equal the archive's count and latest ID. The opening setup once had turn 0 and an empty archive. At the 2026-11-10 checkpoint, CH-000 has six completed turns and fourteen transcript entries. Always inspect the current manifest. Full-text archiving and turn save must use one Git commit; do not overwrite older entries silently.

## D-036 migration boundary: interactive novel, not RPG

The schema v2 `player.progression` shape and historic event `progression_awards` fields are **read-only legacy compatibility**. They may remain to pass existing validators and reconstruct old saves, but must **never be incremented, used as skill checks or exposed as gameplay** after D-036. Abilities/learning are tracked through factual world events, character notes, inventory, relationships and narrative threads. Any later removal of these schema fields requires a separately tested migration across state, event logs, tools and manifest. Do not rewrite historical events. The authoritative narrator must read `docs/NARRATIVE_CONTRACT.md`.


## D-040 — cambios cualitativos verificables desde el turno 7

La prosa no actualiza automáticamente el estado. Toda modificación material de Jack debe declararse en **turn.changes**; para NPC, en **turn.offscreen[].changes**. Si no hubo cambios materiales, puede ser una lista vacía. Omitir un cambio narrado es un defecto de continuidad que ningún validador puede descubrir solo leyendo datos estructurados.

Cada cambio se registra dentro del evento del actor con su valor anterior comprobable. Campos admitidos:

- **location_id**: before, after y ruta opcional. La ruta solo utiliza lugares conocidos conectados y mueve también los objetos que el actor lleva.
- **inventory_item**: item_id, before y after. Con before=null se incorpora un objeto; con after=null se elimina o cede. Un traspaso entre Jack y un NPC exige un evento de salida y otro de entrada en el mismo turno. Los identificadores de objetos son únicos.
- **relationship**: target_actor_id, before, after. Se modifica solo la perspectiva de quien protagoniza el evento.
- **conditions**: before y after, como listas cualitativas sin duplicados.
- **knowledge**: fact y source; no se admiten conocimientos sin una fuente causal.
- **independent_plan**: before y after, solo para NPC.

El motor sigue admitiendo new_location_id y learned_fact en eventos NPC, pero los traduce al registro común. last_resolved_action también se registra. XP, niveles, rangos y progresión RPG no son mutaciones válidas.

La función verifyStateChanges comprueba la unicidad de objetos, ubicación de objetos portados y concordancia entre los eventos posteriores al turno 6 y el estado final. Se ejecuta desde verifyNarrativeSnapshot junto a las comprobaciones previas. La validación Python existente es estructural y no sustituye esta verificación de Node. Los turnos 1–6 no se reescriben.

**Límite:** la calidad literaria y la correspondencia entre la prosa y los cambios declarados siguen requiriendo revisión editorial. El sistema tampoco resuelve por sí solo el Día 0 o la transición entre capítulos.


## D-047 — recursos cualitativos causales

El campo `resources` se puede actualizar en el evento del propio actor mediante objetos completos `before` y `after`; el motor comprueba precondiciones, valida la secuencia causal y rechaza discrepancias en el estado final. Esto permite registrar, por ejemplo, la resolución del reloj de Rosa sin tratar su reparación como un texto efímero. No afecta atributos RPG ni permite cambiar recursos de otro actor sin su propio evento. El estado de Aster se conserva como modificación del objeto `ITEM-ASTER` mediante `inventory_item`; lo ensamblado no implica funciones operativas no probadas.

## Tiempo y trayectos contextuales (2026-11-13)

El narrador estima el tiempo según acciones, conexiones del mapa, transporte y
circunstancias. No calcular distancias a partir del número de conexiones ni
convertir una estimación en horario exacto. Las ventanas temporales son controles
de compatibilidad: al omitir `next_time_of_day`, el periodo conservado también
debe ser compatible con `elapsed_minutes` y `elapsed_days`.

Todo nuevo cambio `location_id` requiere `travel` con `mode`, `elapsed_minutes`
(entero aproximado no negativo) y `basis` (fundamento contextual). La ruta sigue
conexiones existentes; solo el movimiento directo hogar/taller Wilson puede
redondearse a cero. No se introducen nuevos lugares ni distancias canónicas.

Para la misma ruta ordenada y medio de transporte del mismo actor, consultar
`latestTravelReference` y citar su `reference_event_id` si existe un antecedente
con estimación en un turno anterior. Mantener la duración de referencia salvo
una `variation_reason` explícita. El orden inverso, otro transporte o el viaje
de otro actor no son automáticamente equivalentes. Los viajes históricos sin
estimación permanecen intactos y no reciben duraciones inventadas.

El motor marca eventos nuevos con `travel_policy_version: 1` y conserva
`turn_elapsed_minutes` cuando se suministra. Un turno con desplazamientos exige
ese presupuesto; los viajes sucesivos de cada actor deben caber en él. Los
tiempos de actores distintos pueden transcurrir simultáneamente. El validador
revisa también estas condiciones al releer el checkpoint. Los eventos anteriores
sin marcador ni estimaciones siguen siendo válidos sin migración.

La estimación y su contexto permanecen en el evento del actor, sujetos a sus
límites de conocimiento. La verificación controla coherencia estructural, no
demuestra por sí sola que una estimación sea realista: esa revisión contextual
sigue correspondiendo al narrador antes de guardar.
