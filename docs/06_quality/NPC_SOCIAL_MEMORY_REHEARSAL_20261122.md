# QA de memoria social de NPC (no canónica) — 2026-11-22

## Propósito y alcance

Comprobar una secuencia limitada con el motor ChatGPT-nativo ya existente:
interacción social ficticia observada por un NPC, recuerdo individual con
procedencia, decisión distinta ante esa información, cambio material persistente,
cierre de capítulo y recuperación de los archivos. **No se juega el turno 10.**

La prueba exclusiva se encuentra en
`tests/npc_memory_social_continuity.test.mjs`. Usa una simulación en
memoria con identificadores de eventos sintéticos. No contiene hechos aprobados
para el mundo real de la novela y no debe importarse como canon.

## Secuencia evaluada

1. El punto de partida es la copia del checkpoint real CH-000, turno 9.
   Rosa sigue con el despertador reparado, todavía pendiente de entrega.
2. En un turno sintético, el propietario del reloj le comunica a Rosa que
   prefiere recibirlo posteriormente. El conocimiento se registra como cambio
   del propio actor y queda atribuido a EV-000031 (solo en la simulación).
3. El gestor de contexto recupera ese conocimiento privado desde el estado
   guardado y enlaza con EV-000031 como fuente.
4. En otro turno sintético, Rosa **decide** posponer la entrega, modifica su
   plan y registra la consecuencia en sus recursos. No entrega el reloj, no
   modifica la voluntad del jugador y no revela un pensamiento privado.
5. La simulación crea CH-001, reconstruye el historial de CH-000 y relee el
   estado. Verifica que no se pierdan conocimiento, plan, recurso ni evento.
6. Se comprueban aislamiento de memoria entre NPC, privacidad ante el jugador,
   rechazo de eliminación retrospectiva de un conocimiento y preservación
   literal de los cinco archivos originales.

## Límites de la prueba

Se verifica **persistencia y trazabilidad**, no que ChatGPT deduzca de forma
algorítmica todas las decisiones posibles. El campo de justificación causal
es contenido revisado por el narrador; un validador no demuestra su veracidad
literaria ni que la interacción se haya producido fuera de la simulación.

El NPC no necesita una lista cerrada de acciones. La información recordada
debe ser pertinente y tener acceso causal; el resultado es revisado antes de
guardarse. El mundo no funciona en segundo plano. No se crean nuevos NPC reales,
memorias no comprobadas, escenas de Jack ni mapas detallados por esta prueba.

## Evidencia y mantenimiento

Ejecución: `node --test tests/npc_memory_social_continuity.test.mjs`
y regresión completa mediante `node --test tests/*.test.mjs`.
Revalidar tras modificar `tools/context_manager.mjs`,
`tools/living_world_coordinator.mjs`,
`tools/turn_engine.mjs` o
`tools/chapter_management.mjs`.
El validador de Python y el checkpoint canónico son controles adicionales.

El único criterio de aceptación de esta etapa es que las pruebas pasen con
las fuentes y archivos canónicos intactos. Los informes de CI pertenecen a la
PR o commit concretos; no trasladar resultados de commits anteriores.
