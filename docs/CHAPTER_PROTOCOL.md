# Chapter, events and save protocol

The repository is the durable game reference. The conversation is the live interface.

## File roles
- `docs/CANON.md`: owner-approved universe facts.
- `docs/DECISIONS.md`: approved or superseded design choices.
- `game/STATE.json`: latest checkpoint after the last **verified saved** turn.
- `chapters/CH-NNN.md`: prose record for a chapter, with status (opening, in progress, complete), setting, events and unresolved threads.
- `chapters/CH-NNN.events.json`: structured, ordered events for that chapter once events occur.
- `docs/STATUS.md`: verified work and recovery notes.

## Event format (future turns)

Each event should contain a unique ID (e.g. `EV-000001`), chapter ID, in-world day, actor IDs, user intent or independently initiated action, observed outcome, state deltas and any causal parent event ID. Keep uncertain/offscreen reports labeled as such. Do not rely on a prose summary alone to reconstruct continuity.

## Turn transaction
1. Read the latest checkpoint and current chapter.
2. Resolve the player's input and independent world activity.
3. Check invariants: no superhuman before Day 0; no broken character/location references; no impossible inventory, knowledge or chronology jumps.
4. Write an event record, update chapter prose and checkpoint on the working branch, and verify the saved files.
5. Publish the narrative response and the actual save status.

When these writes cannot be completed together, identify incomplete files and reconcile from the last known consistent checkpoint before the next turn. Do not treat an uncommitted chat response as a durable repository save.

## Chapter transitions

Chapters are narrative sequences rather than fixed daily ticks. End one when a meaningful arc closes; carry persistent NPC and world events into the next. Do not rewrite completed outcomes without an explicit correction/retcon record. Continue independent events across chapter boundaries.

## Public repository caution

Use fictional character and world state only. Never include private account data, credentials, or personal details from a user message unless they explicitly intend those facts to be public fictional material.
