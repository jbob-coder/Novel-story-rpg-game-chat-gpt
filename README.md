# Living Superhuman World — ChatGPT-run narrative RPG

**Played entirely in ChatGPT.** The assistant narrates the fictional world and resolves consequences from the player's free-form actions. GitHub stores approved lore, story chapters, character stats, skills, events and world-state checkpoints. **No game download or local browser is needed.**

Earth starts on Day -30, a month before a cosmic shockwave arrives on Day 0. Later awakenings can occur in humans, and animals, plants and the environment can also change. Heroes, villains, ordinary people and organizations act for their own reasons. Skills grow through meaningful practice; powers are separate and not guaranteed.

## Resume safely
**Start with [AGENTS.md](AGENTS.md).** Read the saved manifest, state, current chapter/event log and canon before any new narration. Never rely only on chat memory.

- [World canon](docs/CANON.md), [approved decisions](docs/DECISIONS.md) and [world-building reference](docs/WORLD_BIBLE.md)
- [Narrator rules](docs/NARRATOR_RULES.md), [narrative quality standard](docs/NARRATIVE_STANDARD.md) and [NPC/world simulation](docs/NPC_RULES.md)
- [Skills and progression](docs/PROGRESSION.md) — provisional XP balancing
- [Chapter and turn protocol](docs/CHAPTER_PROTOCOL.md) and [data schema](docs/STATE_SCHEMA.md)
- [Context-loss recovery](docs/RECOVERY.md) and [handoff checkpoint](docs/HANDOFF.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md), [QA scenarios](docs/QA_SCENARIOS.md) and [project status](docs/STATUS.md)
- [Current manifest](game/SAVE_MANIFEST.json), [world state](game/STATE.json) and [opening chapter](chapters/CH-000.md) and [chapter preparation](chapters/CH-000.PREP.md)

## Narration loop
Read verified state → narrate → accept a free-form action → resolve player/NPC consequences and XP → record events and update chapter/state → verify completed save → resume. The world advances through **in-story time**, not while ChatGPT is inactive.

## Developer/QA validator
For a local copy of the repository (only needed for development), run `python tools/validate_state.py` with Python 3. The validator checks checkpoint format and references, not whether prose is good or a scene was fairly adjudicated.

**Initial story status:** CH-000, Day -30, no player-created character or completed turns.

The repository may be public, but outsiders cannot directly write without GitHub access. Work in reviewable branches; neither draft PR #2 nor the older browser prototype PR #1 is automatically merged into `main`.
