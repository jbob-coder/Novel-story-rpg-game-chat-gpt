# Meridian Bay — Crosswater Plaza → Harbor Walk (detailed section 4)

**Status: PROVISIONAL / NONCANONICAL ROAD DESIGN.** This is one existing Crosswater Plaza ↔ Harbor Walk connection, **not** a finished shoreline or an expansion into the industrial/passenger port.

**Sources:** `game/STARTING_LOCATIONS.md`, `game/STATE.json`, and the saved `chapters/CH-000.transcript.json`. The source graph confirms that Crosswater Plaza already connects to Harbor Walk. The saved chapter describes port lights beyond the buildings over dark water. Neither source defines a coastline polygon, street width, bridge, seawall, vehicle lane, or public entry into port operations.

**Design data:** [four-link plan](MERIDIAN_BAY_PLAZA_HARBOR_CORRIDOR_DETAIL_20261116.json) · [read-only validation](../../tools/meridian_bay_plaza_harbor_corridor.mjs) · [regression tests](../../tests/meridian_bay_plaza_harbor_corridor.test.mjs).

## Work one pair at a time

This section starts at Crosswater Plaza (reference coordinate 65,42) and reaches the Harbor Walk public viewpoint (71,37), subdivided at three intermediate *noncanonical* reference points on a reversible fictional drawing grid.

```text
Crosswater Plaza ── L1 ── N1 ── L2 ── N2 ── L3 ── N3 ── L4 ── Harbor Walk
      existing      urban edge      view approach   waterfront transition      existing
```

| Subsegment | Proposed character **between** the anchors | What remains unknown |
| --- | --- | --- |
| L1 — Plaza edge | Public pedestrian flow and city building edges | Actual crossing, transit traffic, rights of way |
| L2 — Urban harbor-view approach | Building spacing or reflections that can plausibly allow harbor lights to be perceived | Exact sightlines, building heights, public/private alleyways |
| L3 — City-to-waterfront approach | Gradual urban-to-promenade transition | Land/water boundary, seawall, bridge, grades, and accessible path |
| L4 — Harbor Walk arrival | Public promenade atmosphere with industrial/passenger port views | Port gates, quay and pier geometry, whether nearby port operations are accessible |

Each interval includes two **relative** frontage sides; these are **not surveyed parcels or confirmed blocks**. The path is a candidate pedestrian depiction of a previously established graph edge, **not** a verified road, legal access route, or actual walking-time estimate.

The original narrative has already established a **harbor view between buildings** from Crosswater and port lights over water. This draft must preserve that possibility, without asserting a directly unobstructed sightline. Harbor Walk allows views of port activity; that does not authorize walking into a restricted industrial/passenger port area.

## Preserve remaining story topology

**Market Row ↔ Harbor Walk** is also an existing, direct graph link. It is **not** the same path as Market Row → Crosswater Plaza → Harbor Walk; it will be given its own in-between detail **next**. Until that work exists, do not delete or fold the direct graph link into the Crosswater route.

The first three section designs — Railgarden → Market Row, Market Row → Crosswater Plaza, and Crosswater Plaza → Terminal — remain separate and unchanged. This fourth section does not move Jack, advance a simulated clock or place an NPC offscreen.

## Acceptance and next gate

The validator checks original source and chapter evidence, the two-way known graph edge, all four ordered pieces and their frontage descriptions, original map anchor alignment, absence of unregistered sketch crossings with the previous eight proposed segments, and explicit noncertification of accessibility/shoreline/port access.

Run the focused tests, entire JavaScript/Python suite and canonical checkpoint validator. Log the exact CI outcome before treating this incremental code as technically checked. A passing test **cannot establish real geography**: it proves internal consistency of a proposed narrative-world sketch.

After review, proceed to **Market Row → Harbor Walk** as a **fifth** independent detailed corridor. Only **after** all sections are detailed should we perform the comprehensive full-city network review, including connected routes, likely obstructions, environmental layout and inconsistent branches.

**No activation:** Changes are isolated in a new draft branch, not the playable story. Jack remains at CH-000, turn 9, Day −29 unless separately advanced by a real player action through the verified save protocol.
