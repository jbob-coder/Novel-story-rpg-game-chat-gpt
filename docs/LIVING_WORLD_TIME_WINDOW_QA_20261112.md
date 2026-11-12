# D-053 — Windows for consistent fictional time (2026-11-12)

## Defect and correction
The previous guard checked only `floor(minutes/1440)` and `ceil(minutes/1440)`. That was necessary but not sufficient: it accepted a hypothetical CH-000 scene beginning at **morning** on Day -29, crossing to morning of Day -28 in just **20 minutes**. This cannot happen.

`tools/living_world_time.mjs` now checks whether any start/end instants exist in **provisional narrator-time windows** that match both the day delta and the minute count. It accepts a short crossing of midnight only when the initial period can be late **night**, and never assigns an exact clock time. Same-day backward transitions remain blocked. These period boundaries are technical plausibility guards, not confirmed canon or merchant opening hours. If a border case is genuinely ambiguous, the narrator must avoid pretending precision and explicitly resolve the period or elapsed duration from the story.

## Verification
- Official isolated GitHub Actions [run #43321955437](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43321955437).
- Node.js: **175 passing, 0 failing**.
- Python unittest: **24 passing, 0 failing**.
- Checkpoint validator: **PASS**.
- Added tests: a midnight crossing that requires late-night origin and rejection of a one-day morning jump in twenty minutes; prior tests still pass.
- No canonical chapter, event, transcript, state, or manifest file was modified.
- The QA workflow is in a separate branch and must NOT be merged.

## Remaining constraints
`clock_time=null`, `calendar_date=null` and actual weekday unknown. The simulation does not run between chat messages. The 7 NPCs are reviewable, but their pending plans are not automatically completed. A real journal-backed story turn and literary review remain outstanding.
