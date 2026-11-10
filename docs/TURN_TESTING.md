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
