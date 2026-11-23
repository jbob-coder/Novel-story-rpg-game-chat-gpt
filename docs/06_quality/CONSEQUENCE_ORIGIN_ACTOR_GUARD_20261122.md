# Corrección mínima: propietario del hilo y evento causal de origen

**Fecha:** 2026-11-22. **Modo:** novela interactiva en ChatGPT, no Godot, no motor externo. Corrección de integridad sobre `work/chat-narrative-foundation` @ `fe687d8e833b30d40880a86fa20b242272976b6e` que incluye PR #168 y #169. Este registro no autoriza abrir nuevos mapas, mecánicas ni turnos.

## Defecto identificado

`tools/consequences.mjs` exigía que la identidad del propietario existiera y que el evento de origen estuviera registrado, pero no comprobaba que ese **personaje participara o estuviera registrado entre quienes lo conocen**. Un registro sintético podía atribuir a `NPC-001` una pregunta causal nacida exclusivamente de un evento del jugador y superar esa validación. Un tercero que afecta una pregunta existente es legítimo; **atribuir falsamente el origen del hilo sin participación ni observación registrada** no lo es.

## Cambios delimitados

- La verificación de un historial ya guardado exige que `owner_actor_id` aparezca en `actor_ids` o `known_to` del evento `origin_event_id`. Si no existe ese dato causal, se detiene la validación.
- La creación de un hilo exige la misma relación entre el propietario y el evento actual: participación o registro en `known_to`. `known_to` acredita solo un vínculo de observación; no garantiza que el actor conozca cada detalle del suceso. La proximidad física y los rumores sin registro tampoco prueban ese vínculo.
- Los desarrollos y resoluciones posteriores **siguen permitiendo otros actores**, siempre que exista el EV causal correspondiente y se conserve el orden estricto y el cierre terminal fijados por PR #166.
- Cinco nuevas pruebas: origen atribuido a otro NPC rechazado, checkpoint falsificado rechazado, NPC legítimo con desarrollos de otro actor aceptado, origen sin `actor_ids` ni `known_to` rechazado, y origen válido por observación registrada sin asignar falsamente al testigo la autoría del evento. Se ajusta la fixture histórica para usar el campo de evento que exige el esquema real.

## Compatibilidad y límites

Los cuatro hilos narrativos guardados en CH-000 fueron comprobados contra sus eventos históricos: cada `owner_actor_id` participa en su evento de origen; la corrección no les cambia identidad ni memoria. Se conserva la libertad narrativa de los NPC y no se exige que cada evento posterior sea del mismo propietario. No modifica `game/STATE.json`, `game/SAVE_MANIFEST.json`, capítulos, journal, mapa ni relato.

**Verificar antes de integración:** Node completo, Python, validador canónico e inventario en el SHA exacto del cambio. Si se aprueba, avanzar solo la rama autorizada con actualización protegida y copia de recuperación; no fusionar a main. Ni las pruebas sintéticas ni el resultado de esta revisión son turnos de Jack.
