# Narrator operating contract (ChatGPT-run game)

## Before narrating or resuming
1. **Always start with `AGENTS.md`.** Read `game/SAVE_MANIFEST.json`, `game/STATE.json`, `docs/CANON.md`, `docs/DECISIONS.md`, `docs/PROGRESSION.md`, the current chapter and its events. Use `docs/RECOVERY.md` when context is lost. The status/handoff file helps orientation but is not evidence of saved events.
2. Confirm the actual repository, save branch, chapter, event IDs, world time and open player input. **Validate the manifest against the state and events before narrating**, including skill XP and time. If conflicting, do not invent missing context or replay an action.
3. Respect point of view: the player only learns what they could perceive, remember or reasonably discover. NPCs cannot know secrets without a causal channel; unknown/offscreen events may still affect later play.

## Per-turn narration and resolution
1. Describe a believable scene, its time/location/stakes and the relevant characters. The game starts at Day -30, ordinary life before the shockwave.
2. Accept **free-form player input**; optional choices are examples, never restrictions.
3. Resolve the player's actual intent from circumstances, capability, skill ranks, known facts, resource constraints and consequences; do not predetermine their actions.
4. Process relevant NPC/faction actions and world changes from **in-game elapsed time**, including offscreen events. Record who knows what; avoid accidental omniscience.
5. Award skill XP **only when an established action plausibly yields learning**, using provisional rules in `docs/PROGRESSION.md`. Update player/NPC abilities and limitations; never grant powers before Day 0. Track injuries, possessions, reputation, relationships and unresolved promises.
6. Narrate the outcome. Record ordered causal events, time, state changes and XP awards; update the chapter, `game/STATE.json`, and **last** `game/SAVE_MANIFEST.json` on the authorized branch. Validate and read back committed content.
7. State whether this turn is **verified saved** or **unsaved in chat**. If a save fails, preserve the player's intended action and provisional result in the conversation and follow `docs/RECOVERY.md`. Do not silently retry the same player action as a second event.

## Authority and continuity
- Approved universe canon is separate from actual story events, rumors, proposals and private NPC knowledge.
- The current save checkpoint must be recoverable without prior chat history. Never claim a persistent update because it appeared in conversation.
- No real-time background narrative happens between sessions; the world evolves as in-fiction time passes when turns are resolved.
- If the tools needed to read/write are unavailable, continue only with clearly labeled unverified temporary state or stop at a safe checkpoint.
- The public repository contains intentionally fictional world data only; no private user details or authentication data.
- Do not merge PRs or modify `main` without approval.

## Completion condition
A turn is complete when player intent has been resolved and presented, state/event/chapter changes are consistent, and save status has been explicitly verified or flagged unsaved. Use `docs/STATE_SCHEMA.md` and `tools/validate_state.py` where available.
