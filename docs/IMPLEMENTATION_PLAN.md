# Implementation plan and acceptance gates

## Scope
This is a **ChatGPT-run story engine**, primarily a documented protocol and durable repository state, not a downloadable application. The narrative engine is the assistant guided by rules, verified files and the player's free-form input.

| Milestone | Deliverable | Acceptance check |
| --- | --- | --- |
| M0 — Continuity foundation | Startup index, recovery guide, schema, state manifest, validator, handoff | Fresh context can identify correct chapter/day/pending action; invalid mismatched save is flagged |
| M1 — RPG core | Attribute and skill rules, per-actor XP, power separation, chapter event schema | A training success/failure produces a traceable XP delta and derived skill rank; cannot grant pre-Day-0 powers |
| M2 — Living actors | Stable NPC identities, goals, memory, knowledge, relationships and offscreen action events | NPCs act without a player trigger and cannot use information they do not know |
| M3 — World consequences | Organizations, ecology, public reactions, time and location continuity | Consequences propagate across later chapters and Earth changes do not occur before the shockwave |
| M4 — Session lifecycle | End-to-end chapter play, event log, verified saves, restore and interruption recovery | Resume a later chat from repository state without fabricating or duplicating an action |
| M5 — Narrative quality | Clear stakes, user choice, consistent agency, pacing and playtest feedback | Real player turn is narrated, saved and faithfully resumed |

## Dependencies and guardrails
M0 and the initial M1 **documentation** can precede player character creation. Detailed character stats and NPC biographies must wait for actual play or an approved worldbuilding pass. No live NPC autonomy, real story progression or RPG balance is verified merely because documentation exists. Numbered XP thresholds are provisional and should be validated in play.

## Work order
Complete continuity foundation and run validator. Then develop the first guided/free-form player turn (CH-000), persist the event and checkpoint, test reloading after loss of chat context, and finally extend NPC/world depth incrementally. PR #1's browser UI is not a prerequisite. Use a reviewable branch; do not merge into `main` without owner approval.
