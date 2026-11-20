# Meridian Bay — Railgarden grocery frontage: admitted-world adaptation

**Date:** 2026-11-20. **Work branch:** `work/meridian-grocery-frontage-admitted-20261120`. **Source base:** `main` at `019175c6463ff31807a0f7013d91299add94913c`.

## Scope and historical source

This is a **selective, standalone code adaptation** from the historic `work/meridian-bay-railgarden-grocery-detail-20261116` (`3bad47131f631d7edb472ef57dc8495226a22835`), notably `tools/meridian_bay_railgarden_grocery_detail.mjs` (blob `e633f74c3db62acd5508101e13f663c0bb068d1f`) and `MERIDIAN_BAY_RAILGARDEN_GROCERY_DETAIL_20261116.json` (blob `c2c4881a2432f4be447200d9305ae375b8545ee1`).

The historical validator assumes `LOC-RAILGARDEN-ABARROTES` is **not yet in `game/STATE.json`**, and brings in a transitive chain of old corridor validators. Neither is correct for the current admitted world. This port **does not copy** those transitive dependencies or overwrite the historic design. It retains only the two provisional frontage sections, the fixed three planning points, parent `MB-WEB-003`, and appropriate safety rules. The adapted JSON fixes the authority language: the site exists, but detailed physical geometry remains a private unapproved draft.

**Existing, verified story graph:** `LOC-RAILGARDEN-RESIDENTIAL` ↔ `LOC-RAILGARDEN-ABARROTES`. The entrance is publicly accessible in the catalog, with unknown hours, staffing, products, pavement, door position and real walking time. The parent household connections are also protected.

## New implementation and contract

- `tools/meridian_bay_grocery_frontage.mjs` exports `validateRailgardenGroceryFrontage({state})` and `previewRailgardenGroceryFrontage({state,fromId,toId})`.
- `docs/01_world/MERIDIAN_BAY_RAILGARDEN_GROCERY_FRONTAGE_REVIEW_20261120.json` stores a provenance-checked snapshot of the historical geometry, **not** a new playable-world graph or canonical building.
- Validation requires the reviewed admitted-city design; calls `verifyMeridianBayWorld` from the existing engine; checks that the grocery equals the authored catalog; confirms reciprocal district, household and workshop links; checks the planning canvas and frozen two-part geometry. It fails closed on missing/duplicated connections, unexpected waypoints or forged admissions.
- Preview is **narrator-private only**. It lists ordered draft nodes/segments in either direction; any outside node yields `outside_this_frontage`. It does not call a turn engine, write a state, move actors, decide time, grant discovery/visit or authorize navigation.
- `openNow` delegates to the current `locationAvailability` calculation; absent event-linked mutable state it is `unknown`, **not** `open`. Staff, stock, discovery and prior visits remain explicitly **unknown**, rather than fabricating false facts.
- No change to `tools/meridian_bay_prebuilt_routes.mjs` or actual route traversal. This is an **inspection capability**, not a new action or integration with the narration pipeline.

## Safety and test plan

The suite `tests/meridian_bay_grocery_frontage.test.mjs` includes **12** regression cases: historical source provenance, preserved geometry, reversible private preview, unknown service facts, a synthetic event-linked closed shop, unsupported corridor rejection, pre-admission fixture rejection, forged review/identity rejection, missing and duplicated graph links, household/workshop boundary checks, fabricated waypoint rejection and zero save/turn impact.

The tests must pass in GitHub Actions **on the exact final PR HEAD** together with all existing JavaScript, Python and checkpoint gates. A historical passing PR suite is not sufficient. Tests use a cloned fixture of the real checkpoint; no synthetic closure is saved to disk and no old checkpoint replaces the current story.

## Integration decision and follow-up

The earlier route drafts #40/#52, #42/#56 and conflicting #44/#58 remain separate. This PR makes **no** geometric choice among them; it validates only the Railgarden grocery frontage.

If this PR is accepted, the next safe target is the clinic frontage `LOC-RAILGARDEN-CLINIC` using the same admitted-world approach and a separate migration. Do not generalize prematurely across all planned sites. Keep the current story at CH-000 turn 9 until an actual owner action and fully verified journal transaction.
