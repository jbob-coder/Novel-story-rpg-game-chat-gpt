# NPC qualitative needs × world plans × chapter history — isolated integration

**Date:** 2026-11-14  
**Scope:** A narrow, QA-only code integration on `work/npc-needs-chapter-bridge-20261114`, stacked on audit PR #26 (which is stacked on PR #25 and PR #24). **No canonical turn, no auto-merge, no background NPC execution.**

## Provenance and owner-safe boundaries

- The needs engine originates from `tools/living_world_needs.mjs` on PR #14, original Git blob `03dbed65644dd616e5ce52a3b850ff29da422ed9`. Its core record schema, event validation, review helpers and pure priority view were copied intact.
- The integrated baseline is audit branch `audit/world-plan-npc-integration-20261114` at `26422133498340fed3bd96ea0898c1da96ca164b`.
- `tools/state_changes.mjs` was **manually extended**, not replaced with PR #14's earlier version. Existing plan and obligation validation, contextual travel, chapter-crossing history, event IDs, and transactional actor-copy behavior remain.
- `tools/living_world_routines.mjs` now accepts reviewed `needs` changes. This enables event-backed needs for an NPC, not automated fulfilment.
- `tools/narrative_archive.mjs` applies a conservative private-needs text gate to both standalone scenes and completed turns. No unreviewed need description is allowed verbatim into reader-facing messages. This is **lexical only**; an editorial check remains necessary to detect semantic leaks. Needs do not yet have a causal player-disclosure model.
- `game/STATE.json`, `game/SAVE_MANIFEST.json`, `chapters/CH-000.md`, `chapters/CH-000.events.json`, and `chapters/CH-000.transcript.json` are **not modified**. Real fiction remains turn 9, Day -29 morning.

## Execution contract

1. Inspect the saved checkpoint and actor's actual `resources`, `location_id`, current commitments and plans.
2. For a new need, obtain a **reviewed, actor-attributed, current-turn observation**. Call `draftReviewedNeedIntroduction` using a new `NEED-` ID and established resource keys.
3. Stage one or more NPC resolutions through `stageLivingWorldTurn`; the entire action batch is checked against each actor's current state. The player's action and NPC effects receive their own events with monotonically advancing IDs.
4. `applyStateChanges` validates `needs` before and after, change ownership, duplicate IDs, and event references. On a failed later change, earlier attempted changes in the same batch do not commit.
5. `verifyStateChanges` checks all historic events through `allEvents`, including closed chapters. It verifies each need's creation/last-change source events, actor ownership, recorded before/after chains, and globally unique need IDs.
6. Plan/obligation/need changes may be combined in the **same actor-owned event**, while different actors still require their own events. One actor cannot silently edit another actor's resources or needs.
7. `reviewNPCNeeds` produces a **private, read-only review**; a deadline or urgency cannot by itself execute an action or reduce health/money. Any future tradeoff or need closure requires an additional reviewed, causal event.
8. Staging is not saving. An authorized real turn still requires the existing durable journal, atomic five-file commit, remote readback, and unchanged literal reader transcript.

## Synthetic acceptance cases

`tests/integration_npc_needs_plans.test.mjs` demonstrates:
- Rosa's ordinary needs, obligation and conditional plan coexist while Noah has a different need; their sources and locations remain actor-owned.
- A private evaluation does not mutate the checkpoint or auto-complete a plan.
- A stale need change after an otherwise valid `conditions` update fails atomically without changing the state or event record.
- A reviewed need tradeoff remains blocked and survives a synthetic CH-000 → CH-001 transition; global event IDs and the original story remain intact.
- Forged sources, duplicate IDs across actors and undocumented changes are rejected by the snapshot validator.
- Both narrative entry points reject direct inclusion of private NPC need metadata.

This QA operates on in-memory cloned checkpoints. It must **never** be saved to the authoritative narrative branch. A genuine remote journal-backed test is a separate acceptance requirement.

## Deliberate limitations

- The full PR #11–#15 decision, social-contact and city-service implementations are still separate. This branch integrates the **needs module and its typed event handling**, not the full prior NPC feature stack.
- The needs metadata does not yet model exactly which facts Jack has causally learned. The lexical guard is deliberately conservative until a disclosure interface is implemented.
- The module does not create needs from elapsed time, infer medical conditions, invent NPC schedules, complete deliveries, or reveal any secret author plans.
- This is not a city-wide autonomous scheduler. NPCs still need reviewed, resolvable actions during actual fictional time.
- This repository is publicly readable. Fictional viewpoint secrecy does not make these records confidential from GitHub readers.

## Next implementation

Integrate the pure planning/decision assessment from PR #11–#12 on a further isolated branch. Establish an adapter for `needs` and conditional `plans` without claiming an independent intent was executed. Then add PR #13 social contacts and PR #15 service cases with explicit cross-actor sequencing and full combined CI. Finally test live journal readback on a QA branch before promoting anything to the playable narrative.
