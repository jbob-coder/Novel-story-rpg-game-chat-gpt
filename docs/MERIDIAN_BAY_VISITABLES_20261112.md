# Meridian Bay — incorporación causal de lugares públicos visitables (D-060)
Fecha de trabajo: 2026-11-12. Rama independiente `work/meridian-bay-visitables-20261112`.
Punto de partida inspeccionado: `59bf58cf2668ce284e68f539217979902ce062b4` (PR #15).
**Este desarrollo no es una acción de Jack y no cambia la partida guardada.**

## Decisión y problema real
Meridian Bay ya tiene ocho ubicaciones `LOC-*` y una ciudad `CITY-*` en el estado canónico, además de 18 **oportunidades narrativas** que no son establecimientos. Era incorrecto presentar la escuela de Elena, la vivienda del vecino o una tienda de suministros todavía no descrita como lugares ya visitables. A su vez, la expansión necesita un camino real, reversible y verificable para establecer nuevos lugares cuando **un turno del jugador los observe de verdad**.

Se diseñó una primera vía conservadora: una **ubicación pública observada y accesible** puede ser establecida por la escena auténtica de Jack; las áreas privadas o con acceso sin confirmar permanecen propuestas. La expansión sigue anclada a los barrios ya registrados; no puede crear un atajo arbitrario ni horarios exactos.

## Código y contrato
`tools/meridian_bay_locations.mjs`:
- `applyReviewedPlaceDiscovery({state,event,discoveries,narrationMessages})` solo acepta un evento `player_action` del protagonista y hasta **dos** lugares en ese turno, respaldados por una de las 18 oportunidades existentes en su **ancla correcta**. No crea actores, propietarios, horarios ni inventarios.
- La declaración del narrador exige `reviewed:true`, `public_access_confirmed:true`, `scene_quote` y `access_quote` literales y distintos, ambos incluidos en la narración completa del mismo turno. Si falta alguna precondición, el borrador se rechaza antes de guardar.
- La ubicación nueva incluye `id` `LOC-...`, nombre, tipo, descripción, `parent_id` barrio original, `connected_ids:[parent_id]`, acceso `public_confirmed`, oportunidad origen, `established_event_id` y **opening_hours:null / travel_minutes:null**. El motor agrega un enlace de retorno **solo** al ancla. No permite rutas directas a distritos ajenos.
- El evento del jugador contiene dos efectos: `world_location` (sitio nuevo) y `world_location_link` (barrio enlazado); luego puede producirse `location_id` para que Jack lo visite por una ruta coherente. La escena puede también descubrir el lugar sin entrar.
- `verifyReviewedPlaceHistory` comprueba que todo `LOC-*` nuevo esté asociado a su evento de introducción, su ancla, su conexión y el texto **literalmente archivado** de ese turno; detecta elementos y enlaces manipulados, sin reconstruir falsos sucesos antiguos.
- `inspectSceneEstablishedPlaces` devuelve únicamente ubicaciones que ya se registraron por evento, su ruta guardada y acceso; no confunde acceso a un edificio con que esté abierto a una hora concreta.

Cambios mínimos en `tools/turn_engine.mjs`: establecer el lugar antes de los cambios de desplazamiento del jugador, validar la procedencia durante `verifyNarrativeSnapshot`. En `tools/state_changes.mjs`: comparar los nuevos `world_location` y `world_location_link` con el historial de cambios; proteger sus precondiciones.

## Escenarios sintéticos, NO canónicos
**Una escena de QA inventada únicamente para pruebas** permite a Jack ver una pequeña tienda pública de suministros en Market Row y confirmar que el público puede entrar. El nuevo lugar pasa a una copia aislada del estado, se conecta exclusivamente a Market Row y puede recorrerse por el trayecto taller → hogar → Railgarden → Market Row → tienda. No se fija duración exacta, tarifa, disponibilidad de piezas o vendedor. Una segunda escena sintética comprueba que el lugar continúa existiendo sin recrearlo ni cambiar su origen.

Otro ensayo agrega hasta dos puntos públicos observados en el mismo turno, sin sobrescribir las conexiones previas. Otros tests comprueban ubicaciones inventadas, observaciones ausentes, acceso privado, atajos, duplicaciones, adulteración de transcript y el último turno canónico intacto.

## Límites explícitos
1. El hecho de que el test construya una escena no quiere decir que esa escena haya ocurrido; no se agrega ninguno de estos lugares al `game/STATE.json` auténtico.
2. La comprobación de literalidad reduce contradicciones, pero **no prueba que una narración sea veraz**. La revisión editorial debe corroborar que la acción realmente fue solicitada y que los efectos están justificados.
3. Solo el **evento del jugador** puede introducir lugares con esta API. Una expansión offscreen por NPC requiere una futura vía con actor fuente, conocimiento separado y pruebas de acceso; no debe hacerse pasar por acción de Jack.
4. Se exige entrada pública explícita. La escuela concreta, el hogar del vecino, oficinas privadas y comercios de acceso restringido seguirán sin incorporarse a este flujo hasta disponer de una política de permiso y visibilidad.
5. La existencia de un local no equivale a verificar qué vende, un horario, quién trabaja, si está abierto hoy, cuánto se tarda en llegar o si se completó una transacción.
6. Las ubicaciones incorporadas a un turno real deberán quedar en la **misma transacción de cinco archivos con journal y readback**, todavía pendiente de integración remota autenticada. No basta un draft local.
7. No se deben fusionar PRs dependientes sin revisión; D-060 depende de D-054→D-055→D-056→D-057→D-058→D-059.

## Próximos bloques
1. Reforzar el esquema de instalaciones públicas, permisos y vínculos de servicio sin hacer inferencias de horarios.
2. Ensayar multitudes y actividad urbana por intervalos solo con eventos y agenda revisados, sin ejecución desatendida.
3. Revisión de compatibilidad entre ramas, diarios de guardado y recuperación por GitHub, antes de activar los sistemas en la rama narrativa oficial.

## QA formal
Usar `node --test tests/*.test.mjs`, `python -m unittest discover -s tests -p 'test_*.py' -v` y `python tools/validate_state.py`. Registrar resultados de GitHub Actions **cuando realmente ocurran**, además de los SHA de los cinco archivos del guardado antes de afirmar preservación. La estimación porcentual del plan global será aproximada.
