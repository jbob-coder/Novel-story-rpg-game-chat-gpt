# Reviewed NPC choices assembled into a single fictional turn

This is the integration candidate for NPC-generated *intentions*, not a hosted autonomous agent.

`stageReviewedNPCIntentionTurn` accepts a specific player-authored narrative turn, one narrator-owned proposal per relevant NPC and its **separately reviewed actual outcome**, or an explicit abstention. It validates the chosen interval, fresh checkpoint, actor attribution, known historical causes, admitted locations, duplicate actor choices and explicit private-outcome leaks before delegating to the existing `stageLivingWorldTurn` coordinator.

The result is an **in-memory staged checkpoint** that is validated through the exact existing save codec. This does **not** bypass `saveFiveFileTurn` / `saveLivingWorldTurn` journal gates or write to the live narrative branch. A real story turn still needs its normal player input, owner-authorized save transaction and five-file remote readback.

### Tested behaviors

- Noah and Rosa can independently act while Mara abstains during the same fictional interval. Player-visible prose does not receive private offscreen outcomes.
- The next turn's actor request includes the actual preceding event; requests made from stale state are rejected.
- Two conflicting actions for one NPC, hidden results under abstention, mismatched intervals, forged personal knowledge, destinations outside the admitted map and literal leaks into narration all fail.
- No scripted future chain, background tick, automatic routine execution, player action or real checkpoint changes.

### Important limit

The model-side text in automated CI remains editorially supplied fixtures. The stage wrapper proves safe composition and causal persistence, **not** that a model autonomously selects convincing actions or that text-level checks detect semantic paraphrase leaks. Evaluating independent long-horizon decision quality requires a separate live narrator review on representative scenes. Until then the PR must not be called a complete NPC autonomy system.


### Exploratory model-narrator scene — authored from the frozen CH-000 turn-9 evidence

This review uses **seven original, actor-specific proposals written by the ChatGPT narrator after inspecting the actual turn-9 saved actor registry and history**. These are not the canned policy variants from the 30-turn deterministic replay. They are then **frozen as an explicit test corpus** in \`tests/npc_generated_turn_batch.test.mjs\`, because CI cannot call a live model. A second turn is authored from the recovered outcome for Noah; requests from the old checkpoint must never be reused.

The authored initial choices are:

| Actor | Grounding and selected behavior | Quality assessment |
| --- | --- | --- |
| Lena (NPC-001) | The recorded route delay belongs to the earlier evening; **abstain** from inventing a new morning dispatch. | Time-bound evidence respected; no blanket routine replay. |
| Sora (NPC-002) | Inspection EV-000012 was closed as an unresolved equipment fault; distinguish observations from hypotheses, with no new diagnosis or shift claim. | New work priority without a fictional technical discovery. |
| Darius (NPC-003) | EV-000008 already delivered the documented parcel; **abstain**, despite the old generalized delivery goal. | Detects a real goal/result tension that a naive routine-first selector may overlook. |
| Elena (NPC-004) | EV-000028 confirms departure, **not school arrival**; independently rehearse an explanation of the corrected artwork while traveling. | Preserves pending travel, backpack and USB; no invented classroom scene. |
| Rosa (NPC-005) | EV-000029 confirms clock repaired and tested; plan return, not a second repair or unverified neighbor meeting. | Goal-driven and actor-known causal source; no forced encounter. |
| Noah (NPC-006) | No previous owned event; voluntarily narrow parts-purchasing priorities, without assuming a sale, inventory count or supplier response. | Original initiative with no fabricated event cause. |
| Mara (NPC-007) | Saved cafe closing belongs to a previous shift; **abstain** from inventing a new shift or payment. | Maintains chronological uncertainty and privacy. |

After staging the first fictional turn and decoding all five files, Noah receives his new privately known event and authors a distinct follow-up: **postpone purchases until concrete parts requirements are checked**. This second action cites only the verified new event; Rosa and Elena abstain because the missing encounter/arrival evidence has not changed. Both steps are **in-memory QA**, never authorized live story turns. The test checks the unchanged original player, NPC attribution, exact private-text separation, causal links, current plan and original five canonical files.

**Critical limitations (not a completion claim):** This is **one exploratory, two-turn scene**, not a blind, independent 30-turn quality benchmark. The author and reviewer are the same assistant; alternatives are manually inspected, not sampled from a production model connector. The JS validators mostly check provenance and structure, **not semantic truth**; a grammatically plausible but contradictory proposal may pass until a narrator rejects it. Semantic paraphrase leaks are likewise not fully caught. The prior 30-turn run remains a *deterministic structural stress test*. Until distinct, incrementally generated long-horizon model scenes and independent semantic review are available, keep PR #193 in draft.


## Sequential authored evaluation: steps 01–02 of 30

The separately authored series in `tests/npc_generated_turn_batch.test.mjs` starts with the protected CH-000, turn 9 checkpoint, without writing the real story. Step 01 is newly authored from the actual seven actor records: **Darius** discards the obsolete plan to deliver a parcel already delivered (EV-000008); **Elena** chooses how to explain the corrected illustration while still en route (EV-000028); **Noah** narrows unverified parts requirements before supplier contact. **Lena, Sora, Rosa, and Mara abstain** when their old duties or an unverified encounter do not justify new activity. The first in-memory turn is staged and passed through the five-file codec before anything in step 02 is evaluated.

Step 02 is **pinned to the exact decoded first-turn snapshot SHA-256** and cannot be replayed against an unrelated first-turn outcome. The new proposals rely only on that updated context:

- **Lena:** distinguish the recorded evening transit delay from a display maintenance report in her private handover notes; do not claim another active delay.
- **Rosa:** leave herself a reminder to return the already-repaired clock; do not fabricate an encounter with its neighbor owner.
- **Noah:** after his previous actor-owned plan-change result, prepare a question about missing parts requirements instead of inventing a supplier order. The second-turn event cites only his newly verified first-turn event.
- **Sora, Darius, Elena, and Mara:** abstain because no new assignment, paid parcel, school arrival or cafe shift has been established.

These are voluntary, newly written narrator decisions, **not actions selected by an automated language-model connector**. The assertions verify per-actor event sources, current context, plan changes, no duplicate completed courier delivery, no unverified arrival or social contact, no private outcome in player-visible text, unchanged player state, exact turn/event counts, in-memory save roundtrip, and byte-for-byte preservation of the five original files. The first authored turn had previously been confirmed independently; the second is a new QA addition.

**Do not mistake this exploratory two-step authored corpus for the 30-step blind semantic-quality acceptance.** The remaining 28 original narrative turns, independent scoring of decision quality and semantic privacy (including paraphrases) still require evaluation; the draft PR cannot be merged on the basis of this test alone.


## Sequential step 03: legitimate inactivity, not a compulsory routine

The third original narrator review is intentionally **not another scripted task**. The step starts from the five-file in-memory result of step 02, pinned by SHA-256 \`62c42ceb4eee19542726016c51e06b24f7aba88127d8c2463da210141afa1081\`. The previous two ten-minute intervals recorded internal preparations, not new outside information, meetings, courier jobs, school arrival, supplier orders, faults, or a fresh cafe shift.

The narrator therefore chooses **seven justified abstentions** rather than repeating Noah's proposed question, Rosa's clock reminder or Lena's sorting of prior reports, or inventing business, transit, school and maintenance activity for Darius, Mara, Elena or Sora. The test requires the coordinator to stage only the placeholder player interval, **zero NPC events**, unchanged individual actor records including last genuine memories, and a new checkpoint that reflects elapsed time. The decoded snapshot SHA-256 is logged by the test if CI passes.

**Interpretation:** an alive world does not entail one compulsory action per NPC per short turn. Preserving freedom to wait is a substantive anti-loop behavior, while a later verified observation or new opportunity can still trigger initiative. This remains a **narrator-authored, frozen, three-step exploratory corpus**, not a live model integration or an independent long-term assessment; keep the PR in draft.
