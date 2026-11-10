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
After edits, fetch files from GitHub and run `python tools/validate_state.py` on a checkout if tools permit; record exact results. A passing structural validator does not certify creative narrative quality or future save/restore. Report any unavailable checks explicitly.

## Still unresolved
No live turn, independent actor event or long-duration continuity replay has yet occurred. Numeric XP thresholds, character creation rules, power growth, setting geography and starting cast require later design/playtesting. The assistant cannot do real-time game simulation when inactive.

## Next action
Validate this checkpoint, then begin character setup and CH-000. Save the first actual action as a causal event, derive any appropriate skill progress and verify the next manifest before continuing.
