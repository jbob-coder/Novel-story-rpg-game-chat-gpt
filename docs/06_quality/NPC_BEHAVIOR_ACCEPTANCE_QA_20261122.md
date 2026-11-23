# Acceptance QA: NPC autonomy, memory and recipient-only information

**Scope:** synthetic, deterministic scenarios built on the verified CH-000 turn-9 checkpoint. This document is an acceptance matrix, **not** in-world narration, story canon, a request for an autonomous clock or a modification of the authentic save. The executable suite is [npc_behavior_acceptance_qa.test.mjs](../../tests/npc_behavior_acceptance_qa.test.mjs).

| Scenario | Synthetic action | Required evidence | Prohibited behavior |
| --- | --- | --- | --- |
| A1. Recipient-only report | NPC-006 speaks to NPC-003 in a reviewed two-person market contact. | The recipient has a recorded, event-linked statement; NPC-002 does not. | Broadcasting the fact to everyone or treating hearsay as verified truth. |
| A2. Independent next step | On a later turn, NPC-003 reviews the event they experienced and chooses a private follow-up. | A distinct actor-owned event cites an earlier known event; no automatic RPG award. | An unsourced or pre-scripted action that the recipient never observed. |
| A3. Freedom to defer | From the same saved situation, the reviewer proposes a different ordinary outcome. | No fixed action-type/menu-choice registry; the draft does not stage a turn. | Equating an available draft with an executed/offscreen autonomous tick. |
| A4. Adversarial evidence | An uninformed NPC tries to cite a private event; a saved event's cause is forged. | The proposal and replay are rejected; reader-visible context excludes private evidence. | Knowledge teleportation, forged history, or disclosure to Jack. |
| A5. Persistence | Synthetically close CH-000 after the two staged turns and reload CH-001. | Recorded reception and independent action retain provenance after archive; authentic CH-000 files unchanged. | Erasing history, writing a fictional turn 10, or altering canonical world time. |

**Review boundaries.** NPC-006, NPC-003 and NPC-002 are existing identities in the admitted checkpoint, not new world characters. Every player-text line in the suite is a synthetic placeholder. The social encounter and follow-up are staged *only* within test memory. Actual NPC autonomy remains turn-bounded and editorially reviewed; this suite does not establish background execution between player turns, automatic truth verification, or complete free-form physical action support.

**Before integrating:** run all Node tests, all Python regression tests and the canonical checkpoint validator on the exact PR head. Compare the five protected CH-000/save file blobs against the base, ensure 1:1 inventory coverage, check no concurrent narrative branch changes, and merge only into the narrative work branch. Never merge a QA-only PR into main.
