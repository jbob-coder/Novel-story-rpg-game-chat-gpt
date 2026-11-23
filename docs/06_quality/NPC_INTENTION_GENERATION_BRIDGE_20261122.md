# NPC actor-driven intention generation boundary — QA-only

The engine is a **ChatGPT-narrated interactive novel**, not an autonomous hosted server. The meaningful generation agent is the **narrator model during an authorized narrative turn**. A deterministic JavaScript template library cannot prove or impersonate genuinely open semantic intentions.

## Working mechanism

`prepareNPCIntentionRequests` builds **independent, private actor prompts** from each existing NPC's saved goal, plan, last outcome, conditions, needs, resources, social connections and personally known event IDs. The prompts provide an open-ended task instead of fixed action verbs or a scene script, and explicitly allow abstention.

`inspectNPCGeneratedIntention` receives the narrator/model's original candidate, **does not execute it**, verifies it belongs to the same actor and fresh checkpoint, checks prior known event IDs, checks admitted-map routes for named destinations, and rejects predeclared success, state mutations or invented events. Code cannot establish semantic accuracy solely from fluent text: narrator editorial review remains required for access, resources, and meaning.

`draftOutcomeFromNPCIntention` forwards one reviewed current-turn outcome to the existing coordinator; staging and the five-file saving protocol stay unchanged. Previous-result events inform the next turn only **after** those events actually exist.

## Controlled counterfactual

In a fully isolated synthetic scenario Noah has no prior owned independent action. He considers reviewing existing business records, then a reviewed synthetic turn changes his own plan. The next request is **different and cites the new actor-owned outcome**; an attempt to submit the old pre-change request is rejected. Other tests cover separate personal evidence, multiple free-language candidate actions, inactivity, false cross-actor evidence, fake routes, outcome preclaims, private information and duplicate same-turn acts.

## What the tests do and do not prove

These tests establish that the **model-facing generation channel is functional and safe**, with an optional abstention and a state-dependent review chain. The test candidate texts are authored by the test harness, not by a live model invocation. The source contains **no automatic language model invocation, unattended scheduler or guaranteed NPC choice quality**. High-quality narrative decisions still depend on the ChatGPT narrator. A genuinely generative NPC system would need an available model runtime/adapter and an evaluated output-quality harness, not claims based on deterministic templates.

Keep this incremental research work isolated until its integration quality and real model-authored gameplay are evaluated. Do not change the active CH-000 checkpoint.
