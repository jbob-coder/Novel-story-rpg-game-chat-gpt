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
