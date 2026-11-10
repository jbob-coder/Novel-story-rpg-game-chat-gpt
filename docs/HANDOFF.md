# Revisión de continuidad — Jack Wilson

**Estado:** CH-000, Día −30, noche en Crosswater Transit Plaza, turno 0, eventos 0. Rama de trabajo: `work/chat-narrative-foundation`; PR #2 borrador.

## Decisiones del propietario
- Jack tiene 21 años. **Elena tiene 17 y es hermana menor**, cuatro años menos. Anteriores referencias a Elena de 25 años/empleada son obsoletas.
- Padres Daniel e Isabel Wilson fallecidos en un incendio de la infancia; Jack sufrió secuelas relacionadas con su dificultad de voz. Edades históricas estimadas: Jack 12 y Elena 8. Rosa Wilson los cuidó.
- Ahorros suficientes para una casa proceden de **hacking pasado**. No se sabe la cifra ni los casos concretos. Hogar modesto por elección.
- Psicopatía como rasgo narrativo descrito por jugador; excepcional autocontrol, intereses propios/familia primero y disposición a poner a terceros en peligro si beneficia; si no, prefiere pasividad. No inventar actos ni presentar diagnóstico clínico.
- Jack tiene TDAH y escribe en el teléfono para que su collar reproduzca exclusivamente las palabras elegidas por el jugador.
- Aster: **robot mediano sin cabina**, en construcción y no operativo. Diseños objetivos: flexible/resistente, jetpack, combate automático, visión nocturna/térmica, display 14K, protección calor/jamming/«UMP» y escape/abort de emergencia. **UMP ambiguo (quizá EMP).** No considerar capacidades disponibles hasta jugarlas/probarlas.

## Fuentes de verdad
`game/STATE.json`, `game/CHARACTER_JACK.md`, `game/ASTER_SPEC.md`, `game/STARTING_CAST.md`, capítulo y eventos, `game/SAVE_MANIFEST.json`, decisiones. Archivo `docs/STATUS.md` contiene auditorías históricas; las referencias anteriores quedan supersedidas.

## Sin avance de historia
El intento de Jack en la plaza todavía no se ha realizado ni resuelto. No hay equipo instalado, datos robados, diálogos creados por asistente, premios XP ni acciones NPC resueltas. Manifest y capítulo siguen turno 0.

## Ingeniería pendiente
Cambio de capítulo, Día 0, validación Python/Node en checkout y prueba de recuperación desde un turno verdadero. Los sistemas planeados de Aster necesitarán progreso en juego. Sus cifras de atributos/XP siguen propuestas.


## Preservation D-027

Original player words, scene narration and dialogue must be recorded in `chapters/CH-000.transcript.json` — not merely summarized in `events.json`. An opening scene is recorded before a turn is played. Five files per turn must be saved atomically, then verified by SHA. The archive currently contains zero messages because there are no played scenes or turns. This rule supersedes older four-file instructions.


### Archive implementation verification

The actual `tools/narrative_archive.mjs` and `tools/turn_engine.mjs` were executed in a JavaScript sandbox with the GitHub checkpoint and tested on a synthetic two-turn scenario. The full player/narrator messages and paragraph breaks survived JSON reload. A non-adjacent repeat NPC move was correctly rejected, then the corrected scenario passed. **No real play was advanced.** Node CLI test execution and first real in-game save remain pending.


## Save lock and navigation update (D-028/D-029)

**Do not progress story on a failed/incomplete save.** Report verified stage percentage, blocker and pending step using `docs/SAVE_BLOCKING_PROTOCOL.md`. When response is exhausted, wait for next user input `CONTINUAR GUARDADO` and verify remote GitHub state. No background processing. The base chapter remains CH-000 Day −30 turn 0 until actual play and verified save. Folder map: `INDEX.md`, `docs/INDEX.md`, `game/INDEX.md`, `chapters/INDEX.md`, `tools/INDEX.md`, `tests/INDEX.md`; canonical files were NOT moved.


## Guard integration

When returning to gameplay, pass `save_guard={observed_head: <actual GitHub ref SHA>, previous_attempt: null only if no outstanding unsaved attempt}` to `stageNarrativeTurn`, or as fourth parameter for `stageNarratorScene`. A blocked/incomplete attempt means NO new player turn or scene. Recover the last attempt on user's next input `CONTINUAR GUARDADO` and verify all five files before resuming.


## Independent validator

`python tools/validate_state.py` now reads the full transcript, validates its sequence and links, and rejects an incomplete player/narrator turn. `tests/test_literal_archive_validator.py` contains corruption scenarios for a checkout run. Passing source-level JS checks does not prove Python tests were executed.


## Auditoría final de D-028/D-029

Índices: **18/18** recuperados desde GitHub; cero rutas relativas rotas y cero rutas canónicas faltantes. Integración de `save_gate.mjs` con turnos y escenas: **15/15** pruebas dinámicas satisfactorias en un entorno de JavaScript, incluida verificación del bloqueo a 85%, retención de textos y desbloqueo tras cinco archivos idénticos. El validador Python también revisa transcripciones, pero su suite CLI está pendiente. No ha ocurrido ningún turno real, no se han escrito eventos ni diálogos jugados. Para continuar desde bloqueo, esperar input `CONTINUAR GUARDADO`.
