# Chapters, events and durable save protocol

This is a ChatGPT-narrated interactive novel (no RPG mechanics). **GitHub files are game data, not a downloadable player interface.** Read `AGENTS.md` before each fresh session.

## Authoritative records
- `docs/CANON.md`: owner-approved world rules; `docs/DECISIONS.md`: approvals and superseded designs.
- `docs/NARRATIVE_CONTRACT.md`: current novel narration, non-RPG consequences and fictional cybersecurity rules.
- `game/STATE.json`: current materialized world state; old numeric fields are archival only.
- `chapters/CH-NNN.md`: prose, setting, key events, active threads.
- `chapters/CH-NNN.events.json`: numbered causal events (historic `progression_awards` arrays may persist empty for compatibility).
- `game/SAVE_MANIFEST.json`: **last written completion marker** identifying the coherent turn, event and chapter.
- `docs/HANDOFF.md`: orientation only, lower authority than event history or saved state.

## Story turn protocol (D-038: separate writing, resolution, save and delivery)
1. Verify the latest manifest, state, full transcript and event sequence at the working branch HEAD. Determine the *real* open scene; historical notes do not override it.
2. Receive the player's **free-form action**. Do not decide Jack's words, movements, thoughts or feelings.
3. Resolve only the chosen act and causally relevant NPC/offscreen changes in fictional time. Record knowledge, consequences, resources and meaningful relationships qualitatively: no XP or RPG stats. Material effects must be declared in `turn.changes` or `turn.offscreen[].changes` with preconditions (D-040, `docs/STATE_SCHEMA.md`), and match the event log and saved state.
4. **Compose and edit the complete visible scene** before writing: natural pacing and dialog, third-person limited, agency, continuity, no obligatory dramatic hinge. The literary gate and the schema validator are separate.
5. Stage all **five** pieces together: chapter transcript containing exact user/narrator text, event log, chapter prose, state and manifest. Validate consistency and exact wording.
6. Make an atomic Git tree/commit on the authorized branch with a checked HEAD; read back the five files by committed SHA. Never call an incomplete write a completed save. D-028 blocks play on an unverified save.
7. **Deliver the exact verified text to the reader.** A GitHub readback confirms persistence only, not the UI display. If delivery is interrupted, recover the already saved text verbatim; do not resolve a duplicate turn. Do not require ritual acknowledgment from the reader.
8. Record a concise handoff after confirmation. This handoff is not more authoritative than the actual manifest/events/transcript.

See [NARRATIVE_EXECUTION_MODEL.md](NARRATIVE_EXECUTION_MODEL.md) for the operational and editorial rationale. Individual Contents API commits followed by manifest-last are a *recovery fallback* and do not establish an atomic save. Documentation maintenance does not advance the story.

## Chapter boundaries
Chapters are meaningful story arcs, not one day apiece. Preserve chronology, capabilities, inventory, relationships, secrets, NPC objectives and events across transitions. New chapter records must have stable IDs. Do not retcon past resolved events without explicitly recording a correction and reason.

### Synthetic chapter/plan pilot (2026-11-14)

`stageChapterTransition` closes a played chapter only after an explicit reviewed
reason and a prepared next-chapter planning record. It does not advance time,
consume a player turn, author a scene or resolve any open situation. A calendar
boundary or Day 0 does not call this operation automatically.

The planning record describes identity/title, source commit, purpose, current
time and constraints, existing location/NPC/thread/hidden-plan references,
conditional possibilities and exit conditions. It is preparation, stored in
`state.chapter.planning`, not played history or a script for Jack. This keeps
it in the same five-file transaction rather than adding an independently saved
authority. `CH-000.PREP.md` remains historical preparation; its old opening
instructions do not replace the live checkpoint or current contract.

Closed chapters keep their three original files byte-for-byte. Their descriptors
in `state.history.completed_chapters` record global turn/event/transcript bounds,
SHA-256 file hashes, closure reason and source commit. The next chapter starts
with empty prose/events/transcript; global turn, EV and TXT counters continue.
The transcript's `last_entry_sequence` is a global cursor even when its local
entries are empty. Runtime snapshots attach `archives` for closed chapters;
these are loaded from their original files and are not copied into the new
chapter's files.

`saveChapterTransition` requires a durable journal and verifies that destination
chapter files do not already exist. It commits exactly the destination chapter's
three files plus state and manifest, and reads back the complete history from
the same commit. An interrupted transition recovers the same commit; its
`narration_messages` is empty because the transition produces no scene. The
next authentic action is still required to play a turn.

The pilot is exercised only in memory/temporary test directories. No real CH-001
or new planning record has been added to the story. Chapter folder indexes are
navigation aids, not transaction authority; update them separately after a real
verified transition, never use an index as proof that a chapter was saved.

During a played scene, continue ordinary reactions needed to resolve the user's
existing intention. Pause when Jack must make a meaningful new choice. This
does not authorize inventing his dialogue, purchases or commitments. PR #18's
broader narrative proposal remains separate and unmerged.

## Minimum invariants
- Opening is Day -30. Day 0 is the cosmic shockwave; no powers or ecological anomalies established from the wave may appear earlier.
- Event IDs do not repeat, gameplay turn numbers never go backwards, and a checkpoint cannot claim events absent from its logs.
- No character knows an event merely because the narrator knows it.
- Do not award, calculate or use RPG XP/levels/ranks. Preserve legacy values frozen; learning, powers and limitations unfold through documented narrative events.
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

The default transcript is append-only. **Only an owner's clear instruction to revisit a played outcome** authorizes replacing the active message of the latest turn. Prior wording and events must be copied intact into `chapters/revisions/REV-...` with parent commit evidence, references, and reason. The amended event/state/narration checkpoint is committed atomically and read back, with no extra player-action turn. The owner used this exception for CH-000 turn 2. See `docs/STORY_REVISIONS.md`.


**D-042:** Para ensayos sin actividad narrativa real, usar el adaptador simulado y la transacción de cinco archivos en `tools/save_transaction.mjs`; ejecutar `tests/save_transaction.test.mjs`. Nunca sustituir el commit remoto real o la lectura verificable por una simulación.


**D-043:** El adaptador REST en `tools/github_save_adapter.mjs` permite completar las operaciones del módulo transaccional con un token suministrado externamente (nunca incluir credenciales en los archivos). La prueba GitHub sobre `qa/story-save-recovery-d043-20261110` verificó cinco archivos y recuperación tras commit interrumpido; su turno 7 es ficticio y NO CANÓNICO. La rama de novela sigue en turno 6.

## D-049: separación del capítulo visible y los eventos privados
A partir de los siguientes turnos, el motor conserva el resultado completo de los actos de NPC en `*.events.json` y el estado causal pero **no** añade automáticamente ese resultado al Markdown del capítulo. El capítulo y la transcripción íntegra deben contener únicamente la escena que Jack puede percibir o saber justificadamente. Los eventos offscreen solo entran en el relato público cuando se produce una revelación causal explícita. El histórico se preserva literalmente y puede necesitar revisión de spoilers antes de compartir capítulos antiguos enteros. Regresión: `tests/turn_engine.test.mjs` y `tests/living_world_coordinator.test.mjs`; QA GitHub Actions `42953180071`.
