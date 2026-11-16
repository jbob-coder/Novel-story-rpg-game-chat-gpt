# Meridian Bay — Market Row → Crosswater Plaza (detailed corridor 2)

**Status:** Draft, not playable or finalized street geometry.

**Dependencies:** [Railgarden → Market Row detailed corridor](MERIDIAN_BAY_RAILGARDEN_MARKET_CORRIDOR_DETAIL.md) must remain coherent. The existing Market Row–Crosswater base connection, formerly in [PR #36](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/36), is now also carried into this **sequential** development branch so the two fully detailed corridors can be reviewed in order.

**Data:** [Four-link corridor JSON](MERIDIAN_BAY_MARKET_CROSSWATER_CORRIDOR_DETAIL_20261116.json) · [Read-only checks](../../tools/meridian_bay_market_crosswater_corridor.mjs) · [Tests](../../tests/meridian_bay_market_crosswater_corridor.test.mjs).

## The in-between space, one corridor only

A player who walked from Crosswater Plaza toward Market Row already entered an area with shops and the corner Café Bruma. This was established in Chapter CH-000. The existing city graph confirms a direct Market Row ↔ Crosswater Plaza connection. This design fills the gap between those district reference points with **four sequential candidate segments**.

```text
Market Row ─ L1 ─ N1 ─ L2 ─ N2 ─ L3 ─ N3 ─ L4 ─ Crosswater Plaza
```

| Segment | Proposed urban character | Review limitations |
| --- | --- | --- |
| L1 — Market Row edge | Small shops, offices, ordinary delivery-facing frontage | Exact shop entrances and curb access not known |
| L2 — commercial-to-transit transition | Smaller commercial/service frontages and a pedestrian approach | No asserted additional street, bus stop or right-of-way |
| L3 — plaza approach | Candidate open shopfront spacing and pedestrian court; preserve potential perception of terminal light | No direct sightline, facade orientation, or building height proven |
| L4 — Crosswater entrance | Transit-oriented public forecourt near the glass-fronted terminal | Pedestrian crossing and traffic access not physically designed yet |

Each stretch has two **relative** frontage sides for later block authoring. These are not surveyed property plots or named establishments.

## Preserving the played chapter

The story describes Jack heading from Crosswater to Market Row, finding Café Bruma at a corner, and perceiving the terminal's glow from the café area. A speculative future building cannot be placed across every possible view of that glow without providing a consistent alternative such as reflection or a gap. Conversely, the existing scene **does not prove** an unobstructed straight visual line from the café to the station. The narrative's location order and information boundary outrank this pencil sketch.

The second segment of the earlier road web (Crosswater Plaza ↔ Terminal entrance) remains a separate, direct preexisting link. This document elaborates only the **Market Row ↔ Crosswater Plaza** corridor, rather than treating the plaza or Harbor Walk as another completed block design.

## Next section rule

First validate all four links, frontage transitions, route direction in both ways, no invented graph links, and the sightline limitation. The full JavaScript/Python/checkpoint suite must pass on an isolated PR. **Only after that** detail the next already-established link from Crosswater Plaza toward Harbor Walk, including a careful waterfront land/shoreline transition; do not simply add a line and declare the waterfront done.

Do not advance Jack's story, approve hidden NPC movement, create locations for planning nodes, establish clock times, or edit the game's five save files. The entire Meridian Bay map should be globally reviewed only **after** completing the local corridor and block designs.
