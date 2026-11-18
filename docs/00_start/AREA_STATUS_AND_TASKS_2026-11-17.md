# Area status, mechanics, goals, rules and remaining work

**Evidence cutoff:** immutable narrative SHA ff2fc65d3359830729a97a440a4ec9b341815ec2, captured Nov 17, 2026 in Puerto Rico. Branch references and PRs are dated review pointers, not automatically playable. Parent: [full repository checkpoint](REPOSITORY_CHECKPOINT_2026-11-17.md). Spatial/dependency details: [Meridian Bay and branch workstack](BRANCH_AND_MAP_WORKSTACK_2026-11-17.md).

**Status vocabulary:** SAVED STORY = committed in the five real story files; INTEGRATED CODE = present on the authoritative narrative branch; TESTED = backed by observed test evidence; DESIGN/DRAFT = prepared only on an isolated branch; DEFERRED = owner has not authorized activation; MISSING = no accepted implementation. These labels are independent: tested draft code can still be unmerged.

## A00 — Project identity, rules and integration custody

**Goal:** maintain one original interactive novel that can be developed by multiple agents and resumed without discarding or inventing decisions.

**Current state:** integrated root boot and domain indexes; authoritative branch work/chat-narrative-foundation; main remains separate and skeletal. The repo is public. Many independent draft PRs, especially Meridian Bay and NPC dependencies, are open. GitHub is the only authorized current store of story state; no MCP, Codex, paid runtime or cloned authoritative database required.

**Rules:** AGENTS.md is the starting point; no silent main merge, force push, branch overwrite or unrelated deletion. Owner-approved decisions outrank speculative design. Canonical file paths are stable. The owner must explicitly authorize irreversible story retcons or change of format. This engineering checkpoint does not grant such authority.

**Sources:** AGENTS.md, INDEX.md, README.md, docs/DECISIONS.md, docs/FOLDER_POLICY.md, docs/HANDOFF.md, docs/STATUS.md, docs/FILE_INVENTORY.json, .github/workflows/narrative-qa.yml.

**To finish/maintain:** periodically reconcile current PR base SHAs; annotate integration readiness and branch owner; keep indexes current; distinguish valid tests at their own commit from acceptance on the latest HEAD; move no old browser code into the ChatGPT novel without an explicit delivery decision.

**Accept when:** a new session can select its area and authoritative branch, verify latest SHA and avoid all draft/canonical mix-ups without rereading every historical handoff.

## A01 — Universe canon, chronology and Day 0 boundary

**Goal:** preserve a coherent alternate modern Earth beginning before a mystery cosmic shockwave; allow delayed and varied consequences rather than a forced powers plot.

**Current state:** SAVED + APPROVED: the story begins on Day -30; the shockwave arrives on Day 0 from a distant part of the universe; awakening may be immediate, delayed or absent; animals, plants and environment may eventually change. The played story is Day -29 morning with all five wave effect flags false. Year, exact geography, wave physics, frequency, transformed species, geopolitical institutions and future outcomes are not established.

**Rules:** do not activate superhuman powers or shockwave-created ecological changes before Day 0. No early civilian knowledge of hidden cosmic cause without a plausible source. Powers are not RPG class rewards and do not force hero/villain identity. Keep proposed world rules out of saved history until owner-approved or event-established. Calendar dates, nation and currency remain unknown when unspecified.

**Sources:** docs/CANON.md, docs/DECISIONS.md, docs/WORLD_BIBLE.md, docs/NPC_RULES.md, game/STATE.json time/world flags, tools/validate_state.py, tools/living_world_time.mjs.

**To finish:** design a deterministic once-only Day0 transition, flag effects by actor/location, define a bounded batch/event sequence respecting private knowledge, test gradual and no-awakening branches, prevent duplicate wave triggers on save recovery, get owner decisions on physical/cultural details only when material. Do not stage any Day0 change in the present checkpoint.

**Accept when:** a proposed Day0 transition is simulated/recovered on QA, cannot fire twice, cannot fire early, and supports ordinary humans and variable ecological impacts without assumed rates.

## A02 — Meridian Bay canonical topology and street design

**Goal:** a physically believable lived-in coastal city grown through historical changes, uneven property parcels, old/new roads, mixed building use and contextually connected districts—not a perfect master-planned grid.

**Current state:** SAVED locations include Meridian Bay container, Crosswater Plaza/Terminal, Market Row, Harbor Walk, Railgarden, Wilson home/workshop and Café Bruma. Their coarse connections are state facts, **not** surveyed streets. The optional PR #33 Phase 1 catalog proposes six more public-facing establishments, admission gates and a 100×80 planning canvas. Later draft stacks detail 8 of 13 known exterior graph links within a specific lineage and three physical fragments; **none** is part of the saved world or a validated complete city map.

**Rules:** a CITY container is not a travel shortcut; the workshop is inside the home and not a road intersection. A graph edge is not a detailed road. Proposal geometry never creates actual knowledge, travel time, an open shop or a verified arrival. Preserve played movement Crosswater → Market Row/Café Bruma → Railgarden/home. Café Bruma's observed distant terminal glow must be reconciled with future buildings/reflection, not erased by a high-rise or guessed measured sightline. Port restricted areas remain restricted unless separately established. Public waterfront views do not imply port access.

**Sources:** game/STATE.json world.locations, game/STARTING_LOCATIONS.md, chapters/CH-000.transcript.json and events, docs/01_world/INDEX.md. **Draft-only:** PR #33 and PRs #34–#69, their docs/01_world/MERIDIAN_BAY_*.json/md/svg and tools/meridian_bay_* modules.

**To finish:** reconcile PR #33 with current save and journal code; review and integrate six designs without auto-admission; finish five known unreviewed frontage connections, reconcile parallel draft PRs, build remaining large physical regions/secondary streets/property access, review line-of-sight, public/private boundaries and blocked streets, decide a meaningful delivery perimeter before any percentage estimate. Integrate only selected approved source, with tests and valid saved-world admission later.

**Accept when:** topology, physical road geometry, building footprints, public access and story evidence agree; no invented shortcuts; visual JSON/SVG validation passes; a genuine player visit can be event-backed and recovered without changing unrelated NPC facts.

## A03 — District-specific place register and planned functional environment

The labels in this table distinguish **saved** locations from optional **draft** candidates. A name in a draft never proves an accessible location in-game.

| Physical/social area | Saved identity at snapshot | Candidate work and current gap | Rules and next deliverable |
| --- | --- | --- | --- |
| Wilson workshop | LOC-WILSON-WORKSHOP, Jack present; Aster and tools | More physical room detail only if required by future scene | Remains within home, not a city street; respect actual carried/stored inventory; Aster incomplete |
| Wilson residence | LOC-WILSON-APARTMENT; Rosa at home | Frontage sketch exists as draft, no certified door/property dimensions | Keep family and workshop adjacency; household ownership/rent remains unspecified |
| Railgarden neighborhood | LOC-RAILGARDEN-RESIDENTIAL; Elena walking through | Draft residential roads and frontage; school location **not established** | Do not invent Elena arrival, route, class roster or actual timetable; next review local access and school separately |
| Railgarden grocery | NO saved location; draft LOC-RAILGARDEN-ABARROTES | Proposed design and frontage; not operational | Confirm admission, entrance, stock, staff, times and actual service only through reviewed world/story event |
| Railgarden clinic | NO saved location; draft LOC-RAILGARDEN-CLINIC | Exterior draft detailed in PR #64 | No assumed healthcare outcome or opening hours; map exterior and access before service scenes |
| Market Row | LOC-COMMERCIAL-DISTRICT; Noah/Darius in district | Multiple road and frontage drafts, some parallel | Mixed uses and realistic deliveries, no all-purpose prefab shopping location |
| Café Bruma | LOC-CAFE-BRUMA; Mara's closing transaction resolved | Detailed Market Row ↔ café exterior missing in primary eight-link chain | Preserve paid bill and past dialogue; no new data theft outcomes without chosen action |
| Noah repair shop | Noah actor exists; separate shop site only in draft LOC-MARKET-NOAH-REPAIR | Site, actual access and layout not admitted | No default stock/sales, address, time or knowledge of Jack's private plans |
| Delivery collection | Draft LOC-MARKET-DELIVERY-POINT only | Separate frontage PR #46, needs reconciliation | Do not equate with a different proposed courtyard; no courier pickup event invented |
| Creative passage | Draft LOC-MARKET-CULTURE-PASSAGE only | Separate PR #48 | Aesthetic/social use candidate, no obligatory NPC encounter |
| Services arcade | Draft LOC-MARKET-BUSINESS-OFFICES only | Separate PR #50 | No legal company identities or contracts implied by geometry |
| Crosswater Plaza | LOC-CROSSWATER-PLAZA; Sora has maintenance history | Draft corridor to Market and waterfront, exterior design | Preserve original events and public sign anomaly without omniscient blame |
| Crosswater Terminal | LOC-TRANSIT-TERMINAL; Lena supervises operations | PR #54 plaza↔terminal entrance sketch | No fixed rail lines, schedules, platforms or arrival durations |
| Harbor Walk | LOC-HARBOR-WALK; public waterfront | Coastal physical draft fragments 01+02 | Preserve separate Market and Crosswater connections, don't open restricted port |
| Remaining Meridian Bay | Not catalogued | Draft 100×80 grid reserves are unbuilt; municipal limits unknown | No invented populated world, location names or completion percent to fill blank map cells |

**Acceptance for each place:** stable place ID and parent, evidence of existence, physical public/private connectivity, access status (or explicit unknown), resident/NPC knowledge and interaction rules, event provenance for player discovery/visit, and no forbidden change to active canonical save.

## A04 — Jack, family, backstory and player agency

**Goal:** persist a player-led protagonist whose competence and prior life already matter without the narrator inventing his words or history.

**Current state:** SAVED Jack Wilson, 21, experienced fictional gray-hat hacker, technology builder, ADHD and difficulty speaking; phone-to-collar communication; childhood fire killed parents Daniel and Isabel; Rosa raised Jack and Elena; assets and activity predate CH-000. State currently places him in workshop after turn 9. Elena 17 is walking toward school with artwork and USB. Rosa 73 has tested repaired neighbor's alarm clock. Technical contact Noah exists. Individual older cyber episodes are intentionally unspecified.

**Rules:** the user alone decides Jack's voluntary movement, internal thought, speech, collar text, risks and goals. ADHD is characterization, not a competence penalty. Avoid literal retrospective hacking exploits, fabricated people harmed, numbers or historical crimes. Established experienced network is canon without 500 invented records. Family NPCs know only what they plausibly witnessed, not private money/device specifics.

**Sources:** game/CHARACTER_JACK.md, JACK_HACKER_HISTORY.md, STARTING_CAST.md, STATE.json player and actors, chapters/CH-000.*; docs/NARRATIVE_CONTRACT.md.

**To finish:** flesh out family dialogue, trust and constraints organically; give Elena's school an actual location/timetable only with world review and causal scene; track Rosa's clock return when resolved, not by arbitrary elapsed time; maintain independent long-term relations; never auto-play Jack. Historical STARTING_CAST numerical skill prose is superseded by current contract.

**Accept when:** new scenes preserve exactly who controls speech, what each family member knows, pending obligations, and all belongings/time through verified event/save history.

## A05 — Device registry, inventory, technology and Aster construction

**Goal:** make physical objects and technical projects persistent, not instant magical functions.

**Current state:** SAVED inventory includes phone, voice collar, compact device case, tester, microdrone, sensor, display, precision tools, Aster and wallet; each has carried/location/status fields. Device registry has nine Café Bruma rows and owner-confirmed 500+ older active devices without itemized identifiers. Aster's first arm attached to torso; shoulder support and passive elbow alignment tested manually, actuators disconnected; all advanced functions untested. Some older gadgets are stored at home, not necessarily carried.

**Rules:** no retroactive creation of equipment or mass records. Transfers require evidence-based removal/addition with stable item ID and matching NPC/player events. Repair and construction consume plausible time/material and preserve incomplete status until actual verified actions. A design specification (jetpack, automation, heat/night vision, 14K display, jamming or "UMP" protection, escape) is NOT working hardware. Do not silently reinterpret "UMP" as EMP or invent detailed weapon specifications.

**Sources:** game/STATE.json inventory, game/equipment/DEVICE_REGISTRY.json, game/ASTER_SPEC.md, tools/state_changes.mjs, tests/test_backstory_aster.py, tests/test_turn9_consequences.py.

**To finish:** review future parts/resources, prototype assembly stages, test powered actuation only after parts and player-directed work, track component ownership and failure/misfires if fictional causality justifies it, document effects as item changes and EV provenance. More sophisticated crafting architecture is optional and **not** established as an autonomous system.

**Accept when:** item history survives save/recovery, no inventory duplicates, the game cannot claim missing functions, and building takes credible fictional time and resources.

## A06 — Economy, cash, businesses and asset privacy

**Goal:** preserve in-story resources, spending, employment and services as economic constraints instead of free-form magic balances.

**Current state:** SAVED ledger: two observed personal balances (86.450,20 and 173.890,75), two observed society-operation balances (43.600,00 and 97.340,10), plus owner-established but unquantified additional reserves and shell-company structure. Currency, overall totals and legal entity names unknown. Two unrelated third-party Café Bruma balance readings are separate and not Jack's money. Mara received café payment in cash. The repository has no complete city market/price/economy engine.

**Rules:** don't sum these visible strings into a global spendable reserve; preserve which account/owner, source event, disclosure and date. No invented legal company identities, currencies, transactions or tax assumptions. No real account connection is implied. Price, service and stock must be established before consequential trades; purchasing requires chosen Jack action and causal resolution.

**Sources:** game/finances/ASSET_LEDGER.json, STATE.json player.finances, tools/state_changes.mjs, docs/NARRATIVE_CONTRACT.md, PRs #15 (draft services) and #33 (draft businesses).

**To finish:** add a minimal typed business/ownership/transaction contract only when the story needs it, test payment/transfer and item outcome against resource preconditions, connect NPC shifts and supplies, keep unknown prices or office access explicitly unknown. Avoid rebuilding an entire market simulation before a real scene needs one.

**Accept when:** a reviewed purchase/service can be replayed from events and ledger facts with no fabricated balance or action and with appropriate NPC incentives.

## A07 — NPC goals, autonomy, motivations and independent routines

**Goal:** a living society with autonomous actors who may act and fail when in-story time passes, including people away from Jack.

**Current state:** SAVED seven NPC identity/goal/location/resource/knowledge records and one transit organization; INTEGRATED routine proposal, review coordinator and typed NPC event staging. Some NPCs have resolved events; Noah has no saved resolved action. Independent actor planning is **not** a continuous background worker; no real-time AI city simulation has been verified.

**Rules:** each NPC can pursue a goal independently, but only a plausible, reviewed causal outcome becomes an event. No action just because a deadline exists. Stage the *owning actor's* changes separately; do not give offscreen secrets to Jack. Avoid decorative NPCs or arbitrary alarm escalation, surprise witnesses and guaranteed success. The player need not be present for independently justified consequences, but fictional time must actually advance in a saved turn.

**Sources:** game/STATE.json world.actors/factions, docs/NPC_RULES.md, tools/living_world_routines.mjs, living_world_coordinator.mjs, living_world_diagnostics.mjs, tests/living_world_routines.test.mjs, living_world_coordinator.test.mjs, living_world_integrated_rehearsal.test.mjs.

**To finish:** test multiple actors competing over limited time and resources, evolving intentions, missed commitments, alternating NPC participation and distance constraints, episodic story-quality review. Reconcile branches with richer NPC needs/social ties only after isolating their code changes.

**Accept when:** two different relevant NPCs can independently develop, fail or change plans across saved turns without fake omniscience or resetting state.

## A08 — NPC needs, obligations, conditional plans and institutions

**Goal:** track why people work, rest, buy, serve, care and make social decisions; let obligations persist across scenes and chapters.

**Current state:** INTEGRATED actor-specific obligation validation, time-aware private review, conditional plans and some chapter-crossing tests. Obligations can be pending, blocked, resolved or cancelled; an actor's deadline is a trigger for review, **not automatic completion**. The richer integrated NPC-needs bridge from PR #27 is still **DRAFT** and not on the authoritative branch. Wider social/services stack PRs #11–#15 is independent. Six Phase 1 candidate businesses/clinic do not yet provide services in the saved story.

**Rules:** do not silently add needs, obligations, work schedules or class attendance to past NPCs. Plan ≠ outcome, current need ≠ fact known to Jack, nearby-only triage must not hide distant saved obligations, company or school membership requires causal evidence. Keep actor ID scopes for obligation keys; don't merge unrelated PR stacks without conflicts assessment.

**Sources:** tools/living_world_obligations.mjs, world_plans.mjs, living_world_commitments.mjs, living_world_diagnostics.mjs, chapter_history.mjs; tests/living_world_persistent_commitments.test.mjs, world_plans.test.mjs, world_plan_pilot.test.mjs; draft PRs #10–#15, #26–#28.

**To finish:** evaluate PR #27's actor-owned needs and privacy changes against the latest turn engine; integrate small tested subset; build needs/role/job/stock/service evidence contracts, emergency and resource tradeoffs, long-term relationships. Do not activate any invented institution by merging planning data. Update relevant context references only after reviewed admission.

**Accept when:** a cross-chapter obligation has provenance, survives time and save recovery, can be genuinely blocked or fulfilled through an event, and never leaks private knowledge.

## A09 — Fictional time, routing, schedules and availability

**Goal:** make travel and availability consistent with where places are and what characters can know, without freezing every minute of the fictional city.

**Current state:** INTEGRATED coarse time consistency and contextual travel/routine availability modules. Day -29 morning is real in-fiction period; exact clock and weekday unknown. Route graph has saved reciprocal links, while detailed road waypoints are proposed on draft branches. Night-spanning schedules have validated logic when actual day/hour evidence exists; unknown remains unknown.

**Rules:** temporal increments must be plausible for current and destination coarse periods. A 20-minute elapsed interval from morning cannot silently become next morning. No time from number of graph hops, no universal speed, no unsourced exact shop hours. A business's public frontage does not establish it is open. CITY as container is no shortcut. Route proposals do not move a player.

**Sources:** tools/living_world_time.mjs, living_world_travel.mjs, living_world_availability.mjs, state_changes.mjs, docs/STATE_SCHEMA.md, tests/living_world_travel.test.mjs, living_world_availability.test.mjs and time QA docs.

**To finish:** provide consistent travel estimates for concrete scenes after reviewing spatial geometry, add weekday evidence only when chosen/established, support legitimate overnight and multi-stage travel, block contradiction between NPC schedules and movement, keep uncertainty visible to narrator but not as mechanical debug fiction.

**Accept when:** chosen routes/elapsed time and actor availability survive reload and cannot claim impossible travel, secret knowledge or unestablished open status.

## A10 — Typed causal effects, knowledge, relationships and persistent consequences

**Goal:** record meaningful changes once with who/when/why evidence, and make that state matter later.

**Current state:** INTEGRATED typed preconditioned events for location, item ownership/transfer, relationship, conditions, knowledge, plans and qualitative resources; existing thread records open/develop/resolve questions. The validator checks structured declarations, not free-form prose meaning. Some old chapter prose may contain private-event information by historical rules; future public text should not repeat such leaks.

**Rules:** event owner determines whose fields change. Before values must match actual saved current state. Multi-step state updates are transactional; a failed last step must not leave half an effect. Knowledge requires source, rumors cannot be magically promoted to facts, relationships are directional. Private offscreen truth is not automatically visible narration. No retcon without owner-authorized revision archive.

**Sources:** tools/state_changes.mjs, consequences.mjs, turn_engine.mjs, narrative_archive.mjs, tests/state_changes.test.mjs, consequences.test.mjs, docs/DECISION_OUTCOMES.md, docs/STATE_SCHEMA.md.

**To finish:** better fact-level private/public knowledge projection; optional confidence/provenance normalization, delayed consequence resolution and cross-chapter replay tests; ensure every significant described item/relationship/financial effect has explicit EV/STATE delta. Keep qualitative capabilities without reintroducing XP.

**Accept when:** an actor-specific event reconstructs later world changes and reader knowledge without duplicating, forgetting or revealing hidden facts.

## A11 — Writing quality, scene continuity, dialogue and player control

**Goal:** tell genuinely experienced, varied scenes where people act naturally and the player retains free-form control.

**Current state:** owner-approved third-person limited interactive-novel contract, literary editing checklist, adaptive narrative-length guidance and ban on menu/status-box fiction. Separate controls for literary craft, continuity and technical save. Historical finished scenes and revisions exist; no new owner-authored turn was created by this checkpoint.

**Rules:** begin in the action, don't paraphrase the user's command as an introduction, use believable dialogue/motion and justified stakes, end naturally even when quiet. Do not impose a cliffhanger. Do not write Jack's voluntary thoughts, chosen words, collar messages, gestures or risks. No RPG XP/stats/classes, operational cyber methods, NPC omniscience or suspicious stranger on every scene. Scene-length ranges are editorial guides, not quotas. Exact wording must be archived.

**Sources:** docs/NARRATIVE_CONTRACT.md, NARRATIVE_EXECUTION_MODEL.md, SCENE_CRAFT.md, NARRATOR_RULES.md, NARRATIVE_STANDARD.md, DECISION_OUTCOMES.md, chapters/CH-000.md and transcript.

**To finish:** run one actual free-form player action when provided, produce a literary scene rather than a results report, independently review causal consistency, stage/save before displaying; evaluate pacing and NPC individuality separately from validator output. Integrate PR #18's continuous-scene policy only if compatible and beneficial, not as automatic extra narration authority.

**Accept when:** a real scene stands alone as prose, faithfully reflects a saved player action and exactly matches the verified literal transcript without hidden fact leakage.

## A12 — Chapters, history, revisions and narration archive

**Goal:** preserve literal dialogue and causes across chapter boundaries without counter resets, missing events or irrecoverable overwrites.

**Current state:** SAVED CH-000 with exact player+narrator transcript and event history, two owner-authorized revision JSON records, zero completed chapters. INTEGRATED global EV/TXT history helpers, metadata-only chapter plan/transition staging, immutable archive verification and synthetic interrupted transition tests. No canonical CH-001 exists.

**Rules:** chapter is a narrative arc, not one fictional day. IDs never repeat or reset across boundaries. A chapter transition doesn't generate a new Jack action/scene or advance time; it must have a reviewed reason and plan. Closed chapter files are immutable and read at the same SHA as active state, with hash descriptors. Old revisions stay available in their audit file. A hypothetical future chapter must not be mistaken for a played one.

**Sources:** chapters/CH-000.* and revisions/*, tools/chapter_history.mjs, chapter_management.mjs, narrative_archive.mjs, save_transaction.mjs; tests/chapter_management.test.mjs, chapter_save_transaction.test.mjs, test_multichapter_validator.py.

**To finish:** first authentic reviewed CH-001 boundary with folder index/inventory updates, actual journaled transaction and recovery; test multi-chapter context and private NPC memory under real connector operation. Do not close CH-000 as a calendar convenience.

**Accept when:** all original EV/TXT bytes reconstruct at the next chapter HEAD, hash checks pass, the next played turn is exactly one user action, and interruption cannot duplicate or lose a chapter.

## A13 — Five-file persistence, save journal, crash recovery and delivery

**Goal:** no lost, partial or duplicated player turns even after context loss, a failed API operation or a truncated chat response.

**Current state:** INTEGRATED five-file Git transaction, seven evidence-backed save stages, remote and journal adapters and ready baseline. The separate canonical journal was created and reread by the authorized GitHub connector; an isolated no-op QA demonstrated blocked-journal, detached commit, protected QA branch update and five matching blob readbacks. Earlier token-backed Node tests demonstrated separate synthetic changed-turn recovery. **No full valid changed-turn through the live ChatGPT connector has yet been proven.**

**Rules:** a ready journal is not a completed previously saved turn. The blocked status cannot be rewritten as ready. After owner input, validate all five candidate files and closed-chapter history; write blocked journal before creating story commit, persist detached SHA before moving ref; update ref non-force with observed HEAD, read back five exact bytes, finalize verified journal, then show identical narration. At any failure, stop with actual stage; 100% only after readback, and persistence never proves UI delivery. Do not write five story files as separate commits.

**Sources:** game/SAVE_MANIFEST.json; chapters/CH-000.*; docs/SAVE_BLOCKING_PROTOCOL.md, RECOVERY.md, 05_persistence/CHATGPT_GITHUB_NATIVE_SAVE.md, 06_quality/CHATGPT_CONNECTOR_TRANSPORT_QA_20261117.md; tools/save_gate.mjs, save_transaction.mjs, github_save_adapter.mjs, github_save_journal.mjs, living_world_coordinator.mjs; tests/github_* and save_*.

**To finish:** valid changed-file synthetic direct-connector QA with journal confirmation and intentional interruption; compare exact narration, state and event IDs; run latest CI; then use genuine player action to verify full live flow and editorial delivery. Evaluate race limits of GitHub's non-force update; it is not a strict multi-writer CAS transaction.

**Accept when:** readback proves new turn and durable journal verified; a second session can replay the exact original scene without a second authored event, and a failed stage blocks safely.

## A14 — Context retrieval, memory boundaries and long-running continuity

**Goal:** resume quickly and reliably without reading an entire archive into one chat or allowing a summary to replace evidence.

**Current state:** INTEGRATED read-only lexical event/transcript index, bounded narrator context packet, conservative reader-visible pointer set and remote immutable loader with ready/blocked/verified journal gates. A source pointer must be dereferenced from its actual commit. The loader explicitly reports mayAdvanceStory=false. No semantic retrieval, auto-summary agent or persistent background memory updater exists.

**Rules:** current manifest and exact EV/TXT source outrank handoff/chat memory. Verified loader reads the same immutable HEAD for original files and checks journal/HEAD again before returning. Reader sees no private offscreen/event payload from narrator's context. A source pointer alone is not proof of the file's contents; summaries need source commit and ID. Do not create a parallel world-state database.

**Sources:** docs/05_persistence/CONTEXT_MANAGEMENT.md, tools/context_manager.mjs, verified_context_loader.mjs, tests/context_manager.test.mjs, verified_context_loader.test.mjs.

**To finish:** build per-character/location/chapter source-linked summary cache only if actual measured context cost justifies it; ensure invalidation on source SHA change, preserve fact-level visibility and ID-backed retrieval. Add intent-aware targeted source selection rather than indiscriminately expanding entire world bible.

**Accept when:** a fresh session loads only necessary authoritative material, recognizes a blocked save before play, and resolves a relevant source ID faithfully after a multi-chapter boundary.

## A15 — Validation, tests, QA and acceptance evidence

**Goal:** demonstrate correctness of current mechanics with repeatable tests and preserve evidence of what ran.

**Current state:** INTEGRATED GitHub workflow .github/workflows/narrative-qa.yml with Node suites, Python unittest discovery, and Python checkpoint validator. The audited tree contains 30 tests/ entries including tests/INDEX.md (29 test files). Prior PR #71–73 and connector QA are documented with commit/run references. These prove specific tested mechanics, not literary quality, real UI delivery or every unmerged map branch.

**Rules:** always record branch, source SHA, exact command/CI URL, and whether network/Git operations used a mocked adapter, isolated QA branch or live canonical branch. Tests on stacked PR parent do not authorize merging on current HEAD. QA story records are NONCANONICAL even if their event IDs look real. No pass claim when runtime was not run.

**Sources:** tests/*, tests/INDEX.md, .github/workflows/narrative-qa.yml, docs/QA_SCENARIOS.md, TURN_TESTING.md, 06_quality/CHATGPT_CONNECTOR_TRANSPORT_QA_20261117.md, tools/validate_state.py.

**To finish:** add future tests for changed-turn connector recovery, stale source in complex stacked branches, fact-level spoilers, constrained services/needs, completed map geometry and eventual Day0; separately solicit story-quality evaluation. Keep CI fast via focus tests during development plus full regressions before integration.

**Accept when:** all applicable current-branch suites pass and the claim is restricted to their actual tested semantics; verification exposes neither secrets nor false save completions.

## A16 — Paths, source inventory, discovery and technical handoff

**Goal:** locate every authoritative file and its supporting mechanics quickly while preventing duplicate source files.

**Current state:** audited Git tree contains 129 original tracked blobs: root 3, GitHub workflow 1, docs 48, game 15, chapters 9, tools 23, tests 30. Historical docs/FILE_INVENTORY.json records only 95 tracked paths and omits 34 existing supporting files; every recorded path exists. The immutable snapshot file lists all 129 with exact SHA/size/area for later comparison. Domain folder indexes primarily point to original root docs/data rather than moving them.

**Rules:** indexes, area reports and this checkpoint are navigation only; do not copy STATE/transcripts into competing editable locations. Preserve original source paths. Don't silently change chapter files or mark unmerged draft files as canonical. Check all relative links and inventory entries in CI.

**Sources:** INDEX.md, docs/INDEX.md, docs/FOLDER_POLICY.md, docs/FILE_INVENTORY.json, all */INDEX.md and tests/index_paths.test.mjs; machine snapshot in docs/00_start.

**To finish:** update original inventory for missing supporting paths with noncanonical labels; link checkpoint from root/start indexes; link persistence and QA reports from their areas; remove stale navigational assumptions through targeted corrections, not historical deletion. Refresh file map only when source changes, not by rewriting immutable audit evidence.

**Accept when:** a reader reaches checkpoint, source, rules and tests from stable indexes; every original path is discoverable, no duplicate canonical authority, and the index test passes.

## A17 — Preauthored narrative branches, possible standalone app and future expansion

**Goal (potential, deferred):** author world situations, eligibility/effects and possible long-term narrative paths before play while preserving unforeseen free-form decisions and canon compatibility.

**Current state:** **DEFERRED, NOT IMPLEMENTED.** The dated design note proposes preauthored conditional branches, compatible rejoining and possible game portability. Original PR #1 browser prototype uses a delivery format the owner explicitly rejected; it is not a prerequisite. No approved active branching schema, browser runtime or numerical RPG restoration exists.

**Rules:** do not implement preauthored choice trees or force menu options unless owner reopens the decision. A prepared branch is only a hypothetical option; it never becomes a real story event or player-knowledge fact until chosen and saved. No unearned percentage based on an "80/20" heuristic. Separate adaptation notices from evidence-backed save percentages.

**Sources:** docs/04_story/FUTURE_NARRATIVE_BRANCHING_PLAN.md, docs/DECISIONS.md, docs/NARRATIVE_CONTRACT.md, draft PR #1 and PR #18.

**To finish if later approved:** review target deliverable, data-first node schema, conditions, alternatives, divergent/convergent state proof, delayed effects, private info boundary and UI/runtime requirements. This is intentionally not in the current active task queue.

## Cross-cutting implementation sequence and proof

1. **Snapshot** actual authorizing Git HEAD, journal and canonical checkpoint; read this board and relevant original files.
2. **Select** smallest area-specific task and its own branch; identify owner rules, existing tests, draft dependencies and source commit.
3. **Implement** typed data/proposals separately from actual story outcomes; keep player control, privacy and time boundary intact.
4. **Test** focused module, Node+Python+checkpoint suites and any real remote behavior in QA; record both successes and incomplete gates.
5. **Review** whether player/world files and other agent branches stayed untouched, whether literal narration differs from structured facts and whether docs contradict newer authority.
6. **Integrate** on verified non-force ref, update references and report changed files, tests, risks and next action.

The next critical engineering task is **A13 changed-turn live connector acceptance**; the next large worldbuilding task is **A02/A03 reviewed Meridian Bay Phase 1 and physical draft consolidation**. None of this authorizes playing Jack's turn 10 without a new user action.
