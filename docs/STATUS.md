# Project status — initial vertical slice

## Current objective

Establish an evidence-based starting point for an original Living Superhuman World game, without locking its final platform.

## Confirmed before implementation

Repository `jbob-coder/Novel-story-rpg-game-chat-gpt`, default branch `main`, initially contained only a one-line README. An active repository ruleset named `Guard goblin` applies to all branches, blocks deletion and non-fast-forward history rewrites, but does not require pull requests or approving reviews.

## Implemented (proposed branch)

- Approved world rules written into canon and decision records.
- Browser-playable, text-first daily choice loop and autonomous NPC actions.
- Seeded, reproducible cosmic awakening on Day 0 affecting humans, wildlife, plants and environment.
- Local save/restore, bounded stats, event history and unit tests.

## Verification

Run `node --test` on the exact branch contents. Record actual results and commit SHA in the pull request; do not treat this description as evidence tests were executed on GitHub.

## Next tasks

1. Decide the platform/engine and target experience before expanding code architecture.
2. Build durable NPC identity, needs, memory, relationships, and persistent factions.
3. Develop the nonhuman/ecological simulation and effects on cities, habitats and infrastructure.
4. Extend save schema and tests, including migration and interrupted sessions.
5. Add branch rules requiring review/approval before changes reach `main`, if owner chooses.
