# Meridian Bay — Market Row → Harbor Walk (detailed core section 5)

**Status:** Provisional map design, not canonical streets or verified navigation.

The saved `game/STATE.json` and `game/STARTING_LOCATIONS.md` establish an **independent direct connection** from Market Row to Harbor Walk. This is **not** the Market Row → Crosswater Plaza → Harbor Walk route, which was detailed separately. Both original graph links must survive. Their actual distances, speed, and relative travel convenience are unknown.

## One link, with the in-between areas detailed

```text
Market Row — L1 — N1 — L2 — N2 — L3 — N3 — L4 — N4 — L5 — Harbor Walk
  existing    urban edge     mixed city   port-view edge  promenade approach   existing
```

Six coordinate anchors (four of them **noncanonical planning bends**), five contiguous candidate walking stretches, and five two-sided frontage descriptions. Each proposed part is a reversible representation of the old graph edge, not a new game location.

| Subsegment | Proposed surroundings | Still unresolved |
| --- | --- | --- |
| L1 | Transition from Market Row's shops/offices and ordinary deliveries to a less commercial urban edge | Individual shop exits, crossings, public ownership |
| L2 | Mixed city frontages, possibly local services | Actual alley geometry, residents, business identities |
| L3 | Transitional urban approach with possible distant harbor impressions | Exact land–water boundary, port perimeter, public walkway rights |
| L4 | Promenade-facing approach in the broader waterfront study area | Quays, grade changes, property fencing, transit/industrial interference |
| L5 | Connection into Harbor Walk's established public viewing path | Shoreline type, pier presence, public accessibility, traffic or port access |

Proposed geometry uses reference anchors Market Row (58,43) and Harbor Walk (71,37) with four waypoints. These coordinates are **fictional planning units**, not surveyed meters, navigation distances, or city streets. The drawing avoids crossing the nine previously drafted route sketches internally; an in-game or real physical map still needs a separate geographical/accessibility check.

## Narrative constraints and boundaries

Chapter CH-000 describes distant harbor lights beyond buildings, and the world setting establishes Harbor Walk as a **public waterfront viewpoint** with industrial/passenger port views. This does not make shipping facilities accessible, imply any particular port gate, or create NPC routes. No fictional time, player location, event, business or player knowledge changed.

[Draft route data](MERIDIAN_BAY_MARKET_HARBOR_CORRIDOR_DETAIL_20261116.json) · [Fail-closed validator and private preview](../../tools/meridian_bay_market_harbor_corridor.mjs) · [Regression tests](../../tests/meridian_bay_market_harbor_corridor.test.mjs).

## Development next

- Complete targeted tests, all Node/Python regressions and canonical checkpoint validation in isolated CI.
- Review the **known starting core** for omitted existing location edges and missing block/frontage details. **The current reference canvas is not proof that all Meridian Bay neighborhoods are mapped.**
- Continue section by section wherever original map data confirms a connection. Only after the map has adequate breadth should a **global routing, obstacles, natural-boundary and visual-sightline audit** take place, with measured or approved design geometry.

**Do not merge into the playable world or claim the full map is finished.** All parent PRs remain review drafts.
