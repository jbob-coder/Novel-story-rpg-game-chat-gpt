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
