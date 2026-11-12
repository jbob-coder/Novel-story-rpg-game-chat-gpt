# GUARDADO BLOQUEANTE — regla D-028

**No se puede avanzar en la historia mientras el guardado del turno anterior o la escena previa esté incompleto o no se haya verificado.** Las conversaciones de mantenimiento NO son turnos narrativos.

## Siete etapas observables y porcentaje exacto
| Etapa | Progreso añadido | Total acumulado | Evidencia mínima |
| --- | ---: | ---: | --- |
| 1. Leer checkpoint remoto y HEAD | 10% | 10% | Archivos y SHA recuperados |
| 2. Verificar coherencia previa | 15% | 25% | Validación de estado, eventos y transcripción |
| 3. Preparar turno y texto completo | 20% | 45% | Mensaje íntegro del jugador y narrador, cambios y eventos |
| 4. Validar la nueva copia completa | 15% | 60% | Reglas, referencias, XP, causalidad y texto exacto |
| 5. Crear commit Git con los cinco archivos | 15% | 75% | SHA de commit confirmado |
| 6. Actualizar rama con comprobación de HEAD | 10% | 85% | Rama remota apunta al commit esperado |
| 7. Leer de vuelta y comparar los cinco archivos | 15% | **100%** | Contenido literal idéntico y manifest coherente |

**El porcentaje representa etapas confirmadas, no tiempo restante, velocidad de carga o trabajo en segundo plano.** No se pueden saltar etapas ni declarar 100% por haber creado un commit. Si falla algo, mostrar `🚩 GUARDADO BLOQUEADO — NN% verificado`, etapa pendiente y causa observada. Detener la narración sin simular otra escena, turno, reacción NPC o XP.

### Si se acaba la respuesta
Usar la respuesta disponible para dejar el estado técnico más fiel posible; el turno del asistente puede terminar solamente con el estado del guardado. **No continúa en segundo plano.** Al siguiente mensaje del jugador, `CONTINUAR GUARDADO`, volver a leer GitHub y revalidar antes de retomar. No interpretar ese texto como acción de Jack. Si se perdió el texto completo del turno anterior, pedirlo de nuevo: no reconstruir citas literales por imaginación.

### Fallo, parcialidad o conflicto
- Un commit preparado pero sin actualizar la rama **no significa guardado**.
- Un ref actualizado pero con lectura incompleta no significa guardado hasta confirmar los cinco archivos.
- No forzar pushes ni reemplazar trabajo de otros agentes; si cambia el HEAD, detenerse y reconciliar.
- Si la plataforma no permite acceso al repositorio, informar el bloqueo y el último porcentaje confirmado. No prometer actividad posterior sin nueva interacción.
- La partida se recupera del último checkpoint coherente, y el intento pendiente no se reproduce como un segundo turno.
- Solo mostrar el próximo resultado narrativo **después de guardar/verificar** su texto íntegro; si no se logra, reservar el resultado y mostrar el mensaje de bloqueo.
- El archivo `game/SAVE_MANIFEST.json` es el marcador de estado actual; los porcentajes en respuesta son estados transitorios basados en evidencia, NO se escriben como si fueran éxito.

## Implementación de apoyo
`tools/save_gate.mjs` ofrece seguimiento de etapas, bloqueo, reanudación condicionada a HEAD y comparación de cinco archivos. Es una **librería de control**, no un agente permanente que pueda capturar la UI o escribir GitHub sin herramientas. El narrador debe aplicar este contrato y usar la API GitHub para la transacción; una validación local no sustituye una lectura remota.

## Integridad y privacidad
El juego usa un repositorio público: guardar únicamente contenido ficticio destinado a publicación, no datos reales privados o credenciales. La narración íntegra se conserva en `chapters/CH-NNN.transcript.json`, su resumen causal en events, prosa en markdown y estado del mundo en JSON.


## Enforcement in the narrative engine

The narrative engine and opening-scene archiver **require a save guard argument**. They call `assertMayAdvance` before staging. A saved attempt with incomplete stages or a blocked status stops execution. For a clean new session with no pending attempts, `previous_attempt: null` is accepted **only after** a fresh GitHub checkpoint validation; the calling assistant must establish this fact rather than using `null` to bypass a failed save. The guard supplies the observed branch HEAD from GitHub. This guard cannot control arbitrary text typed outside the code: the assistant must also obey the narrative hard-stop protocol.


## D-042 — transacción y recuperación verificable

La librería `tools/save_transaction.mjs` conecta mediante un adaptador inyectado la puerta D-028, el motor de turnos y las cinco lecturas remotas. El adaptador debe proporcionar `readHead`, `readFiles`, `createCommit` (un solo árbol con los cinco archivos) y `updateHead` (CAS, sin forzar). En ningún caso interpretar `status=blocked` como un guardado completo.

`recoverFiveFileSave` solo confirma o enlaza **el commit conocido con el texto exacto almacenado**. Si falta el SHA/texto, cambió el HEAD o no coinciden bytes, se detiene. No crea otra resolución ni reescribe turnos. El intento devuelto `blocked` necesita conservación exterior; la librería no instala almacenamiento persistente ni ejecuta tareas en segundo plano. La prueba de `tests/save_transaction.test.mjs` utiliza una simulación, no reemplaza un commit real.
