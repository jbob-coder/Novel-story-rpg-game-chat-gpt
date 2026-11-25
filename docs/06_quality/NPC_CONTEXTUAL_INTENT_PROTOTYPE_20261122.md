# Contextual NPC intent prototype — isolated QA, not game canon

This isolated experiment adds an **open-language, source-bounded intention preview** alongside the existing `recommendNPCIntentReviews` / `assessNPCDecisions` path. It does not replace the coordinator, create story events or choose NPC outcomes automatically.

**Baseline comparator:** Current deterministic recommendation prioritizes recorded obligations, then first applicable role routine. It is useful for plausible everyday life, but it does not itself enumerate entirely new authored intentions.

**Prototype difference:** `inspectNPCContextualChoices` returns each existing actor's personal goal, plan, needs, known events, literal memory, resources, relationships and commitments, without an action menu. `reviewNPCFreeformIntent` accepts a new free-text intention, checks actor-owned event references and graph reachability, rejects stale evidence, and returns an unresolved private proposal. No direct contacts, deliveries, truth, access, time passage or success are inferred.

**QA scenarios:** comparative alternative intentions; actor-specific private knowledge; known event citation; unknown/future event rejection; graph-only potential travel; tampered and stale packet rejection; fourteen hypothetical day observations without autonomous time ticks or canonical changes.

**What this does NOT prove:** convincing long-horizon agent initiative, unattended simulation, verified semantic fidelity of natural-language reasoning, independent generation of intention text, real NPC success, or integration into player-turn save. The prose and reasoning still require an editorial agent; they are not produced by a deterministic action planner.

**Next recommended experiment:** With an explicitly cloned, synthetic checkpoint, stage reviewed actor events and measure whether selecting from context yields better continuity than the existing priority selector across multiple turns. Require provenance and no invented physical access. Do not advance real CH-000 turn 9.

**Protected scope:** A new tool module and test plus documentation/index/inventory entries only. No changes to game/, chapters/, existing NPC code, main, or world canon.


## Seguridad del contexto: `known_to` no equivale a memoria completa

La proyección privada `knownEvents` distingue el evento atribuido al propio
actor (`detailScope:'actor_owned_event'`, con su intención y resultado) de una
referencia de evento ajeno (`detailScope:'known_to_reference_only'`). Para un
tercero se conservan ID, turno y día, pero `kind`, `actorIds`, `intent` y
`outcome` se omiten mediante valores nulos. La inclusión en `known_to`
no transfiere el texto privado de otro actor. El conocimiento literal que el
NPC adquirió sigue disponible mediante su propia `knowledge` grabada; una
referencia sola no demuestra el contenido aprendido. Esta regla protege el
paquete que la pasarela de generación entrega al narrador. Tests cubren EV-000025
(Elena, también listado en `known_to` de Rosa), su lectura por ambas actrices
y la petición de generación posterior. La proyección no crea nuevos hechos,
ni cambia el contenido, la cronología o el guardado del juego.

 
## Alcance de una fuente citada en las intenciones abiertas

En el borrador privado `inspectNPCGeneratedIntention`, cada EV citado
ahora se identifica mediante `citedEventEvidence`: `actor_owned_event`
si el NPC protagonizó el evento, o `known_to_reference_only` si su ID
solo consta como conocedor de una referencia. El segundo caso activa
`requiresReferencedContentReview:true`: el narrador debe revisar la
observación/afirmación **propia** del NPC antes de interpretar los detalles
como información adquirida. No impide que el NPC forme hipótesis,
actúe libremente o incluso se equivoque; no cambia la causalidad del motor,
el esquema de guardado, el estado ni el tiempo. La prueba sintética compara
EV-000025 y EV-000029 para Rosa y contempla una intención sin causa externa.


## Recuerdos antiguos fuera de la ventana reciente

`prepareNPCIntentionRequests` incluye un máximo de ocho eventos recientes
para controlar el tamaño del contexto, **no** para limitar la memoria real
de un NPC. `inspectNPCGeneratedIntention` ahora valida los EV citados
contra `allEvents(snapshot)` y `known_to` del actor en el historial completo.
Un EV anterior sigue siendo citable si el actor realmente lo conoce, aunque
ya no figure en `knownEventIds` de la ventana de ocho. Nunca se permite
citar un evento desconocido o futuro.

El resultado privado marca `outsideRecentContext:true` y
`additionalContentReviewRequired:true` cuando se cita un evento antiguo
fuera del resumen reciente, incluido uno propio: el narrador debe recuperarlo
antes de inferir detalles. La referencia ajena conserva
`known_to_reference_only` y no filtra su resultado privado. La prueba
sintética crea nueve turnos en memoria, recupera un evento propio antiguo
y una referencia ajena, rechaza una fuente no conocida, y verifica un evento
causal posterior sin escribir los cinco archivos reales del guardado.
