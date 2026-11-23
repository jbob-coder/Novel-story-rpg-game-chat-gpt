# Contextual NPC intent prototype — isolated QA, not game canon

This isolated experiment adds an **open-language, source-bounded intention preview** alongside the existing `recommendNPCIntentReviews` / `assessNPCDecisions` path. It does not replace the coordinator, create story events or choose NPC outcomes automatically.

**Baseline comparator:** Current deterministic recommendation prioritizes recorded obligations, then first applicable role routine. It is useful for plausible everyday life, but it does not itself enumerate entirely new authored intentions.

**Prototype difference:** `inspectNPCContextualChoices` returns each existing actor's personal goal, plan, needs, known events, literal memory, resources, relationships and commitments, without an action menu. `reviewNPCFreeformIntent` accepts a new free-text intention, checks actor-owned event references and graph reachability, rejects stale evidence, and returns an unresolved private proposal. No direct contacts, deliveries, truth, access, time passage or success are inferred.

**QA scenarios:** comparative alternative intentions; actor-specific private knowledge; known event citation; unknown/future event rejection; graph-only potential travel; tampered and stale packet rejection; fourteen hypothetical day observations without autonomous time ticks or canonical changes.

**What this does NOT prove:** convincing long-horizon agent initiative, unattended simulation, verified semantic fidelity of natural-language reasoning, independent generation of intention text, real NPC success, or integration into player-turn save. The prose and reasoning still require an editorial agent; they are not produced by a deterministic action planner.

**Next recommended experiment:** With an explicitly cloned, synthetic checkpoint, stage reviewed actor events and measure whether selecting from context yields better continuity than the existing priority selector across multiple turns. Require provenance and no invented physical access. Do not advance real CH-000 turn 9.

**Protected scope:** A new tool module and test plus documentation/index/inventory entries only. No changes to game/, chapters/, existing NPC code, main, or world canon.
