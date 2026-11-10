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

`player.progression={attributes:null|object,skills:{},powers:[],lifetime_skill_xp:0,milestones:[]}`. Before the player is created, attributes and identifiers remain null, skills and powers empty, XP zero. Once initialized, attribute IDs must be stable and values 1–5. A skill entry is `{xp: integer>=0, last_progress_event_id: null|string}`. Skill ranks and general level are **derived**, not stored.

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

Each chapter uses `chapters/CH-NNN.transcript.json`, with `schema_version=1`, `chapter_id`, `last_entry_sequence`, and ordered `entries`. Each `TXT-000001` record contains `chapter_id`, `turn`, `role` (`player`/`assistant`), `kind` (`player_action`/`scene`/`resolution`), `text` (original literal full message), and `event_ids` (existing causal events). `scene` entries have a unique `source_key`. The `manifest.last_transcript_sequence`/`last_transcript_id` and `state.history.last_transcript_sequence` must equal the archive's count and latest ID. Existing state is turn 0 with an empty archive. Full-text archiving and turn save must use one Git commit; do not overwrite older entries silently.

## D-036 migration boundary: interactive novel, not RPG

The schema v2 `player.progression` shape and historic event `progression_awards` fields are **read-only legacy compatibility**. They may remain to pass existing validators and reconstruct old saves, but must **never be incremented, used as skill checks or exposed as gameplay** after D-036. Abilities/learning are tracked through factual world events, character notes, inventory, relationships and narrative threads. Any later removal of these schema fields requires a separately tested migration across state, event logs, tools and manifest. Do not rewrite historical events. The authoritative narrator must read `docs/NARRATIVE_CONTRACT.md`.
