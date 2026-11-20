# Independent world admission and mutable location state

The review of [PR #33](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/33)
identified two distinct responsibilities: admitting a reviewed city design before
Jack discovers it, and recording later changes to buildings and businesses.
These operations use separate records and do not replace played history.

## Admit the world without playing a turn

[`stageWorldAdmission`](../../tools/world_admission.mjs) accepts a verified
snapshot, its `observedHead`, and a `designReview` containing `reviewed: true`,
the catalog's `design_id`, matching `source_commit`, and a concrete `reason`.
It prepares an in-memory candidate and checks that only these world fields change:

- The six catalog locations and their reciprocal district connections.
- `world.prebuilt_design_id`.
- `world.prebuilt_design_review`, including `operation: "world_admission"`
  and `effective_from_turn` equal to the already completed turn.

Actors, possessions, knowledge, time, pending input, narrative threads, chapter
identity, event/transcript counters and played history remain unchanged. At a
turn-9 checkpoint, admission remains at turn 9; the next player action is still
turn 10. Admission generates no scene, player action or fictional event.

[`saveWorldAdmission`](../../tools/save_transaction.mjs) saves this candidate
through the existing five-file transaction with a mandatory durable journal.
The active transcript, event log, chapter prose and `SAVE_MANIFEST.json` retain
their exact original bytes, including formatting. Only `STATE.json` changes.
All five files are read back and checked, along with any closed chapter history.

The journal records `operation: "world_admission"`, the source chapter/commit,
the same completed turn and the admitted design ID. Interrupted recovery reads
the original immutable source again and validates the permitted state difference
and four unchanged files before moving a detached commit into place. Successful
admission and recovery return `narration_messages: []`; neither replays the last
scene. An already admitted world cannot be admitted again: recover the existing
operation instead of manufacturing another save.

This replaces PR #33's first-turn admission path. The
[`stageMeridianBayTurn` / `saveMeridianBayTurn` bridge](../../tools/meridian_bay_integration.mjs)
now requires an already admitted world and rejects a `designReview` attached to
gameplay. Later chosen actions continue through the normal narrative protocol.
Code availability or a passing synthetic test is not proof that admission has
occurred in the playable checkpoint; inspect the actual state and journal.

## Preserve the design; record what changes

`world.locations` retains the immutable catalog identity, description and map
connections. Optional `world.location_states[location_id]` stores changing
conditions separately. An absent entry means no mutable state has been recorded;
admission does not invent an opening schedule, a closure or pristine condition.

Each mutable record has exactly these fields:

| Field | Meaning |
|---|---|
| `operating_status` | `unknown`, `operating`, `temporarily_closed` or `permanently_closed` |
| `physical_condition` | `unknown`, `intact`, `damaged` or `under_repair` |
| `opening_hours` | `null` or an explicitly confirmed weekday schedule |
| `note` | Concrete causal description of the recorded condition |
| `last_change_event_id` | The actual event that established this version |

A change uses `field: "location_state"`, an existing `location_id`, explicit
`before` (`null` for the first record) and complete `after` values. The change's
actor must be the actor responsible for its event, and the new record cites that
event's ID. Location and actor effects share an atomic batch: a stale condition
or invalid later effect leaves both unchanged. The history validator replays
changes per location across all chapters, so different actors may cause later
changes to the same building without erasing the earlier evidence.

Use this mechanism for a justified closure, changed hours, damage, repairs or
reopening. It does not rename the original catalog, create an address, alter a
road, establish employee attendance, complete a service or perform a purchase.
Those facts require their own supported worldbuilding or narrative resolution.

## Availability and knowledge remain separate

[`locationAvailability`](../../tools/location_state.mjs) returns the current
private assessment and its source event. A recorded temporary or permanent
closure overrides posted hours. `operating` alone does not mean open now;
neither damage nor an identifiable entrance determines availability by itself.

Confirmed hours use `{confirmed: true, weekdays: {"0": [[start, end]], ...}}`.
Intervals use minutes since that weekday's midnight, with an explicit end past
1440 for an overnight interval. A missing weekday is unknown, not closed. The
availability helper also needs an established weekday and minute; relative Day
−29 is not a weekday. No calendar facts are inferred to make a schedule work.

Private route and world diagnostics may use these records. They do not teach
Jack about an unseen closure or schedule. `playerVisibleDiagnostic` excludes
private location-state data, and the known-place view continues to distinguish
an observed entrance from current availability. Disclosure needs its own causal
knowledge source and narrative review.

## Verification scope

The [admission tests](../../tests/world_admission.test.mjs) cover same-turn
admission, exact original bytes, source-bound review, duplicate refusal,
interrupted saves, recovery and tampering. The
[location-state tests](../../tests/location_state.test.mjs) cover causal state
changes, atomic failure, closures, hours, repairs, cross-chapter history and
private NPC effects. The [city integration scenario](../../tests/meridian_bay_integration.test.mjs)
admits the map independently before chosen travel, observation and a later visit.

These fixtures are synthetic. Their results establish implementation behavior,
not live activation or a new turn in Jack's story. Broader business inventories,
staffing, budgets, services and civilian event chains remain separate work.

## Verified GitHub admission — 2026-11-18

The implementation in [PR #78](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/78)
was based on the current narrative safeguards at `117fb6b8` and the reviewed
Phase 1 commit `ec4aedf0`. Published commit `68faa9abcce60a94b4ca62dd917c7e180407a6d5`
passed [CI #44322607447](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44322607447):
395 JavaScript tests, 47 Python tests and checkpoint validation. The full suites
also passed against an isolated admitted-world checkpoint. Historical auditing
normalizes only the validated catalog delta, then checks the pinned original
STATE blob hash; it still rejects unrelated state changes.

The tested coordinator delegated remote Git operations to the authenticated
ChatGPT GitHub connector through a temporary session bridge. No credential,
external service or continuously running game process was added to the repository.

| Operation | Verified evidence |
|---|---|
| Isolated admission | Branch `qa/world-admission-recovery-20261118`, separate journal `journal/qa-world-admission-20261118` |
| Intentional interruption | Detached commit `7a0d73900be12d80a794fcaf40a52b026b8d28c7`, durable blocked record, stopped before branch update |
| Fresh recovery | Same detached commit became authoritative only on the QA branch; five-file validation completed; no narration |
| Code integration | Non-force expected-HEAD update from `117fb6b8` to `68faa9ab`; backup `backup/before-meridian-world-admission-20261118` |
| Actual world admission | Commit `ca30f1a3eba8b56cf0f8599eb04d35ba564b911e`, parent `68faa9ab`; only `game/STATE.json` changed |
| Canonical durable journal | `journal/living-world-save-attempts`, status `verified`, operation `world_admission`, source `68faa9ab`, saved commit `ca30f1a3` |
| Fresh canonical recovery | Re-read source and saved checkpoint, validated the permitted delta, recovered `ca30f1a3`; zero narration and no duplicate commit |

The real checkpoint remains CH-000 turn 9, Day -29 morning, EV-000029 and
TXT-000020. Jack remains in the workshop; NPCs, discoveries, time and Aster are
unchanged. There are 14 LOC records plus the city container. The transcript,
events, chapter prose and manifest remain byte-identical to their pre-admission
versions. Mutable location states have not been fabricated.

This evidence establishes journaled world admission and recovery. It does not
claim a new played turn, literary reader delivery, automatic NPC service
simulation or a tested Day 0 transition. Future sessions must recheck the live
branch and journal rather than using these dated commit pointers blindly.
