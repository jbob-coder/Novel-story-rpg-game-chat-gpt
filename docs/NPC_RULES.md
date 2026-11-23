# Independent actor and world simulation — narrative contract

Each established NPC or organization should have a stable ID, identity, current location, motivations, needs, resources, relationships, abilities/skills, knowledge and an active goal. Include obligations and constraints such as schedules, risk, health and access. Record only relevant actors; do not invent thousands of simulated records.

## During each narrated turn
- Determine elapsed fictional time and update **relevant** offscreen actors even when the player ignores them.
- Choose plausible actions from the actor's goals, capabilities, resources, contacts and location. Not all actions succeed.
- Update discovered facts with `known_by` or individual knowledge records. An NPC should not react to secret events it has no reasonable way to know.
- Let relationships, injuries, financial conditions, reputation and skill progression persist.
- Record meaningful independent decisions as events with actor IDs, causes and consequences. Details unknown to the player may remain out of narrated prose, but must not disappear from the saved world.
- Organizations can develop plans, recruit members, spend resources and conflict without player input. Power does not equal alignment.

## Simulation scope
Use **causal abstraction** for distant populations and detailed tracking only for people/places likely to affect the active scene. Expand granularity as needed, avoiding exhaustive per-day processing for every citizen. Chapters are narrative arcs, not fixed day-tick loops. Long actions can advance time and produce multiple world events.

## Before and after the shockwave
The opening thirty days establish normal society. No superhuman manifestation before Day 0. On or after Day 0, some humans may awaken, others later or never, and wildlife/plants/terrain can change. Specific rates, powers, geography and ecology are not yet approved; don't present placeholder outcomes as canon.

## Acción libre y memoria de NPC

Las siete entradas de `ROUTINE_PROPOSALS` son sugerencias de actividad, **no**
una lista de acciones permitidas. Un NPC establecido con identificador, objetivo
y plan propio también puede recibir una revisión narrativa genérica, aunque no
tenga plantilla de rutina. La hora, el destino y la ruta quedan sin especificar
si no existe evidencia; el resultado nunca se ejecuta por adelantado.

ChatGPT puede resolver otras acciones plausibles según intención, conocimiento,
recursos y circunstancias. Los campos de cambio admitidos son un contrato de
persistencia y causalidad, no un menú de conductas. Un efecto que no se pueda
registrar de forma segura requiere una extensión revisada, no un resultado
inventado ni una mutación fuera del guardado.

La memoria persistente incluye hechos con origen en `knowledge`, relaciones,
`last_resolved_action`, planes, compromisos, necesidades y sucesos históricos
con identificadores EV. La memoria **no** implica omnisciencia: se recuperan
las fuentes pertinentes al interpretar una escena y los datos privados no se
revelan a Jack sin una causa. No se simulan acciones durante la inactividad del
chat ni se avanza la historia para rellenar recuerdos.


La recuperación contextual puede seleccionar automáticamente un NPC si su
nombre o identificador aparece en la consulta o comparte la ubicación
**guardada** con Jack. La selección no prueba un encuentro y no entrega
conocimientos de un actor a otro. La proyección automática es breve: antes de
resolver algo material, el narrador debe consultar el estado y los eventos
originales completos del actor.


### Identidad dudosa y conocimiento causal

Si dos NPC comparten nombre de pila, una mención ambigua no selecciona uno
arbitrariamente. El narrador recibe `npcAmbiguities` en contexto privado y
debe consultar identidad, ubicación, diálogo previo y fuentes antes de atribuir
palabras o acciones. Un pronombre por sí solo tampoco acredita una identidad.

`checkNPCFactEvidence` y la opción privada `npcKnowledgeClaims` contrastan
**hechos literales** con `knowledge` del NPC y, si figura un EV, con el cambio
de conocimiento original de ese **mismo actor**. Que un NPC aparezca en
`actor_ids`, `known_to` o en la escena no demuestra que haya aprendido todos
los detalles. `not_recorded` significa «no hay prueba suficiente en el
conocimiento explícito»; no confirma ignorancia absoluta. Si una afirmación
es una inferencia, rumor, observación nueva o paráfrasis, requiere revisión
causal y registro antes de representarse como conocimiento cierto. No es una
restricción a sus acciones libres.


### Rumores, mentiras y recuerdos expresados de otra forma

Una entrada literal de `knowledge` demuestra que el NPC **recuerda una
afirmación**, no que la afirmación sea cierta. Los hechos difundidos por
terceros pueden ser rumores, errores o mentiras; las creencias y sospechas
dependen de la interpretación del narrador y sus fuentes originales.

Cuando no hay coincidencia literal, `relatedStatementsForReview` propone
hasta tres frases ya guardadas que comparten términos. Son **pistas para
revisión**, no equivalencias: también pueden ser negaciones, contradicciones
o descripciones de otro hecho. `truthStatus:'not_assessed'` impide confundir
el estado de conocimiento con la verdad objetiva. El NPC puede mentir, callar,
malinterpretar, sospechar, inferir o cambiar de opinión si la situación lo
justifica. No existen nuevas restricciones sobre sus acciones; los efectos
persistentes requieren revisión causal y guardado.


### Revisión de conocimientos sin perder recuerdos

Una creencia o afirmación guardada en `knowledge` **no se borra** cuando
el personaje recibe datos posteriores. En una resolución narrativa revisada,
un nuevo cambio `field:'knowledge'` puede incluir `revision_of` con la
cadena exacta de la memoria anterior del **mismo NPC** y
`revision_reason` para explicar por qué actualiza su postura. El sistema
registra ambos hechos y sus eventos; no exige que se demuestre verdad
objetiva, ni interpreta la relación como contradicción automática.

`checkNPCFactEvidence` conserva `mayAssumeKnown` para la experiencia histórica,
pero añade `statementRevisionStatus`, `revisionEventIds` y, si la
revisión es una cadena inequívoca, `latestLinkedStatementForReview`.
Una vieja afirmación puede seguir siendo conocida sin representar la creencia
presente. Si hay varias revisiones alternativas, debe revisarlas el narrador;
no se elige una de manera automática. Esto no restringe mentiras, dudas,
nuevas hipótesis ni cambios de opinión basados en acontecimientos reales.
