# Integration audit — chapter/plan pilot vs. NPC and Meridian Bay branches

**Date:** 2026-11-14. **Status:** review only, not an integration merge.  
**Repository:** `jbob-coder/Novel-story-rpg-game-chat-gpt`  
**Baseline:** PR #25 `c9448eeaee555b3eb1474eec1832a0aa2991a1b2`, stacked on PR #24 `73fd82757b7cdef4cc7ca931f7b1bbded0f431ca`.  
**Canonical narrative HEAD:** `b096f84dca1ec4e01f1a2742a67ae41688bd11d6`. Do **not** merge this QA branch into the narrative branch without explicit owner review.

## Verified branch graph and evidence

- PR #24 targets `work/chat-narrative-foundation`; PR #25 targets PR #24's head, not `main`.
- The NPC chain is **PR #10 -> #11 -> #12 -> #13 -> #14 -> #15**, each dependent on its predecessor; PR #19 is based on #15.
- The separate cartography lineage includes PRs #20–#23. PR #21 provides prebuilt place records, PR #22 navigation and crosswalk, PR #23 a provisional scale plan. The atlas branch PR #20 must be reconciled editorially rather than applied as an independent canonical world.
- GitHub compare of PR #25 and the #15 head shows **diverged** branches with the shared narrative merge base `b096f84dca1ec4e01f1a2742a67ae41688bd11d6`; comparing PR #25 to the #15 head found 73 commits ahead on #15 and 2 on #25. **Do not fast-forward either branch onto the other or force-push.**
- PR #25's official CI run [43597585341](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43597585341) completed successfully on the PR #25 head: 257 Node, 37 Python and checkpoint validator according to the PR summary. This proves its isolated test scope, **not** combined NPC or city integration.
- The five saved files below have identical Git blob IDs on the authoritative narrative branch and PR #25:
  - `game/SAVE_MANIFEST.json`: `897ec2e77ece4f8edf506c7058552a5dd3cdb320`
  - `game/STATE.json`: `0320a93ebf4a944da97b65dffa6d281acce46d94`
  - `chapters/CH-000.events.json`: `1f40c724e44f70c9b45814dc11ff1f73262c5a5f`
  - `chapters/CH-000.transcript.json`: `1350916ead7fb1f2f15fdd635dda42e69a0a3fed`
  - `chapters/CH-000.md`: `e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4`
  - Therefore **CH-000, turn 9, Day -29 morning, EV-000029, TXT-000020** remains the sole real gameplay checkpoint.

## Collision matrix: manual reconciliation required

| Integration source | Hotspot paths overlapping PR #24/#25 | Merge requirement |
|---|---|---|
| PR #10 obligations | `living_world_obligations.mjs`, `living_world_routines.mjs`, `state_changes.mjs` | PR #25 already reuses the obligation validator from #10. Compare contents rather than importing a second copy. Keep event-owned commitment transitions. |
| PR #11–#12 agenda/decisions | `living_world_diagnostics.mjs`, `tools/INDEX.md` | Preserve narrator-private selection and stale-assessment checks. Never auto-complete a routine. |
| PR #13 social contacts | `living_world_coordinator.mjs`, `turn_engine.mjs`, `docs/STATE_SCHEMA.md` | Preserve paired actor-owned social events, knowledge isolation, global EV/TXT cursors, chapter local archives, and exact text. |
| PR #14 needs | `state_changes.mjs`, `living_world_routines.mjs`, `living_world_diagnostics.mjs`, schema | Union both qualitative `needs` and PR #25 `plans` validations; neither may silently overwrite the other. |
| PR #15 service cases | `state_changes.mjs`, `living_world_routines.mjs`, `living_world_diagnostics.mjs`, schema | Preserve `service_cases`, NPC ownership, case history, and chapter continuity with plans and obligations. |
| PR #19 city services/visitable places | `turn_engine.mjs`, `state_changes.mjs`, diagnostics, schema | Distinguish designed existence vs. discovery vs. visit; no retroactive LOC creation from Jack's observation. |
| PR #20 atlas vs. PR #21–#23 prebuilt map | Largely distinct files, but shared mapping semantics | Reconcile identity crosswalk and coordinate uncertainty. Never convert schematic distances to canonical travel minutes. |
| PR #24 travel and literal recovery | `turn_engine.mjs`, `state_changes.mjs`, transaction modules | Keep travel budgets, original narration replay, exact five-file readback, and journal hard gate. |
| PR #25 chapter/plan pilot | `chapter_management.mjs`, `chapter_history.mjs`, `world_plans.mjs`, `state_changes.mjs` | Keep global IDs, immutable closed chapter bytes, causal plan references, and nonexecuting author proposals. |

**High-risk path:** `tools/state_changes.mjs` is edited across both development lines; copying either version wholesale can erase the other line's registered fields.  
**Second critical path:** `tools/turn_engine.mjs` must combine social events, city navigation, chapter-local event collections, global counters, and non-disclosure behavior.

## Safe integration execution order

1. **Baseline and provenance.** Create an isolated `integration/*` or `qa/*` branch from the verified PR #25 head; record SHA of both source heads, compare all five canonical blobs, and never write synthetic events onto a narrative branch.
2. **Obligation contract first.** Compare PR #10's validator with the already reused PR #25 module; import only changes not present. Retain the `commitments` change field and prove event-backed updates survive reload.
3. **Import pure NPC planning modules.** Bring in PR #11–#12 agenda/decision modules and their tests. Resolve diagnostics interface explicitly; pure proposals cannot mutate state or trigger narrator-visible disclosures.
4. **Social relationship integration.** Bring PR #13 social contacts and paired actor-owned resolutions. Reconcile the coordinator and turn engine manually; add two-actor event/knowledge privacy tests.
5. **Needs and services.** Import PRs #14–#15. Reconcile the single `state_changes` registry to support `plans`, `commitments`, `needs`, `service_cases`, and all existing canonical mutations. Reject stale before/after, cross-actor edits, and partial transactions.
6. **Chapter boundary integration.** Run multi-actor synthetic cases with an unfinished NPC plan and service/need/commitment crossing CH-000 -> CH-001 -> CH-002. Assert immutable closed history, globally monotonic event and transcript IDs, and no private-plan leakage.
7. **Meridian Bay geography.** Integrate #19 and prebuilt #21–#23 in a separately reviewed increment. Resolve the #20 atlas crosswalk before promoting proposed places. Keep `unknown` times unknown; preserve PR #24 per-actor travel budgets.
8. **Validate full pipeline.** Run complete Node/Python/validator suites and remote five-file readback on **QA-only** state; test interrupted saves and replay without duplicate turns; verify no regression relative to each source branch's relevant tests.
9. **Review gate.** Produce a combined diff, CI evidence, open issues and compatibility matrix for owner approval. Do not merge into PR #25, `work/chat-narrative-foundation`, or `main` by default.

## Minimum acceptance tests for the actual integration

- Existing canon from all five Git blobs remains identical, before and after isolated synthetic tests.
- PR #25 plan creation/blocked/recovered/completed flows still pass when NPC needs and service cases are present.
- A two-NPC social interaction updates each actor through its own event and does not reveal either character's private knowledge to Jack.
- A recurring NPC commitment and its source event survive a chapter boundary with no invented attendance, completed delivery, exact weekday, or Day-0 ability.
- A service case cannot close merely because it is `due`; explicit reviewed action and evidence are mandatory.
- An NPC exterior trip must follow known connectivity and fit its own time budget, including when other NPCs move simultaneously.
- Unknown school and business schedules do not convert to arbitrary observed facts.
- A failure at any save stage leaves a recoverable attempt, not a second played scene.
- Real-world background execution is **not** claimed. Fiction advances only during authorized turn processing.

## Open blockers (do not represent as fixed)

1. No combined QA run or merged code for PR #25 plus PRs #10–#15 is currently evidenced.
2. The PR #25 pilot does not yet implement organization economies, ARC records, broad-world plan disclosure, or the Day 0 event transition.
3. Live token-backed journal recovery is not established by mocked or local tests.
4. Review of private vs. public author secrets is required: a public GitHub repository is readable regardless of narrator-private labels.
5. Chapter prose quality is editorial and cannot be certified by structural CI alone.

## Hand-off

**Current task:** reconcile the first real code integration (obligations + agenda/decisions) on a new isolated implementation branch. Import tests, repair contracts, and run CI before adding the next dependent NPC subsystem. Preserve other agents' branches and do not claim merged world functionality before a combined QA run.  
**This audit does not authorize or perform a story turn, merge, or private plot disclosure.**

## QA-only seam tests in this audit branch

- `tests/integration_npc_chapter_contract.test.mjs` verifies that empty, forward-compatible `needs`, `service_cases`, `commitments`, and `plans` collections survive a reviewed metadata-only chapter transition without any live story writes.
- `tests/integration_multi_actor_plans.test.mjs` creates two independent **synthetic** NPC intentions and obligations in one staged turn (Rosa and Noah), checks event ownership, private diagnostics, and carryover across CH-000 → CH-001 without touching the real chapter.
- These smoke tests exercise PR #25's embedded PR #10 obligations contract. They do **not** claim the independent PR #11–#15 agenda, social, needs, and service implementations have been merged or verified together.
- CI is required after each additional test commit; do not label the new test validated until the run on that exact branch HEAD passes.
