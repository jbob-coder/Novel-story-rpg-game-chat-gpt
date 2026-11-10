# Living Superhuman World — novela interactiva en ChatGPT

**Played entirely in ChatGPT.** The assistant narrates the fictional world and resolves consequences from the player's free-form actions. GitHub stores approved lore, story chapters, causal events and world-state checkpoints. **No RPG attributes, XP, levels or ranks are used in current narration.** **No game download or local browser is needed.**

Earth starts on Day -30, a month before a cosmic shockwave arrives on Day 0. Later awakenings can occur in humans, and animals, plants and the environment can also change. Heroes, villains, ordinary people and organizations act for their own reasons. Characters can learn and change through their experiences; extraordinary abilities can emerge later according to world canon, but are not guaranteed.

## Resume safely
**Start with [AGENTS.md](AGENTS.md).** Read the saved manifest, state, current chapter/event log and canon before any new narration. Never rely only on chat memory.

- [World canon](docs/CANON.md), [approved decisions](docs/DECISIONS.md) and [world-building reference](docs/WORLD_BIBLE.md)
- [Narrator rules](docs/NARRATOR_RULES.md), [narrative quality standard](docs/NARRATIVE_STANDARD.md) and [NPC/world simulation](docs/NPC_RULES.md)
- [Contrato narrativo actual](docs/NARRATIVE_CONTRACT.md) — novela interactiva, continuidad y ciberseguridad no operativa
- [Retired RPG progression rules](docs/PROGRESSION.md) — historial congelado, no mecánicas activas
- [Chapter and turn protocol](docs/CHAPTER_PROTOCOL.md) and [data schema](docs/STATE_SCHEMA.md)
- [Context-loss recovery](docs/RECOVERY.md) and [handoff checkpoint](docs/HANDOFF.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md), [QA scenarios](docs/QA_SCENARIOS.md) and [project status](docs/STATUS.md)
- [Current manifest](game/SAVE_MANIFEST.json), [world state](game/STATE.json) and [opening chapter](chapters/CH-000.md) and [chapter preparation](chapters/CH-000.PREP.md)

## Narration loop
Read verified checkpoint → receive a free-form Jack action → resolve grounded consequences → draft and **editorially review** the literary scene → atomically commit and verify all five save files → present the identical saved text. Remote persistence does **not** prove the reply reached the user's screen. See [D-038 narrative execution model](docs/NARRATIVE_EXECUTION_MODEL.md). The world advances through **in-story time**, not while ChatGPT is inactive.

## Developer/QA validator
For a local copy of the repository (only needed for development), run `python tools/validate_state.py` with Python 3. The validator checks checkpoint format and references, not whether prose is good or a scene was fairly adjudicated.

**Current story checkpoint:** CH-000, Day -30, six completed turns, last event EV-000021. Jack is at the Wilson workshop and Elena is asking for a portable memory to save her illustration. Always verify current manifest, state, chapter, events and transcript before playing the next turn.

The repository may be public, but outsiders cannot directly write without GitHub access. Work in reviewable branches; neither draft PR #2 nor the older browser prototype PR #1 is automatically merged into `main`.


**Complete played story text:** `chapters/CH-000.transcript.json` holds literal, ordered player and narrator messages, while event and state records hold structured changes. Six turns are recorded at the current checkpoint. Use the manifest to verify future updates. See `docs/FULL_NARRATION_ARCHIVE.md`.


**Mapa por carpetas:** [índice maestro](INDEX.md), [docs por áreas](docs/INDEX.md), [capítulos](chapters/INDEX.md), [regla de guardado bloqueante](docs/SAVE_BLOCKING_PROTOCOL.md). No se mueve historia existente.


Guardado bloqueante: los dos puntos de entrada narrativos (escena inicial y turno) exigen validación del checkpoint y del estado del guardado anterior. Ver [protocolo de bloqueo](docs/SAVE_BLOCKING_PROTOCOL.md).
