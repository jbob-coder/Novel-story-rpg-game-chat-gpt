# Meridian Bay — Railgarden → neighborhood grocery (detailed local section 7)

**Status:** Draft; place preauthored in Meridian Bay Phase 1 **but not admitted into the saved novel**. This section only details the space between the Railgarden district reference and its neighborhood grocery.

**Evidence:** `docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json` identifies `LOC-RAILGARDEN-ABARROTES` as a public-facing grocery connected directly to Railgarden, without a confirmed individual staff, inventory, hours or visit. The previously drawn `MB-WEB-003` supplies provisional coordinates only. The canonical `game/STATE.json` does **not** yet contain this site; narrator-private preparation may see it without modifying Jack's world.

```text
Railgarden district (N0) ── L1 ── neighborhood frontage bend (N1) ── L2 ── designed grocery reference (N2)
```

**L1 — neighborhood approach:** Modest residential context and ordinary small commercial buildings. Neither a crosswalk, private alley, school route, household entrance nor extra street is established.

**L2 — grocery frontage:** A reversible public-facing shop approach; the exterior's door and windows are not surveyed. Do not infer which person works there, what items are in stock, whether it is open at this fictional hour, whether Jack knows the shop, or whether any purchase happened.

Each stretch has **two relative frontage sides**, not fixed property footprints. The draft does not move the player, complete a store visit, consume time, place NPCs or create events. The nearby clinic is a **separate** planned link and will be detailed afterward.

[Structured draft](MERIDIAN_BAY_RAILGARDEN_GROCERY_DETAIL_20261116.json) · [Read-only validator](../../tools/meridian_bay_railgarden_grocery_detail.mjs) · [Tests](../../tests/meridian_bay_railgarden_grocery_detail.test.mjs).

The validator verifies source graph/canonical household continuity, six-place catalog identity, reciprocal **detached** Railgarden↔grocery link, exact source-provisional sketch points, two continuous subsegments and unadmitted location state. Full JS, Python and checkpoint CI must pass before this individual map section is technically reviewed. A passing test is **not** a certification of real streets or business availability.

**Next section after passing:** Railgarden → clinic, separately. A full-city geography and routing audit must wait until other local sections are mapped.
