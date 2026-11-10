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
