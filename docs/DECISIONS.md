# Decision register

| ID | Status | Decision |
| --- | --- | --- |
| D-001 | Approved | Living Superhuman World: autonomous actors and consequential player freedom. |
| D-002 | Approved | Begin thirty in-world days before the first superhumans (Day -30). |
| D-003 | Approved | Cosmic shockwave from a distant corner of the universe reaches Earth on Day 0. |
| D-004 | Approved | Hybrid human awakening: immediate, delayed or never. |
| D-005 | Approved | Shockwave affects humans, animals, plants and environment. |
| D-006 | Approved | The GitHub repository may be publicly viewed; unauthorized people must not edit it. |
| D-007 | Approved | The game is narrated and run through ChatGPT conversation, not a downloaded browser application. |
| D-008 | Approved | ChatGPT reads repository world and chapter records, narrates events, accepts the player's input, resolves consequences, then updates story and state when authorized tool access permits. |
| D-009 | **Superseded by D-036** | Original requirement for RPG skills and progression; withdrawn at owner's request. |
| D-010 | Approved | Project documentation must support resuming after context loss without inventing, duplicating or contradicting saved events. |
| D-011 | Approved | Alternate modern Earth with fictionalized cities and institutions. |
| D-012 | Owner delegated | Assistant selects initial region and start scene; chose Meridian Bay / Crosswater Transit Plaza (fictional). |
| D-013 | Approved player setup | Jack Wilson, age 21, gray-hat hacker. |
| D-014 | Declared in-game intent | At the transit plaza, Jack intends to use unspecified remote electronics for theft of payment and personal information. No result or device placement confirmed. |
| D-015 | Approved player traits | Jack is intelligent, has ADHD, experiences difficulty speaking clearly; writes desired speech on a phone and wears a collar that voices it. |
| D-016 | Approved motivation | Money, interest in technology, and making gadgets/tools matter to Jack. No predefined hero/villain label. |
| D-017 | Approved home life | Jack has a sister and grandmother; family lives modestly with basic needs covered. |
| D-018 | Approved resources | Jack has private reserves large enough to buy a house but avoids attention; spends on gadgets and tools; possesses many small gadgets and one large unfinished project. |
| D-019 | Owner-delegated creative choices | Assistant chose physical appearance, past, names/ages/activities of family, contact NPC Noah, Railgarden home and large project name Aster; revise if owner wishes. |
| D-020 | **Superseded by D-036** | Former provisional RPG balancing/skill attributes, now inert legacy metadata. |
| D-021 | Owner correction | Elena Wilson is **17** and Jack's younger sister by four years, not the previously invented older sister aged 25. |
| D-022 | Owner-established backstory | Both parents died after a fire connected to Jack's difficulty speaking; named Daniel and Isabel by assistant under delegation. |
| D-023 | Owner-established finances | Jack's reserves came from past hacking, amount and individual activities unspecified. |
| D-024 | Owner-established morality/personality | Exceptional self-control, user-described psychopathic traits, self/family benefit first, may risk others, usually passive without advantage; not a medical diagnosis or automatic action. |
| D-025 | Owner-established Aster concept | Medium cockpit-free robot planned for jetpack, automated combat, night/thermal vision, 14K display, heat/jamming/«UMP» resistance and abort/escape; unfinished and not operational. |
| D-026 | Creative delegation | Assistant may fill remaining ordinary biographical details but must separate owner facts, plans, and actual story events. |
| D-027 | Owner-approved full narration preservation | Save the exact complete visible story: player inputs, every narrator scene and resolution, dialogue and formatting, in a persistent chapter transcript. Summaries are not a substitute. Exclude planning chat and unapproved real personal data. |
| D-028 | Owner-approved hard save gate | Stop story progression whenever a save fails or remains unverified. Give evidence-based progress percentage and resume only on the user's next input, with a verified five-file readback before more narration. No background work or invented status. |
| D-029 | Owner-approved file organization | Create subfolder indexes and maintain a single authoritative file inventory; retain existing canonical paths until a separately tested migration, avoiding broken links or duplicated state. |

## Superseded implementation direction

The browser prototype in PR #1 was a mistaken interpretation of the delivery format. Its JavaScript files and browser save design are **not** the target game interface. Preserve that PR for reference until the owner decides what to do with it; do not merge it as the chat game.

## Open decisions

Any further relationship or biographical changes; date/year; additional supporting cast; geography and institutions beyond Meridian Bay; the exact powers and ecological changes; exact attribute/skill/XP thresholds, global levels and resolution mechanics (numerical drafts in PROGRESSION.md are provisional). Leave unresolved until developed in the story or explicitly approved. Assistant suggestions are not approval.


| D-030 | Approved at narrative direction | Use an immersive interactive urban-suspense novel style, grounded dialogue and meaningful player-led outcomes. Choices can trigger immediate, persistent and eventual consequences, without predetermined endings; do not speak/act for Jack. |


| D-031 | In-game narration controls | The owner requested that numbered choice menus be removed from subsequent narrative responses. Continue as free-form story only; prompts may ask an open question but must not show a selection list unless specifically re-requested. |

| D-032 | Owner-requested narrative correction | Stop giving event reports dressed as storytelling. Dramatize moment-to-moment fictional scenes with distinctive NPC lives, varied justified outcomes, real dialogue and pacing; remove technical verdict boxes and menus; preserve the player's agency. Apply `docs/SCENE_CRAFT.md` editorial gate. No retroactive rewrite of saved turns without authorization. |

| D-033 | Owner-authorized reprocessing of played turn 2 | The player explicitly requested that CH-000 turn 2 be re-narrated **with a different outcome**. Replaced the active resolution and consequential checkpoint without incrementing turn count; preserved original full text and original event records in `chapters/revisions/REV-CH000-0001.json` and the earlier Git commit. Revised success is partial: two fictional device executions and two balance readings; no funds transferred. |

| D-034 | Owner conversation style feedback | The player asked not to echo or paraphrase the action in the assistant's introduction. In gameplay, narrate directly from the next moment and show external reactions rather than restating the player's commands. Keep full original player input only in the underlying transcript, not in the visible response. |

| D-035 | **Clarified by D-037** | Earlier record treated the older 500+ device network as unverified; owner subsequently confirmed it is an **active established in-fiction network**. Individual identifiers and exact financial balances remain unspecified. |

| D-036 | **Approved — current delivery** | Remove RPG mechanics entirely from active narration/adjudication: novela interactiva, no levels, XP, attributes, ranks, classes, dice or reward screens. Legacy XP data remains frozen only to preserve historic checkpoints. The D-036 narrative contract overrides D-009/D-020. See `docs/NARRATIVE_CONTRACT.md`. |
| D-037 | **Approved — canon and cyber portrayal** | Jack has maintained an **active network of more than 500 devices** for years; the nine Café Bruma devices are later additions. Financial reserves and shell companies predate this chapter, exact numbers/names remain unspecified. Cyber operations are narrated solely as fictional facts and consequences, not reproducible intrusion or evasion methods. Do not re-audit accepted canon every turn. |

| D-038 | **Owner-directed operational correction (2026-11-10)** | Document and apply a critical separation of literary scene construction, causal continuity, and persistence/delivery. No obligatory suspense; do not conflate five-file GitHub save verification with proof the reader saw a response. After uncertain delivery, replay the same saved text, not another simulated turn. Preserve D-028 save lock, D-036/D-037 and the current checkpoint. See `docs/NARRATIVE_EXECUTION_MODEL.md`. |

| D-039 | **Owner clarification — existing hacker history (2026-11-10)** | Jack was already an experienced hacker before CH-000. His preexisting active network of more than 500 compromised fictional devices is canon, separate from nine later Café Bruma additions. Detailed stories of individual past operations have **not** been authored or approved. Missing episode documentation is not missing experience; do not fabricate a retroactive biography. See `game/JACK_HACKER_HISTORY.md`. No new player turn. |

| D-040 | **Technical implementation — event-backed state changes (2026-11-10)** | Track typed, preconditioned changes for location, inventory, relationships, conditions, knowledge and NPC plans. Each effect belongs to the actor's causal event. Keep legacy XP frozen and the five-file save lock intact. Do not advance CH-000. Refer to `tools/state_changes.mjs` and `docs/STATE_SCHEMA.md`. |

| D-042 | **Technical QA implementation (2026-11-10)** | Add a five-file transactional save orchestrator and in-memory Git crash/recovery rehearsal; require exact readback, CAS, preservation of previous turns, no duplicate story generation. 67 Node + 20 Python tests passed in CI run #42905805692. The real remote adapter and first authentic post-D-042 story save remain unverified; no new player action or canon change. |

| D-043 | **Implementado y comprobado (2026-11-10)** | Prueba REAL de commit Git y recuperación posterior sobre rama QA NO CANÓNICA, con cinco archivos y no-force expected-HEAD, y adaptador GitHub REST de credenciales externas. CI: 75 Node + 20 Python PASS, run #42912600548. No se inició el turno 7 real. La ejecución directa del adaptador con token real, persistencia del journal de fallos y calidad literaria de futuros turnos siguen pendientes. |
