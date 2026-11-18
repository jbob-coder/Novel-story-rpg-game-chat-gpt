**Novel-first precedence:** [NARRATIVE_CONTRACT.md](NARRATIVE_CONTRACT.md) supersedes RPG mechanics and outdated scene/checkpoint directions here. Jack's active network predating Café Bruma (500+) is established fictional history, not an unverified story premise.

# SCENE CRAFT — Mandatory literary quality contract (D-032)

The owner rejected the previous narration as **a report about what happened, rather than a story being experienced**. Fix that root problem. This document supersedes prior output templates in `docs/NARRATIVE_STANDARD.md` and any advice to present numbered choices.

## Write scenes, not after-action reports
- Begin **inside an ongoing moment** with a concrete physical interaction or spoken line. Let time actually pass on the page through character behavior, shifting attention, dialogue, interruptions, motion, decisions and resistance. Avoid the pattern «Jack does X → device displays result → nothing confirmed → end».
- Give every relevant NPC an immediate motive, independent priorities, a distinctive way of behaving and responding, and room to contradict expectations. Don't use them as disposable atmosphere or one-line reactions.
- Allow the user's chosen action to produce **specific and varied plausible consequences**: success, partial success, failure, complications, bargains, misunderstandings, discoveries or delays based on established capabilities and context. No automatic victory; equally, don't use perpetual «no confirmed result» as a default answer to every attempt. Never provide actionable methods for illegal technology in the prose.
- Reveal consequences through what Jack can **perceive in a dramatized moment**, not debug boxes, lists of findings, omniscient recaps or repeated verdicts. Any technical verification belongs in the save machinery, outside story text. Don't tell Jack secrets learned only by offscreen NPCs.
- Let tension arise naturally instead of adding pointless danger. Quiet scenes can carry subtext, human friction, discovery or intimacy. Not every NPC needs to look at a malfunctioning phone.
- End at a **natural point of continuation**, not a mandatory dramatic hinge. Quiet exchanges, simple completed actions and pauses are valid. Avoid manufactured suspense, generic summaries, repeated prompts and option menus.
- Respect player agency. Jack's typed messages, collar speech, inner feelings, choices and unrequested acts **belong to the player**. Describe the user's selected acts and external consequences only.
- Preserve exact user and visible narrator text in the chapter transcript. Do not rewrite the first two historical turns silently. The next played turn must be staged, committed and read back under D-028 before presenting it.

## Aclaración 2026-11-12 — Desarrollo continuo de una acción, sin interrupciones artificiales

Una acción del jugador puede justificar **varios compases de narración** y reacciones encadenadas: el comerciante busca una pieza, llega una llamada que debe atender, recuerda una entrega pendiente, propone una alternativa, y la situación cambia naturalmente. No cortar para pedir permiso después de cada gesto del NPC o transición ordinaria. Dramatizar el proceso y sus variaciones, no dar una lista de resultados ya resueltos.

Preparar la escena con la información **ya existente** del lugar y de sus actores: personalidad cualitativa, objetivos, experiencias, relaciones, disponibilidad no supuesta, conocimientos, compromisos y contexto. No crear una tienda o persona establecida retroactivamente solo para justificar la respuesta; si el lugar no existe todavía, distinguir preparación editorial de hechos del mundo. Evitar «PNJ programado» y también «evento aleatorio obligatorio».

Los secundarios pueden responder, continuar sus tareas, dialogar y tomar iniciativas propias durante la misma escena; Jack **no** recibe diálogos, pensamientos, emociones, asentimientos ni nuevas decisiones inventadas. El narrador puede completar desplazamientos y pasos rutinarios implicados por la orden, pero frena naturalmente si haría falta que Jack elija un precio, responda a una pregunta decisiva, revele algo, asuma riesgos o cambie su intención. La ausencia de opciones numeradas no impide detenerse ante una decisión real.

Antes de finalizar, preguntar: ¿la acción recibió un desarrollo proporcional y una conclusión o pausa natural?, ¿los secundarios tuvieron causalidad y personalidad?, ¿el lector pudo intervenir en las decisiones sustanciales?, ¿el mundo persiste sin hechos fabricados y sin tiempo que transcurra entre mensajes? Registrar hechos y tiempo del turno solo después de resolver la escena y validarla. Ver [CONTINUOUS_SCENE_FLOW_20261112.md](CONTINUOUS_SCENE_FLOW_20261112.md).

## D-048 — Extensión y profundidad adaptativas (preferencia del propietario, 2026-11-10)

**Objetivo:** evitar que una orden con varias acciones relevantes se resuelva como una secuencia abreviada de resultados. La escena debe permitir que el lector experimente el tiempo, las interacciones y la resolución material de lo que pidió, sin inventar decisiones nuevas de Jack.

**Referencias orientativas de extensión, no cuotas obligatorias:**
- **Transición breve o respuesta sencilla:** alrededor de 250–500 palabras cuando el momento se resuelve naturalmente con poco desarrollo.
- **Escena habitual con interacción o actividad significativa:** alrededor de 600–1.000 palabras.
- **Turno con varias etapas distintas, personajes o procesos importantes:** alrededor de 900–1.400 palabras; separar los momentos con transiciones naturales y dedicar espacio proporcional a cada etapa relevante.
- **Secuencia excepcionalmente compleja:** puede superar ese rango si la acción realmente exige más desarrollo o el lector pide una narración extensa. No extender automáticamente cada turno.

**La prioridad es densidad dramática, no volumen.** Mostrar el desarrollo en vez de comprimirlo en «hizo A, reparó B y montó C». Usar acciones visibles, detalles físicos pertinentes, reacciones con motivación, obstáculos concretos y sus soluciones, diálogo cuando corresponda y consecuencias que queden claras sin informes. Dar más espacio a una tarea central, como ensamblar un componente, que a un gesto rutinario; no detallar tornillos o pasos repetitivos solo para alcanzar una cifra.

**Controles:** no forzar NPC, diálogo, conflicto, suspenso, explicaciones técnicas operativas ni nuevos hechos para llenar espacio. Conservar la tercera persona limitada, la agencia exclusiva del jugador sobre Jack y todas las prohibiciones del contrato vigente. Si una escena queda claramente demasiado comprimida para la cantidad de acciones, revisarla **antes de guardarla**; si una escena breve ya está completa, no alargarla artificialmente. No aplicar retroactivamente este cambio a la transcripción ni a los eventos jugados; una revisión de un turno guardado exige autorización separada.

## Mandatory silent editorial review before saving a played turn
Ask:
1. Is there a scene the reader *experiences*, rather than just an explanation of events?
2. When NPCs are present or relevant, do they pursue believable personal priorities? Solitary scenes need no artificial NPC.
3. Does the chosen action receive a proportionate, causally plausible response (even if its immediate effect is small)?
4. Have I avoided speaking, thinking or deciding for Jack and avoided hidden omniscience?
5. Did I remove RPG stats, XP, mechanical status prose, repetitive inconclusive conclusions, unnecessary cybersecurity procedure detail and menus?

If any answer is no, **rewrite before committing**. This is a quality gate, not a demand to add filler or florid adjectives. Keep each scene as long as the dramatic moment requires, not automatically the same fixed length.

Literary quality is a separate responsibility from save verification and interface delivery; see [D-038](NARRATIVE_EXECUTION_MODEL.md).

**Historical note only:** this policy originally accompanied a turn-2 Café Bruma correction; those scene details are **obsolete**. The current checkpoint MUST come from `game/SAVE_MANIFEST.json`, `game/STATE.json`, current chapter events and transcript. Never resume turn 2 from this file. The current policy is `docs/NARRATIVE_CONTRACT.md` (D-036/D-037).
