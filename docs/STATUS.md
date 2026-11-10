# Project checkpoint — narrative foundation and continuity audit

## Goal
ChatGPT-run Living Superhuman World with a durable, reconstructable chapter record, independent actor consequences, and an RPG skill/progression system.

## Verified starting point
- PR #2 (`work/chat-narrative-foundation`) contains the **correct narrative model**, separate from the unmerged browser prototype in PR #1.
- Chapter `CH-000` is opening at Day -30 and has **zero player actions and zero story events**.
- Player identity, location, background and starting abilities are not defined.
- `main` must not be assumed to contain the draft branch until a merge is explicitly verified.

## Documentation audit — deficiencies and remedy
- **Context loss / wrong chapter:** add `AGENTS.md`, `docs/RECOVERY.md` and `docs/HANDOFF.md`.
- **Unverified saves / duplicate actions:** add manifest-last protocol, structural validator and explicit coherent-checkpoint recovery procedure.
- **Skills and progression missing:** add `docs/PROGRESSION.md` and player state progression data; actual numbers remain provisional.
- **Offscreen knowledge and goals ambiguous:** add `docs/NPC_RULES.md` and `docs/STATE_SCHEMA.md`.
- **Implementation plan scattered:** add `docs/IMPLEMENTATION_PLAN.md` with milestone acceptance criteria.

## Verification
**Executed:** Read back 18 files from the working GitHub branch and ran 14 direct consistency checks on the retrieved content: **14/14 passed** (state/schema, chapter and event alignment, zero turns, pre-wave invariants, progression initialization, recovery links and documented decisions). All checks were performed against committed GitHub data.

**Not executed:** The committed `python tools/validate_state.py` script could not be run on a full checkout here because the container cannot reach GitHub. A passing structural check is not proof of narrative quality or complete turn save/recovery. Run this command on an actual checkout before declaring M0 end-to-end verified.

## Story context added for narration
- `docs/WORLD_BIBLE.md` distinguishes confirmed world anchors from provisional details of everyday society, institutional pressures, causality and phases before/after Day 0.
- `docs/NARRATIVE_STANDARD.md` defines concrete, player-centered scenes and how they record consequences and character knowledge.
- `chapters/CH-000.PREP.md` provides a flexible opening scene framework and suggested everyday-life tensions, explicitly **not** actual played events or approved named lore.
- These references improve narration readiness but **do not substitute for established starting location, player identity or authored NPC biographies**. A live end-to-end story-save/resume test remains pending.

## Still unresolved
No live turn, independent actor event or long-duration continuity replay has yet occurred. Numeric XP thresholds, character creation rules, power growth, setting geography and starting cast require later design/playtesting. The assistant cannot do real-time game simulation when inactive.

## Next action
Validate this checkpoint, then begin character setup and CH-000. Save the first actual action as a causal event, derive any appropriate skill progress and verify the next manifest before continuing.


## Opening-state repair — 2026-11-09 (owner authorized)

Jack's previously confirmed name, age, role, opening intent, original alternate-Earth coastal city and transit plaza, and three supporting NPCs were moved into structured `game/STATE.json`, chapter and reference documents. The character profile contains **provisional** background skill values. No device placement, stolen data, gameplay turn, or independent NPC outcome is fabricated. An atomic Git commit is used for this checkpoint if the branch lease succeeds. Full turn execution and cold-resume remain future acceptance gates. Older statements above that the player or location are undefined are superseded by this repair section.


## Narrative turn lifecycle quality gate (2026-11-09)

Added a dependency-free, non-mutating narrative checkpoint staging and validation module, a Node test suite, and instructions on atomic four-file commits. Tested **19 cases** using the exact current GitHub starting state in the JavaScript execution environment: all passed, including two sequential hypothetical turns, knowledge isolation, XP, duplicate suppression, corrupt save detection, and reload. The hypothetical actions were **not** written as gameplay history. No real turn has occurred; actual Node CLI execution on a checkout is pending. The first time skip across Day 0 intentionally stops until an explicit cosmic-shockwave event handler is built.


## Detached GitHub persistence rehearsal

Created Git commit `733433bc6b7b0da8f2163a6894e98a50f6028e1e` without moving any branch ref. It contains one **synthetic** player event, one independent NPC event, skill XP change, chapter prose and a matching turn-1 manifest. Read back all **4** files using that commit SHA; exact bytes matched. Verified real working branch still points to `2743e565d2b6b78359275a0a5c47586e462b6d33` and `main` stayed unchanged. This was a persistence proof, **not** an actual player turn. An NPC event causality issue in the prototype staging module was subsequently fixed; chapter rollover and Day 0 transitions remain open.


## Player-profile expansion — owner instructions and delegated design (2026-11-09)

Stored owner-provided ADHD, assisted phone-to-collar speech, money/technology/gadget motivations, sister and grandmother, discreet house-level savings with modest living standards, several small devices and large unfinished Project Aster. Narrator created physical description, family/background and three new persistent actor/place records; all explicitly labeled as delegated choices. Numeric skill balancing is provisional (46 baseline XP); not earned in play. No initial story event was generated, and the manifest setup revision advanced without changing the real turn number. `game/CHARACTER_JACK.md` is now the character's full reference.


## Corrección de identidad/robot (10 noviembre 2026)
Elena es **17**, hermana menor; corrige edad anterior 25. Ambos padres fallecieron en incendio vinculado a las dificultades de voz de Jack. Origen del ahorro: hacking pasado. Moralidad pragmática con autocontrol extremo y rasgos descritos como psicopáticos (personaje ficticio, no diagnóstico). Aster ahora es un robot mediano sin cabina, aún inoperativo, con requisitos documentados de vuelo, sensores, combate automático, pantalla 14K, resistencias y escape de emergencia. UMP no ha sido aclarado. No hay turnos ni eventos nuevos.


## Full-text story archive

Owner requires full original text of all actual gameplay. Initialized `chapters/CH-000.transcript.json` empty at turn 0, added `tools/narrative_archive.mjs`, and integrated exact-message requirements in `tools/turn_engine.mjs`. It now requires `player_text` and `narration_messages` and includes the narrator text in the chapter. Regression tests were extended; read-back and separate test execution still required. No player action was fabricated or performed, and the `main` branch remains unchanged.


### Full narration QA evidence — 2026-11-10

Performed dynamic execution of the exact JavaScript modules retrieved from GitHub: 19 initial checks passed; one intentionally re-used NPC destination in a second-turn scenario was rejected by the engine's navigation validation. Correcting the **test scenario** (not gameplay data) passed 9/9 further checks, including two consecutive hypothetical turns, four verbatim transcript entries, preserved line breaks, NPC progression, counters, JSON round-trip restore, and unchanged real turn-0 save. The Node CLI test suite was committed but has **not** been executed as a Node process in an actual checkout. A real chat turn and full five-file commit/read-back still require live gameplay. No invented transcript was added to the actual saved game.


## D-028/D-029 — save lock and indices

Added `tools/save_gate.mjs` to track seven independently evidenced save stages and prevent further story output until a committed remote five-file readback validates at 100%. On failure, show percentage and hold; next input resumes verification after refreshing branch HEAD. No background work. Added root + domain and chapter subfolder indexes, `docs/FILE_INVENTORY.json`, link-validation tests and `docs/FOLDER_POLICY.md` while preserving legacy/canonical paths. The story is still at Day −30, turn 0 and its transcript is empty.


## Save gate integrated with both story entry points

The `stageNarrativeTurn` engine and `stageNarratorScene` archiver now import the hard gate and reject missing, blocked or unverified save attempts before staging new narrative output. Tests extended to cover missing guards and previous blocked saves. The caller must provide the real verified branch HEAD; a unit-test placeholder SHA is not evidence of a real save. No actual story state changed.


## Python validator extended (D-028)

The repository Python checkpoint validator now checks literal chapter transcript structure, entry/counter alignment, unique IDs, role/kind, event links and complete player+assistant text for played turns. A separate regression file tests a pristine checkpoint and intentionally corrupt archives. **These Python tests were committed but not executed locally in this environment** (GitHub cannot be cloned in the local runtime). The runtime JavaScript hard-save gate was tested separately.


## Verificación de índices y bloqueo

Se verificaron 15/15 escenarios dinámicos al ejecutar código JavaScript obtenido de GitHub y se inspeccionaron los 18 índices remotos, todos sus enlaces relativos y el inventario sin errores. `main` no se modificó. Nota: son pruebas directas en el entorno de herramientas, **no** una ejecución de `node --test` / `python -m unittest` desde checkout. Se conserva el bloqueo obligatorio al fallo de guardado y la partida CH-000 turno 0.


## Estilo interactivo y desenlaces causales — D-030

A partir de la petición del usuario, se añadieron reglas para novela interactiva urbana inmersiva, opciones libres y desenlaces inmediatos, persistentes y de largo plazo. `tools/consequences.mjs` y `tests/consequences.test.mjs` gestionan hilos causales `THREAD-` vinculados a eventos adjudicados. La lista comienza vacía. No se crean resultados de la elección hasta que el usuario actúe. Falta probar el flujo de un primer turno real y la recuperación entre capítulos.
