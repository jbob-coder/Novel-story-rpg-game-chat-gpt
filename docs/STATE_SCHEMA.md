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
