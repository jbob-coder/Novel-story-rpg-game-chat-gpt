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
