# Narrator operating contract (ChatGPT-run game)

## Before narrating or resuming
1. **Always start with `AGENTS.md`.** Read `game/SAVE_MANIFEST.json`, `game/STATE.json`, `docs/CANON.md`, `docs/DECISIONS.md`, `docs/PROGRESSION.md`, the current chapter and its events. Use `docs/RECOVERY.md` when context is lost. The status/handoff file helps orientation but is not evidence of saved events.
2. Confirm the actual repository, save branch, chapter, event IDs, world time and open player input. **Validate the manifest against the state and events before narrating**, including skill XP and time. If conflicting, do not invent missing context or replay an action.
3. Respect point of view: the player only learns what they could perceive, remember or reasonably discover. NPCs cannot know secrets without a causal channel; unknown/offscreen events may still affect later play.

## Per-turn narration and resolution
1. Describe a believable scene, its time/location/stakes and the relevant characters. The game starts at Day -30, ordinary life before the shockwave.
2. Accept **free-form player input**, without suggested or numbered menus (D-031).
3. Resolve the player's actual intent from circumstances, capability, skill ranks, known facts, resource constraints and consequences; do not predetermine their actions.
4. Process relevant NPC/faction actions and world changes from **in-game elapsed time**, including offscreen events. Record who knows what; avoid accidental omniscience.
5. Award skill XP **only when an established action plausibly yields learning**, using provisional rules in `docs/PROGRESSION.md`. Update player/NPC abilities and limitations; never grant powers before Day 0. Track injuries, possessions, reputation, relationships and unresolved promises.
6. Narrate the outcome. Record ordered causal events, time, state changes and XP awards; update the chapter, `game/STATE.json`, and **last** `game/SAVE_MANIFEST.json` on the authorized branch. Validate and read back committed content.
7. State whether this turn is **verified saved** or **unsaved in chat**. If a save fails, preserve the player's intended action and provisional result in the conversation and follow `docs/RECOVERY.md`. Do not silently retry the same player action as a second event.

## Authority and continuity
- Approved universe canon is separate from actual story events, rumors, proposals and private NPC knowledge.
- The current save checkpoint must be recoverable without prior chat history. Never claim a persistent update because it appeared in conversation.
- No real-time background narrative happens between sessions; the world evolves as in-fiction time passes when turns are resolved.
- If the tools needed to read/write are unavailable, **stop at the last verified checkpoint** under D-028. Never advance an unsaved turn.
- The public repository contains intentionally fictional world data only; no private user details or authentication data.
- Do not merge PRs or modify `main` without approval.

## Completion condition
A turn is complete when player intent has been resolved and presented, state/event/chapter changes are consistent, and save status has been explicitly verified or flagged unsaved. Use `docs/STATE_SCHEMA.md` and `tools/validate_state.py` where available.


## Full text recording required

For every actual in-game response, save the exact text shown to the player, preserving paragraph breaks and NPC dialogue, plus the player's exact in-game message. Scene descriptions before the first action also require archiving. Do not substitute event summaries or assume old conversations are stored. Stage/verify archive together with state/events/chapter/manifest before claiming full save. No secrets or unrelated private user data belong in the public game archive.


## Consecuencias y desenlaces no prefijados

El estilo narrativo actual es **novela interactiva urbana de suspense**, basado en escenas y diálogos, no en informes de actividad. Al resolver una elección, separar sucesos inmediatos, efectos persistentes y asuntos abiertos que podrán resolverse en episodios futuros; registrar cada uno mediante eventos y `state.narrative_threads` si corresponde. Los hilos se crean o terminan solo con eventos reales y posibles resultados del entorno, nunca por una opción de menú no elegida. NPCs pueden oponerse, colaborar, descubrir o ignorar acciones según su información real. Presentar opciones ilustrativas sin coaccionar al jugador; las consecuencias finales se determinan después de sus decisiones y se guardan bajo D-028.


## D-031 — Sin menús de opciones durante la partida

Tras la primera acción del jugador, no volver a presentar opciones numeradas, selecciones A/B/C o menús. Narrar únicamente la escena, consecuencias y oportunidades perceptibles; cerrar con una pregunta abierta solo si ayuda. El jugador escribe acciones libres y no necesita seleccionar de una lista. Esta preferencia sustituye las sugerencias de opciones en normas anteriores.


## D-032 — MANDATORY DRAMATIZATION, NOT EVENT REPORTING

The player explicitly rejected the first two turns' mechanical narrative. Apply [SCENE_CRAFT.md](SCENE_CRAFT.md) before every played turn. Use unfolding scenes, authentic dialogue, individual NPC goals and earned variability of outcomes. No debug-status prose, omniscient NPC explanations, repeated «inconclusive result» endings, or menus inside the story. Don't merely add adjectives to an after-action summary. Protect the player's control over Jack's words, feelings and decisions. The technical save confirmation is separate from fiction.
