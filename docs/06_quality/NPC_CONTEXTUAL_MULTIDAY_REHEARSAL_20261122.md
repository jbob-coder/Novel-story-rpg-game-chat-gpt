# Synthetic seven-day NPC contextual comparison — acceptance gate

This evaluates PR #193's new **read-only, open-language intention review** against the existing routine-first selector without touching the canonical CH-000 turn-9 player save.

## Reproducible protocol

- Seven *synthetic* in-memory day intervals, one per deliberately authored test turn: each exactly 1,440 minutes and one day. Six different existing NPCs appear, one twice. Every staged private result cites an event that actor genuinely knew.
- For each actor-day, record the existing selector's primary recommendation (zero or one); submit **two externally authored** open-language intentions grounded in the actor's own context. Check both as proposal-only. For traceability, explicitly pass **one** reviewed intent into the existing causal continuation mechanism and stage a single private NPC event.
- Validate each synthetic checkpoint through full narrative verification, encode and decode five-file readback, preserve the player record, and reject forged private-event references.
- Expected metrics, subject to official CI: seven source-backed, reviewed NPC events; fourteen valid open-language proposals; seven distinct synthetic days; zero automatic decisions and zero authentic player turns. Test logs print a machine-readable `NPC_CONTEXTUAL_MULTIDAY_QA` line.

## Interpretation of the comparison

The existing selector is **not** proved inferior: it already offers competing routine alternatives and free-form narrator review. It returns at most one primary suggestion in this protocol. The prototype's two distinct accepted intentions demonstrate *interface flexibility*, not higher-quality actions, novel autonomous generation, or believable multi-day social dynamics. The seven actions and their reasons were explicitly written by the reviewer: **no NPC agent authored these actions on its own**.

Multi-day simulation here means **fictional days processed via staged synthetic turns**, not unattended wall-clock execution. Because time advances, the synthetic placeholders are neither legal player inputs nor canonical scenes. The five protected real checkpoint files must remain unchanged.

## Decision gate

A passing suite establishes evidence/continuity compatibility and a wider review surface. Do **not** merge it into the active narrative branch as an autonomous agent upgrade until a separate reviewed evaluation shows a genuine, non-tautological improvement in actor choice quality, state-dependent replanning, honesty about unknown locations, and consequences. No replacement of existing `recommendNPCIntentReviews` or `assessNPCDecisions` is included.


## Thirty-turn sequential replay — technical stress gate, NOT narrator-quality acceptance

The companion test in \`tests/npc_contextual_multiday_rehearsal.test.mjs\` now also builds **30 consecutive in-memory turns** (ten fictional minutes each, without moving the player). Each step obtains a *fresh* request for an existing NPC from the just-decoded five-file checkpoint. It either abstains or proposes a context-linked private intention, separately stages a reviewed, limited outcome, then validates and re-encodes/decodes the resulting checkpoint before progressing to the next step. The fixture chooses five existing actors for conservative private plan changes and two for abstention where a new school arrival or cafe shift cannot be inferred. The initial CH-000 save remains untouched.

The test-double **is not a language model**. Its example intentions are controlled template variants chosen from the NPC's current saved plan. This is deliberately a structural stress test of replay, memory ownership, privacy, chronology, actor-specific causal attribution, multiple abstentions and plan persistence, **not** evidence that the narrator generates surprising or convincing choices. It prints \`NPC_30_TURN_SYNTHETIC_QA\` with counts and \`narratorAutonomyQualityEstablished:false\` when it passes. Automated pass does not satisfy the independent narrative-quality merge gate documented in PR #193.

**Remaining acceptance:** perform a separately inspected, model-authored 30-turn run with no prewritten action list, expose each fresh NPC context *only after* the preceding verified result, review adaptability, evidence and semantic privacy case-by-case against the older selector, and record errors and counterexamples. Keep the PR in draft while that evidence is missing; do not activate or update Jack's real story.


## External model sequential evidence protocol (2026-11-24)

`tests/npc_model_authored_replay.test.mjs` consumes an append-only evaluation trace in `tests/npc_model_authored_trace.json`. An empty trace is a valid preparation state, **zero completed authored decisions**. The engine constructs the next actor request only after replaying and verifying every prior response and five-file readback. The SHA-256 of the exact request binds each externally authored response to the current state. Round-robin actor order is a coverage choice, not an action policy. No action menu, automatic proposal, model API, background execution or canonical save. CI logs only bounded fictional context metadata and plan/goal, not raw memories, event outcomes or relationships; retrieve relevant actor-owned evidence from the source as needed. A separate local/private evaluator may inspect the full request.

Append exactly one response after examining the fresh context: `requestSha256`, `author`, `proposal`; for an action also separately reviewed `reviewed:true`, `outcome`, and optional `changes`. Abstentions must not include effects. Preserve prior response entries and their commit provenance. Record semantic concerns and corrections, do not tune the engine to force a desired result. The digest binds a response to a request, but does not prove that an external model saw only that request or that reviewer independence exists. A separate evaluator must score grounded motives, novelty, replanning, evidence/privacy, feasible outcomes and justified inactivity; the runner deliberately never marks the quality gate passed. The old selector is consulted after proposal creation, for comparison only. No more than 30 synthetic turns; no canonical play. Do not publish full actor packets in public CI.
