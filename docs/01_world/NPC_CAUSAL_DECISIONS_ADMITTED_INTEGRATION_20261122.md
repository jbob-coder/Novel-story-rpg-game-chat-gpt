# Meridian Bay — adaptación selectiva de decisiones causales NPC (Lote 08)

**Fecha:** 2026-11-22. **Tipo:** implementación técnica en borrador, **no** avance narrativo ni integración automática a main.

## Fuentes y base comprobadas

- [PR #12](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/12): `work/meridian-bay-causal-decisions-20261112` en `7b0c6ddf9c07192b2e8b2560725712b2efb0f82f`; fuente `tools/living_world_decisions.mjs`, Git blob `34ecb0aa60db1bf36bcb7ae4d0c834a295d06398`; tests fuente `d0834d41c3f90474df3f4ff117b02613f73c1cdf`. Históricamente dependía de la PR #11.
- [PR #82](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/82): `work/npc-causal-agenda-20261120` @ `53f6dcb77965a62cf896be22cd1d97cef2088761`, con agenda privada que interpreta compromisos **del actor propietario**, ventanas temporales e intervalos hasta el día de destino.
- [PR #91](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/91) documenta la incompatibilidad histórica de cinco blobs: el antiguo `STATE.json` no tiene las seis ubicaciones que luego fueron admitidas en main. Esta rama parte directamente del HEAD de PR #82: **no se trasladó ningún archivo de partida ni módulo antiguo de rutas/guardado**.

## Código adaptado

`tools/living_world_decisions.mjs` reproduce de manera independiente las verificaciones concretas de PR #12 sobre el **estado de 15 lugares** admitidos y la agenda de PR #82: `assessNPCDecisions` inspecciona hasta un intento prioritario por NPC, su objetivo y plan registrados, recursos, compromisos, limitaciones, rutas existentes y alternativas. El resultado es privado, no muta estado, no avanza tiempo, no añade lugares y **no confirma logros**.

`draftReviewedNPCDecision` reevalúa el informe antes de crear una resolución provisional y exige revisión editorial. Progreso, fallo o finalización requieren una observación de turno nuevo, atribuida al actor o al protagonista, con fuente concreta. Una entrega de paquete, llegada a escuela o devolución del reloj no se consideran cumplidas por tener una intención o por aparecer un nuevo lugar sin conexión causal de destinatario. Obstáculos guardados bloquean progreso y finalización; vencimientos no significan fallo automático. Una acción de otro actor o progresión RPG no se autoriza desde este borrador.

`tools/living_world_diagnostics.mjs` expone `causalDecisionAssessments` **solo** en la inspección privada del narrador, sin añadirlo a `playerVisibleDiagnostic`. Con ello se conserva la separación entre mundo real, conocimiento de NPC y conocimiento del protagonista.

No se editaron `tools/turn_engine.mjs`, `tools/living_world_coordinator.mjs`, `game/`, `chapters/`, ramas de otros agentes, ni journal. Los borradores siguen entrando al coordinador **solo** tras una resolución explícita de turno y el guardado de cinco archivos verificado. Esta implementación no añade automáticamente una escena ni transforma una observación inventada en hecho: la veracidad narrativa de la observación depende de revisión humana.

## Pruebas y riesgo residual

`tests/npc_causal_decisions_admitted.test.mjs`: **19 casos**, 13 heredados y adaptados de PR #12 y seis nuevos relativos a la admisión actual, destinatarios no establecidos, vencimiento según día destino, compromisos del propietario, evaluaciones caducadas y privacidad. Incluye un **turno sintético en memoria** para verificar que la resolución del NPC no aparece en prosa visible y que el checkpoint original sigue inmutable. El turno sintético **no** es una acción real del jugador ni guardado GitHub.

**Aceptación pendiente:** ejecutar Node, Python, validador canónico, integridad de índices/inventario y comparación de blobs Git sobre el HEAD final; registrar un workflow real antes de marcar QA completa. Las suites existentes de PR #82 no certifican por sí solas esta nueva capa.

**Límites y siguiente paso:** la evidencia de observación se inspecciona en memoria y `review_metadata` no cuenta todavía con un registro de procedencia persistente independiente en el evento final. Resolver ese contrato de replay sin exponer secretos ni introducir información no observada es trabajo futuro. La [PR #13](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/13) de encuentros sociales debe adaptarse **después** y de forma aislada; no fusionar código histórico de relaciones, `turn_engine` o `coordinator` sin conciliación de los contratos actuales. Esta rama está **apilada sobre PR #82**: no fusionar en main independientemente.

## Defecto detectado por CI de integración y corrección

La ejecución QA-only inicial [#45070520788](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45070520788) encontró **449 PASS / 1 FAIL** en Node; el test preexistente de diagnósticos con compromisos diferentes de igual ID local fallaba con `Selected intention has no source candidate`. El problema era el uso del ID de obligación sin su propietario como clave de mapa dentro del evaluador nuevo. Se corrigió en `assessNPCDecisions` a clave compuesta `[actorId,candidateId]` para la selección **y las alternativas**, y se añadió una prueba propia de dos propietarios con el mismo ID local. No se alteró el código de la agenda de PR #82, el coordinador, los test antiguos ni el guardado. **Volver a ejecutar la suite completa sobre el commit final**; un fallo de un commit anterior no puede considerarse resuelto sin esta nueva ejecución.
