# RPG skills and progression — provisional mechanics v0.1

**Owner requirement:** Characters must have skills and progression. Numbers and categories below are a usable initial **design proposal**, not immutable universe canon. The player can influence training and career through free-form actions; growth must have causally documented evidence.

## Model
- **Attributes** (baseline capacity, proposed 1–5): strength, agility, endurance, intellect, perception, willpower, presence. Assign only on character setup from the player's chosen background; do not invent a player profile before then. Attributes do not automatically rise every turn.
- **Skills** (practice and knowledge): extensible stable IDs, such as athletics, stealth, investigation, medicine, technology, persuasion, crafting, combat. Only record skills that have been established in play; no hard character classes.
- **Power abilities**: a separate list, initially empty. A superhuman ability cannot exist before Day 0, and awakening is not guaranteed for the player. Track acquisition, capabilities, limitations and training separately from ordinary skills.
- **Progression applies to NPCs too**, using the same principles when their autonomous work, study or hardship establishes learning. The narrator must not award experience solely because the world advanced a day.

## Provisional reproducible skill advancement
Each skill entry stores `xp` as a nonnegative integer and optional `last_progress_event_id`. Rank is **derived** from total skill XP, never silently edited.

| Rank | Minimum cumulative skill XP | Meaning |
| --- | ---: | --- |
| 0 | 0 | Untrained |
| 1 | 3 | Beginner |
| 2 | 8 | Practiced |
| 3 | 15 | Competent |
| 4 | 24 | Advanced |
| 5 | 35 | Expert |

For now, award **+1 XP** for a meaningfully attempted practice or investigation that teaches something, whether it succeeds or fails; **+2 XP** for a difficult, consequential or novel achievement. Do not award XP for a repeated trivial action, a skipped timespan, or description alone. Note evidence and exact delta in the event log. A skill may gain at most one award per distinct training incident; ordinary actions should not become XP farming. Rank is capped at 5 until mechanics are reviewed.

`lifetime_skill_xp` is the sum of current skills' recorded XP, not a free-floating source of levels. The provisional general character level, only if requested, is derived from lifetime skill XP: level 1 at 0, 2 at 10, 3 at 25, 4 at 45 and 5 at 70; these thresholds are **tentative** and no overall level needs to appear in narration. Progression is not a substitute for social consequences, injuries, resources or story milestones.

## Resolution and consistency
Use fiction, capabilities, circumstances, preparation, opposition and established limits to adjudicate results. No automatic success because a skill rank rises; no random-dice rules are locked in. Record successful, failed and interrupted learning as appropriate. When levels or powers change, update effects only within supported limits. Expose a concise skill summary when the player requests it.

## Pending design decisions
Attributes/XP thresholds and caps; whether to introduce dice or hidden checks; long-term skill specialization; how attributes change; training costs; power taxonomy and upgrades; whether a visible overall level is needed. Do not claim user approval of these numeric choices.


## Opening character baseline (setup; not gameplay XP awards)

Based on the owner's additional information that Jack designs many small gadgets and is building a large apparatus, a **provisional** baseline is technology 15 XP (rank 3), investigation 8 XP (rank 2), electronics 15 XP (rank 3), gadget_crafting 8 XP (rank 2): **total 46**. Starting attributes are in `game/STATE.json` and presence is 3/5, not penalized for using assisted speech or having ADHD. These numbers were inferred for initial balance, **not** explicitly selected by the owner and **not** earned from a resolved game event; `last_progress_event_id` is null for each entry. Preserve separate skill IDs and advance from event-supported learning, not repetitive actions. The system's derived overall level remains an unapproved, optional presentation mechanic.


**Owner update:** Voluntad provisional 5/5 por autocontrol excepcional. No garantiza éxitos ni implica diagnóstico de personalidad. XP inicial permanece en 46, sin puntos ganados durante el juego. Aster no concede poderes ni experiencia mientras sigue sin funcionar.
