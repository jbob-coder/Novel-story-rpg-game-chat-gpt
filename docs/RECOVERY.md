# Context loss, interrupted writes and continuity recovery

A long game can exceed chat context, switch devices or lose tool access. **Conversation memory is not durable evidence.** Repository checkpoints are the recoverable source, but only after consistency checks.

## Recovery workflow (required on resumption)
1. Read `AGENTS.md`. Confirm repo, branch, open PRs and whether the desired save is still on that branch. Do **not** assume `main` includes a draft PR.
2. Fetch `game/SAVE_MANIFEST.json`, `game/STATE.json`, the referenced chapter file and its event log, plus CANON and DECISIONS. Read `docs/PROGRESSION.md`, `docs/NARRATOR_RULES.md`, `docs/STATE_SCHEMA.md` and `docs/HANDOFF.md` for relevant rules. A quick handoff is never sufficient by itself.
3. Verify saved turn, chapter ID, schema versions, last event ID and sequence, chronology, no premature awakenings, player attributes/skill XP consistency, actor IDs, knowledge and unresolved threads. Run `python tools/validate_state.py` when a repository checkout with Python is available; its checks are necessary but not sufficient for narrative consistency.
4. Rebuild the situation: where/when the player is, what they just did, what happened elsewhere, NPC goals, secrets known to each actor, active tensions and precisely which player input is pending.
5. Resume from that point. If documents conflict, **do not roll forward from a guess**. Identify the last consistent saved commit and affected files, reconcile event and state from that commit, then resume. Ask the owner only if the conflict would change canonical outcomes.

## Crash-safe write discipline
- Work on the authorized branch. Prepare the complete next event, chapter text, state and optional handoff **before writing**.
- Verify current file SHAs/head to avoid overwriting parallel edits. Each update uses the SHA obtained from that branch.
- Write event log, chapter prose and state; validate them. Write `game/SAVE_MANIFEST.json` **last**, fetch it back, and verify all files align with it. Then announce the saved turn.
- GitHub Contents API updates are separate commits: this procedure does **not** provide an atomic transaction. A crash between writes may leave partial changes. The old manifest remains the last completion marker.
- On partial write, do **not** trust the new HEAD merely because it exists. Inspect history for the last commit at which the manifest and its dependent files all matched. Recover that coherent checkpoint on a new branch or by safe forward repair after inspection; do not force-push, silently reset or erase other agents' work.
- If a coherent snapshot cannot be proven, stop and say exactly which actions/events are unverified. Never duplicate a played turn or invent an event to close a gap.

## Lightweight post-session handoff
Update `docs/HANDOFF.md` with date, branch, manifest turn/event ID, chapter/day, current scene, important NPC and faction developments, open player choice, changed files, tests, uncertainties, and next task. Distinguish **confirmed saved** from **planned** or **chat-only**. Keep handoff short; canonical facts stay in their primary files.

## Limits
No real-time background simulation when the assistant is not running. Each new response can advance in-game offscreen activity based on elapsed fictional time. A public repo must contain only intentionally public fictional story data.


## Preferred atomic save path

If GitHub Git Data API access permits, prepare all changed files including `game/SAVE_MANIFEST.json` in **one new Git tree and one commit**, then update the branch ref with an expected-head check (non-force). The branch ref update makes the complete snapshot visible atomically and is preferable to the older separate-Contents-API manifest-last method. If that API is unavailable, use the staged manifest-last fallback and strict recovery checks. Never claim either path was used without verifying the new commit and reading back authoritative files.


## Literal transcript recovery gate

Read `chapters/CH-NNN.transcript.json` for the current and any past played chapters. Verify exact sequential `TXT-` IDs and that `manifest.last_transcript_sequence`, `manifest.last_transcript_id`, and `state.history.last_transcript_sequence` match. Every played turn needs the player's full message and at least one entire assistant response. A transcript with missing entries or event links is not a coherent checkpoint. **Never reconstruct missing dialogue or paragraphs from summaries, chat memory or intuition**; report that exact words are unavailable. CH-000 currently has zero real turns, so its first transcript is legitimately empty.


## HARD STOP PRIORITY — overrides permissive fallback (D-028)

If ANY save step fails or an attempt is incomplete, **do not advance or display the next story scene**. Use the seven evidence-backed percentages in `docs/SAVE_BLOCKING_PROTOCOL.md`. Do not claim time-dependent progress. Show blocked percentage with exact cause and pending stage; stop for this response if necessary. On next user input `CONTINUAR GUARDADO`, retrieve the branch HEAD and artifacts and reconcile an unverified commit before completing or retrying. If the original full text was lost, ask user to recover it rather than guess. Never accept new story actions until five-file readback has finished at 100%. On unresolvable conflict, preserve the last coherent commit and report blockage.
