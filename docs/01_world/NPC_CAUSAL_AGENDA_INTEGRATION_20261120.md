# Causal NPC agendas — selective PR #11 integration candidate (2026-11-20)

**Status:** proposed for review on `work/npc-causal-agenda-20261120`. No claimed merge, no autonomous story turn. The canonical narrative branch remains `work/chat-narrative-foundation`; `main` is the consolidated code base.

## Verified starting point and dependency

- Source of the historical design: PR [#11](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/11), `work/meridian-bay-causal-routines-20261112`, module `tools/living_world_agenda.mjs`.
- Port target: `main` at `019175c6463ff31807a0f7013d91299add94913c`, after PR #2 and #80. The present checkpoint has **15** world location records (14 LOC plus the city container), not the 9 used by some historical tests.
- Existing `living_world_commitments.mjs` no longer takes a `targetDay` argument; it accepts `elapsedDays` and reviews commitments owned by **all NPCs** even when routine selection is narrow. The old agenda therefore could misdate obligations and attribute a different actor's saved obligation to the selected actor.
- Qualitative NPC needs and Meridian Bay service cases already exist; neither is copied or overridden by this change.

## Scoped changes

1. Port the 15 earlier role-backed proposals and private contact preview as *read-only* candidates. Unknown school, recipient and neighbor destinations remain unknown. Availability is never inferred from a fictional Day -29 weekday or an unverified clock.
2. Pass the current time contract to obligation review, filter obligations by **their true actor owner**, and classify their urgency at the **day being reviewed**. A blocked task remains a question, not a completion.
3. Only return two-NPC contact possibilities when both recorded locations match an established place; proximity alone cannot create conversation, knowledge or relationship changes.
4. Expose `causalAgenda`, `recommendedNPCIntents` and `possibleNPCContacts` on the narrator-private `inspectLivingWorld` report. The `playerVisibleDiagnostic` projection remains a small explicit allowlist and does not expose these new fields.
5. Add tests covering modern map count, saved actor separation, day-bound deadlines, unknown destinations, time validation, privacy, zero elapsed time and nonmutation.

## Scope limits

No `game/` or `chapters/` files are changed, no role schedule or turn is executed, and no new map, relationship, school arrival or player knowledge is created. This is a source-level agenda and diagnostic integration, **not** a port of PR #11's civic-map proposals, PR #12's decision resolution or PR #13's social-event persistence.

## QA and handoff

Run the configured GitHub PR-to-`main` checks (Node suites, Python suites and checkpoint validator) on the **exact final head**. Inspect CI and commit status before marking this slice verified. Compare the five canonical save file blob hashes to the baseline. Do not merge automatically into protected `main`.

Next slice: inspect PR #12 against the new agenda and the current coordinator; then adapt PR #13 social validation and event-history linkage. Reject accidental double-counting of NPC obligations and private knowledge leakage. A hypothetical social encounter must be attributed and reviewed by both actors and cannot occur merely because they share a place.
