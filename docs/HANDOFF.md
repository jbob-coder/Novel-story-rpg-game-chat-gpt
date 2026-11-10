# D-042 — simulación integral de guardado y recuperación (2026-11-10)

**Último commit de implementación:** `f6a8b3ab8aa5526d31cfe78ced74a11187c141ce` en `work/chat-narrative-foundation`; PR #2 continúa abierta y en borrador, sin merge a `main`. Nuevo `tools/save_transaction.mjs` y `tests/save_transaction.test.mjs`; índices, inventario y protocolos actualizados.

**Pruebas reales en GitHub Actions:** [run #42905805692](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/42905805692) en este commit, **67/67 Node**, **20/20 Python**, `tools/validate_state.py` PASS. Los 10 escenarios nuevos utilizan un Git remoto **simulado en memoria**; nunca modificaron la historia. Casos: commit atómico de cinco archivos, interrupción tras ref, interrupción tras crear commit, protección CAS, cambios concurrentes, archivo alterado, SHA desconocido, recuperación idempotente, fuente incompleta y entrega literal idéntica.

**Checkpoint conservado:** CH-000, Día −30, turno **6**, evento EV-000021 y transcripción TXT-000014. Los cinco archivos de partida mantienen los mismos blobs verificados antes de D-042. Jack continúa en el taller; Elena espera su respuesta sobre la memoria USB. No hay turno 7 ni decisiones nuevas de Jack.

**Límites pendientes:** el módulo es un **orquestador por adaptador inyectado**, no un cliente GitHub autónomo. Una prueba con GitHub remoto y una acción real del lector con lectura de vuelta siguen sin hacerse. El estado temporal del intento bloqueado debe conservarse para recuperarlo; si desaparecen el commit SHA o el texto exacto, no recrear la acción. La validación de correspondencia entre prosa y cambios permanece editorial. Continúan pendientes las transiciones entre capítulos y el Día 0.

---

# D-041 — CI real y aplicación atómica de cambios (2026-11-10)

**Rama de trabajo:** `work/chat-narrative-foundation`; PR #2 en borrador. Los commits `3e887816` y `fca32dca` implantaron aplicación atómica por actor de un lote de cambios (una validación fallida no modifica el actor ni añade cambios al evento), mensajes explícitos para campos no admitidos y dos pruebas de regresión. También corrigieron una expectativa obsoleta: la siguiente escena se agrega al final de una transcripción que ya tenía 14 entradas, no al inicio.

**Evidencia ejecutada:** GitHub Actions [narrative-qa run 42903181369](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/42903181369) para `fca32dcaf88bd28f03cef7574e97257db80c3243`: Node **57/57**, Python **20/20**, y `python tools/validate_state.py` PASS. Los tres pasos del job finalizaron con éxito. Un primer run `42902977959` había fallado con 56/57 por aquella expectativa obsoleta; el segundo run demuestra la reparación. El flujo se limita a PR para no duplicar consumo de CI en cada push.

**No se avanzó la historia.** El último checkpoint continúa en CH-000, Día −30, turno 6, EV-000021, TXT-000014. Los cinco archivos de partida fueron excluidos de los commits de implementación. La suite usa escenas sintéticas: no prueba todavía el guardado y recuperación remotos de un turno 7 auténtico. D-036, D-037, D-038 y D-040 siguen vigentes. **Pendiente:** comprobar correspondencia entre prosa y efectos declarados en un turno real elegido por el lector, con commit atómico y lectura de vuelta, sin adelantar decisiones de Jack.

---

# D-040 — avance técnico de continuidad (2026-11-10)

**Hechos verificados:** el nuevo módulo `tools/state_changes.mjs` aplica cambios cualitativos con precondiciones de Jack y NPC y se encuentra integrado en `tools/turn_engine.mjs`. Incluye rutas y movimiento de objetos portados, inventarios, relaciones, condiciones, conocimientos, planes y registro de últimos actos NPC. Doce pruebas aisladas **se ejecutaron localmente con Node y pasaron**; las pruebas de integración se añadieron a `tests/turn_engine.test.mjs`, **sin ejecución completa verificada en checkout** debido a la falta de acceso de red de la terminal a GitHub. El código se guardó en la rama de trabajo mediante commits no forzados y readback remoto. El motor no interpreta automáticamente el texto narrado; deben prepararse los cambios materiales explícitos. Ver `docs/STATE_SCHEMA.md` D-040 y `docs/QA_SCENARIOS.md`.

**Checkpoint no jugado:** CH-000, Día −30, turno 6, EV-000021, TXT-000014. Jack sigue en el taller y Elena espera una respuesta sobre la memoria USB. El pasado tecnológico confirmado de Jack figura en `game/JACK_HACKER_HISTORY.md`. No iniciar turno 7 sin decisión del usuario ni afirmar que las suites completas pasaron.

**Pendiente:** ejecutar pruebas de integración y Python sobre el mismo HEAD, luego ensayar guardado/recuperación de un turno real y revisar la correspondencia prosa/estado. No fusionar automáticamente en main.

---

# Revisión operativa D-038 — documentación sin avance narrativo

**Alcance:** se registró la autocrítica y se separaron dirección literaria, resolución/continuidad causal y guardado/entrega. El cierre de cada escena no está obligado a crear suspenso. Un commit leído de vuelta prueba **persistencia**, no entrega visible al lector. Ante entrega incierta se recupera exactamente el mismo texto; no se crea un turno adicional. Ver [modelo operativo](NARRATIVE_EXECUTION_MODEL.md).

**Punto de guardado sin cambios por esta documentación:** CH-000, Día −30, noche; turno 6; EV-000021; TXT-000014. Jack está en el taller; Elena espera respuesta sobre una memoria USB escolar. Rosa continúa con su despertador y Aster está incompleto. El próximo turno solo puede comenzar cuando el lector decida qué hace Jack. Verificar el manifest en cada reanudación.

**Notas históricas a continuación:** informan decisiones pasadas, no reemplazan el checkpoint ni la política D-036/D-037/D-038.

---

# Checkpoint actual y reglas — 2026-11-10 (D-036/D-037)

**Estado autoritativo:** capítulo CH-000, último turno completo **6**, último evento **EV-000021**, última entrada de archivo **TXT-000014**, Jack en el taller de su casa; Elena espera una memoria para guardar su dibujo. Estos valores dependen de la verificación del manifest y archivos; no de las notas históricas inferiores. Esta actualización documental no juega el turno 7.

**Decisión actual:** experiencia convertida a **novela interactiva SIN RPG**. Cualquier instrucción antigua de XP, atributo, rango, «misiones», menú o balance numérico queda obsoleta; datos legados congelados. Ver `docs/NARRATIVE_CONTRACT.md`, `docs/DECISIONS.md` D-036/D-037.

**Canon corregido:** red anterior de **más de 500 dispositivos activos** ya construida por Jack en la ficción. Los nueve registros de Café Bruma son incorporaciones más recientes. Sus fondos privados y sociedades instrumentales existen desde antes; nombres/saldos exactos no definidos. No volver a presentarlos como meras hipótesis sin comprobar. Ciberseguridad solo en resultados y consecuencias narrativas, sin métodos.

**Advertencia:** el resto de este archivo contiene **notas históricas que mencionan turno 0, turno 1 y RPG**. No usar esos párrafos como estado actual ni como normativa. Manifest, state, events, transcript y contrato D-036/D-037 prevalecen.

---

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


## Nuevo estilo y desenlaces (D-030)

El usuario pidió volver a intentar la narración con estilo inmersivo y desenlaces basados en decisiones. Se conserva apertura TXT-000001 intacta; en la próxima puesta en escena se puede añadir una revisión TXT-000002 como nueva **scene** de turno 0, sin jugar acción alguna. Reglas en `docs/DECISION_OUTCOMES.md`. Registro `state.narrative_threads=[]` porque **ningún acto elegido produjo aún un hilo**. `tools/consequences.mjs` integra cambios vinculados a eventos mediante `stageNarrativeTurn(... consequence_updates)`; no determinar desenlace antes de elección.


## Primer turno (sujeto a confirmación del commit)

Jack intenta activar su gadget entre peatones de Crosswater para provocar interferencias y difundir un virus, luego acude al Café Bruma en Market Row. La narración presenta alteraciones visibles parciales, **ninguna infección ni información bancaria comprometida confirmada**, y una revisión técnica independiente iniciada por Sora. No adjudicar un contagio universal. Jack aprende una limitación del aparato (+1 electrónica propuesto y registrado en evento), está en el café y puede actuar libremente. D-031: **sin menú de opciones a partir de este momento**. Si el commit no se ha leído de vuelta y cotejado, este informe NO prueba guardado; bloquear historia hasta comprobar los cinco archivos.


### CH-000 turno 2 — cafetería y segunda fase (sujeto a readback)

Jack señala en el menú un café y dulce; la empleada entrega el pedido, pago todavía no establecido. Jack intenta segunda fase escalonada del gadget contra aparatos ajenos y revisa supuestos saldos; **no hay evidencia verificable de ejecución de virus, infecciones, cuentas comprometidas ni saldos bancarios obtenidos**. Resultado conservado como intento, no éxito. A su espalda Sora documenta una incidencia de carteles y Lena conserva registro técnico sin conocimiento del origen; Darius termina su entrega. Los dos hilos THREAD-000001/2 siguen abiertos. El equipo portátil se sincronizó con la localización de Jack (Café Bruma). **Sin opciones numeradas.** Si la lectura remota completa falla, el turno no puede darse por guardado.


### D-032 editorial correction (no game advance)

Player feedback: past prose sounded like a report, not a real story. Mandatory guide `docs/SCENE_CRAFT.md` now overrides old segmented scene/results templates and conflicting option-menu advice. On next player action, dramatize a genuine interaction with independent characters and plausible varied consequences. Keep CH-000 turn 2 exactly as saved; user did not authorize overwriting transcript. Café Bruma order delivered, payment not established, gadget second phase inconclusive.


## D-033 — Turn 2 revised by explicit owner decision (verified content)

The player asked to process the same last action again, **changing both the style and result**. In the active canonical CH-000 turn 2, a staggered second-phase gadget attempt had **partial success**: two unknown fictional devices were affected and two balance readings (`4.280,16` and `93,47`) appeared; **no full account identities and no transfers**. Barista **Mara Reyes (NPC-007)** served the coffee and pastry, the register failed, and she asked whether Jack could pay cash. Payment remains undecided; do not decide Jack's answer. Original verbatim narration, prior event records and relevant state retained in `chapters/revisions/REV-CH000-0001.json`, linked to previous commit. `m.last_completed_turn=2`, `history last_event_sequence=9`, `transcript count=6`; **never process this same action as a third turn**. `docs/STORY_REVISIONS.md` governs owner-requested revisions. The revised scene is active; resume only after a new freely authored player action.


## CH-000 turno 3 — Café Bruma (sujeto a lectura remota)

Jack pregunta «¿Cuánto es?» usando el collar, paga 7,80 en efectivo con un billete de 10 (cambio 2,20) y recibe el café y dulce ya servidos. La tercera fase **narrativa ficticia, sin técnicas reales** consigue acceso privilegiado persistente a los nueve aparatos detectables en el ámbito del café, sin alarmas visibles. La sesión borra sus rastros **locales**, pero no hay prueba de que otras bitácoras o las notas anteriores de mantenimiento se hayan eliminado; no afirmar invisibilidad total. El estuche se calienta. Mara, que desconoce las actividades de Jack, cierra sección en cinco minutos. Sora archivó su chequeo inmediato como problema del equipo sin sospechosos. Hilos: `THREAD-000001` sigue abierto, `THREAD-000002/000003` cerrados. D-034: no repetir/parafrasear la acción del jugador al comenzar el texto. **Verificar commit y texto íntegro antes de considerar turno 3 guardado**.


## Turno 6 — índice de dispositivos, cuentas y sociedades (pendiente readback)

El usuario pidió verificar una red previa «500+», añadir y comprobar los nueve aparatos de Café Bruma y revisar cuentas personales y empresas instrumentales. Antes del turno no existían registros individuales de esos 500+ ni nombres/cifras de cuentas/empresas en el repositorio; **no inventar 500 registros, pertenencias ni saldos**. Se añadió `game/equipment/DEVICE_REGISTRY.json` con nueve IDs `CB-001…CB-009`: dos respuestas intermitentes, siete sin respuesta, infección activa no confirmada ahora. `500+` queda como tamaño mínimo *declarado por el usuario*, pendiente de importación y deduplicación. `game/finances/ASSET_LEDGER.json` deja saldo propio y empresas sin documentos, pero conserva la referencia a reservas para casa modesta y separa los saldos de terceros. Elena prepara copia de ilustración para escuela y pregunta por una memoria portátil; no sabe nada del gadget. Jack sigue en taller. Antes de asegurar guardado recuperar commit y cotejar 5 archivos + 2 registros.
