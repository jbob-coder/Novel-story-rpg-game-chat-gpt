# Evidence-linked context management — read-only pilot

**Date:** 2026-11-14. **Status:** isolated, review-only implementation stacked on PR #27. It does not narrate, advance the world, write a save, edit canon, or automatically merge other agents' work. The authoritative story branch remains work/chat-narrative-foundation.

## Source of truth and compression boundary

The narrative already has five atomic save files, verified global EV/TXT history, closed-chapter archives, current state, and canon/decision rules. **A summary can only help locate these records; it cannot replace or silently rewrite them.**

Organize context into four levels:

1. **Authoritative records:** docs/CANON.md, docs/DECISIONS.md, narrative contract; exact event history; full chapter transcripts; materialized world state; save manifest and journal. Read from the authorized branch at a verified immutable Git commit. A partial save blocks narration.
2. **Working context:** active chapter and turn, in-story day and time period, Jack's location, last completed scene, nearby relevant actors, unresolved threads, recent causal events and player-pending action. Keep small and rebuild after a verified save.
3. **On-demand references:** find matching EV/TXT IDs and document paths for the active question; dereference just the original sources needed. All returned summaries must carry a source path plus stable record ID. Never treat a file-path pointer as file contents.
4. **Long-range navigation:** evidence-linked per-chapter, character, organization, location and timeline summaries may later be produced from original sources and approved. Record last verified source commit, covered EV/TXT ranges and any uncertain or proposed details. Invalidated summaries are regenerated, not used to overwrite literal dialogue.

## Safe narrative cycle

1. **Resume:** Confirm branch vs stacked drafts; read manifest, world state, active five files, closed history and durable journal from the same immutable commit. Run existing snapshot validators. For a verified but interrupted delivery, replay the saved text verbatim. For a blocked save, stop and recover; do not create another turn.
2. **Select:** Build a small narrator-private packet. Search by the actual player action and current scene. Fetch original documents and events needed for character identity, knowledge, location/travel, causal consequences, timing, and NPC intentions. A query about Aster requires game/ASTER_SPEC.md and relevant EV/TXT records, not a guess from a vague summary.
3. **Resolve:** Only the player's own free-form action advances the session. NPCs may act independently during justified in-fiction time, not while the chat is inactive. Maintain actor-specific facts, rumors, secrets, resources, commitments and plans; intentions do not equal outcomes.
4. **Stage and save:** Generate and review the complete literary response; record it in the literal transcript together with events, chapter, state and manifest; validate and commit atomically with expected-head checking and durable journal protection. Read back the original five files before claiming saved.
5. **Refresh:** Discard the old context packet. Re-index the new verified checkpoint, refresh relevant actor/chapter summaries and handoff pointers only after the save is confirmed. Revisit corrections and closed chapters by exact EV/TXT provenance.

## Pilot API

tools/context_manager.mjs exports:

- buildContextPacket({snapshot, audience, query, maxReferences, maxPreviewCharacters, sourceCommit}). Calls verifyNarrativeSnapshot and indexes allEvents and allTranscriptEntries, including old chapters. Returns current checkpoint fields and a bounded list of source paths and exact IDs. The latest two items act as recency anchors. Documents are pointers only. sourceCommit is caller-supplied and must be checked against actual repository readback; passing a string is **not independent verification**.
- resolvePrivateContextReference({snapshot, referenceId}). Validates again and returns an exact cloned event/transcript record; for registered document pointers, returns an instruction to fetch the original from the verified repository version. It has no network access and performs no writes.

narrator_private may include event-outcome excerpts and internal source pointers. reader_visible deliberately includes transcript **pointers only**, never excerpts, event details, NPC plans, needs, threads or full private state. This limits accidental disclosure but is not a substitute for fact-level knowledge controls. Earlier chapter prose may contain historical spoilers; a transcript pointer does not authorize repeating all its content. A known_to field is too coarse to approve every detail of an event.

The first index is deterministic keyword-based retrieval, not semantic RAG. It rebuilds from verified history at request time; for large volumes, implement a per-commit incremental index and bounded cache invalidation. This pilot does **not** generate summaries with an LLM, host a daemon, integrate GitHub reads or enable real journal-backed saves.

## Tests and acceptance

tests/context_manager.test.mjs checks the CH-000 turn-9 / EV-000029 / TXT-000020 anchors, query matching for Aster, preview limits, no mutation, reader-only privacy boundaries, literal event/transcript reference resolution, invalid request rejection and references surviving a synthetic CH-000 → CH-001 transition.

Before production use, verify Node and Python suites, the checkpoint validator and the real journal-backed resume/readback path on the exact head SHA. Add fact-level visibility/knowledge acquisition, reviewed derived summaries with source provenance, and intent-aware document retrieval. None of those broader features are claimed implemented here.

**Preservation guard:** No turn 10; no new power before Day 0; no changes to the five live story files; no rewrite of prior transcripts; no auto-merge.
