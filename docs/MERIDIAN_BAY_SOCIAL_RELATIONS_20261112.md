# Meridian Bay — relaciones e información entre NPC (D-057, propuesta implementada)
Fecha: 2026-11-12. Rama aislada: `work/meridian-bay-social-relations-20261112`.
Base técnica inspeccionada: `7b0c6ddf9c07192b2e8b2560725712b2efb0f82f` (D-056).

## Problema verificado
El esquema ya permitía cambios de `relationship` y `knowledge` como mutaciones individuales. Sin un contrato de encuentro, era fácil confundir que Darius y Noah figuren en Market Row con que realmente conversaron; o atribuir a uno un secreto que solo el otro conoce. La selección de posibles contactos de D-055 era **propuesta**, no hecho. Las relaciones son direccionales: uno puede ganar respeto y el otro mantener reservas.

## Solución técnica
Nuevo `tools/living_world_social.mjs`:
- `draftReviewedSocialContact`: **dos** NPC existentes y diferentes, con ubicaciones registradas iguales y un testimonio de interacción **en el nuevo turno narrativo**, marcado explícitamente como revisado. La coincidencia territorial por sí sola no autoriza el encuentro.
- `interactionId` estable `SOC-...`, `participantIds` y observación causal atribuida; resultados separados aportados por el narrador para cada personaje. Se exige al menos un cambio material: vínculo propio de uno o ambos participantes, o información comunicada.
- Las relaciones nuevas requieren etiqueta y vínculo cualitativos explícitos. Una relación existente conserva todo campo no autorizado, incluidos indicadores privados. El vínculo puede cambiar en **una sola dirección**; la otra perspectiva no cambia sin su propio evento.
- Un hecho comunicable se toma **literalmente** del conocimiento registrado del emisor, se atribuye a ese emisor y se almacena en la memoria del receptor como **testimonio no verificado de forma independiente**. No se eleva un rumor a verdad objetiva ni se otorga conocimiento al protagonista.
- `validateSocialResolutionBatch` rechaza mensajes imposibles, alteración de atributos ajenos, efectos cruzados, interlocutores inventados, encuentros unilaterales o modificaciones no relacionadas.
- `tools/living_world_coordinator.mjs` exige la pareja de resoluciones verificadas antes de construir un turno. El motor da al emisor el **primer evento** y al receptor el siguiente, con `caused_by` enlazando la transmisión.
- `tools/turn_engine.mjs` conserva `social_context` solo en el registro privado de ambos eventos. `verifySocialEventHistory` compara pares, turno/día, origen de información y vínculo causal durante la validación del checkpoint. No cambia el texto narrado para Jack.
- El guardado real sigue requiriendo la transacción de cinco archivos y un journal externo: un borrador en memoria **no es** una nueva partida.

### Ejemplo sintético, NO CANÓNICO
Noah y Darius aparecen registrados ambos dentro de Market Row. Si en un futuro turno un encuentro directo fuera narrado y revisado, Noah podría comunicar un dato que ya conoce y Darius guardarlo como `Reported by NPC-006 (not independently verified)`. Tras eso, cada uno puede interpretar la conversación de forma distinta, y solo su propio evento modifica su `bond`. **No se afirma que el encuentro haya ocurrido en el turno 9.**

## Restricciones y riesgos
1. La prueba de contacto `current_turn_observation` la aporta/revisa el narrador. El validador confirma forma, autor, lugar y coherencia de efectos, **no la verdad literaria** de una escena nueva por sí solo. No se ejecuta entre mensajes.
2. La ubicación `LOC-COMMERCIAL-DISTRICT` abarca un distrito; compartir ese ID no confirma proximidad física. Debe existir evidencia específica del encuentro en el turno. En una expansión futura harán falta ubicaciones con granularidad comercial.
3. Una conversación puede originar **testimonio**, no certidumbre. Resolver hechos, rumores o secretos exige pistas y comprobaciones separadas; los metadatos de su origen quedan en el evento.
4. Relaciones no son puntos sociales, porcentajes de confianza ni XP. No se sobrescriben antecedentes familiares de Jack/Elena/Rosa.
5. Se guardan vínculos mediante eventos de cada NPC por separado; la bidireccionalidad no se impone. Ninguna narración pública recibe automáticamente conversaciones privadas.
6. La rama depende de D-054, D-055 y D-056, todavía en PR de revisión; no fusionar automáticamente a `main`.
7. La validación se añade a esta nueva ruta social; la antigua interfaz general de cambios sigue permitiendo relaciones revisadas desde otros tipos de evento. Fortalecer en el futuro el contrato global de conocimiento y relaciones sin destruir compatibilidad histórica.

## QA y próxima fase
- `tests/living_world_social.test.mjs`: simulación de dos eventos sociales, origen privado, perspectiva asimétrica, relación preexistente, ausencia de encuentros automáticos, datos falsificados, compañero ausente, archivo alterado y continuidad canónica.
- Ejecutar suites Node y Python, validador del checkpoint, comparador de cinco hashes y GitHub Actions antes de afirmar pruebas exitosas.
- Próximo incremento D-058: necesidades y costes cualitativos persistentes (tiempo/disponibilidad, trabajo/familia, recursos, privacidad) y casos de desacuerdo/no cooperación. Después: servicios físicos confirmados mediante eventos e integración remota journal+recuperación.

## Continuidad D-055
Todo el trabajo se hace en incrementos entre mensajes. Porcentaje de progreso del alcance total de Meridian Bay debe ser **aproximado y sujeto a revisión**; ni la generación de planes ni la validación de código equivalen a una simulación narrativa continua.

## Resultados confirmados de la entrega
- [GitHub Actions #43341782362](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43341782362), commit técnico `fa9b196dc69df4b0a603270e8d659f40cc4a94e5`: **222/222 pruebas Node.js**, **24/24 Python**, **0 fallos**, validador del checkpoint **PASS**. Un commit posterior solo agregó el contrato de esquema a `docs/STATE_SCHEMA.md`, sin modificar el código verificado.
- Comprobación de GitHub por SHA de blob: los cinco archivos originales de partida (`game/SAVE_MANIFEST.json`, `game/STATE.json`, `chapters/CH-000.md`, `chapters/CH-000.events.json`, `chapters/CH-000.transcript.json`) son idénticos en rama canónica, rama D-056 y esta rama.
- [PR #13](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/13): **abierta, en borrador, sin fusionar**, con base correcta `work/meridian-bay-causal-decisions-20261112` tras activar CI mediante una base temporal `main`. Ocho rutas nuevas/modificadas, ninguna pertenece a los cinco archivos de partida.
- No se modificó el checkpoint original: CH-000, turno auténtico 9, día −29 por la mañana.

## Progreso aproximado y bloque pendiente
Alcance total de desarrollo de Meridian Bay según D-055: **~40–50 %** en *ramas técnicas no fusionadas*, sujeto a auditoría e integración. El módulo de relaciones e información entre NPC tiene su contrato mínimo y pruebas integrales sintéticas, pero **no** significa que los NPC ya tengan emociones complejas o rutinas continuas. Siguen pendientes: necesidades y costes cualitativos durables, relaciones más complejas/conflictos, servicios y lugares canónicos incorporados por evidencia, y prueba completa del journal autenticado de guardado y recuperación. La próxima tarea recomendada es comenzar por necesidades/costes; no por generar centenares de NPC decorativos.
