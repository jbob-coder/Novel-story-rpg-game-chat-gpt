# Verified handoff — foundation only

**Project:** ChatGPT-run Living Superhuman World  
**Working branch:** `work/chat-narrative-foundation` (proposed in draft PR #2; `main` is not the playable save)  
**Current scene:** `CH-000`, Day -30, pre-shockwave ordinary life  
**Last completed gameplay turn:** 0  
**Last event:** none  
**Player character:** not yet defined  
**Immediate player input needed:** Character identity/background/starting situation (partial answers accepted)

## Confirmed lore
Cosmic shockwave arrives Day 0, affects humans/animals/plants/environment. Human awakenings immediate/delayed/never; no forced hero/villain labels. ChatGPT narrates and adjudicates; GitHub stores chapters and saves.

## Engineering work
- Continuity documents and provisional progression rules are proposed on this working branch.
- Check `game/SAVE_MANIFEST.json`, `game/STATE.json` and `chapters/CH-000.events.json` before playing.
- **Verified:** 18 committed repository files read back; 14/14 direct consistency checks passed for initial state, chronology, chapter/event/manifest, progression and missing player input.
- **Unverified:** The Python validator script has been committed but was not executed on a local checkout in this environment (GitHub access from container unavailable). No actual gameplay or interrupted-save recovery test has run.

## Narration preparation
- `docs/WORLD_BIBLE.md`: confirmed Earth shockwave timeline plus proposed ordinary-life social context and causal rules.
- `docs/NARRATIVE_STANDARD.md`: scene-specific quality and continuity checks.
- `chapters/CH-000.PREP.md`: adaptive, unplayed opening scene prep and examples; **nothing there is established story history**.
- Resume by reading these after the saved manifest, primary state, current chapter and event records. Do not force the player into an example opening.

## Unknown and unapproved
Player details, starting city/year, initial cast, world geography, exact powers, XP balancing, skill rank thresholds, NPC characteristics and further lore. Numeric progression values are proposals, not approved canon.

## Next action
Resume CH-000 only after verifying manifest and state; accept user's character input. Narrate a scene, log the action and NPC/world consequences, update the checkpoint, then mark the save verified. Never claim story turns occurred before they have.
