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


## Sequential step 04: owned-resource initiative after a quiet interval

The fourth separately authored evaluation is prepared **only after** the third step's decoded in-memory checkpoint with SHA-256 \`a728c5e170cfed360e4a6aa805c4b79a7aa45a13c1379c88f4af27cb0614c1b7\` has been verified. The third-step abstentions do not erase earlier genuine memories and do not imply a mandatory action in the fourth.

In this ten-minute fictional interval, **Elena (NPC-004) makes one small, physically feasible decision**: check that the previously established USB with her illustration is still inside the backpack she is carrying. Her existing inventory and the actor-known departure event EV-000028 establish those objects and her ability to check her own bag. The reviewed result changes only her own current plan; it does **not** claim a school arrival, class presentation, other characters' knowledge, equipment, an encounter, a new map place, or transfer of the USB. **The other six NPCs abstain** because the courier job is already done, past shift or maintenance duties have no new observed trigger, and rewording private reminders/parts questions would not constitute meaningful progress.

The test requires exact previous snapshot, independent actor attribution, privately known cause, no unauthorised disclosure in Jack's chapter/transcript, unchanged player state, unchanged NPC state for every abstention, unchanged USB inventory and location, no extra NPC events, round-trip through the canonical five-file *in-memory* codec and pristine original story files. It emits a reproducible SHA-256 for the staged result on successful CI. No live model provider is called from the test, and an author-reviewed short-horizon example **does not** establish long-run semantic-quality certification. PR remains draft / unmerged.


## Sequential step 05: real independent movement to an admitted shop

This exploratory turn is newly authored **after** the fourth verified in-memory result, pinned to SHA-256 \`99a0916e93b039ef728b63f311032327f6ab3a030655cddd14a949faa875d399\`. It tests a **physically consequential NPC choice**, rather than repeatedly changing a to-do list: Noah (NPC-006) elects to travel from his recorded Market Row district position (\`LOC-COMMERCIAL-DISTRICT\`) to his already mapped repair-components shop (\`LOC-MARKET-NOAH-REPAIR\`).

Both locations and their direct graph connection already exist. The shop is explicitly tagged as Noah's, \`public_area: true\`, \`access_status: public_confirmed\`; the reviewer independently authorizes a one-link transition in the ten-minute fictional window. The move includes the mandatory contextual travel estimate: mode \`walk\`, approximately **six minutes** in this isolated scenario, and a prose basis; it is not a fixed world-map distance or a claim about travel time elsewhere. An admitted graph path alone would not prove a private door accessible, and specific opening hours/travel minutes are not stated; the proposal therefore does **not** claim the shop is trading, staffed, stocked, or selling anything. The staged outcome records an actor-owned \`location_id\` effect with the verified route plus a revised work priority. Noah cites only his own previous private event, never another actor's memory.

The six other known NPCs abstain: they have no new reviewed courier job, teacher encounter, neighbor availability, maintenance assignment, transit dispatch or cafe shift. The test re-checks the protected player's state, unchanged state of all six abstentions, exact location and event attribution, no private event text leaked to the public transcript/chapter, and five-file in-memory round trip. **No canonical game save is written**. GitHub Actions must prove the result before this step is counted as verified.

These are authored, frozen test decisions. They demonstrate structural continuity for one concrete change in NPC position, **not** independent semantic-quality certification by a live generative provider; PR stays in draft pending 30 original steps and independent evaluation.

The first test attempt was correctly rejected by `verifyTravelHistory` for omitting this contextual estimate, despite the route being connected; the test was corrected with the required metadata, without bypassing the engine's travel rule. The official successful rerun is [GitHub Actions #45113900126](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45113900126): **661/661 JavaScript**, **47/47 Python**, and checkpoint **PASS**. The resulting in-memory snapshot hash is `b546eb8301636332c08d8a871bb93c10b456f7917dda854ad1e9bbfa8e0c1b88`.


## Sequential step 06: actor-driven courier search and shop work, no fabricated transactions

The sixth separately authored exploratory turn starts **only** from the verified, decoded Step 05 snapshot SHA-256 `b546eb8301636332c08d8a871bb93c10b456f7917dda854ad1e9bbfa8e0c1b88`. No future turn is prewritten.

**Darius (NPC-003)** has already delivered the previous parcel. He now independently chooses to walk from `LOC-COMMERCIAL-DISTRICT` to `LOC-MARKET-DELIVERY-POINT`: the destination is an existing `commercial_delivery_hub`, marked `public_confirmed` with a direct return graph link. The narrator supplies an approximate **six-minute** walking estimate for the ten-minute isolated interval; it does not establish world-canon distances or opening hours. Darius *seeks* legitimate new work; the test must **not** claim a new package, dispatcher encounter, contract, recipient, or deadline. His own last outcome (from Step 01) is the sole relevant private causal event.

**Noah (NPC-006)**, after actually arriving at his mapped repair shop in Step 05, begins reviewing existing pending work priorities before considering parts orders. The outcome does not confirm particular stock, quantities, clients, purchases, supplier replies, or extra devices. It cites only his own verified Step 05 outcome. Both decisions update owned plans; Darius also updates his owned position. The **five other NPCs abstain** without any changed memory or location.

The added test requires exact Step 05 hash; all seven actor reviews tied to fictional turn 15; 2 actor events and 5 abstentions; an admitted destination with reviewed travel metadata; no re-delivery of the completed parcel; Noah's current shop location; unchanged actor resources; actor-owned causal event IDs; unchanged protected player; zero disclosure of exact private outcomes; and in-memory five-file checkpoint recovery. The five canonical CH-000/save files are read for exact byte comparison, never written.

**Acceptance status:** this is a **narrator-authored, frozen exploratory fixture**, not a language-model call or independent semantic review. Keep PR #193 DRAFT/unmerged until official CI and the separate 30-step/semantic-quality gate pass. Do not report this sixth turn as verified solely from the test commit.


## Sequential step 07: independent neighborhood movement, no invented neighbor

This authored exploratory scene was written **after verifying Step 06**, and requires the exact recovered six-step snapshot SHA-256 `428eff8aa2f1a012b09660cb26361b5494186d81176eace330172ccba7aa0ca7`. It never changes the real CH-000 save.

**Rosa (NPC-005)** has personally verified that the alarm clock is repaired (EV-000029), previously recorded a reminder to return it, and is still in her family apartment. She now chooses one physical step toward arranging a possible handover: walking from `LOC-WILSON-APARTMENT` to the **directly connected** `LOC-RAILGARDEN-RESIDENTIAL` district. The test uses a narrator-reviewed approximate **four-minute** walk within a ten-minute synthetic interval; it does **not** assert exact world distances, where the neighbor lives, any meeting, any conversation, or taking/transferring the clock. Only Rosa's location and private plan change. The other **six** NPCs can abstain without losing plans or memories.

The test checks exact Step 06 input hash, actor-owned motive and event linkage, admitted graph path and explicit travel metadata, no handover, no invented neighbor, unchanged resources/knowledge and six other actor states, the preserved player, exact event count, private text excluded from player-visible narration, and a full in-memory five-file codec roundtrip. Original five-file contents are read and compared byte-for-byte, not written.

**Not a live autonomy claim.** These are frozen, narrator-authored QA examples executed by Node, not an independently evaluated model-generated run. Official CI, protected blob comparison and separate semantic evaluation remain required. Keep PR #193 in draft and unmerged.


## Chat closure handoff — 24 November 2026 (PR #193 remains draft)

**Source of truth, not completion by narration:** The last successful GitHub Actions run was [#45347518769](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45347518769) on exact commit \`1c872b3a8327b6595147c975e3baf64286449d8b\`: 663 JavaScript tests, 47 Python tests, canonical checkpoint PASS. It validated original narrator-authored exploratory steps **01–07 of 30**, *not* 30 original long-horizon scenes and not model-produced autonomous behavior.

An eighth authored *isolation test* was added in commit \`7c2f6908147e7a8736f72f46b2bc87967adfc328\`, from the exact reconstructed step-07 synthetic checkpoint SHA-256 \`b49437274572c660f5d87738e6d451142d3f56720dbb12d0d63e5075a63d25e9\`. Both Rosa and Elena occupy the broad Railgarden residential district; that does **not** make their private events mutually known. Step 08 deliberately tests rejection of a forged cause citing Elena's private USB action from Rosa's context, followed by an interval with seven justified abstentions and no forced social meeting. **This eighth test is not counted verified until GitHub Actions succeeds on a commit containing it**. Its expected completion in the *synthetic* sequence would be fictional turn 17, not Jack's live turn 17.

**Actual protected story:** This work is strictly on branch \`work/npc-contextual-intent-prototype-qa-20261122\`. Comparing Git object SHA of \`chapters/CH-000.md\`, \`chapters/CH-000.events.json\`, \`chapters/CH-000.transcript.json\`, \`game/STATE.json\`, \`game/SAVE_MANIFEST.json\` against PR base \`f7646a4deea56037ee51deb8be404b7356890063\` showed **5/5 identical** after the eighth test was committed. The real game remains CH-000, completed turn 9; no artificial player turn, remote story save or new canonical event was authorized.

**What is unfinished and why PR cannot merge:** At least **22 additional original narrator-authored steps** remain after the not-yet-verified eighth test (or **23** if it fails). A 30-step *deterministic stress replay* elsewhere in the PR is not the same acceptance criterion. Independent semantic review of sustained choice quality, causal truth, unintended paraphrase disclosures and NPC personal knowledge has not taken place. Neither the Node fixtures nor the validators call a live generative model; the existing staging helper only validates narrator-supplied choices and their independently reviewed results.

**Required next owner/agent workflow:**
1. Verify fresh branch HEAD and the CI job **for that exact SHA**, not an earlier green build. Run \`node --test tests/*.test.mjs\`, \`python -m unittest discover -s tests -p 'test_*.py' -v\`, and \`python tools/validate_state.py\` using the repository workflow.
2. If step 08 fails, fix the real cause without weakening actor-knowledge or route validation. Recompute and record its output hash, and compare the five protected Git blobs again.
3. Resume step 09 **only** from step 08's verified decoded result; generate one new original, actor-specific decision per relevant NPC or a justified abstention, reviewing the real outcome before authoring step 10. Avoid scripted mandatory tasks, automatically inferred meetings, invented courier work, premature school arrival, or guessed stock/sales.
4. Continue until **30/30 original consecutive steps** have been staged, independently semantically scored and verified for knowledge, space, elapsed time, resources, realistic inactivity, consequence persistence and private/public narrative separation. Include adversarial paraphrase disclosure checks; exact string exclusion alone is insufficient.
5. Recheck the protected five files and compare PR base/HEAD; retain PR in **draft** until all acceptance evidence is present. Only consider a merge after an explicit separate integration decision; a green suite alone does not certify believable NPC autonomy.

**End-of-chat disposition:** QA-only work is preserved in the PR branch. No merge, no main-branch mutation, no change to the saved adventure, and **no claim that the outstanding 30-step autonomy/semantic gates are complete**.
