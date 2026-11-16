# Meridian Bay — Wilson home → Railgarden (detailed local section 6)

**Status:** PROVISIONAL / NOT CANONICAL STREET GEOMETRY. **One connection only.**

The story establishes that the Wilson family occupies an apartment **within Railgarden** and that Jack's workshop is inside that home. On a previous night he returned from Market Row, passed Railgarden's residential buildings, and reached the Wilson apartment door. On the next morning, a bus was audible outside. This is enough to define a neighborhood approach, but **not** an exact street-level building entrance, numbered address, stairwell, transit stop or walking time.

[Detail data](MERIDIAN_BAY_WILSON_RAILGARDEN_DETAIL_20261116.json) · [Read-only validation](../../tools/meridian_bay_wilson_railgarden_detail.mjs) · [Regression tests](../../tests/meridian_bay_wilson_railgarden_detail.test.mjs).

## The two in-between pieces

```text
Wilson home reference ── L1 ── Residential frontage reference ── L2 ── Railgarden district reference
      (N0)                         (N1; draft only)                     (N2)
```

**L1: Residential building approach.** The candidate route begins at the family home reference, passes through a conceptual building/frontage transition, and enters the neighborhood's public-facing context. This does **not** establish an individual apartment floor, lobby, direct exterior door, building footprint, ownership, stairway or public access through a private building.

**L2: Railgarden neighborhood approach.** A candidate residential frontage leads toward the district reference. Nearby everyday shops and the familiar sounds of ordinary bus traffic are consistent with the established Railgarden setting. But a particular stop, grocery entrance, clinic door, pedestrian crossing, or neighbor is **not** placed on this line without further evidence.

Each stretch has **two relative frontage descriptions** for future block planning. The single intermediate point is merely a reversible planning bend. It is not a new world location, a forced encounter, or an NPC destination.

## Separation of interior and street map

The Wilson workshop is **inside the apartment**. It remains connected to the home in the world graph but is not a street entrance, workshop storefront, or exterior building. The Wilson residence is not presumed owned or rented. Elena's school is **not mapped** from this passage. Neighborhood grocery and clinic are different Phase 1 drafts with separate direct Railgarden connections, and remain for later detailed sections.

The coordinates (46.3,44.5), (47.1,44.35), and (48,44) are all on the earlier provisional drawing grid. They do not establish meters, travel minutes, cardinal orientation, street name or walking accessibility.

## Acceptance gate

The validator first checks all previously detailed corridors, then confirms that both original endpoints and their only intermediate drawing marker reproduce the exact parent segment `MB-WEB-001`. It tests reciprocal Railgarden–home links, preserves the indoor workshop, checks the saved chapter and setting evidence, and excludes unsupported new entrances or world state writes.

After focused and full regression tests pass, the next **single** link is Railgarden → neighborhood grocery. The neighborhood clinic and Market Row shop frontages follow one at a time. The **global** city routing and obstruction review occurs only after the individual local sections are authored.

No changes to the five saved story files; Jack remains at CH-000 turn 9, Day −29, until a real player action and verified save authorize advancement.
