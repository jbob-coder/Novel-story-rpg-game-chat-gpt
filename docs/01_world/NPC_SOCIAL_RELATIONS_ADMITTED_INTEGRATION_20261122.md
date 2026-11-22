# Lote 09 — Relaciones sociales NPC y procedencia de encuentros

**Fecha:** 2026-11-22. **Rama:** `work/npc-social-relations-admitted-20261122`. **Estado:** integración de código y pruebas en rama de revisión, apilada sobre [PR #98](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/98), que a su vez depende de [PR #82](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/82). **No fusionar independientemente.**

## Procedencia verificada

- Fuente histórica: [PR #13](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/13), HEAD `cc1fbdf149fc6ae2ad4703fc4ed14e70a77ec226`, con base antigua de [PR #12](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/12). Fuente `tools/living_world_social.mjs` Git blob `971cf964a45fe1842c986288212543c198f8f63a`; pruebas fuente Git blob `c8bc14d84ae45d217fa41470b5c710ed840c9099`.
- Base moderna de esta rama: [PR #98](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/98), HEAD `b858c5c5cd0d0975dae67048e639cf12d493422d`, con `game/STATE.json` Git blob `3f4e9c98a7211068faefd31d0a0acbd4260ef589`; 15 lugares (14 `LOC-` y contenedor urbano) y 7 NPC. La fuente de PR #13 heredó un estado antiguo de **9** lugares y por ello **no** se importaron sus archivos de partida ni herramientas de motor enteras.
- Las PR #13 y #98 son trabajo **sin fusionar**; la documentación no modifica las decisiones del propietario ni el canon.

## Código y contratos implementados

1. `tools/living_world_social.mjs` adapta selectivamente tres interfaces: `draftReviewedSocialContact`, `validateSocialResolutionBatch` y `verifySocialEventHistory`. Todo encuentro necesita **dos NPC existentes y distintos**, misma ubicación registrada, una **observación explícita del turno nuevo atribuida y revisada** y al menos un cambio material actor-owned. Compartir distrito o aparecer en el mismo local es solo un *candidato*, jamás una conversación automática.
2. La pareja de resoluciones preserva **relaciones direccionales** y los metadatos previos de cada actor. Una modificación de relación solo afecta al emisor de su propio evento. La información transmitida solo puede proceder de un hecho ya guardado en `speaker.knowledge`; el receptor obtiene un testimonio **atribuido y no verificado independientemente**, no una verdad global ni conocimiento de Jack.
3. `tools/living_world_coordinator.mjs` únicamente añade comprobación de pareja completa y copia el contexto social privado cuando recibe una resolución editorial válida. Rechaza un efecto social no relacionado, resultados sin revisión, pérdidas de fuente y el orden invertido **emisor antes del receptor**.
4. `tools/turn_engine.mjs` conserva `social_context` como metadato del evento privado de cada NPC, enlaza el segundo evento con `caused_by` al primero y llama al verificador social desde `verifyNarrativeSnapshot`, junto a los controles ya existentes de cambios, cronología, ruta, descubrimiento, privacidad, capítulos y guardado.
5. **Extensión selectiva de readback:** el verificador examina `allEvents(snapshot)` del historial global, no únicamente `CH-000.events.json`, para seguir examinando la procedencia cuando se cierren capítulos. Rechaza un contexto social en un evento del jugador, uno cuyo `known_to` no atribuya el evento a su NPC, mutaciones no sociales ocultas, pares incompletos y modificaciones de procedencia de testimonios. Los eventos antiguos sin `social_context` siguen siendo válidos.

Se conserva el sistema de novela interactiva (no XP), la separación entre realidad mundial, conocimientos de NPC y conocimientos de Jack, el mecanismo de guardado GitHub de cinco archivos con journal y el motor de rutas/tiempos. **No se añadió ninguna interacción social real al turno 9** y no se habilita simular cuando el chat está inactivo.

## QA y alcance

- `tests/npc_social_relations_admitted.test.mjs`: **19 tests**, procedentes de PR #13 y de nuevas pruebas contra el mundo admitido: co-ubicación no equivale a evento, dos efectos propios del actor, orden de comunicación, no fabricación de conocimiento, relaciones asimétricas, vínculo causal, privacidad, transferencia con fuente, readback de eventos alterados, no mutación del checkpoint y dos turnos sintéticos en memoria.
- **Los turnos 10/11 de las pruebas son sintéticos, nunca guardados ni narrados al propietario.** No hay permiso para adelantar la historia ni modificar `work/chat-narrative-foundation`, `main` o `journal/`.
- **Validación requerida:** Node, Python, validador de partida, inventario exacto, SHA de los cinco archivos del checkpoint y GitHub Actions en el **mismo HEAD** que se someta a revisión. No declarar las 19 pruebas aprobadas antes de comprobar CI. La pasada histórica de PR #13 no certifica esta adaptación.
- **Límite residual:** el verificador comprueba la autoría y consistencia de los metadatos; la autenticidad de una observación editorial y de la información originalmente conocida por el emisor depende de eventos y revisión narrativa. La lectura histórica no reconstituye por sí sola la memoria del emisor a cada instante. Las relaciones fuera de este camino social pueden ser modificadas por otros eventos legítimos, sujetos al validador general; este lote no restringe de forma destructiva los eventos históricos.

## Siguiente fase sugerida

Verificar el resultado del CI y los SHA finales; corregir cualquier fallo sin desactivar las pruebas. Si pasa, mantener un draft PR apilado sobre #98 y realizar una QA-only PR con base `main` para disparar workflows si hace falta, **cerrándola sin merge**. Posteriormente evaluar la persistencia independiente de observaciones causales y la revalidación de fuente a lo largo de capítulos sin duplicar los eventos ni exponer secretos.