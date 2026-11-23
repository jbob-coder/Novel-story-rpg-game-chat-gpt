# Continuaciones causales abiertas entre NPC — contrato mínimo

**Rama:** `work/npc-open-causal-continuations-20261122` (base fija: [PR #154](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/154), `5221300eacee3d0c71dd48be2b41800149097ba1`). **Tipo:** ingeniería y QA en borrador, no capítulo nuevo, no partida avanzada.

## Objetivo aceptado

Las acciones de Jack se interpretan en lenguaje libre. La novela **no** le ofrece menús, ni debe depender de árboles predefinidos de acciones o finales. Las consecuencias pueden ser inmediatas, persistentes o diferidas. Un comerciante puede reaccionar y contar algo a un mensajero, quien decide qué hacer, y la nueva información puede llegar a otro personaje. **La cadena no requiere que Jack esté presente**, pero cada decisión debe ser plausible, tener su propio autor, respetar el conocimiento individual y quedar ligada a sucesos verdaderamente ocurridos. Esto no autoriza inventar un evento a partir de una mera posibilidad.

**Situaciones generales reutilizables** (ejemplos no exhaustivos): trabajar, reparar, desplazarse, hablar, compartir información, comprar/vender, ayudar, investigar, descansar y esperar. Las acciones no se clasifican en botones predefinidos. El narrador analiza intención, tiempo, lugares y conexiones reales, herramientas, recursos, competencias cualitativas, restricciones, fuentes y posibles terceros. Resolver una acción puede ser éxito, fracaso, intento parcial, retraso, complicación u oportunidad; no se impone una recompensa o amenaza. Cada efecto material se añade al evento propietario mediante los campos tipados ya existentes (`location_id`, `inventory_item`, `knowledge`, `relationship`, `resources`, `plans`, `needs`, `commitments`, etc.) y se guarda con los cinco archivos en una operación atómica con journal.

## Implementación mínima (reusa el motor existente)

El módulo nuevo `tools/living_world_causal_continuations.mjs` no es un simulador adicional ni una IA separada.

- **`inspectNPCCausalContinuations`** inspecciona eventos que cada actor ya conoce, en orden cronológico y con límites de revisión. Devuelve candidatos **privados**, marcados `review_required`, `resolved:false` y `applied:false`. No inventa decisiones, horarios ni nuevos NPC.
- **`draftReviewedNPCCausalContinuation`** produce la misma resolución del coordinador existente, pero añade `continuation_context` con **1–3 eventos anteriores** que el actor conoce. Requiere `reviewed:true`, una justificación editorial específica, un resultado y cambios eventuales opcionales. No hay lista cerrada de acciones ni obligación de que el resultado sea favorable. Una fuente vieja puede citarse aunque no esté entre los últimos candidatos mostrados por la vista acotada.
- **`validateNPCContinuationDraft`** se ejecuta también en la entrada directa del motor para que el coordinador no sea la única barrera. Rechaza eventos aún no ocurridos, sucesos que el actor desconoce, ID duplicados, reseñas falsificadas, métodos para colar referencias sin contexto y mezcla de estas resoluciones con el contrato especializado de encuentros sociales.
- **`verifyNPCCausalContinuationHistory`** verifica todas las continuaciones, tanto en el capítulo activo como en archivos anteriores: evento privado `independent_actor`, autor real, revisión, intención, `caused_by` exacto, referencias existentes y **anteriores al turno**, visibles previamente para el propio actor por `known_to`, y cambio persistente `last_resolved_action`. Rechaza enlazar retroactivamente una acción sin justificación. No reinterpreta los 29 eventos sellados del turno 9.

El único requisito para materializar una continuación es que el propietario haga avanzar el tiempo ficticio con una nueva acción libre y que el narrador **revise y resuelva** el acto de cada NPC relevante. El motor no ejecuta propuestas ni se mantiene funcionando entre respuestas de ChatGPT. El conocimiento de otro personaje no se obtiene automáticamente por proximidad, ni el jugador ve hechos privados: el sistema social anterior exige que el testimonio sea compartido mediante dos eventos propios y registra el origen de la información.

## Ejemplo sintético de una cadena abierta

1. Un NPC A comparte una observación comprobable con B; el registro social mantiene el evento de A y el de B como dos hechos causales diferenciados. B conoce la declaración con fuente, pero no se trata como verdad confirmada.
2. En un **turno posterior**, B decide verificar esa información. Su nuevo evento cita su propio evento previo de adquisición mediante `continuation_context.source_event_ids`, y queda relacionado con `caused_by`. El motivo y el resultado son revisados, no calculados automáticamente.
3. B comunica lo que realmente sabe a C mediante otra interacción causal. C puede hacer una verificación diferente más adelante, referenciando su evento de adquisición. El origen del testimonio original se conserva en la cadena de conocimientos.
4. El sistema valida los enlaces entre capítulos, sin asumir que Jack fue testigo, tuvo acceso a secretos o eligió la actuación de B o C.

Esta es una **cadena de consecuencias posibles**, no un guion obligatorio. También puede no pasar nada si no hay causa plausible o tiempo disponible.

## Alcance, garantías y límites

El historial solo puede citar sucesos que el actor ya conoce mediante el registro existente. **No se introduce conocimiento por inferir intenciones secretas**, ver un rumor en una planificación o conocer la ubicación de otro NPC. Si una consecuencia exterior es perceptible pero el NPC no tiene todavía registro causal de observación, debe introducirse primero una evidencia real en un evento atribuido a ese NPC; no se permite inventar memoria ni enlazar directamente el hecho secreto. El contrato social gestiona sus propios eventos, por lo que una acción genérica con continuación no puede suplantar una interacción social bilateral.

La vista privada no obliga a inspeccionar todos los candidatos. Los actores pueden seguir realizando tareas ordinarias que no provengan de ninguna fuente nueva. No impone roles, rutinas ni una máquina de decisiones finita. La valoración literaria y física del resultado corresponde al narrador con las reglas actuales. El enlace `caused_by` solo prueba la referencia estructural y su exposición previa; **no demuestra por sí mismo que la relación semántica o la motivación sea verosímil**. Se exige revisión editorial.

**No se cambia:** `main`, la rama narrativa, el journal de producción, `game/STATE.json`, `game/SAVE_MANIFEST.json`, `chapters/CH-000.*`, la fecha del fenómeno, los poderes y la física detallada de la ciudad. El Día 0 y sus implicaciones futuras siguen sin activarse. Ningún evento sintético es canon.

## QA antes de integrar

`tests/npc_open_causal_continuations.test.mjs`: 16 escenarios sintéticos incluyendo fuentes conocidas y desconocidas, revisiones y métodos maliciosos, conocimiento privado, enlaces de varios personajes, decisión posterior, transferencia social, continuación entre capítulos y no ejecución de propuestas. Ejecutar en GitHub Actions la suite Node/Python y el validador sobre **HEAD exacto**. Mantener esta PR apilada sobre #154, sin fusionar otras PR ni ampliar el mapa. El almacenamiento en cinco archivos permanece bajo el contrato existente.
