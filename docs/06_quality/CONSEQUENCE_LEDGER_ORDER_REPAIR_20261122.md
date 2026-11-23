# Corrección verificable — orden de consecuencias narrativas (22-11-2026)

**Alcance limitado:** reparar un defecto de integridad del motor narrativo existente, no agregar otra mecánica ni motor distinto de ChatGPT. Rama independiente apilada sobre `work/chat-narrative-foundation` @ `d978ce5df8b073c32f55bf06f354f6b43879026d`. No fusionar sin revisar la cabeza actual y CI.

## Error reproducible

`tools/consequences.mjs` antes validaba una historia de consecuencias únicamente con `event.turn >= lastTurn`. Si dos eventos aparecían en el mismo turno, aceptaba un registro invertido, con el evento posterior apareciendo antes del anterior. La verificación tampoco rechazaba dos referencias al mismo evento con operaciones diferentes, ni un historial adulterado que añadiera una etapa de desarrollo después del evento que ya resolvió la cuestión. Es un fallo de consistencia, no evidencia de que el checkpoint real esté corrompido.

## Reparación mínima

- `verifyConsequences` contrasta ahora cada referencia de historia con la **posición del evento en el archivo global de eventos** (incluidas transiciones entre capítulos), en vez de comparar únicamente el número de turno. La siguiente referencia debe aparecer estrictamente después de la anterior; no acepta dos operaciones basadas en un mismo evento del mismo hilo.
- La resolución tiene que ser el último registro del hilo. Una vez resuelta la pregunta, cualquier etapa de desarrollo posterior es inválida.
- `stageConsequences` bloquea que un mismo evento sea usado de nuevo dentro del mismo hilo aun con otro tipo de operación.
- Se conserva intacta la flexibilidad de autor: los eventos pueden ser del jugador o de NPC, tener alcance `world`, privado o observable y continuar mediante eventos independientes. No se impone lista de acciones, horario fijo ni conocimiento omnisciente.

## Protección del canon y de la experiencia

Los cuatro hilos del checkpoint autorizado de CH-000 ya tienen EV en orden correcto. La modificación **no toca su historia, actores, lugares, conocimientos, acciones, calendario, journal, transcripciones ni los cinco archivos del guardado**. Ninguna PR de mapas, noticia futura o simulación opcional se fusiona.

Cinco regresiones nuevas cubren dos eventos en un mismo turno en orden correcto/invertido, archivo histórico manipulado, doble uso del evento, desarrollo posterior a resolución y un hilo de NPC de alcance `world`. La suite existente se mantiene para garantizar compatibilidad.

**Evidencia de cierre pendiente en origen:** ejecutar Node completo, Python, validador del checkpoint e inventario en un SHA de rama exacto. No considerar un test sintético como un turno nuevo ni una ruta física aprobada.
