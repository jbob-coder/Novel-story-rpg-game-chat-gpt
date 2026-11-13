# Meridian Bay — recorrido inicial de lectura (propuesta técnica)

**Fecha:** 2026-11-12. **Rama:** `work/meridian-bay-walk-slice-20261112`, hija de `work/meridian-bay-atlas-20261112`. Esta entrega NO reproduce un turno ni establece un mapa nuevo. No se tocó ninguna rama del otro agente.

## Alcance implementado

`tools/meridian_bay_walk_slice.mjs` ofrece `previewMeridianBayWalk({state,destinationId})` como planificador **solo de lectura**, importando el grafo de rutas ya validado por `living_world_routines.mjs`. El origen proviene de `state.player.location_id`; no se puede teletransportar a otro punto ni usar `CITY-MERIDIAN-BAY` como atajo. Del checkpoint auténtico (Jack en el taller), propone:

1. Taller Wilson → hogar Wilson → Railgarden (salida del edificio/barrio).
2. Railgarden → Market Row (recorrido urbano).
3. Market Row → Crosswater Transit Plaza (punto de referencia central).

**Actividades opcionales y no completadas:** observar el barrio Railgarden; recorrer Market Row; consultar paneles públicos de Crosswater. Son disparadores de escenas, no eventos ya ocurridos. Ningún comercio se declara abierto y ningún interior se mapea.

**Dos NPCs candidatos, no encuentros:** Darius Flint en Market Row (NPC-003) y Sora Venn en Crosswater Plaza (NPC-002). Solo se muestran sus ubicaciones del checkpoint; la presencia cuando Jack llegue y cualquier reacción se tendrán que resolver con observación del turno correspondiente y pruebas causales. El campo `visibility: narrator_private` no se copia al capítulo dirigido al lector.

## Tiempo y límites

Para segmentos conocidos, estimaciones blandas: taller–hogar 1–3 min; hogar–Railgarden 2–6; Railgarden–Market Row 10–20; Market Row–plaza 5–15. Recorrido total aproximado **18–44 minutos sin paradas ni imprevistos**, NO duración establecida ni tiempo transcurrido. En trayectos nuevos la estimación es `null` y no se inventa. Sin calendario, horas de apertura, desplazamientos de NPC, entradas a edificios, viajes exteriores ni trama.

## Cómo ejecutar por turnos

1. Recuperar manifiesto, estado y último evento de `work/chat-narrative-foundation`. Turno real conservado: 9, Día −29 mañana.
2. Tras una **acción libre explícita del lector**, llamar al planificador solo para orientar rutas y posibles escenas, no para mover automáticamente a Jack.
3. Narrar el tramo/actividad que realmente se complete, resolver únicamente consecuencias constatables y rutinas de NPC revisadas; tiempo aproximado solo cuando el desplazamiento ocurre.
4. Guardar los cinco archivos canónicos en una sola transacción con registro remoto obligatorio, releer y validar. Sin esa puerta, no afirmar progreso narrativo ni continuar otro turno.
5. No fusionar esta propuesta directamente con `main` ni con las ramas de rutinas/servicios paralelos sin revisar dependencias y preservar sus cambios.

## Verificación

`tests/meridian_bay_walk_slice.test.mjs` contiene diez pruebas de grafo, actividades, dos NPC, estimación aproximada, alternativa de ruta, entrada inválida, inmovilidad y preservación literal del estado. Ejecutar `node --test tests/*.test.mjs`, `python -m unittest discover -s tests -p 'test_*.py' -v` y `python tools/validate_state.py` en integración. La inspección del archivo no sustituye la ejecución de estas pruebas.
