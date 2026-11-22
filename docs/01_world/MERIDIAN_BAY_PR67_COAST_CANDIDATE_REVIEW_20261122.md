# Meridian Bay — Coast 01, PR #67-derived candidate (2026-11-22)

**Status:** independent, reversible **physical-map design candidate**, not admitted to the saved world and **not** a gameplay route. This variant is intentionally kept alongside the competing Coast 01 review in PR #86 and the source-comparison audit in PR #87. It does not replace either.

**Branch:** `work/meridian-coast-pr67-candidate-20261122`, based on PR #87 HEAD `3a923dab989c046b186370d2f441ad4a545c6c2f`. This is a *stacked* review, not a PR directly against canonical `main`. The current canonical baseline at selection was `019175c6463ff31807a0f7013d91299add94913c`.

## Source facts and exact changes

The source is the unmerged historical [PR #67](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/67), commit `8bdf34c5eddf4e12e34352018b2a893cb9a14056`. Its Coast 01 JSON was byte-copied previously as `SOURCE_PR67_COAST_01_20261120.json` (Git blob `7cb79b2113bfef7b7fbbc39539c17fd80a275cd7`).

The original PR #66 Coast 01 geometry remains archived separately (Git blob `81ef8da51951205394ba050fe6f867bfc00d7244`) and so does its historical SVG (Git blob `56e6ba7a830fdc53e6dcff205871b3af57e7c04e`). The competing PR #86 revised JSON is **also untouched** (Git blob `dae1ea04e1addcaa1ed71b1a96e0e2171e0c7ac9`).

PR #67 differs from the original Coast 01 source by exactly **three scalar updates**:

| Item | Original PR #66 | PR #67 reviewed candidate |
| --- | --- | --- |
| Freight-zone polygon `HC-Z-FREIGHT`, point 3 x | `72.5` | **`72.25`** |
| Old-street candidate `HC-A-OLD`, point 3 y | `39.1` | **`39.95`** |
| Old-street candidate `HC-A-OLD`, point 4 y | `38.9` | **`39.3`** |

No other historical geometry was altered. `MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json` preserves every PR #67 source field and adds only `candidate_review_2026_11_22` source, scope and approval metadata. All coordinates are **illustrative** and can be revised in a later approved city-plan decision.

## Why this candidate is preferred technically

The earlier **PR #86** correction solved the source freight polygon's intersection with the proposed coast but left **three** internal road–candidate-building conflicts (two boundary crossings and one road vertex inside `HC-B-02`). The PR #67 source instead corrects the freight zone **and** the proposed old street, producing **zero** land/water violations and **zero** detected internal street/building conflicts under the reviewed geometric checks.

This is an improvement to an internal **design sketch**, not proof of real building occupancy, road clearance, slope, land ownership, traffic rules, port security or accessibility. No player/NPC knowledge, action, movement, new `LOC-` IDs, street link or world time follows from the map.

## Source-matched visual reproduction

[PR #67 reviewed SVG](MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.svg) is a distinct rendering generated **only** from the candidate JSON. The renderer [`tools/render_harbor_coast_pr67_candidate.mjs`](../../tools/render_harbor_coast_pr67_candidate.mjs) uses the archived historical SVG as a presentation template, checks its Git blob, compares all original SVG coordinates with the archived PR #66 JSON, and rewrites exactly **11 polygons** (one illustrative water polygon, four zones, six candidate buildings) and **7 polylines** (one shoreline, six road lines). It embeds visible noncanonical status and provenance metadata.

Regenerate by explicit opt-in only: `node tools/render_harbor_coast_pr67_candidate.mjs --write`. Importing the module, inspecting the proposal, and running CI do **not** write any file.

[`tests/harbor_coast_pr67_candidate.test.mjs`](../../tests/harbor_coast_pr67_candidate.test.mjs) checks exact source Git blobs, only three scalar differences, zero recognized water/building intersections, matching coast seam, every SVG vertex against the corresponding JSON coordinate within 0.051 px rounding, byte-identical re-render, non-admission, tamper rejection, and no change to canonical state.

## Remaining boundaries and recommended next action

The shoreline joint with historical Coast 02 remains **(75.1,42)**, the same as the matching PR #86 branch; this proves **matching study coordinates**, not a surveyed coast or travel route. The neighboring Land 03 road-join coordinates are the same as documented in the PR #87 audit: **(68.1,43.8)** and **(68.2,46.65)**. They remain unadmitted.

The competing historical Market Row–Harbor Walk route options #44 and #58 are **not resolved**; matching #58 to the drawn `HC-A-MARKET` tail merely reflects its source dependency. The Plaza–Harbor corridor #56 still intersects the unapproved `HC-B-01` candidate building. Correcting Coast 01 does **not** resolve these problems.

**Recommendation:** review this smaller three-scalar variant as the candidate to supersede PR #86's two-vertex-only draft, while retaining the original historical blobs and PR #87 comparison. Do **not** promote it to world canon until corridor conflicts and wider city-plan consistency are settled.

**Quality gate:** prove the exact final branch commit with complete Node, Python and saved checkpoint GitHub Actions; compare inventory to the final Git tree and all five story blobs to canonical `main`. No claim of final acceptance is made solely because a drawing is generated.
