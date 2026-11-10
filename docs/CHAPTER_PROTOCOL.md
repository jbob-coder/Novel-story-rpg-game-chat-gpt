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


## Full narration preservation (owner decision D-027; supersedes summary-only practice)

Every in-story scene, every actual player action and every full narrator response (including dialogues and formatting) must be stored **verbatim** and in order in `chapters/CH-NNN.transcript.json`. The structured `events.json` holds causes and effects, not the literal transcript. An opening scene shown before a player input is archived separately by `stageNarratorScene(...)` with a stable unique key and **does not count as a completed turn**. A real turn requires `turn.player_text` and `turn.narration_messages` (full, exact visible message text, not `intent`/`outcome` summaries); the engine rejects omitted content. The chapter Markdown also receives the full narrator text. Technical planning conversations do not belong in the fictional transcript.

A completed turn must stage and atomically commit **five artifacts** together: transcript, events, chapter prose, state, and save manifest. Read all five back by commit SHA and check literal text and counters before saying the narration is saved. If GitHub is unavailable, label the scene **not saved**, do not silently truncate, and do not simulate recovery of lost words. `docs/FULL_NARRATION_ARCHIVE.md` contains detailed instructions. Earlier four-file language is outdated.


## Save-lock override (D-028)

The assistant must not narrate additional consequences or a next scene after a failed/pending save. The `tools/save_gate.mjs` library models seven ordered evidence-backed stages and rejects declaring 100% before remote read-back of all five required files. Use `docs/SAVE_BLOCKING_PROTOCOL.md`; an explicit save-progress message may consume the whole response. Continue verification on the **next user input**, not in the background. The previous non-atomic manifest-last procedure is a fallback to inspect/recover, never permission to proceed without verified atomic five-file state. Root and section indexes are navigation only.


## Hilos y desenlaces vinculados a decisiones

Antes de confirmar cada turno, evaluar `turn.consequence_updates` contra eventos realmente producidos por ese mismo turno. Registrar asuntos abiertos con `THREAD-`, desarrollarlos con eventos posteriores, resolverlos con un evento comprobado; nunca inventar resoluciones por simple intención, opción sugerida o salto de tiempo. El evento sustenta el resultado, el hilo registra la continuidad y la transcripción contiene el texto narrativo íntegro. Véase `docs/DECISION_OUTCOMES.md`.


## Explicit revision exception (D-033)

The default transcript is append-only. **Only an owner's clear instruction to revisit a played outcome** authorizes replacing the active message of the latest turn. Prior wording and events must be copied intact into `chapters/revisions/REV-...` with parent commit evidence, references, and reason. The amended event/state/narration checkpoint is committed atomically and read back, with no extra player-action turn or XP. The owner used this exception for CH-000 turn 2. See `docs/STORY_REVISIONS.md`.
