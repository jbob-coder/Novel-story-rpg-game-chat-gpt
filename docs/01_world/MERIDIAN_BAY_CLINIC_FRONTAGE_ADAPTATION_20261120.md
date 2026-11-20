# Railgarden clinic frontage — compatibility port for an already-admitted location

**Date:** 2026-11-20. **Independent branch:** `work/meridian-clinic-frontage-admitted-20261120`. **Authoritative base:** `main` at `019175c6463ff31807a0f7013d91299add94913c`.

## Inspection and historical custody

The old clinic draft lives in PR #64, `work/meridian-bay-railgarden-clinic-detail-20261117`, commit `3a359a171ecf31d3e7492e600b1cbae3e2aec426`. Its source `tools/meridian_bay_railgarden_clinic_detail.mjs` has Git blob `43ddfce346bf939ae669fde53ca73c2042c39eff`; its JSON has Git blob `5e8442b4baec74e646b79148d09d11ed6d113acb`.

Historical source #64 stacks on grocery PR #62, itself depending on older road/frontage PRs. Its original validator **requires the clinic not to exist in the saved checkpoint**. This was true for the historical branch, but is false for `main`: all six authored Meridian Bay sites have already been admitted under `MB-PREBUILT-20261112-V2`, reviewed with operation `world_admission`. Therefore **blind merge or unchanged validator reuse is incorrect**.

The new file `MERIDIAN_BAY_RAILGARDEN_CLINIC_FRONTAGE_REVIEW_20261120.json` was generated from the historic JSON with **all 3 XY coordinates, 2 link descriptions, 2 frontage bands and uncertainty flags preserved**, plus provenance and revised site status. The planning bend `(48.55,44.28)` is **not a saved location**, surveyed sidewalk, verified ramp, doorway, crossing, emergency access or additional gameplay vertex. Both endpoint coordinates are checked against the existing city-scale plan. The prior status `prebuilt_design_not_saved_story_location` was updated to `admitted_saved_story_location_with_unverified_frontage`; this is correction of source assumptions, not a new world admission.

## New technical contract

`tools/meridian_bay_clinic_frontage.mjs` exports:

- `validateRailgardenClinicFrontage({state})`: requires an actual reviewed and already-admitted world with a valid player location; verifies the full authored catalog, exact clinic identity, its existing reciprocal link to Railgarden, and retained grocery, commercial district and Wilson home/workshop connections. It checks immutable source provenance, spatial geometry, both bands and no claims of certified accessibility or clinical care.
- `previewRailgardenClinicFrontage({state,fromId,toId,weekday,minute})`: produces a cloned, narrator-private draft sequence in either direction; unsupported nodes return `outside_this_frontage`. Opening state comes from the existing event-backed location-state reader, and defaults to **unknown**. Even a synthetic scheduled `open` result does not establish staffing, doctors, medicines, available care or emergency capacity.

The adapter never writes the world or save files, creates events or admission records, moves Jack/NPCs, passes fiction time, grants discovery/visit or authorizes actual route traversal. It does **not** integrate into the narration or save engine. The information is available only to a reviewer until a separate integration decision.

## QA acceptance and risks

`tests/meridian_bay_clinic_frontage.test.mjs` contains **14** regression tests: 15-location admitted checkpoint, source preservation, two-way provisional review, unknown medical details, synthetic closure, unsupported nodes, pre-admission rejection, forged review and clinic identity, missing/duplicate clinic links, preserved grocery/commercial/household links, invented waypoint rejection, unverified accessibility and ambulance context, fail-closed state checks, and synthetic opening-hours handling.

Every synthetic closure/opening record exists only in the in-memory test copy. The recorded event identifier there tests the status reader shape; **it does not create a valid real-world event history or authenticate a new open clinic**. Actual chronological and source verification remains under `tools/location_state.mjs` and the save/journal gates.

**Before claiming completion**, verify exact-HEAD GitHub Actions JavaScript, Python and checkpoint validator; compare Git trees and inventory, especially the five canonical narrative blobs. A passing historical PR #64 run **does not** prove modern source compatibility.

**Separate branches:** PR #83 is documentation/audit only, PR #84 is the independent grocery adaptation. Neither is merged here. Do not bring those branch files into this PR or merge older dependencies just to satisfy clinic validation.

## Next task after QA

Perform independent evaluation of Market Row → Noah repair shop frontage (historical #66 or successor, verifying the actual HEAD first); compare saved-state admission and avoid prematurely interpreting unverified storefront plans as playable locations or staff.
