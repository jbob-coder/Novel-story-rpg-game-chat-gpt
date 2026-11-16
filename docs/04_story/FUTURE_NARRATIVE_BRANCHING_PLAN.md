# Deferred design proposal — prepared branching narrative and future game portability

**Recorded:** 2026-11-16  
**Status:** PROPOSED / DEFERRED / **NOT IMPLEMENTED**  
**Project:** Living Superhuman World — Meridian Bay interactive novel  
**Authority:** Planning note only. Does **not** override `docs/NARRATIVE_CONTRACT.md`, `docs/DECISION_OUTCOMES.md`, saved canon, current gameplay rules, or branch ownership.  
**Trigger for review:** When the owner elects to expand preauthored narrative infrastructure, particularly before broad story-arc production or any future standalone game conversion. Do not initiate implementation automatically.

## Why preserve this note
During the November 16 discussion, the owner identified a limitation: the current world has relatively few fully developed NPCs, businesses, social institutions and concrete event relationships. Heavy improvisation during a player turn can distract from scene quality and make outcomes less consistent. The owner favors preparing the world's baseline and many plausible story branches **before** play, while keeping the freedom to make unanticipated choices. The inspiration mentioned was the *Heroes or Villains: Genesis* style of an interactive novel—**inspiration only**, not permission to copy its text, plot, characters or branches.

The owner explicitly deferred the larger game/branching implementation until **later** and requested a durable reminder across chats. This note is that reminder, **not** a task authorization to build or activate the system now.

## Proposed approach (not a locked implementation contract)
1. **Prepare world baseline:** Establish trustworthy location identities and geography, services, organizations, social connections, NPC goals/knowledge, unresolved situations and chronological anchor events. Facts distinguish canon from speculative proposals.
2. **Preauthor narrative possibilities:** For important situations, document prerequisites, scene entry conditions, plausible responses, immediate results, potential delayed consequences, knowledge visibility and alternative resolutions. A predetermined *situation* or milestone does not imply a forced ending.
3. **Use branching state rather than a rigid path:** An owner's free-form Jack action selects or creates an eligible branch. Track consequences in durable narrative/world state. Multiple paths may rejoin only when their facts and character states are compatible; preserve meaningful differences instead of resetting them.
4. **Handle the unexpected deliberately:** If the action is not covered by prepared branches, check canon, available time, character motivations and existing effects; add a coherent proposed branch or connection, then validate and persist its actual consequences. Never silently alter prior events to justify a surprise. Do not replace the owner's free-form action with forced multiple-choice menus.
5. **Concentrate on narration:** Prepared context should reduce repeated world invention and let the narrator prioritize scene craft, natural dialogue, character continuity and outcomes. Offscreen NPC activity stays causally constrained, selectively resolved at authorized fictional time advancement, not continuously simulated in the background.
6. **Protect hidden information:** A narrator/engine may track concealed NPC motivations and unresolved branches, but Jack learns only through plausible experience and evidence. No private event spoilers in reader-facing prose, logs, UI or progress hints.
7. **Keep future portability possible:** Event/branch definitions should be data-first and engine-neutral where practical, with IDs and explicit conditions/effects. A future standalone application would still need a runtime, UI, validation, persistence and content authoring; the tree alone will not constitute a finished game.

## Possible internal story-node data (example only; NOT an implemented schema)
- `node_id`, `arc_id`, `version`, `entry_conditions`, `world_facts_required`
- `scene_reference` or drafted scene text, `character_knowledge`, `reader_visibility`
- `allowed_outcome_variants` (not required menus), `immediate_effects`, `deferred_effects`
- `next_node_ids`, `rejoin_conditions`, `unresolved_dependencies`
- `origin_evidence`, `save_event_ids`, `canon_status`

Proposed arcs and branches must remain design data until a genuine player action and verified save establish a canonical outcome. Do not pre-create canonical events or active `narrative_threads` for hypothetical decisions.

## Optional user-facing notice for unplanned cases — LATER FEATURE
The owner requested at most a short one-line notice outside the narrative when an unprepared decision needs adaptation, e.g.:

`Story adaptation: validating an unexpected branch.`

Or, **only if actual discrete, verifiable stages exist**:

`Story adaptation: [######----] 60% — validating a new path.`

This is a proposed future experience, not a current working widget, background process, or a permission to invent progress. Do not claim percentages from intuition. Keep it brief, avoid spoilers, and separate it from the existing mandatory save-gate percentages (which concern verified persistence, not creative planning). The owner may refine its exact presentation later.

## Design choices still open
- Whether the target is an author-curated branching library, rule-assisted dynamic branches, or a hybrid; how much preauthored content to require.
- How much content to build for Railgarden and Market Row first; which NPCs and institutions need detailed profiles versus lightweight background simulation.
- The minimum branch/state schema, reproducible condition evaluation, event attribution, and when branches are allowed to rejoin.
- How event uncertainty is represented, and how to QA pacing, causal consistency, hidden knowledge, and NPC autonomy without numeric RPG stat checks.
- Whether an adaptation notice should be shown during ChatGPT-only play or **only** in a later standalone game. Do not assume this has been decided.
- The suggested '80% prepared / 20% adaptive' was a **discussion heuristic**, not a verified ratio, quota, user-locked design rule or completion metric.

## Conditions before moving out of DEFERRED
- Owner explicitly decides to revisit the future branching system.
- Check the then-current repository, active branch, saved chapter/turn, merged city/NPC features, and existing contracts.
- Draft a focused design with branch schemas and at least one small authored/tested example; verify no forced choice or canon rewrite.
- Test divergence and compatible reconvergence, immediate/deferred consequences, alternate NPC decisions, spoilers, chapter rollover, and exact save/readback.
- Review with owner before treating narrative branching rules as authoritative or starting a standalone game implementation.
- If approved, record implementation commits, QA evidence, migration plan and handoff; update **this** document's status and links.

## Current preservation and dependencies
At note creation, the known canonical checkpoint was CH-000, turn 9, Day -29 morning (verify from `game/SAVE_MANIFEST.json` before any real play). Meridian Bay Phase 1 city integration is separate draft PR #33 and **not** activated in that checkpoint. Do not alter `game/`, `chapters/`, `main`, or the saved journal because of this note.

Related existing guidance:
- [Narrative contract](../NARRATIVE_CONTRACT.md)
- [Decision consequences](../DECISION_OUTCOMES.md)
- [Narrative execution model](../NARRATIVE_EXECUTION_MODEL.md)
- [Development handoff](../HANDOFF.md)
- [Meridian Bay Phase 1 PR #33](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/33)

**Reminder for future assistants:** Surface this as a deferred proposal when narrative-tree authoring or standalone game conversion becomes relevant. Do not present it as already built, automatically prioritize it over the active milestone, or advance Jack's story because it exists.
