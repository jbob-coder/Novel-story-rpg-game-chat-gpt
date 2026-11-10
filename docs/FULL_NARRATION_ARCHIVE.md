# Full, verbatim narration archive — mandatory

**Owner decision D-027:** preserve complete story narration, not only summaries. Every real in-game player message, NPC dialogue voiced through narrator text, full assistant scene, resolved outcome and line breaks must be copied *exactly* into an ordered per-chapter transcript. The saved archive is fictional gameplay text; ordinary technical discussions and unapproved private information are not included in public GitHub.

## Files
- `chapters/CH-NNN.transcript.json`: exact ordered messages, stable `TXT-` IDs, roles, message kind and event references.
- `chapters/CH-NNN.events.json`: event IDs, causal actor changes and knowledge; old XP fields are frozen archival data only.
- `chapters/CH-NNN.md`: readable narrative chapter, including full visible narrator prose as turns complete.
- `game/STATE.json` and `game/SAVE_MANIFEST.json`: current materialized state and saved text/event counters.

## Opening scene
Compose the complete narrative prose before showing it. Stage it using `stageNarratorScene(snapshot, exactText, stableSceneKey)`, commit archive/state/manifest (and the relevant chapter when prose changes) in one commit; re-fetch and compare original text. Only then display the same words. It is turn 0 and **does not** count as a gameplay action. Reusing the same key is prohibited to prevent duplicates.

## Player turn
Read back latest coherent checkpoint. Receive the player's complete original message. Resolve only the stated action and plausible offscreen NPC/world changes. Stage with `stageNarrativeTurn(snapshot,{ key, intent, outcome, player_text, narration_messages, elapsed_days, ...})`. `intent/outcome` are **short technical event descriptions**, whereas `player_text` and `narration_messages` are the exact text of the actual visible exchange. Do not edit or truncate those literal strings.

One atomic Git tree + commit must contain transcript, event log, chapter prose, state and manifest. Update the branch with a non-force expected-HEAD lease; fetch all five by committed SHA and check archive count, original wording, event references and state. Say **saved** only after successful read-back. If tools fail, apply D-028 and report a blocked save; do not invent a completed scene. Persisted story text is not necessarily delivered in the chat interface: after an interrupted delivery, replay the exact saved narration without duplicating events (D-038).

## Recovery
The archive is the authority for *what was said*; the events for *what happened*; the state for *what is true now*. Never invent forgotten words or replace missing text with plausible summaries. If exact original text was not saved, say it is unavailable and request the source if the player wants it restored verbatim.

CH-000 originally began with zero turns, but the checkpoint reviewed on 2026-11-10 contains **six completed turns and fourteen literal transcript entries**. Development conversations are not backfilled as story. The current staging module is scoped to CH-000; a separate per-chapter transcript is required for a new chapter.
