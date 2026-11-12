# D-052 — Living World reliability implementation and staged rollout
Date: 2026-11-12. Development branch: `work/living-world-reliability-20261112`.
**This is infrastructure, not a story turn.** Canon is CH-000, turn 9, Day -29 morning.

## Work broken into stages

| Step | Change | What can be verified | Remaining limitation |
| --- | --- | --- | --- |
| 1. Temporal coherence | `living_world_time.mjs` validates plausible whole-day/minute intervals and coarse period transitions; coordinator calls it before staging. | Reject one day in zero minutes, 1500 minutes in zero days, and morning-to-night in 20 min; preserve short midnight crossing without inventing clock. | Exact weekday, wall-clock and authoritative duration remain unknown. |
| 2. Crash recovery | `save_transaction.mjs` optionally journals precommit, detached commit, updated branch and final readback. `recoverJournaledSave` resumes without recreating narration. `github_save_journal.mjs` provides an authenticated REST contents adapter to a dedicated `journal/*` branch. | Tests simulate lost context, interrupted write, diverged branch, write failure, and journal finalization failure. The canonical Living World coordinator blocks saves lacking a journal adapter. | An actual live journal write/read using a scoped token is NOT yet tested. Journal branch is prepared, but no player turn is active. An interruption before detached commit SHA is persisted remains blocked for manual reconciliation. |
| 3. NPC commitment triage | `living_world_commitments.mjs` selects nearby relevant existing NPCs and reviews unresolved plans; supports explicit event-backed `due_day` deadlines. `living_world_diagnostics.mjs` exposes only narrator-private proposals. | No invented school arrival, neighbor-clock delivery, resolved courier job or hidden NPC knowledge. `unknown` remains explicit. | This is a review queue and NOT a fully autonomous decision engine; it still requires causally reviewed outcomes. It does not create a new canonical school, institution or schedule. |
| 4. Visibility boundary | `turn_engine.mjs` no longer adds engine `intent/outcome` summaries automatically to reader-facing chapter **for new turns**; it rejects verbatim copies of hidden NPC results into narration. | Full private offscreen results remain in event log/state, while chapter and transcript contain only literal reader-facing story. | Semantic paraphrases still require narrator review; historical chapters must not be silently rewritten. |
| 5. Integration QA | Synthetic three-turn rehearsal uses the current checkpoint via mocked Git remote to stage, read back and validate all five files after each turn; separate all-suite CI run. | No synthetic scenario is added to canonical `chapters/` or `game/`. | Actual narrator/reader experience and GitHub live journal recovery must still be exercised before declaring automatic operation. |

## Recoverability and privacy policy

- Before a new real turn, configure `createGitHubSaveJournal` with an externally supplied scoped token and `journalBranch:'journal/living-world-save-attempts'`.
- `saveLivingWorldTurn` on `work/chat-narrative-foundation` refuses unjournaled writes. Before staging, the coordinator reads the journal; a nonverified attempt must be recovered or reconciled.
- Once a five-file commit has been created, store its SHA in the journal before updating the narrative branch. On recovery, reuse exactly this commit and original text, never a re-generated version.
- The journal branch is **not** a narrative branch; do not merge it into main or into the story branch.
- The recorded fiction in this repository is public; do not copy real credentials, personal data or confidential external content.
- GitHub REST non-force updates are not a perfect atomic compare-and-swap; do not claim universal concurrency guarantees.

## Narrative and scope guard

- Live ChatGPT is still the narrator. No separate AI, periodic worker, or background NPC simulation is running.
- No tick occurs while the chat is inactive.
- `clock_time`/`calendar_date` remain null; do not invent opening hours, exact school locations, assignments or dates.
- The seven existing NPCs retain their prior state until **reviewed narrative events** justify changes. The urgency tool flags *review needed*, not success or failure.
- Before first authentic turn: verify current branch HEAD and all five original files, load pending journal status, perform private diagnosis, review actor outcomes and visible text, then stage and read back one action.
- The initial three-turn rehearsal is **synthetic and noncanonical**; test success cannot alone prove good story writing.

## Remaining design priorities
1. Verify real journal REST writes/recovery with external credentials on an **isolated QA branch** and dedicated journal, never the true story.
2. Add persistent, actor-specific obligations with constraints (resources, work shifts, believable failure), and time-aware reconciliation driven by player turns.
3. Expand functional city areas, institutions, possible encounters, and proposed travel durations without falsely promoting them to canon.
4. Run editorial review of a full multi-stage literary scene with independent NPC consequences and knowledge boundary.
5. Authoritative chapter transition and Day 0 shockwave tests remain separate outstanding work.

**Current test outcome:** PENDING official GitHub Actions CI for this revision; see GitHub run before claiming pass.
