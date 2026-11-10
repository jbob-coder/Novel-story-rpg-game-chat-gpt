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
- Validate with `python tools/validate_state.py` on an available checkout; report actual execution results, not planned results.

## Unknown and unapproved
Player details, starting city/year, initial cast, world geography, exact powers, XP balancing, skill rank thresholds, NPC characteristics and further lore. Numeric progression values are proposals, not approved canon.

## Next action
Resume CH-000 only after verifying manifest and state; accept user's character input. Narrate a scene, log the action and NPC/world consequences, update the checkpoint, then mark the save verified. Never claim story turns occurred before they have.
