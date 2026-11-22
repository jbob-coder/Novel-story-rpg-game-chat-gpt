# Cross-stack Harbor Walk / Plaza waypoint clearance and map coverage — 2026-11-22

**Status:** independent **read-only**, unadmitted engineering comparison. No player action, NPC movement, story turn, canonical map admission or route selection.

## Branch lineage and source custody

Review branch `audit/plaza-harbor-crossstack-coverage-20261122` is based on **PR #106** exact HEAD `b22e05f1c4738bdcd0d907dc2bae671ac690e711`. Its upstream review chain is #101 → #94 → #87 → #86; no source parent is merged. **Do not merge this review independently** or use it as a road survey.

The separate [PR #103](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/103) is a **sibling**, stacked on #89 → #87 → #86. Its local reconciliation JSON at immutable PR #103 HEAD `a04712478fad6ab3f367d3af2eb1f14ee55013e2` is copied byte-identically to `SOURCE_PR103_HARBOR_ACCESS_RECONCILIATION_20261122.json`, Git blob `aae66aae315603e37e8cb88034600446bf46d21d`; this archive is **evidence only**, not a second approved map.

Other pinned source records, inherited unchanged: PR #56 original `a5ac772922b4717797118b15f182207be1d1a7fb`; PR #67 Coast 01 `7cb79b2113bfef7b7fbbc39539c17fd80a275cd7`; PR #44 Market `e8efe8e5f6a746ab4e628f76a9deb5f71061010d`; land fragment 03 `2a95eb9e50f69436cb65711daf8ff586f4ef4279`; Coast 02 `325a0acde67a1ce3b44576860824657a3db41695`. The PR #103 candidate metadata also refers to PR #89 Coast01 blob `139c3687c98285aff886d28422544d082768217d`, but the underlying 2-D geometry compared here is the archived PR #67 source.

## Exact comparison (fictional 2-D canvas, not physical distance)

Two separate **one-waypoint** proposals preserve all other PR #56 route points and the Harbor Walk terminal. Option A from PR #106 uses N2 `(69.6,39)`; sibling PR #103 uses N2 `(68.3,38.1)`. Both have zero *strict* candidate building/blocked-trace crossings under existing source screening.

| Candidate result | PR #106 A | PR #103 sibling |
| --- | ---: | ---: |
| `MB-PH-N2` candidate XY | (69.6, 39) | (68.3, 38.1) |
| Route length, abstract canvas units | 7.990491 | 8.280615 |
| Minimum gap to candidate `HC-B-01` | **0.079745** | **0.293021** |
| Minimum gap to candidate `HC-B-02` | **0.111803** | **0.829699** |
| Gap to draft old-street trace `HC-A-OLD` | 0.166960 | 0.851566 |
| Length outside the 3 available study rectangles | **3.638721** | **4.611400** |
| Percent of illustrated route outside study rectangles | **45.538140%** | **55.689098%** |
| Strict crossings with sibling #103 Market reviewed path | 0 | 0 |
| Market candidate contact at shared Harbor destination | 1 | 1 |
| Legally/publicly accessible route verified | **No** | **No** |

The region coverage test uses the **union of rectangular study bounds** for Coast 01, inland 03, Coast 02. It does *not* establish surveyed land, approved roads or completeness inside those rectangles. It avoids double-counting where rectangles overlap. The first segment from the public plaza reference to `(66.9,40.6)` is entirely outside the union of available study rectangles in both options.

**Critical design risk:** a line with zero intersection can still have inadequate width. PR #106 A's nearest point is less than **0.08 arbitrary drawing units** from `HC-B-01`; that is not a certified pedestrian gap. Sibling #103 increases clearance in the illustrated coastal part, but has more of its full route outside existing study rectangles. The comparison does **not** prove the sibling is better overall. Approvals must not be inferred from relative sketch distances or labels.

## Executable gates

`tools/meridian_bay_plaza_harbor_crossstack_coverage.mjs` pins all six historical source blobs and validates exact PR #103 Plaza/Market edits against PR #56/PR #44. It evaluates segment-to-segment clearance (crossings, contacts, containment), candidate building separation, review-only routes vs the sibling Market variant, and clipped coverage against the three study rectangles. Results are deep-cloned and private; no code writes to source/state.

`tests/meridian_bay_plaza_harbor_crossstack_coverage.test.mjs` adds tests for immutable provenance, both exact N2 changes, B01/B02 gaps, overlap-safe region clipping, strict/touching/contained synthetic geometry, same-terminal-only contact, corrupt graph rejection and no state changes.

**Acceptance:** full Node/Python/checkpoint CI on exact HEAD of this branch, file inventory reconciliation and all five canonical narrative Git blobs compared with PR #106 and main. As with parent reviews, the QA-only PR must never merge.

## Recommended next work; no canon decision

Before selecting either draft N2, expand the missing corridor coverage between Crosswater Plaza and Coast 01. Document all relevant buildings, public access boundaries, old street contacts and plausible walkway width **within the actual wider world plan**, without inventing surveyed measurements or fixed physical access. Only then compare fully compatible geometry, consider true pedestrian constraints and seek editorial approval. Both alternatives remain **unapproved**.

## Initial official CI evidence — implementation commit

On `fb04c5f142e7e297351bbf3aec4706f0f957252b`, the temporary, explicitly **no-merge** QA PR #115 triggered [Narrative integrity run #45081856027](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081856027), which finished **completed/success** on that exact commit. GitHub Actions logs and individual steps were read back: **500/500 Node tests passed**, **47/47 Python tests passed**, canonical checkpoint validator **PASS**.

An independent recursive Git tree comparison found **223** blobs vs parent PR #106's **219**: 4 source/docs/test files added, 4 original index/inventory paths modified, 0 deleted. Complete inventory **223/223**, no missing or extra paths. All five canonical narrative Git blobs match parent PR #106 and `main` at `019175c6463ff31807a0f7013d91299add94913c`.

This appendix is **a documentation-only follow-up commit**. Its new HEAD must be tested independently before final review; the earlier successful run is evidence for the implementation commit, not proof of the updated HEAD. QA PR #115 must be closed without merge after the final exact-HEAD run.
