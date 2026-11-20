# Meridian Bay — three-region seam and historical route-conflict audit (2026-11-20)

**Status:** source-backed engineering review only; no saved-world geometry admission, story action, NPC decision, or branch merge.

**Branch:** `work/meridian-three-region-seam-qa-20261120` — starts at the exact **PR #86** HEAD `79cca5c6f9106b904c5fb371fea28e183b9509ad`. It is an **isolated stacked PR** with **base `work/harbor-coast-fragment-review-20261120`**, *not* a replacement of PR #86 and *not* a direct PR to `main`. If PR #86 changes, reevaluate the stack and rerun CI before applying it.

## Historical source custody

Six additional JSON sources were copied byte-identically from historical drafts and pinned by SHA-1 Git blob, using unique archive filenames. They are **not playable source authority**:

| Historical PR and SHA | Local snapshot | Source Git blob |
| --- | --- | --- |
| #67, `8bdf34c5eddf4e12e34352018b2a893cb9a14056`, corrected Coast 01 | `SOURCE_PR67_COAST_01_20261120.json` | `7cb79b2113bfef7b7fbbc39539c17fd80a275cd7` |
| #67, same commit, Coast 02 | `SOURCE_PR67_COAST_02_20261120.json` | `325a0acde67a1ce3b44576860824657a3db41695` |
| #69, `f424538e03755b62b91c6b589e9a121cc10019d3`, Land 03 | `SOURCE_PR69_LAND_03_20261120.json` | `2a95eb9e50f69436cb65711daf8ff586f4ef4279` |
| #44, `1b51a0050deb95309b4380768cb13a3139019dbc`, direct Market–Harbor A | `SOURCE_PR44_MARKET_HARBOR_20261120.json` | `e8efe8e5f6a746ab4e628f76a9deb5f71061010d` |
| #58, `b11332aa53796717cf299bebccf043d72620220e`, direct Market–Harbor B | `SOURCE_PR58_MARKET_HARBOR_20261120.json` | `280a444f6eed99a33027aea2edb48af70cc67bd0` |
| #56, `199b3843085d8b4b2ab92739357263d598757331`, Plaza–Harbor | `SOURCE_PR56_PLAZA_HARBOR_20261120.json` | `a5ac772922b4717797118b15f182207be1d1a7fb` |

The audit also verifies **both PR #86's existing source** (PR #66 blob `81ef8da51951205394ba050fe6f867bfc00d7244`) and its reviewed draft Coast 01 (blob `dae1ea04e1addcaa1ed71b1a96e0e2171e0c7ac9`). No competing geometry is falsely labeled an integrated canonical map.

## Three exact source-geometry seams

- **Coast 01 ↔ Coast 02 shoreline:** `(75.1,42)`; it matches both the PR #86 and PR #67 first-coast variants and the fragment-02 initial point. Shore direction, charted area and navigability are **unverified**.
- **Land 03 ↔ Coast 02 historic road candidate:** `(68.1,43.8)`: `MX-A-OLD-SEAM` meets `HN-A-OLD`.
- **Land 03 ↔ Coast 02 newer-bypass candidate:** `(68.2,46.65)`: `MX-A-LATER-BYPASS` meets `HN-A-NEW`.

These are **exact matching sketch points**, not new `LOC-` vertices, legal streets, guaranteed passability, safe crossings or saved-world edges. The source state currently authorizes only the existing Market Row, Crosswater Plaza, Crosswater Terminal and Harbor Walk links.

## Previously missed conflict: Coast 01 candidate street vs candidate building

**PR #86** repaired the original freight polygon's own shoreline crossings by inserting `(71.8,34.6)` and `(72.02,35.1)`. This removed strict shoreline crossings but **left a second contradiction**: the unapproved `HC-A-OLD` street intersects **two edges** of the candidate `HC-B-02` building and contains **one intermediate street point inside the building's candidate footprint**.

**PR #67** is a different historic proposal that independently repairs both errors using **exactly three original scalar changes** in Coast 01:
1. `HC-Z-FREIGHT` polygon vertex 3 `x:72.5 → 72.25`.
2. `HC-A-OLD` road vertex 3 `y:39.1 → 39.95`.
3. `HC-A-OLD` road vertex 4 `y:38.9 → 39.3`.

The source inspection reports the following **strict geometric QA** (all *candidate design* geometry):

| Variant | Water-side geometry violations | Street–building candidate conflict findings |
| --- | ---: | ---: |
| Original PR #66 | At least 1 | 3 (road `HC-A-OLD` vs `HC-B-02`) |
| PR #86 reviewed fragment | **0** | **3** (2 strict edge crossings + 1 point inside) |
| Historical PR #67 alternative | **0** | **0** |

**Technical recommendation:** the **PR #67 three-scalar change set** is a more complete candidate than PR #86's two new freight vertices because it corrects both observed defects with fewer geometric edits. However, it remains an unadmitted design and does not establish real ownership, physical access, survey data, or a playable map. Do not silently replace the PR #86 review or merge PR #67's stacked ancestry. Adoption requires its own documented compatibility change and complete CI.

## Route conflict remains unresolved

- Historical **#44**: Market Row `(58,43)` to Harbor Walk `(71,37)` via **5 points / 4 segments**, with the final leg from `(68,36.9)`.
- Historical **#58**: same saved Market–Harbor endpoints via **6 points / 5 segments**, final leg from `(69.5,36.7)`. That penultimate coordinate **matches** the `HC-A-MARKET` sketch from Coast 01, which was drawn using #58. This consistency is a **dependency**, not independent corroboration or approval.
- Both routes geometrically **cross the hypothetical blocked `HC-A-OLDTRACE`** from the coastal draft. Neither is automatically impassable because the trace and routes are unverified; no selected direct-route candidate.
- Historical **#56**: Crosswater Plaza → Harbor Walk uses 5 points / 4 segments; its penultimate `(70.1,37.85)` matches the `HC-A-PLAZA` sketch, but **two strict boundary crossings** appear against candidate building `HC-B-01`. A revised building footprint or compatible route needs further design review.
- The already-saved reciprocal graph links **Market–Harbor, Plaza–Harbor, Market–Plaza, Plaza–Terminal** remain authoritative. A draft drawn through a building does not revoke those high-level connections or justify inventing an underground passage.

## Implemented contract and regression scope

`tools/meridian_bay_three_region_seams.mjs` provides `validateMeridianRegionalSeams`, `inspectMeridianRegionalSeams`, `coastalWaterConflicts`, `coastRoadBuildingConflicts`, and `candidateRouteCrossings`. All source Git SHA checks are performed from bytes **before** the inspection. It checks both inherited and historical coast geometry, two coast-land interfaces, four genuine saved-world links, historic PR source choices and route conflicts. The inspector is private and returns cloned data; it creates **no movement, time, NPC action, player knowledge, world record or new graph edge**.

`tests/meridian_bay_three_region_seams.test.mjs` adds **16** regression cases: eight archive blob IDs, reproducible three scalar PR67 changes, exact fragment joins, before/after road and coast defects, route conflicts, graph safety, forged connections, no mutability, no playtime or scene generation.

**Acceptance gate:** run on the precise final branch HEAD using GitHub Actions (Node, Python, saved checkpoint validator); then compare Git trees, inventory and five protected story blobs. Historical QA PR #68 and #70 are evidence of previous source tests, not a live compatibility test of this new combined review.

**Recommended next safe implementation:** produce a separately sourced **complete Coast 01 candidate** based on PR #67, with SVG regenerated against the updated three-scalar geometry; then assess whether to supersede the PR #86 draft in review. Continue to keep #44/#58 and Plaza–Harbor conflicts in design review, not player navigation.
