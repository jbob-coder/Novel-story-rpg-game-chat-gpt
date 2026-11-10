**D-043 QA GUARD:** La rama `qa/story-save-recovery-d043-20261110` contiene un turno 7 SINTÉTICO/NO CANÓNICO exclusivo de pruebas. NUNCA reanudar la historia desde `qa/*`; la fuente narrativa sigue siendo la rama autorizada `work/chat-narrative-foundation`, cuyo último turno real sigue siendo el 6. Ver `docs/HANDOFF.md`.

**HIGHEST PRIORITY — D-036/D-037/D-038:** Read [docs/NARRATIVE_CONTRACT.md](docs/NARRATIVE_CONTRACT.md), [docs/NARRATIVE_EXECUTION_MODEL.md](docs/NARRATIVE_EXECUTION_MODEL.md) and [game/JACK_HACKER_HISTORY.md](game/JACK_HACKER_HISTORY.md) before any narration. His pre-story hacker experience and 500+ active fictional devices are owner-confirmed; individual earlier operations have not been authored. Do not make him a novice or invent past incidents. Current format is **novela interactiva** (no RPG: no XP, levels, ranks, numeric stat checks, reward screens or fixed choice menus). Historical progression fields are frozen, not gameplay authority. Jack's pre-existing active 500+ network and nine recent Café Bruma additions are owner-confirmed fictional history. Describe cybersecurity only in abstract fictional events/results/consequences, never practical methods. This supersedes older RPG/checkpoint advice below.

# Living Superhuman World — interactive-novel session entry point

**Delivery:** This is a ChatGPT-run **interactive novel, not an RPG** and not a browser game. Player actions are free-form chat messages; the repository stores fictional canon, chapters, events and checkpoints.

## Recovery entry (every new session or after context loss)
1. Confirm repository, branch and PR state. `main` is the approved destination, NOT automatically the latest playable save. The active work branch is `work/chat-narrative-foundation` until changed by an explicit verified decision.
2. Read `game/SAVE_MANIFEST.json` first, then `game/STATE.json`, `docs/CANON.md`, `docs/DECISIONS.md`, **`docs/NARRATIVE_CONTRACT.md`**, `docs/WORLD_BIBLE.md`, `docs/NARRATIVE_STANDARD.md`, `docs/NARRATOR_RULES.md`, `docs/RECOVERY.md`, the current `chapters/CH-NNN.md` and its `.events.json` and its **complete `.transcript.json` archive**. Read `chapters/CH-000.PREP.md` when the opening chapter is active. **Read `game/CHARACTER_JACK.md`, `game/ASTER_SPEC.md` and the updated `game/STARTING_CAST.md` and `game/STARTING_LOCATIONS.md` before speaking for any actor.** Read `docs/HANDOFF.md` for the last checkpoint summary, but verify every important assertion from primary files.
3. Validate references, event sequence, timeline, character records, and manifest against the saved files. If anything conflicts, **stop narration at the last verified checkpoint** and report the inconsistency; do not invent lost turns or overwrite an uncertain save.
4. Identify the player's last resolved action, exact open scene, pending player input, relevant NPC goals and knowledge. Only then resume narration.

## Authority and precedence
Approved owner decisions in CANON/DECISIONS govern world rules; verified event records govern what happened; a consistent checkpoint represents current state; chapter prose provides narrative detail; handoff and chat memory are aids, never proof of repository state. If authoritative sources conflict, preserve both and request correction only when it affects the story.

## Save protocol
For each completed player turn: determine action and in-game elapsed time; resolve relevant NPC and offscreen activity; apply grounded **non-numeric** character/world changes (do not award XP); validate; write event history, chapter and state; require a **verbatim archive** of all player and assistant story messages in `chapters/CH-NNN.transcript.json`; include it in the same atomic commit with events, chapter, state and manifest; fetch all five back before claiming saved. In a non-atomic fallback write the manifest last. The manifest-last procedure is not an atomic multi-file transaction: see `docs/RECOVERY.md`.

Do not add fictional personal data about the user to this public repository. Keep `main` unchanged without explicit merge authorization. Do not merge the older browser prototype as the chat game. No real-time background gameplay is implied between messages.

## Current entry — checkpoint pointer (D-038)

**Always verify the live manifest, state, events and transcript.** At this documentation revision the last completed turn is **6** (CH-000, Day −30, evening; EV-000021; TXT-000014). Jack is **at the Wilson workshop in Railgarden**. Elena, 17, is at the door asking to borrow a USB memory for her school illustration. Rosa is repairing an alarm clock and Aster is unfinished. **Jack has not answered.** Older Crosswater/turn-0 notes are historical, not live instructions.

Jack is 21 and has an established technological background, private resources, a network of more than 500 prior active fictional devices and nine later Café Bruma additions. His phone/collar voices only player-chosen words. Preserve third-person limited narration, NPC autonomy, no RPG and no premature superpowers. Separate literary work, causal continuity, and persistence/delivery under [D-038](docs/NARRATIVE_EXECUTION_MODEL.md).

## HARD STOP ON FAILED SAVE + FOLDER MAP (D-028)

First read [root index](INDEX.md) and [indexed documentation](docs/INDEX.md) for navigation, **without bypassing the manifest-first recovery procedure**. Before any new in-game scene, check the last save is coherent; a failed/pending save BLOCKS all further narration. Use [save gate](docs/SAVE_BLOCKING_PROTOCOL.md) with evidence-based stages 10/25/45/60/75/85/100%; 100% requires verified remote literal readback of five files. If it fails, show `🚩 GUARDADO BLOQUEADO: NN% verificado`, observed cause and next step. Do not narrate another action or scene. When the response budget ends, give only the honest save status; **the next input `CONTINUAR GUARDADO` resumes verification**, not Jack's actions. No background execution; never invent previously unsaved original dialogue. Indices remain navigation-only, current canonical paths unchanged.


## D-030 — estilo y desenlaces basados en decisiones

La presentación vigente es novela interactiva urbana de suspense (escenas sensoriales y diálogo humano, evitando listados técnicos dentro de la escena). El usuario controla a Jack: no elegir sus frases ni acciones. Sin opciones al final salvo solicitud expresa del usuario. Leer `docs/DECISION_OUTCOMES.md` y `state.narrative_threads`; un desenlace solo puede seguir eventos reales, con consecuencias inmediatas y diferidas, y debe persistir junto con texto íntegro. No asignar finales predeterminados a opciones sin seleccionar.


## Literary correction D-032 — higher priority than old narrative templates

The player explicitly said the two played turns sound like event reporting, not narration, and wants the style replaced. **Read `docs/SCENE_CRAFT.md` and run its five-point editorial check before composing/saving the next turn.** No tech-summary narration, repeated negative results, flat NPCs, or option menus. **Don't invent Jack's decisions**. No gameplay advancement from the old document-only commit; its turn-2 Café Bruma checkpoint is historical and **not** a resumption instruction. D-028 saving lock remains mandatory.
