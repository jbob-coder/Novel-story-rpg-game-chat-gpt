# Testable narrative turn staging and recovery

This is a **ChatGPT-run** game; there is no separate application to download. The optional `tools/turn_engine.mjs` stages a proposed, narrated **fictional** turn as four in-memory artifacts: state, manifest, chapter event log, and chapter prose. The player speaks in chat. ChatGPT is still responsible for adjudicating outcomes and the narrator must not silently select the player's action.

The pure function `stageNarrativeTurn(snapshot, proposedTurn)` performs structural checks and rejects duplicate turn keys, invalid XP awards, fabricated/missing actor links, pre-shockwave powers and skipping across Day 0 without an explicit narrative transition. It does **not** perform remote writes; its output is a candidate, not a confirmed save.

For a real player turn: load the exact branch checkpoint, decide the outcome with the player input, stage it, validate it, create a single Git tree containing the updated 4 artifacts, create one commit based on the observed branch HEAD, update that ref non-force with `expected_sha`, and read back all four files. Only then tell the player the turn was saved. If branch head changed, stop and reconcile; do not overwrite other work. Follow `docs/RECOVERY.md` for partial or interrupted writes. No completed in-game turn has yet been added to the actual save.

Run from repository checkout:

```
node --test tests/turn_engine.test.mjs
python tools/validate_state.py
python -m unittest discover -s tests
```

The Node test suite uses only Node's built-in runner. The tests stage **hypothetical actions on in-memory copies** and intentionally verify a reload, tampering, duplicate-turn rejection, NPC isolation and XP accounting. They never overwrite `game/STATE.json` or record fictional progress as a real player turn. The Day 0 transition and long-term NPC planning remain unfinished mechanics.

## Currently unsupported

The staging module is intentionally scoped to the existing CH-000 chapter. A new chapter's event log and global event-sequence rollover are **not** implemented; do not use it across chapter boundaries yet. Crossing Day 0 also requires a separate explicit wave event. NPC actions are independently caused by default: their event `caused_by` is empty unless a narrator supplies a proven causal link in a future version. These limitations must be resolved before claiming unrestricted long-term play.


## Mandatory full-transcript save (five-file commit)

The turn model now requires the full exact chat text: `player_text` and `narration_messages`. Short `intent`/`outcome` records remain event summaries only. To save a completed turn, commit transcript, event log, chapter, state, and manifest together and verify all five by read-back. For an opening narration before player action, call `stageNarratorScene` and save its snapshot without increasing turn/event counters. The full archive starts empty because no real game turn has occurred. Run `node --test tests/turn_engine.test.mjs` from a checkout. The scripted module cannot capture chat UI automatically: the narrator has to supply exactly the messages it delivers.


## Implemented hard guard integration

Both `stageNarrativeTurn` and `stageNarratorScene` now require `save_guard: { observed_head, previous_attempt }` for player turns, or a fourth `saveGuard` argument for opening scenes. `previous_attempt` must be explicitly `null` only when there is no pending/failed previous save after fresh checkpoint verification. A blocked or unverified attempt triggers `NARRATIVE LOCKED`, preventing staging. `observed_head` must come from the actual GitHub branch read. Tests using a synthetic SHA are unit-test-only. Never use a fake SHA for play.
