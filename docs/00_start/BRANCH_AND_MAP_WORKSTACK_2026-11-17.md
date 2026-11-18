# Branch custody, Meridian Bay spatial status and next integration order

**Audit date:** November 17, 2026 local time. **Canonical snapshot source:** work/chat-narrative-foundation @ ff2fc65d3359830729a97a440a4ec9b341815ec2. **This is a developer review report, not an authorized geography merge or world save.** See [full checkpoint](REPOSITORY_CHECKPOINT_2026-11-17.md) and [area register](AREA_STATUS_AND_TASKS_2026-11-17.md).

## 1. Branch and workflow boundaries

| Branch / PR | What it contains | Authority and next gate |
| --- | --- | --- |
| main @ 52fcff9 | Minimal default branch; not current story | Never resume from main and never merge draft PR #2 automatically |
| work/chat-narrative-foundation, draft PR #2 | **Current authoritative novel**; saved turn 9; rules, source code, journal readiness and context | Preserve game/chapter bytes until new owner action; review actual HEAD and journal each session |
| journal/living-world-save-attempts | One canonical ready baseline and separate QA journal records | Separate persistence metadata only; never merge into story; blocked must be recovered, not reset |
| qa/chatgpt-native-journal-transport-20261117 | Noncanonical five-file **no-op** Git connector transport rehearsal | Never use as an event or player save |
| work/meridian-bay-phase1-20261116, draft PR #33 | Six prebuilt locations, reviewed admission and directed route/observation checks, provisional map | Reconcile with latest narrative branch and current journal; test; **admission** still separate from merging code |
| work/meridian-bay-market-crosswater-land-fragment-03-20261117, draft PR #69 | Latest examined *stacked* regional blueprint, including coastal fragments 01/02 and landward 03 | Noncanonical; retain JSON/SVG consistency and separate coordinates vs actual travel; needs spatial/editorial integration review |
| work/npc-needs-chapter-bridge-20261114, draft PR #27 | Actor-owned needs and plan/chapter bridge with independent CI | NOT integrated; selectively port only after reviewing current effects/privacy modules |
| work/context-retrieval-pilot-20261114, draft PR #28 | Original read-only context pilot stacked on #27 | Its safe context code was already **independently integrated** on canonical via PR #31; do not duplicate or import #27 implicitly |
| work/narrative-continuous-scenes-20261112, draft PR #18 | Continuous-scene editorial proposal | Not merged; adopt only compatible editorial guidance if needed, never force Jack's decisions |
| work/living-world-foundation, open PR #1 | Historic browser-game prototype | Superseded delivery approach; do not treat as the active ChatGPT novel |

**Source accuracy rule:** A GitHub PR being open, green or "clean" does not mean its source is in the current playable branch. A tested isolated QA branch does not create saved world facts. Always read the exact PR head/base and compare current source files before integration.

## 2. Confirmed city facts vs reviewed design

The following are in the **canonical saved story graph** at the audit source: CITY-MERIDIAN-BAY; LOC-CROSSWATER-PLAZA; LOC-TRANSIT-TERMINAL; LOC-COMMERCIAL-DISTRICT (Market Row); LOC-HARBOR-WALK; LOC-RAILGARDEN-RESIDENTIAL; LOC-WILSON-APARTMENT; LOC-WILSON-WORKSHOP; LOC-CAFE-BRUMA. The CITY node is a geographic container, not a street; workshop is physically within the apartment.

PR #33's six **preauthored draft identities**, not activated into the current game/STATE.json:
- LOC-RAILGARDEN-ABARROTES: neighborhood grocery and street frontage.
- LOC-RAILGARDEN-CLINIC: neighborhood clinic/health center.
- LOC-MARKET-NOAH-REPAIR: Noah's shop; Noah as an NPC already exists separately.
- LOC-MARKET-DELIVERY-POINT: delivery collection point, not an implied courtyard.
- LOC-MARKET-CULTURE-PASSAGE: creative/cultural passage.
- LOC-MARKET-BUSINESS-OFFICES: services arcade.

The prepared graph after reviewed design admission would contain **14 LOC nodes and 14 bidirectional links**, of which the workshop-to-home link is internal. **13 exterior links** are known within that prepared set, not 13 measured physical roads and not an exhaustive city street network. The provisional 100 by 80 study canvas, described as a nominal 10 by 8 km rectangle, is not a surveyed size, municipality boundary or confirmed orientation.

## 3. Map development: what was physically authored

The important distinction is topology vs road candidate vs physical region vs play-admitted world. Many earlier PRs draw curves *between existing destinations* without building the surrounding blocks. The latest separate fragment drafts move toward irregular shorelines, building footprints, land patches and old/new road traces.

| Fragment | Branch/PR and source | Candidate footprint / contents | Important preserved join |
| --- | --- | --- | --- |
| Region 01 — Harbor Walk / inner bay | draft PR #66, docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json + SVG/MD | study x=68..77, y=32..42; irregular coast, four mixed use patches, six footprints, twisted old road and dead-end service road | Harbor Walk anchor (71,37); Market/Crosswater approaches remain distinct; coast outlet (75.1,42) |
| Region 02 — expanded coastline | draft PR #67, docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_02_20261117.json + SVG/MD | study x=68..82, y=42..51; 22 coast vertices, six land-use zones, ten footprints, seven road/promenade traces | coast starts exactly at (75.1,42) and exits at (79.2,51); west old road (68.1,43.8), newer road (68.2,46.65) |
| Region 03 — Market/Crosswater landward | draft PR #69, docs/01_world/MERIDIAN_BAY_MARKET_CROSSWATER_LAND_FRAGMENT_03_20261117.json + SVG/MD | study x=58..68.2, y=42..51; six irregular patches, 12 buildings and eight traces, including one historic **blocked** route | exact candidate joins at (68.1,43.8) and (68.2,46.65); preserves Market (58,43), Crosswater (65,42), Terminal (66,42) |

**These are three editable study fragments, not three functioning game chunks.** Building shapes and historic stages are proposals, not approved urban history. The shoreline outline is not a confirmed coastline. Historic paths marked blocked cannot be walked simply because they appear on the SVG. No automatic population, business access, street name, in-story travel, school, clock or owner assignment follows from the drawings.

The coastal validator tools described in draft PRs #67/#69 generate SVG **from JSON** and check exact seam/land/building/road constraints; SVG previews must be regenerated after changing JSON. QA runs on isolated temporary PRs were successful for some fragments. This supports structural consistency only, not a physically complete city or a saved playable map.

## 4. Exterior route coverage (do not conflate with area)

The reviewed corridor coverage report in the PR #64 lineage lists **8 detailed of 13 known exterior graph links**. That is 61.5% of the finite *link list*, **not** the area of Meridian Bay mapped, built, populated or playable.

| Known prepared exterior link | Detail recorded in the principal sequential branch | Integration issue / next work |
| --- | --- | --- |
| Railgarden ↔ Market Row | Yes (Rail–Market corridor) | Draft road layout; reconcile blocks and actual access |
| Market Row ↔ Crosswater Plaza | Yes | Story-compatible Market→café order and terminal glow constraint |
| Crosswater Plaza ↔ Terminal | Yes | Terminal doors/rail services not established |
| Crosswater Plaza ↔ Harbor Walk | Yes | Preserve distinct public waterfront approach |
| Market Row ↔ Harbor Walk direct | Yes | Do not collapse into via-Crosswater route |
| Wilson residence ↔ Railgarden | Yes | Workshop is within residence, never another street corner |
| Railgarden ↔ grocery | Yes | Grocery not admitted; no actual opening hours |
| Railgarden ↔ clinic | Yes | Clinic exterior only; no medical service assumed |
| Market Row ↔ Café Bruma | **No** | First outstanding district frontage to reconcile with saved Café Bruma scene |
| Market Row ↔ Noah's repair store | **No** | Draft designed shop, but no certified entrance/stock or finalized physical frontage |
| Market Row ↔ delivery collection point | Not in this lineage | Separate PR #46 frontage candidate needs dependency/QA reconciliation |
| Market Row ↔ cultural passage | Not in this lineage | Separate PR #48 frontage candidate |
| Market Row ↔ services arcade | Not in this lineage | Separate PR #50 frontage candidate |

The latest PR #69 branch may carry more physical regional data but does not upgrade these exterior links to canonical game paths. The "8 of 13" metric is only the draft report's specifically defined coverage, and it must be recalculated after any branch reconciliation.

## 5. PR lineage map: do not blindly fast-forward independent work

**Central city integration:** PR #33 (Phase 1) is based on an older narrative SHA. PR #34 is its first road-web increment; the corridor and frontage families extend from there. The named PRs below represent overlapping or parallel work, not one automatically safe linear merge.

| PR | Subject and relationship | Snapshot classification |
| --- | --- | --- |
| #33 | Phase 1 prebuilt identity/admission + map canvas | Open, draft, not canon |
| #34 | Railgarden to Market road web slice 1 | Open, draft |
| #38 | Railgarden–Market multi-section corridor | Open, draft |
| #40 | Market–Crosswater multi-section corridor | Open, draft |
| #42 | Crosswater–Harbor corridor | Open, draft |
| #44 | Market–Harbor direct corridor | Open, draft |
| #46 | Market delivery frontage | Open, draft, partly parallel to later line |
| #48 | Market cultural passage frontage | Open, draft, depends on #46 |
| #50 | Market business-service frontage | Open, draft, depends on #48 |
| #52 | Additional Market–Crosswater frontage sections | Open, draft |
| #54 | Crosswater Plaza–Terminal detailed | Open, draft |
| #56 | Crosswater Plaza–Harbor detailed | Open, draft |
| #58 | Market Row–Harbor detailed | Open, draft |
| #60 | Wilson home–Railgarden frontage | Open, draft |
| #62 | Railgarden grocery frontage | Open, draft |
| #64 | Railgarden clinic frontage and 8/13 coverage ledger | Open, draft |
| #66 | Physical coast fragment 01 | Open, draft, stacked on #64 |
| #67 | Physical coast fragment 02, repairs piece 01, deterministic JSON→SVG checks | Open, draft, stacked on #66 |
| #69 | Landward Market/Crosswater physical fragment 03 and coast seams | Open, draft, stacked on #67 |

Some older city prebuild route and faction/needs draft PRs (#11–#23) form different preparation lines. The active code has selectively adopted obligations, plans, context and chapter logic without wholesale adoption of the associated original PRs. This must continue to prevent accidental conflicting engine versions.

## 6. NPC, services, quality and context draft dependency track

| PR family | Goal | What is integrated / what remains draft |
| --- | --- | --- |
| #10 persistent obligations | Due dates, blocking and long-term actor commitments | Scoped obligation validator + review mechanics integrated later; parent PR remains open historically |
| #11–#15 social/needs/services | Causal routines, social relations, observed need costs, service tradeoffs | Related proposal branches; not all systems admitted. Do not infer live workers, institution staffing or prices from PR content |
| #24/#25/#29 | Contextual time, chapter lifecycle, plans and persistent obligations | Previously integrated into authoritative branch; avoid duplicate re-import |
| #26/#27 | Audit + richer actor needs/chapter bridge | Still stacked/draft; #27 tested in its own CI and needs independent comparison with current code |
| #28 | Keyword evidence-linked context retrieval | Safe source-only portions already integrated via later independent PR #31; original stacked dependencies not merged |
| #18 | Continuous-scene writing rules | Draft editorial policy; active SCENE_CRAFT and NARRATIVE_CONTRACT already control current play |
| #1 | Standalone browser proof of concept | Superseded delivery type; not the novel's runtime |

## 7. Integration procedure for city/map and NPC work

1. Freeze a **read-only** evidence snapshot: current authoritative HEAD/manifest/journal, current actor/place IDs and current selected draft head(s).
2. Choose **one** coherent target lineage: e.g. Phase 1 admission, then a small road slice or one physical fragment. Do not sum distinct branch outputs or force all PRs into a single update.
3. Compare tree and diff against the newest narrative branch; explicitly protect game/STATE.json, manifest, chapter prose/transcript/events, journal and prior agents' unmerged paths.
4. Extract only required source/code/docs/tests; reconcile differences with currently integrated context, save, time, actor and obligation modules; avoid bringing older engine variants.
5. Validate graph edges and physical seams, blocked areas, street/building intersections, JSON/SVG deterministic parity and original CH-000 story observations. Unknown opening/access/time is accepted as unknown, not assumed valid.
6. Run focused map/NPC tests, full current Node/Python/manifest CI, then keep integration PR reviewable until the code and semantics are approved.
7. Code merge only adds **eligible optional design mechanics**; do not mutate the current playable world with draft six-place admissions or a geometric "visited" claim.
8. First actual *in-story* world admission requires a deliberate reviewed design ID, source provenance, and the existing player-action/journaled five-file save protocol. Always protect fictional privacy and player agency.
9. On every status update, explicitly report **source code integrated**, **locations admitted**, **physically drawn** and **traversable in story** as four separate signals.

## 8. Next spatial sequence, with concrete acceptance checks

**First:** reconcile Phase 1 design against the current narrative SHA; ensure all six proposed location IDs are unique and are not already present in STATE.json, and their parents/connectors are plausible. Ensure the existing 9 canonical locations remain unchanged. Validate a hypothetical in-memory admission and rejected invalid admission, without a real saved turn.

**Second:** reconcile the Market Row ↔ Café Bruma and Noah exterior approaches, plus the parallel delivery/culture/business frontage drafts. Ensure frontage/detail doesn't invent an open shop, shop stock, medical staff or a privately owned building's interior access. Verify routes/waypoints against existing state and design evidence.

**Third:** review the three physical fragments together. Require every seam coordinate to match; no ordinary road through a proposed newer building; historic traces stay blocked; Harbor public promenade never becomes an unreviewed port entrance; no silent shifts of known place anchors. Compare generated SVG and JSON and keep open boundaries explicit.

**Fourth:** expand landward toward Railgarden and later unmapped reserves, one authored physical area at a time. Buildings and side streets should reflect historical growth and repairs rather than a clean uniform grid. Add meaningful uses and populations only when established and playable.

**Fifth:** after verified region and NPC admission, support actual player travel, sightlines, encounters, schedules and costs via event/knowledge provenance, saving changed files exactly once. Only now can a bounded *playable region* completion metric be defined; the whole city's completion remains unmeasured until its perimeter is explicitly chosen.

## 9. Hold points / unapproved owner decisions

- Meridian Bay's exact city boundaries, cardinal north, scale, all coastlines, roads, zoning and real timetable: **not locked** by the draft canvas.
- Elena's school location and attendance/arrival: **not in active saved map**.
- Exact nation/calendar year/currency and law: **unknown**.
- True Day0 shockwave nature, power categories, awakening frequencies: **unknown**.
- Future narrative branching schema and standalone app: **explicitly deferred**; not a dependency to play the existing novel.

**Closeout signal:** this report documents draft and canonical states as of the named commits; it neither activates the six proposed sites nor authorizes them to be added to the current checkpoint. Read the [full area board](AREA_STATUS_AND_TASKS_2026-11-17.md) for mechanic-specific completion gates.
