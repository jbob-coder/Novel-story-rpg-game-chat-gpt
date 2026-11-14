**D-053 (2026-11-12):** Temporal-policy guard strengthened after discovering that Day -29 morning -> Day -28 morning in 20 minutes was previously accepted. `tools/living_world_time.mjs` now checks that a starting coarse period, elapsed minutes, day delta, and optional destination period can coexist. A 20-minute midnight crossing requires a compatible late-night starting period, not morning. Official isolated QA [run #43321955437](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43321955437) **175/175 Node, 24/24 Python, checkpoint validator PASS**. Coarse period windows are model guards, **NOT fictional clock timestamps or confirmed opening hours**. Five story files remain unchanged. See `docs/LIVING_WORLD_TIME_WINDOW_QA_20261112.md`.

**D-052 (2026-11-12):** Living World reliability modules are in the narrative branch after QA. Official isolated CI run **43320823776**: 173/173 Node, 24/24 Python, checkpoint validator PASS; three-turn synthetic integration PASS. This is **NOT** a real turn and NOT background activity. The narrator remains ChatGPT. The next authentic player turn is CH-000 turn 10 **only upon user action**. Canonical `saveLivingWorldTurn` now **requires** a separate durable journal adapter; reserved branch: `journal/living-world-save-attempts`. A scoped token/runtime journal connection is **not established by a repo commit**. If unavailable, stop rather than bypass the guard. Before any new action, inspect journal for blocked attempts; recover exactly the original verified five-file commit. Do not use any QA turn as canon. See `docs/LIVING_WORLD_RELIABILITY_IMPLEMENTATION_20261112.md`.

**D-043 QA GUARD:** La rama `qa/story-save-recovery-d043-20261110` contiene un turno 7 SINTÉTICO/NO CANÓNICO exclusivo de pruebas. NUNCA reanudar la historia desde `qa/*`; la fuente narrativa sigue siendo la rama autorizada `work/chat-narrative-foundation`, cuyo último turno real es ahora el 9 (Día -29, mañana; EV-000029, TXT-000020). La rama QA conserva un turno 7 sintético anterior NO CANÓNICO. Ver `docs/HANDOFF.md`.

**HIGHEST PRIORITY — D-036/D-037/D-038:** Read [docs/NARRATIVE_CONTRACT.md](docs/NARRATIVE_CONTRACT.md), [docs/NARRATIVE_EXECUTION_MODEL.md](docs/NARRATIVE_EXECUTION_MODEL.md) and [game/JACK_HACKER_HISTORY.md](game/JACK_HACKER_HISTORY.md) before any narration. His pre-story hacker experience and 500+ active fictional devices are owner-confirmed; individual earlier operations have not been authored. Do not make him a novice or invent past incidents. Current format is **novela interactiva** (no RPG: no XP, levels, ranks, numeric stat checks, reward screens or fixed choice menus). Historical progression fields are frozen, not gameplay authority. Jack's pre-existing active 500+ network and nine recent Café Bruma additions are owner-confirmed fictional history. Describe cybersecurity only in abstract fictional events/results/consequences, never practical methods. This supersedes older RPG/checkpoint advice below.

# Living Superhuman World — interactive-novel session entry point

## Conditional-plan and chapter pilot (2026-11-14)

This development checkout supports reviewed metadata-only chapter transitions,
global EV/TXT history and optional event-backed NPC plans/obligations. Follow
[chapter management](docs/CHAPTER_PROTOCOL.md), [plan/state schema](docs/STATE_SCHEMA.md)
and [recovery](docs/RECOVERY.md). Plans are public files but narrator-private
within the fiction; evaluate them only over authorized fictional intervals and
persist reviewed observations with actual events. Dates do not force outcomes.
Load closed chapter history as well as the active five files. The synthetic
pilot does not establish any plan for Rosa, close CH-000 or play a real turn.
PR #24 and this dependent work remain review branches until explicitly integrated.

## Recovery and contextual-time implementation (2026-11-13)

This checkout adds literal recovery from an already verified save journal and
contextual travel validation. See [recovery](docs/RECOVERY.md) and
[time/travel schema](docs/STATE_SCHEMA.md). Recover saved narration without
regenerating it; new travel records need an approximate duration, context and
any comparable prior-event reference. Do not infer distances from graph hops.
Report evidence-backed progress outside the novel as specified in
[the execution model](docs/NARRATIVE_EXECUTION_MODEL.md). These development
changes do not play a turn, activate an unattended simulator or authorize a
merge. The live manifest remains the narrative checkpoint authority.

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

## Current entry — checkpoint pointer (D-047; supersedes D-046)

**Always verify the live manifest, state, events and verbatim transcript.** Latest real turn: **9**, CH-000, Day **−29**, morning, EV-000029, TXT-000020. Jack handed Elena her schoolbag with the already borrowed USB; Elena has left the apartment for Railgarden en route to school (school arrival not yet established). Rosa's neighbor's clock was fixed by adjusting the cover tab that pressed its time-setting control, and repeated closure tests no longer advance the clock; she plans to return it to the owner. Jack is now in **LOC-WILSON-WORKSHOP** beside Aster. Its **first arm is mechanically mounted**, shoulder/elbow moved successfully by hand, actuators remain disconnected, and the robot is **nonoperational**. Do not infer autonomous movement, flight, combat or other planned features. No Day 0 powers. **Wait for the owner's next free-form action for turn 10.** Never use the synthetic QA branch as canon.

## HARD STOP ON FAILED SAVE + FOLDER MAP (D-028)

First read [root index](INDEX.md) and [indexed documentation](docs/INDEX.md) for navigation, **without bypassing the manifest-first recovery procedure**. Before any new in-game scene, check the last save is coherent; a failed/pending save BLOCKS all further narration. Use [save gate](docs/SAVE_BLOCKING_PROTOCOL.md) with evidence-based stages 10/25/45/60/75/85/100%; 100% requires verified remote literal readback of five files. If it fails, show `🚩 GUARDADO BLOQUEADO: NN% verificado`, observed cause and next step. Do not narrate another action or scene. When the response budget ends, give only the honest save status; **the next input `CONTINUAR GUARDADO` resumes verification**, not Jack's actions. No background execution; never invent previously unsaved original dialogue. Indices remain navigation-only, current canonical paths unchanged.


## D-030 — estilo y desenlaces basados en decisiones

La presentación vigente es novela interactiva urbana de suspense (escenas sensoriales y diálogo humano, evitando listados técnicos dentro de la escena). El usuario controla a Jack: no elegir sus frases ni acciones. Sin opciones al final salvo solicitud expresa del usuario. Leer `docs/DECISION_OUTCOMES.md` y `state.narrative_threads`; un desenlace solo puede seguir eventos reales, con consecuencias inmediatas y diferidas, y debe persistir junto con texto íntegro. No asignar finales predeterminados a opciones sin seleccionar.


## Literary correction D-032 — higher priority than old narrative templates

The player explicitly said the two played turns sound like event reporting, not narration, and wants the style replaced. **Read `docs/SCENE_CRAFT.md` and run its five-point editorial check before composing/saving the next turn.** No tech-summary narration, repeated negative results, flat NPCs, or option menus. **Don't invent Jack's decisions**. No gameplay advancement from the old document-only commit; its turn-2 Café Bruma checkpoint is historical and **not** a resumption instruction. D-028 saving lock remains mandatory.

## Integración Living World — decisión de propietario delegada, 2026-11-10 (D-048)

La rama narrativa `work/chat-narrative-foundation` incorporó mediante avance fast-forward desde `work/living-world-design-review-20261110` únicamente herramientas, pruebas e informes (17 rutas en la comparación; no se modificaron archivos canónicos del juego). `main` no se alteró. El checkpoint real sigue CH-000 turno 9, Día −29 mañana, EV-000029, TXT-000020. Referencia autoritativa: manifiesto/estado/eventos/transcripción actuales, no las notas viejas.

**Estado de activación:** los módulos `tools/living_world_*.mjs` se encuentran en la rama narrativa, pero NO son un narrador externo, servicio de fondo o simulador autoejecutable. El narrador es ChatGPT. `living_world_diagnostics.mjs` es un asistente de análisis privado y solo sirve para preparar una escena; `living_world_coordinator.mjs` puede preparar cambios revisados en memoria y guardarlos con el protocolo existente, pero no se invoca automáticamente. No inventar movimientos o rutinas durante la inactividad. Toda acción debe venir del jugador; no generar ni guardar un turno 10 real sin ella.

**QA completada:** GitHub Actions `42952186293`: Node 56/56 pruebas Living World y 133/133 suites completas, Python 24/24, validador PASS. GitHub Git Data API: commit sintético de cinco archivos en la rama `qa/living-world-integration-20261110` recuperado tras detenerse antes de mover la referencia; cinco blobs iguales al releer. Esa rama llegó al turno 10 **SINTÉTICO/NO CANÓNICO** y la PR QA #3 quedó cerrada sin fusionar. Nunca reanudar la novela ni fusionar esos archivos sintéticos.

**Riesgo pendiente antes de activar offscreen:** `tools/turn_engine.mjs` añade resultados completos de NPC independientes al Markdown legible del capítulo aunque sean secretos; no enviar ese texto al jugador ni confundirlo con su punto de vista. Corregir la separación de información entre archivo privado y prosa visible, y probar la corrección, antes de activar automáticamente resolución offscreen. Otro límite: reloj exacto y día de semana no están establecidos; devolver `unknown` en vez de inventarlos. Mantener puerta D-028 de cinco archivos y lectura remota.

**Próximo paso:** (1) corregir y probar filtración offscreen del capítulo, (2) ensayar uso manual de diagnóstico privado con una acción libre real, (3) validar narración literaria y guardar cinco archivos idénticos de una única acción real. No hay autorización implícita para adelantar la trama.
[Informe de QA final](docs/LIVING_WORLD_FULL_VERIFICATION_20261110.md) y [guía de activación](docs/LIVING_WORLD_ACTIVATION_HANDOFF_20261110.md).

## D-049 — se corrigió la filtración offscreen hacia el capítulo (2026-11-10)
La observación D-048 sobre filtración del futuro `CH-000.md` ya tiene una corrección **validada para nuevos turnos**. `tools/turn_engine.mjs` deja de copiar resultados de NPC privados al Markdown legible; quedan en el registro de eventos y estado. Las pruebas nuevas de privacidad y la suite completa aprobaron **135/135 Node, 24/24 Python y validador PASS** en GitHub Actions `42953180071`. La corrección se incorporó a la rama narrativa mediante fast-forward protegido, **sin modificar los cinco archivos de guardado**. El sistema no se invoca automáticamente y no se adelantó la partida (turno 9). El histórico anterior no fue reescrito y puede tener spoilers si alguien solicita capítulo entero. Referencia: [revisión privacidad](docs/LIVING_WORLD_PRIVACY_FIX_QA_20261110.md). La puerta final sigue siendo la resolución libre del próximo turno del usuario y su guardado verificado.

