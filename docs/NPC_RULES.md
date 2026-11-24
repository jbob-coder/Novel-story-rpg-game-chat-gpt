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


### Testimonios divergentes y revisiones ramificadas

Los conocimientos de un NPC pueden incluir testimonios mutuamente incompatibles.
La memoria registra **quién dijo qué** en las fuentes de eventos, no decide
quién tiene razón. Si un recuerdo tiene dos revisiones explícitas alternativas,
`checkNPCFactEvidence` devuelve `multiple_review_required`,
`alternativeLatestStatementsForReview` y las rutas de eventos; no selecciona
una versión como creencia definitiva. Si una alternativa recibe después otra
revisión, el narrador ve su última afirmación sin perder los eslabones previos.

Dos testimonios diferentes sin `revision_of` siguen siendo afirmaciones
separadas; no se fabrica automáticamente un vínculo de corrección. El narrador
puede decidir que el NPC dude, sospeche, acepte, rechace o mienta según
evidencias y circunstancias. Ninguna revisión exige certeza ni convierte
una declaración de terceros en verdad objetiva.


### Reconciliación privada de memoria y hilos

Las referencias de THREAD y de `knowledge` pueden compartir un EV sin que
eso demuestre que el NPC conozca todo el hilo. `relatedThreadReferences`
indica únicamente un enlace por **mismo evento** cuando una memoria literal
ya está respaldada por un cambio de conocimiento del actor. La lectura privada
de THREAD incluye evidencia separada de participación, inclusión en
`known_to` y cantidad de cambios de `knowledge` del propietario que
permanecen en el guardado. Ninguno de esos indicadores convierte el resumen
del hilo en una creencia confirmada ni autoriza su divulgación a Jack.

Incluso con `visibility:'known'`, `playerDisclosureAuthorized:false`
expresa que esta herramienta **no certifica** qué frase conoce el jugador.
Antes de narrar información no pública, contrastar los eventos y la
experiencia real del protagonista. Las correcciones, rumores y decisiones
libres siguen siendo responsabilidad del narrador.


### Comunicación causal entre NPC (rumores, noticias y secretos)

Una afirmación no se propaga solo porque otro NPC esté en `known_to`,
comparta un lugar, aparezca en un hilo o el narrador tenga acceso privado
a un evento. Para una transmisión explícitamente rastreable, el cambio
`field:'knowledge'` del **destinatario** puede incluir
`transmitted_from:{actor_id,knowledge_entry,event_id}`. Debe señalar
la entrada literal previamente guardada del **emisor** (otro NPC) y un
evento de aprendizaje más antiguo perteneciente al emisor. La recepción
necesita su **propio evento causal revisado** y guarda el texto que el
destinatario realmente oyó, que puede diferir del original.

El enlace demuestra una cadena de declaraciones, no su verdad, precisión,
confianza, comprensión íntegra ni intención de repetirla. La ausencia de
`transmitted_from` no impide que un NPC hable libremente: se mantiene
el comportamiento anterior sin garantía estructurada de procedencia.
Las consultas privadas exponen el origen exacto sin enviar secretos
al texto visible de Jack ni a otros actores automáticamente.


### Confidencialidad, transmisión parcial y relatos alterados

Un NPC puede optar por no contar algo: sin un evento propio del destinatario,
no aparece un recuerdo ajeno en su estado. Si comunica solo parte de una
afirmación o la altera, el campo opcional
`transmitted_from.reported_form` admite `as_heard`, `partial` o
`altered`. La etiqueta es una **clasificación revisada por el narrador**,
no un análisis semántico ni una demostración de mentira, intención o verdad.
El texto que recibe cada personaje se guarda exclusivamente como **su**
conocimiento; el secreto original sigue perteneciendo a su fuente.

La narración pública impide ahora copiar literalmente una frase privada de
`knowledge` añadida durante una acción fuera de escena o el contenido
original de una `transmitted_from.knowledge_entry`. El control cubre
cadenas literales extensas; una paráfrasis reveladora todavía exige la
revisión editorial del narrador. Los NPC pueden seguir hablando, callando,
engañando y reconsiderando información según causas humanas, sin menús de
acciones ni difusión automática.


## Referencia de vida cotidiana y noticias (propuesta, no canon)

Cuando un turno narrativo requiera contexto de barrio, trabajo, familia, noticias,
rumores o consecuencias después del Día 0, consultar la
[biblioteca de sucesos y noticias](01_world/LIVING_WORLD_EVERYDAY_NEWS_AND_FUTURE_HOOKS_20261122.md)
**solo como fuente de candidatos editoriales**. No es un calendario, generador
automático ni lista de eventos cumplidos. No es obligatorio insertar una noticia
en cada escena. Primero comprobar estado guardado, tiempo ficticio, actor,
motivo, fuente, audiencia y contradicciones con el canon. Una noticia puede
ser falsa o rectificada: registrar la publicación por separado de la verdad
alegada. Solo un evento adjudicado y guardado incorpora consecuencias al mundo.
El material anterior al Día 0 no anticipa poderes; las posibilidades posteriores
no asignan despertares, destinos ni resultados a personajes concretos.

## Encuentros privados entre dos NPC

Al preparar un encuentro directo, registra qué observó cada participante y
qué relación o conocimiento cambió. Puedes pasar `elapsedMinutes` a
`draftReviewedSocialContact` para indicar cuánto duró la conversación. Los dos
participantes emplean ese tiempo a la vez. Cada uno debe disponer de él además
del tiempo que ya dedicó a trabajar o desplazarse. Los registros anteriores
que solo indican el intervalo del turno necesitan al menos un minuto disponible
por participante. El historial conserva la duración exacta como desconocida.

La recuperación comprueba las ubicaciones en el momento del encuentro,
incluidos los movimientos posteriores y las incorporaciones de nuevos NPC.
La narración puede citar un detalle privado cuando el conocimiento de Jack
incluya ese dato con una fuente. El control automático detecta copias literales.
El narrador revisa por separado las paráfrasis y lo que Jack pudo observar.
