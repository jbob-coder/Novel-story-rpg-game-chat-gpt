# Living Superhuman World — session entry point

**Delivery:** This is a ChatGPT-run narrative RPG, not a browser game. Player actions are free-form chat messages; the repository stores fictional canon, chapters, events and checkpoints.

## Recovery entry (every new session or after context loss)
1. Confirm repository, branch and PR state. `main` is the approved destination, NOT automatically the latest playable save. The active work branch is `work/chat-narrative-foundation` until changed by an explicit verified decision.
2. Read `game/SAVE_MANIFEST.json` first, then `game/STATE.json`, `docs/CANON.md`, `docs/DECISIONS.md`, `docs/PROGRESSION.md`, `docs/WORLD_BIBLE.md`, `docs/NARRATIVE_STANDARD.md`, `docs/NARRATOR_RULES.md`, `docs/RECOVERY.md`, the current `chapters/CH-NNN.md` and its `.events.json`. Read `chapters/CH-000.PREP.md` when the opening chapter is active. Read `docs/HANDOFF.md` for the last checkpoint summary, but verify every important assertion from primary files.
3. Validate references, event sequence, timeline, character records, progression and manifest against the saved files. If anything conflicts, **stop narration at the last verified checkpoint** and report the inconsistency; do not invent lost turns or overwrite an uncertain save.
4. Identify the player's last resolved action, exact open scene, pending player input, relevant NPC goals and knowledge. Only then resume narration.

## Authority and precedence
Approved owner decisions in CANON/DECISIONS govern world rules; verified event records govern what happened; a consistent checkpoint represents current state; chapter prose provides narrative detail; handoff and chat memory are aids, never proof of repository state. If authoritative sources conflict, preserve both and request correction only when it affects the story.

## Save protocol
For each completed player turn: determine action and in-game elapsed time; resolve relevant NPC and offscreen activity; apply grounded progression; validate; write event history, chapter and state; update `game/SAVE_MANIFEST.json` **last** as the completion marker; fetch the saved files again before claiming "saved." The manifest-last procedure is not an atomic multi-file transaction: see `docs/RECOVERY.md`.

Do not add fictional personal data about the user to this public repository. Keep `main` unchanged without explicit merge authorization. Do not merge the older browser prototype as the chat game. No real-time background gameplay is implied between messages.

## Current entry
Chapter **CH-000**, Day **-30**, no resolved player turn; character and location not yet defined. Ask for a starting character/background, then narrate with user agency intact. Follow `docs/IMPLEMENTATION_PLAN.md` for technical work and `docs/HANDOFF.md` for the latest verified task checkpoint.
