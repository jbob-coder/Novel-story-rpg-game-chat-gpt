# Chapters, events and durable save protocol

This is a ChatGPT-narrated interactive RPG. **GitHub files are game data, not a downloadable player interface.** Read `AGENTS.md` before each fresh session.

## Authoritative records
- `docs/CANON.md`: owner-approved world rules; `docs/DECISIONS.md`: approvals and superseded designs.
- `docs/PROGRESSION.md`: proposed skills, attributes, advancement and powers rules.
- `game/STATE.json`: current materialized world state and skill progress.
- `chapters/CH-NNN.md`: prose, setting, key events, active threads.
- `chapters/CH-NNN.events.json`: numbered causal events and progression awards.
- `game/SAVE_MANIFEST.json`: **last written completion marker** identifying the coherent turn, event and chapter.
- `docs/HANDOFF.md`: orientation only, lower authority than event history or saved state.

## Story turn protocol
1. Read and validate latest manifest/checkpoint; locate chapter and player pending input.
2. Narrate the current scene, receive the player's free-form input and resolve it without replacing their choice.
3. Let relevant NPCs and factions pursue independent goals as in-fiction time passes. Track what each actor actually knows and record significant offscreen outcomes separately.
4. Compute concrete changes to location/time, resources, injury, relationships, actor knowledge, chapter threads and skills/XP using `docs/PROGRESSION.md`.
5. Create one or more monotonically increasing event IDs (e.g. `EV-000001`), with chapter, turn, in-world day, actor IDs, kind, original intent (if player), outcome, known-to, causal predecessors, explicit state_changes, progression_awards.
6. Save event log and chapter, then state. Validate they match (see `docs/STATE_SCHEMA.md`); update the manifest **last** and fetch it back. Mark the turn saved only after all artifacts agree.
7. Update concise handoff information with confirmed turn/event, unresolved threads and next scene. If it fails, do not invalidate an otherwise verified manifest; mark handoff stale and reconstruct later.

**Multi-file GitHub writes are not atomic.** On interruption, see `docs/RECOVERY.md`. A mismatching manifest/state/events combination is **not** a completed turn; recover from last known coherent commit rather than guessing or duplicating events.

## Chapter boundaries
Chapters are meaningful story arcs, not one day apiece. Preserve chronology, capabilities, inventory, relationships, secrets, NPC objectives and events across transitions. New chapter records must have stable IDs. Do not retcon past resolved events without explicitly recording a correction and reason.

## Minimum invariants
- Opening is Day -30. Day 0 is the cosmic shockwave; no powers or ecological anomalies established from the wave may appear earlier.
- Event IDs do not repeat, gameplay turn numbers never go backwards, and a checkpoint cannot claim events absent from its logs.
- No character knows an event merely because the narrator knows it.
- No skill ranks/XP are arbitrarily rewritten or granted without causal recorded evidence; powers and ordinary skills stay separate.
- All story/player data committed to public GitHub must be intended fictional data.


### Atomic commit option (preferred)

The order described above is the fallback for individual file writes. Where available, prepare event log + prose + state + manifest together as a single tree/commit and move the working branch with an expected-head lease. This avoids observable mid-turn files; validate the staged contents and read back the completed commit. The setup checkpoint may update character/place metadata while retaining turn 0 and an empty event log: setup is **not** a played action.
