# Prototype simulation contract

## Existing vertical slice

- The game starts on Day -30. Each player choice advances one day; `wait` demonstrates that the world advances independently of the player.
- Four NPCs make autonomous decisions based on energy, resources, motivations, the world's concern level, and seeded day variation. Their actions update individual state and collective society metrics.
- Day 0 triggers the shockwave **once**. No one can awaken before that day.
- Human awakening is assigned deterministically by seed. The first NPC awakening is guaranteed on Day 0. Other humans can awaken later or not at all.
- Wildlife, plants, and environment are each affected at Day 0; later changes occur independently of player actions.
- A limited event log records consequential world activity. World state is JSON-serializable; localStorage persists it only in the current browser.
- `src/simulation.js` is independent of HTML and uses no wall-clock or ambient randomness. Replaying a seed and a sequence of choices reproduces the same state.

## Current limitations

- Four NPCs with simple daily rules are **not** a full living-world simulation. There is no geographic pathfinding, households, economies, complex relationships, factions, law, combat, quests, or agent planning.
- Initial ability categories and awakening probabilities are placeholders, not confirmed canon.
- Changes to animals/plants/environment are counters, not yet biological or physical simulations.
- Simulation progresses only when a day is advanced; there is no real-time background service.
- Saved state is local and versioned but not backed up, encrypted, or synchronized. Browser rendering requires manual verification.

## Extension architecture

Keep the simulation separate from the user interface. Next increments should add: persistent actors and memories; organizations with independent objectives; place/time simulation; causal event records; explicit ecological state; tests of deterministic replay and save migration. Avoid assuming that all inhabitants use player-visible RPG interfaces or that every enhanced human must become a hero or villain.
