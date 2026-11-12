## D-043 — GitHub real, prueba aislada, y adaptador sin secretos (2026-11-10)

**Crítica del enfoque previo:** hasta D-042 los tests solo usaban un Git simulado. No demostraban que GitHub conservaría un commit de cinco archivos después de interrumpirse el proceso, ni existía adaptador REST reutilizable. Tampoco el resultado de una suite técnica mide la calidad literaria de la escena.

**Prueba REMOTA de recuperación completada:** rama **exclusiva de QA** `qa/story-save-recovery-d043-20261110`, creada desde `96b9d73b7945686cac4a9090d0a759d8ecd3d3d2`. Se preparó un turno **sintético/no canónico** en cinco archivos con commit `d637304e2665828e5c53cb76fd40e0e4a6ade7ec`; se detuvo el procedimiento después de crear el commit y **antes de mover la rama**, se verificaron remotamente sus cinco archivos por SHA, se reanudó en una operación diferente, se aplicó actualización no forzada con HEAD esperado y se leyó literalmente de nuevo la rama. **No se creó un segundo commit** ni se afectó la rama narrativa. Ese turno 7 de QA **no es una acción del propietario**, jamás usarlo como checkpoint de juego.

**Implementación:** `tools/github_save_adapter.mjs` aporta las operaciones reales `readHead`, `readFiles`, `createCommit` y `updateHead` por API GitHub REST para `tools/save_transaction.mjs`, con credenciales externas y cinco blobs en un solo árbol. `tests/github_save_adapter.test.mjs` prueba lectura, escritura, errores HTTP, colisiones y recuperación con transporte HTTP simulado (sin usar ni exponer un token real). El adaptador **no se ejecutó directamente con token real** en la prueba remota: se verificaron las mismas primitivas Git mediante el conector autorizado. GitHub REST dispone de *read-then-update* y *non-force fast-forward*, pero **no de CAS atómico con expected SHA**. No prometer bloqueo perfecto ante carreras arbitrarias.

**Evidencia de CI:** [GitHub Actions #42912600548](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/42912600548) para `ca414ffe56d8faff9dae739046d3a5d4bb525c8e`: **75/75 JavaScript**, **20/20 Python** y `python tools/validate_state.py` PASS. El primer CI detectó identificadores falsos de longitud inválida y ruta `../repo` no rechazada; corregidos antes de aprobar. La continuidad narrativa todavía requiere revisión editorial y el próximo turno auténtico del lector no se ha jugado.

**Canon protegido:** rama `work/chat-narrative-foundation` y PR #2 conservan **CH-000, Día −30, turno 6, EV-000021 y TXT-000014**. Los cinco blobs del checkpoint no se tocaron. Jack continúa en el taller con Elena esperando una respuesta sobre una USB. Mantener la PR en borrador; no fusionar ni reutilizar `qa/*` como fuente narrativa.


---

## D-041 — resultados ejecutados en GitHub Actions

- Commit de código corregido: `fca32dcaf88bd28f03cef7574e97257db80c3243`, rama `work/chat-narrative-foundation`.
- [Ejecución 42903181369](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/42903181369): Node `57 passed / 0 failed`, Python `Ran 20 tests ... OK`, `validate_state.py` informó PASS. Todos los pasos del job finalizaron con éxito.
- Regresión incorporada: un segundo cambio inválido en el mismo lote no debe dejar efectos parciales en el estado ni en el evento. Un lote válido registra ubicación y objetos portados con sus condiciones anteriores.
- Se corrigió un test obsoleto que suponía que un nuevo texto de escena sustituía `TXT-000001`; debe añadirse al final sin tocar ninguna de las 14 entradas previas.
- Estos resultados validan **pruebas sintéticas y checkpoint actual**, no un turno 7 real guardado y recuperado. La lectura editorial de prosa contra efectos tipados continúa siendo una puerta de calidad independiente.

# Interactive novel continuity and narrative acceptance scenarios (D-036)

These are planned end-to-end tests for real play. Passing the structural validator alone is **not** sufficient.

1. **Cold start after context loss.** In a fresh chat, read `AGENTS.md`, manifest, state, current chapter and events. Recover the current manifest chapter/turn (at D-036: CH-000, turn 6) and pending scene without relying on a chat summary.
2. **Consecutive player turns.** Jack performs an action; log intent, event, qualitative outcome, chapter prose and manifest. Confirm no RPG XP/ranks/levels are newly awarded and that a later session recovers consequences.
3. **Learning from failure.** An instructive failure changes Jack's knowledge or relationships when justified. No numerical XP, ranks or trivial progress farming.
4. **Offscreen NPC agency.** While the player ignores a faction, record a plausible independent NPC decision and later effects without assuming everyone knows it.
5. **Actor knowledge isolation.** A private conversation cannot influence a distant NPC until a documented communication, observation or inference route exists.
6. **Time and shockwave.** Before Day 0 no shockwave powers or wave-created flora/fauna anomalies. On Day 0 the event occurs once; delayed or absent awakening remains possible.
7. **Partial write recovery.** Simulate event-log update without state/manifest update. Validator must flag the mismatch; recover prior coherent checkpoint without duplicate turn or forced rewrite of another contributor's files.
8. **State drift.** A changed manifest, missing chapter or duplicate event ID is detected. Do not narrate from an inconsistent checkpoint.
9. **Player agency.** Free-form actions beyond suggested choices remain accepted. No predetermined villain/hero identity or mandatory awakening.
10. **Privacy and public repo.** Fictional records only; no unapproved real-world private data, credentials or account details.

## Known unverified
By the D-036 checkpoint six story turns and event EV-000021 are recorded. The revised novel-only flow, NPC continuity across future chapters, and interrupted writes still require full end-to-end tests. Prior RPG balancing scenarios are retired. Record actual test outputs and commits in the PR or status document, never label these scenarios passed in advance.


## Guardado bloqueante y organización (D-028/D-029)

11. **Falla remota al 10%:** tras recuperar el HEAD, falla GitHub. El asistente debe informar `🚩 GUARDADO BLOQUEADO — 10% verificado`, no narrar más y esperar `CONTINUAR GUARDADO`.
12. **Commit antes de lectura 100%:** crear un commit y mover la rama no basta. Con cinco archivos sin lectura idéntica, el progreso máximo confirmado es 85% y la historia sigue bloqueada.
13. **Contenido íntegro:** alteración de un carácter en `CH-000.transcript.json` debe impedir desbloquear; resúmenes/eventos no reemplazan texto literal.
14. **Cambio de HEAD:** al reanudar, si otro agente avanzó la rama, detenerse y reconciliar; no hacer force push ni sobreescribir.
15. **Respuesta agotada:** el mensaje puede consumir la respuesta completa para dar estado/porcentaje. Ningún trabajo continúa en segundo plano; el siguiente input reanuda la verificación, no un nuevo turno.
16. **Índices sin enlaces rotos:** todos los 18 índices y sus referencias deben existir. El inventario debe conservar una sola ubicación canónica por recurso.

**Ejecución:** 15 pruebas dinámicas del flujo de bloqueo y narración aprobaron en el entorno JavaScript de esta sesión; 18 índices fueron leídos desde GitHub sin enlaces rotos. Los tests de Python y Node como procesos CLI aún no han sido ejecutados en checkout.

17. **No RPG regression:** ensure the new turn engine rejects any `awards` for player or NPC; legacy progression numbers remain unchanged.
18. **Canon continuity:** ensure the 500+ prior active fictional devices and nine new Café Bruma records are not repeatedly described as mere unverified proposals. No fictitious individual IDs or exact bank balances invented.
19. **Cyber narration:** only depict fictional high-level events and their human consequences, not reproducible compromise, persistence or concealment steps.


## D-040 — aceptación obligatoria antes de calificar el motor como estable

20. **Cambio material del jugador:** mover a Jack del taller al apartamento actualiza su posición y todos los objetos que lleva, y registra cada cambio en EV-...; una escena quieta no altera lugares por defecto.
21. **Transferencia de inventario:** si el lector decide entregar un objeto a Elena, registrar salida de Jack y recepción de Elena en eventos distintos del mismo turno, sin duplicar identificadores ni asumir que Jack tiene una memoria USB antes de verificarla en la ficción.
22. **Relaciones y condiciones:** cambios positivos, negativos o neutros quedan justificados por acontecimientos; se detecta una discordancia entre el valor guardado y el evento.
23. **Conocimiento aislado:** Elena no adquiere información técnica privada de Jack solo porque el narrador la conoce.
24. **Precondiciones:** un lugar anterior incorrecto, ruta imposible, objeto duplicado, campo RPG o modificación sin permiso del actor produce error antes de guardar.
25. **Continuidad entre varios cambios:** actualizaciones repetidas del mismo campo siguen el valor anterior inmediato, incluso al transferir objetos.
26. **Regresión histórica:** los seis turnos originales, la red anterior de más de 500 dispositivos y los nueve de Café Bruma no cambian durante una revisión documental. No se reescribe su transcripción.
27. **Ensayo real aún pendiente:** ejecutar suites Node y Python en checkout completo; preparar una acción libre real del lector, comparar la narración con efectos tipados, realizar commit atómico de cinco archivos y recuperar todo desde otra sesión. Solo entonces calificar la recuperación de un turno 7 como probada.

## D-042 — ensayo integral ejecutado, no un turno de la novela

**Evidencia:** [GitHub Actions run #42905805692](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/42905805692), commit `f6a8b3ab8aa5526d31cfe78ced74a11187c141ce`. **67 pruebas JS aprobadas, 20 Python aprobadas, validador estructural PASS**. Se agregaron **10 pruebas** con un remoto Git en memoria, sin escribir la partida ni ejecutar acciones de Jack.

Cobertura: confirmación literal de cinco archivos, commit antes de actualizar ref, interrupción tras actualizar ref, recuperación desde el mismo commit sin volver a generar diálogo, CAS rechazado por carrera, datos corruptos, SHA ausente, ausencia de archivo fuente, recuperación repetida idempotente y preservación del turno 6.

**No probado:** adaptador GitHub real con escritura atómica y readback en una acción auténtica, durabilidad externa del diario del intento bloqueado, y equivalencia literaria de escenas futuras. Distinguir estas ausencias de fallos de la suite. El sistema no sustituye la revisión editorial ni autoriza jugar el turno 7 sin entrada del lector.

