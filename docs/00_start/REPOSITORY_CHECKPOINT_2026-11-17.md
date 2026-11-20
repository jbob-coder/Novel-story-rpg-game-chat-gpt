# Living Superhuman World — full repository checkpoint

**Snapshot date:** November 17, 2026 (America/Puerto_Rico; related GitHub commit timestamps may be November 18 UTC).
**Repository:** jbob-coder/Novel-story-rpg-game-chat-gpt.
**Authoritative narrative branch:** work/chat-narrative-foundation.
**Immutable audited source commit:** ff2fc65d3359830729a97a440a4ec9b341815ec2.
**Default main HEAD at audit:** 52fcff9f2a9b94670b614fdac6b60032f5164c6d.
**Nature:** architecture/development checkpoint, **not a new fictional save**, new chapter, canon approval or release.
**Companions:** [area-by-area mechanics and task register](AREA_STATUS_AND_TASKS_2026-11-17.md), [branch and Meridian Bay workstack](BRANCH_AND_MAP_WORKSTACK_2026-11-17.md), and [immutable full 129-file inventory with Git blob hashes](REPOSITORY_FILE_SNAPSHOT_2026-11-17.json).

## 1. Read this first: source hierarchy

Do not infer game state from this dated document after the branch advances. At every resumption, inspect the actual authorized branch HEAD, the independent save journal, current manifest, state, five chapter/save files, closed-chapter history and governing canon; compare exact records before producing narration. The order of authority is:

1. Owner-approved CANON.md, DECISIONS.md and the controlling NARRATIVE_CONTRACT.md, together with recorded player choices.
2. Verified literal chapter transcript and causal events, with explicit owner-authorized revisions.
3. Coherent materialized STATE.json and SAVE_MANIFEST.json at the same immutable commit.
4. Chapter prose, character dossiers and source-linked reference records.
5. Development audit, handoff, README, indexes, QA plans, PR descriptions and conversation summaries.

Documentation may be chronologically newer than a story event without becoming a fictional event. Proposed city roads, speculative actors and draft mechanics are **not** adopted by being listed here.

## 2. Evidence-backed executive snapshot

| Area | Verified present state | What remains to finish |
| --- | --- | --- |
| Novel format and narrative rules | Owner-approved interactive novel; numeric RPG retired; scene craft and agency standards written | Test a new actual player scene for prose quality as a separate gate from persistence |
| Saved campaign | CH-000, turn 9, Day -29 morning, EV-000029, TXT-000020 | Await the owner's actual turn 10 action; never synthesize or advance it during engineering |
| Player/family and Aster | Jack, Elena, Rosa and workshop established; Aster first arm manually mounted only | Continue fabrication only through player action; validate any new functionality or family developments as causal events |
| NPCs and organization | Seven named saved NPCs and one transit organization with goals/knowledge; typed event effects | Expand needs, schedules, competing priorities, relationships, service capacity and multi-scene consequences, without auto-ticking |
| World and cosmic event | Modern alternate Earth, Meridian Bay opening; Day 0 shockwave approved, not reached | Implement and test Day 0 once-only causal transition and later ecological/social effects; do not invent actual wave outcomes |
| City/world layout | Saved world has eight LOC places plus CITY container and known coarse links | Integrate reviewed Phase 1 six-place draft separately; spatial map remains draft, physical full-city coverage unmeasured |
| Transport, schedules and time | Coarse temporal consistency, route/availability/travel proposal modules and tests | Ground real scene travel, weekday/schedules, frontage, access and NPC constraints; no invented exact duration |
| Inventory, finances and technology | Materialized items, financial ledger and device registry have event provenance | Maintain transfer/account/device changes via real events; no fabricated exact account totals or 500 device rows |
| Consequences and knowledge | Typed changes, independent thread registry, private/visible distinction | Add fact-level knowledge/privacy propagation and long-chain cross-character consequences |
| Chapters and history | Literal transcripts, event IDs, revisions; a multi-chapter engine and synthetic transition tests exist | First authentic CH-001 boundary, locked historical archives and round-trip recovery in a real authorized session |
| Saving/recovery | Atomic five-file Git tree protocol, seven-stage gate, durable GitHub journal baseline ready; tested isolated QA transport | Prove a fully changed valid new-turn, connector-native save+recovery without a second authority; then an owner-authored canonical turn |
| Context management | Read-only bounded keyword/source-ID packet and verified loader integrated | Improve targeted retrieval and reviewed derived summaries without replacing source evidence |
| QA/integration | Node, Python, state validation CI; prior PR #71–73 and QA transport passed; PR #2 remains draft | Test integrated candidate branches at current HEAD; editorial and real-turn launch acceptance remain |
| Branch/work governance | Main left untouched; many map/NPC PRs are open, stacked and noncanonical | Reconcile dependencies and review one coherent change at a time, never force-merge a draft |
| File discoverability | 129 baseline tracked files; 95 paths in the pre-audit central inventory | Preserve one canonical location per resource and fix missing inventory/index pointers |

The snapshot is **not** a percent-complete estimate. No credible overall completion percentage has been measured. A draft map's 8/13 known exterior-link coverage does not mean 61.5% of the physical city is complete.

## 3. Current playable state (literal checkpoint reference)

At source SHA, game/SAVE_MANIFEST.json identifies CH-000, completed turn 9, 29 causal events and 20 transcript entries. game/STATE.json places Jack Wilson (PLAYER-001, age 21) at LOC-WILSON-WORKSHOP, morning on in-fiction Day -29; exact calendar date and clock time remain null. The current pending object says await_player_action and preserves his last full player action.

In that actual turn, Jack returned Elena's backpack (with the USB she prepared for her digital illustration); Elena left the home **on the way to school**, with no arrival adjudicated. Jack and Rosa confirmed the neighbor's alarm-clock cover repair, and Rosa intends to return it. Jack mechanically mounted and manually checked Aster's first arm; powered motion, actuators, load tests, autonomy, flight, weapons and other proposed modules **remain absent/unverified**. The story is at a natural pause, not a checkpoint for automatic continuation.

Existing relationships: Elena (17) and Rosa (73) are family; Noah is a repair/components contact; none automatically knows Jack's secret technology or financial history. His established private active 500+ fictional device network predates the **nine** newer Café Bruma records; individual older-device IDs are not written, and two intermittent responses versus seven silent café sources must not be described as loss of the older network. Two personal and two business-operation account balances appeared in-fiction; currency, overall reserves and legal entity names remain unspecified. No real-world financial account access is implied.

Four saved causal threads exist: Jack's device consequences (open), Sora's equipment review (resolved), Mara's café bill (resolved), and details of Jack's accounts/companies (open). Two explicitly authorized historical revisions are preserved in chapters/revisions; no completed chapters have been closed. Shockwave, observed human powers, altered wildlife, plants and environment remain false.

## 4. Mechanics actually in the authoritative branch

The following are real source modules and tests on ff2fc65d; **a module's existence does not prove automatic play**:

- Narrative and events: tools/turn_engine.mjs, state_changes.mjs, narrative_archive.mjs, consequences.mjs.
- Independent actors: tools/living_world_routines.mjs, living_world_commitments.mjs, living_world_obligations.mjs, world_plans.mjs, living_world_diagnostics.mjs.
- Time/location: tools/living_world_time.mjs, living_world_travel.mjs, living_world_availability.mjs.
- Chapters: tools/chapter_history.mjs, chapter_management.mjs; synthetic transitions and immutable archive verification.
- Persistence: tools/save_gate.mjs, save_transaction.mjs, github_save_adapter.mjs, github_save_journal.mjs, living_world_coordinator.mjs.
- Context: tools/context_manager.mjs, verified_context_loader.mjs.
- Validation: tools/validate_state.py, 29 tests under tests/ and one CI workflow.

The GitHub token-backed Node adapters are not implicitly executing inside an ordinary ChatGPT chat. The direct GitHub connector has shown Git object/ref and journal operations on isolated QA data. It has **not** proved a newly authored real chat turn is journaled, validated and saved before its narration is shown. A ready journal is a pre-journal baseline, never a retroactive verified save.

## 5. Mandatory rules across every area

1. **Format:** original interactive novel, third-person limited, no levels, XP, classes, stat checks, dice, fixed-choice menus or mandatory dramatic cliffhanger. Existing progression fields are frozen historical compatibility.
2. **Agency:** player chooses Jack's movements, voluntary risks, thoughts, voice-collar messages and decisions. Narrator acts only on chosen actions plus plausible external consequences. NPCs can have their own goals, but no omniscient knowledge.
3. **Causality:** material changes to ownership, position, relationship, conditions, knowledge, plans, resources, obligations and time need reviewed event-linked before/after evidence; unseen NPC acts stay private.
4. **Fictional cybersecurity:** events and consequences in prose only, no operational real-world intrusion, persistence, evasion or credential procedures.
5. **Clock:** in-fiction time advances for a justified player turn, not while ChatGPT is inactive. No superpowers or wave-made ecological effects before Day 0; do not invent civil weekday, clock, nation, currency or travel minutes.
6. **Save-first delivery:** exact player + narrator transcript, event JSON, chapter prose, state and manifest saved together in one Git commit, checked against source HEAD, reread byte-for-byte. A failed/pending journal blocks new narration. Saved is not necessarily displayed.
7. **Preservation:** do not overwrite prior turns or other agent branches; no forced pushes, no duplicate world database, no MCP/Codex/paid hosting, no automatic merge into main. All committed material is public fictional data only.
8. **Status labels:** CANON/SAVED, IMPLEMENTED+TESTED, READ-ONLY PROPOSAL, DRAFT PR, HISTORICAL/SUPERSEDED, and NOT VERIFIED must not be conflated.
9. **Index governance:** retain original canonical file paths; new docs must be discoverable in relevant indexes and docs/FILE_INVENTORY.json; this checkpoint never replaces original source files.

See [area-specific rules/tasks](AREA_STATUS_AND_TASKS_2026-11-17.md).

## 6. Root layout (purpose, not a duplicate source tree)

| Path | Ownership and meaning |
| --- | --- |
| AGENTS.md | Mandatory start/handoff order and most recent safety notices |
| INDEX.md, README.md | Root navigation and delivery description; not live state |
| docs/00_start | Session boot, readiness, handoffs and this dated engineering snapshot |
| docs/01_world | World/canon navigation; Meridian Bay design drafts live in other branches, not this audited HEAD |
| docs/02_characters | Character and NPC/equipment navigation |
| docs/03_systems | Mechanical/narrative system contract and effects |
| docs/04_story | Chapter/narrative guidance and explicitly deferred branching design |
| docs/05_persistence | Save, context and journal protocol |
| docs/06_quality | QA standards and connector QA evidence |
| docs/*.md, docs/FILE_INVENTORY.json | Original authoritative reference documents, historical status logs, and path registry; indexes are pointers only |
| game/STATE.json and SAVE_MANIFEST.json | Canonical materialized story state and last coherent save marker |
| game/characters, world, equipment, finances, saves | Navigational grouping; populated data are chiefly in the original game root, equipment registry and finance ledger |
| chapters/CH-000.* | Real chapter prose, events, transcript and preparation; revisions/ stores exact user-authorized supersessions |
| tools/*.mjs and validate_state.py | Pure stage/proposal/validation modules plus optional GitHub remote adapters |
| tests/* | Automated Node and Python regression tests |
| .github/workflows/narrative-qa.yml | GitHub PR integrity CI |
| Separate journal/* branch | Independent durable save-attempt evidence; **not** a narrative branch or alternate world authority |
| Separate qa/* branches | Test artifacts; **never** resume canon from them |

The [full file manifest](REPOSITORY_FILE_SNAPSHOT_2026-11-17.json) records the exact 129 original blob paths, SHA hashes and sizes to support later integrity comparisons. It does not include itself (avoids circular checksums) or unmerged draft branch files.

## 7. Milestones: what is real vs what is only a candidate

| Milestone | Observed evidence | Acceptance still missing |
| --- | --- | --- |
| M0: original canon and recoverable opening | Character/world docs, stable IDs, saved manifest, exact transcript | Routine cleanup of stale index and status pointers |
| M1: qualitative continuity | Typed state-change and consequence tests, archived scenes | Full real multi-turn continuity and literary user playtest |
| M2: living actors | Goal and routine proposals, explicit review/staging, obligations/conditional plans | Demonstrated long-run independently varied outcomes, needs/social/economic tradeoffs, fact privacy |
| M3: spatial/civic world | Existing location graph; substantial multi-PR *draft* Meridian Bay layout | Branch integration, physical road/access review, services, NPC ties, true world-building coverage |
| M4: persistence and chapter lifecycle | Five-file save engine, journal ready, mock and isolated remote QA, synthetic chapter transition | Complete authorized new-turn connector route, actual CH-001 transition and interrupted recovery |
| M5: narrative quality | Detailed scene contract, explicit agency and free-form story | New player-authored scene evaluated and saved faithfully |
| Day 0 and later | Canon only | Once-only arrival/event, conditional awakenings, geography/ecology/social effects, privacy and causality tests |
| Standalone app / preauthored branch library | Historical browser prototype and explicitly deferred planning | **Not an active milestone** without later owner decision |

## 8. Current risks, ambiguity and stale guidance

- **Stale document traps:** older PLAY_READINESS percentages, IMPLEMENTATION_PLAN's six-turn instruction, WORLD_BIBLE's "no story turn resolved," STARTING_CAST's old RPG stats/payment status, RECOVERY's old turn-6 example and the old XP-focused "open decisions" sentence in DECISIONS.md are **historical**. Do not delete their context indiscriminately; point current readers to the manifest and controlling contract.
- **Narrative vs draft geography:** many populated draft map/route files exist only on separate PR stacks. None is a saved Jack visit or a legally open business. Do not quote proposed city coverage as game completion.
- **Live connector:** prior node runtime and no-op connector QA succeeded in different, narrower situations. No verified owner-turn write/readback inside ChatGPT; this is the immediate engineering launch gate.
- **Index drift:** the old central file inventory did not enumerate 34 of the 129 existing baseline paths. The snapshot includes a complete immutable file list; maintenance should register noncanonical supporting files without treating every QA note as primary canon.
- **Public repo and private viewpoints:** hiding facts from Jack's prose does not hide them from the public GitHub repository. Never put private real-world user material or passwords there.
- **Multiple PR stacks:** open draft city and NPC branches have overlapping bases; a green test on a past branch is not proof of clean current integration or runtime world admission.

## 9. Ranked near-term work queue (engineering, not story play)

**P0 — Live save acceptance.** Use isolated QA branches to author a valid synthetic *changed* turn through the existing engine; independently exercise the authorized ChatGPT GitHub connector, durable journal, atomic tree/commit, deliberate interruption, exact changed-file replay, recovery and readback. Verify no double turn and no main/canonical changes. Only then process an actual player-authored turn when given.

**P1 — Safe integration of Meridian Bay.** Rebase/reconcile PR #33 and the stacked spatial proposals against current branch HEAD without overwriting recent save code; review six proposed institutions and geographical evidence; run current CI; preserve CH-000. Promote selected layout into game state only by reviewed, journaled world admission, not merely by merging documentation.

**P2 — Reliable social simulation.** Compare the existing routine/plan/obligation modules against unmerged NPC needs/social/services PRs; integrate narrowly with strict actor ownership, knowledge isolation, event provenance and tests; make behavior credible when players act over in-fiction time.

**P3 — Physical geography and services.** Finish the five known draft frontage links not covered by the principal 8/13 series, reconcile the three separate editable physical fragments, design blocked/public paths, building use, realistic service constraints and actor-dependent access. Coverage of the entire city remains unknown.

**P4 — Chapter/Day 0 and narrative quality.** Test real chapter turnover, first post-Day0 wave events and long-term qualitative growth only as separately verified future milestones; defer owner-open power specifics and standalone conversion.

**P5 — Keep reports cheap.** At future sessions, read this summary, live HEAD, journal and manifest, then the small relevant file group; use source IDs and Git commit evidence, not repeated repository-wide research. Update the area board only for verified changes and explicitly mark what has not been measured.

## 10. Restore and handoff template

Upon a future request to continue development:
- Confirm repository, branch and HEAD; note whether this document is stale relative to new commits.
- Read AGENTS.md, current manifest and journal; for play also verify entire five-file active snapshot and all declared closed chapters.
- Identify the requested **development area** using the [area board](AREA_STATUS_AND_TASKS_2026-11-17.md); load only those source files and tests.
- Determine whether work is canonical, mechanically tested, draft/QA-only or just a proposal. Identify owning PR and dependencies first.
- Implement on a fresh scoped branch; use targeted, non-destructive changes.
- Verify Node/Python/validator CI on an appropriate branch, record exact SHA and evidence. Never claim tests were run unless observed.
- Update area status, rule changes, remaining tasks, owner decisions, branch handoff and links; never rewrite the immutable audit snapshot.

**Snapshot interpretation:** this is a detailed map of verified repository evidence on a fixed commit, **not** an assertion that every source line was semantically audited or that a full live gameplay session has been proven. The physical city and future story are deliberately incomplete.
