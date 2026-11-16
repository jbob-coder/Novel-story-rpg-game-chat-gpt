# Crosswater Plaza → Crosswater Terminal — local detail (section 3)

**Status:** Draft geometry only. **Next route to develop:** Crosswater Plaza → Harbor Walk, but **only after** this section's verification.

This is a **short original graph link**, not another cross-city road. The story establishes that Crosswater has a glass-fronted terminal entrance adjacent to the plaza, with bus and rail transit. Exact doors, bus bays, kiosks and parking/road crossings are not yet fixed.

## Pedestrian approach

```text
Crosswater Plaza (existing) ── plaza circulation ── forecourt (draft) ── Terminal entrance (existing)
 MB-PT-N0                  MB-PT-N1                        MB-PT-N2
```

The original link is subdivided into two candidate pedestrian segments. The centre forecourt point is a **planning marker**, not a new game location or a required station ticket barrier. Each side of each stretch has a short frontage context that can guide later block and building design without inventing a store, a station entrance fee, or an NPC meeting.

**Before treating this as a complete physical building interface**, check the station property line, platform/vehicle circulation, uninterrupted walking access, potential street crossings, and accessibility. None is certified yet; the graph only establishes that a path exists in the fictional city.

## Story protection

- The terminal is attached to Crosswater Plaza, not a distant standalone location.
- No need to alter Jack's chapter or identify exact routes/time.
- The terminal's glow being perceptible in the Café Bruma scene stays a constraint on the **later** combined map, not proof of line-of-sight from this tiny area.
- Do not assume Lena, Sora, Jack or other NPCs move along it offscreen merely because a design route exists.

## Tests and next step

[Proposed data](MERIDIAN_BAY_PLAZA_TERMINAL_DETAIL_20261116.json), [read-only validation](../../tools/meridian_bay_plaza_terminal_detail.mjs), [targeted tests](../../tests/meridian_bay_plaza_terminal_detail.test.mjs).

Validate source graph, midpoint alignment, route reversibility and no saved-world mutation, plus full Node/Python/checkpoint test suites. Only after passing should the next local link be drafted. The final full-city road/obstruction review remains a separate end-of-map phase.

**This section is not activated in the saved novel.**
