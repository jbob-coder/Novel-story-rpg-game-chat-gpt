# Evidence-linked context management — read-only pilot

**Original pilot:** PR #28 (2026-11-14). **Independent port:** 2026-11-15, isolated context-integration branch based on the currently verified narrative foundation, without merging PRs #26–#28 or their NPC-needs dependencies. Read-only: no narration, save, automatic actor decisions, or new canon.

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

## Verified remote loader (independent integration)

`tools/verified_context_loader.mjs` exports `loadVerifiedContextPacket({remote, journal, branch, audience, query, maxReferences, maxPreviewCharacters})`. It accepts an injected read-only GitHub adapter, and optionally a read-only durable-journal adapter. It reads HEAD, retrieves the manifest and complete active/closed-chapter records at the **same immutable commit**, invokes the existing structural validator, builds a bounded context packet, and checks HEAD and journal again before returning. It rejects a blocked journal or records changed during the read. A previously verified journal may precede documentation-only commits **only if all five canonical story files still match the journaled commit exactly**.

The result reports `loadStatus='verified_read_only'`, `sourceCommitStatus='verified_immutable_remote_readback'`, a `journalGate` value, and `mayAdvanceStory=false`. A missing journal does **not** block read-only research, but does **not** grant permission to narrate or save a turn. The loader is intentionally **not** an authorization token and does not write to GitHub. The separate save/recovery controller and journal are required before actual gameplay.

The loader never treats the active chapter as a fixed `CH-000`: it first reads `game/SAVE_MANIFEST.json` at HEAD, then loads the chapter and declared closed-chapter archives. It returns pointers rather than reproducing reference documents. `reader_visible` does not return private event outcomes or exact transcript excerpts. Source files and transcript words must be reread and filtered against player knowledge before disclosure.

**Explicit limits:** No semantic RAG or LLM summaries; no automatic background updates; no proof of full reader-visible delivery; a verified GitHub snapshot is only structurally and temporally checked by existing validators. Multi-writer GitHub REST updates are not atomic compare-and-swap. The next real player turn must come from the owner and pass the full journaled five-file save process.

### Integration tests

`tests/context_manager.test.mjs` preserves the original pilot's exact checkpoint and chapter-transition checks. `tests/verified_context_loader.test.mjs` exercises remote readback, journal absence/blocked/verified states, source-commit byte reconciliation, race rejection, reader-projection limits and invalid input. Both tests are synthetic and must pass on the independent branch before integration; the PR and CI run are the authoritative verification record.

## NPC memory retrieval (bounded, private, no extra database)

`buildContextPacket({snapshot,npcIds:['NPC-005']})` can include the selected NPC's
exact saved qualitative actor state (knowledge, relationships, goals, resources,
independent plan, needs/cases/commitments, last resolved action) and up to ten
recent actor-related EV pointers with source paths. The actor's full current
state is read from the *verified* `game/STATE.json` snapshot; pointers lead
back to original archived events across chapter transitions. No memory is
invented or overwritten by summarization. For older events, read the verified
original event history; the ten pointers are a context budget, not a limit on
what the character remembers.

Use `loadVerifiedContextPacket({remote,journal,branch,npcIds})` to obtain the
same private projection after the immutable-HEAD, five-file and journal checks.
Select explicit **established** NPC IDs from the active scene or action;
unknown, duplicate or player IDs are rejected. When `npcIds` is omitted,
auto-selection may add compact NPC memories as described below. `reader_visible` forbids nonempty NPC selections and
never contains private actor state. Related event pointers are only contextual
evidence: `known_to` does not mean an actor learned every detail. Consult
the actor's saved knowledge and causal sources before deciding what they can
react to or tell Jack. This function does not make decisions, advance time,
save turns or start a background process.


## Automatic bounded NPC recall (2026-11-22)

For the narrator-private packet, `buildContextPacket({snapshot,query})` and
`loadVerifiedContextPacket({remote,journal,branch,query})` now retrieve up to
**three** candidate NPC memory projections automatically, matched from the
**saved actor identity** and the input's exact NPC ID, full name or unique given
name. A character whose saved location exactly equals the player's may also
be selected. `sceneNpcIds` permits explicitly attributed scene actors when
a narrator has prior evidence of their involvement (e.g. a remote call). It
does **not** prove that they are physically present; neither a graph neighbor
nor a claimed place name can silently establish an encounter.

Automatic recall uses only a small snapshot of actor attributes, up to four
ranked knowledge facts, and four recent original event pointers. It includes
a knowledge count to expose truncation and a path to the full saved actor
record for further source-backed investigation. A source reference does not
grant the NPC extra knowledge or permission to disclose a fact. Critical
details omitted by this compact projection must be checked in the original
state/events before changing actor behavior.

An explicit `npcIds` input continues to return complete actor state and up to
ten event pointers, and overrides automatic selection. Use
`autoNpcMemory:false` to get the previous manual-only behavior.
`reader_visible` never auto-retrieves NPC memory and rejects explicit/scene
selection. The loader still checks an immutable Git commit, five-file
checkpoint, branch stability and any available journal. No new memory store,
background process, NPC action, new canon or turn is created.


## Ambiguous identity and literal NPC fact evidence (2026-11-22)

The narrator-private packet now emits `npcAmbiguities` when a mentioned given
name belongs to multiple established NPC records and no explicit full name
identifies one. No actor is selected on that ambiguous name alone; pronouns
are not resolved by guesswork. This is a **review hint**, not evidence of
presence. `reader_visible` never receives ambiguous private actor IDs.

`checkNPCFactEvidence({snapshot,actorId,fact})` and optional
`npcKnowledgeClaims:[{actorId,fact}]` in both context/verified loader check a
literal fact against that actor's recorded `knowledge`. Event-sourced entries
are recognized only when the exact event's state_changes contain the same
actor, original fact, source and saved knowledge string. Outcomes are:

- `recorded_event`: precise actor-specific EV provenance found.
- `recorded_checkpoint`: literal actor knowledge already in saved state,
  without a newer event pointer.
- `not_recorded`: no matching literal knowledge; don't treat mentions or
  `known_to` flags as proof.
- `unverified_provenance`: an apparent EV suffix does not match original
  actor-owned state change; don't assume the claim was learned.

Only the first two are sufficient **literal** evidence. Inference, hearsay,
ambiguous paraphrase, contradictory evidence, changing circumstances and
social transfer still require narrator review and a justified event; this
guard is **not** a general natural-language truth checker. The new claim
checks are capped at eight, read-only, narrator-private, source-backed and
journal-checked through the existing immutable loader. No story turn
advances and no new state fields are persisted.


## Non-literal claims, rumors and falsehoods (2026-11-22)

A fact-check's `mayAssumeKnown` refers only to an actor's exact recorded
*awareness of a statement*, **not** objective truth, justified belief,
perfect recall or permission to disclose. All checks now report
`truthStatus:'not_assessed'`. For a `not_recorded` statement, the
narrator-private result can include up to three
`relatedStatementsForReview` with shared lexical tokens and source-backed
text from the actor's own saved knowledge. They are explicitly classified
`review_only_possible_relation`; related wording may be a paraphrase,
negation, misconception, lie or unrelated statement. Never treat it as a
semantic match or verified knowledge.

Multiple people sharing a given name are checked **per occurrence**:
`Rosa Wilson ... Rosa` retains an unresolved bare-name mention even when
the first full name is known; two fully specified names are not treated as
bare references. Any subsequent pronoun still requires conversational
evidence. The helper does not make an identification or determine who
spoke.

A liar needs no recorded belief in the falsehood they utter. This checker
is not an action gate; it must not block inference, misinformation,
concealment or changing beliefs. New observed or communicated facts require
reviewed actor-specific event changes before they can be considered saved.
All functionality is read-only, private, capped and noncanonical by itself.


## Recuperación privada de hilos del mundo — incremento acotado (2026-11-22)

El índice contextual también proyecta los registros **ya guardados** en
`state.narrative_threads` como referencias `THREAD-*` del narrador. Los hilos
abiertos son elegibles incluso sin consulta específica; los resueltos se
recuperan por palabras relevantes. Cada referencia indica `game/STATE.json`
y el último EV original. `resolvePrivateContextReference` devuelve una copia
del hilo y rutas a **todos** los EV de su historial, incluso de capítulos
archivados. El resumen jamás sustituye esos eventos originales.

Esta operación solo lee el checkpoint verificado. No inicia sucesos, no
convierte rumores en hechos, no emite noticias, no actualiza a NPC y no avanza
tiempo ficticio. La clasificación `reader_visible` sigue excluyendo los hilos
y sus resúmenes: solo el narrador puede abrir estas referencias. Los campos
`visibility: known` y `known_to` por sí solos **no demuestran** que Jack
conozca cada afirmación; hay que comprobar la vía concreta de recepción antes
de incluirla en prosa. En el checkpoint histórico, por ejemplo, THREAD-000003
cita EV-000011 como `known`, mientras el EV registra solo a NPC-007 en
`known_to`; esta divergencia se conserva sin reinterpretar ni modificar
el save y requiere revisión contextual antes de cualquier divulgación.

La regresión aislada de `tests/context_manager.test.mjs` cubre hilos
abiertos y resueltos, recuperación exacta, ausencia de mutación, privacidad
del lector y una corrección hipotética de rumor por NPC mediante dos EV
distintos. Estos turnos sintéticos no se guardan en GitHub ni son historia.
