# Meridian Bay — Railgarden y Market Row preconstruidos antes de su visita
**Fecha:** 2026-11-12. **Estado:** implementación en rama aislada, bajo revisión; **NO es un turno ni un cambio aplicado al checkpoint canónico**.
**Fuentes:** `game/STARTING_LOCATIONS.md`, `game/STARTING_CAST.md`, `game/STATE.json`, `game/MERIDIAN_BAY_PREBUILT.json`, `tools/meridian_bay_city.mjs`, atlas de PR #20 y reglas de continuidad de la novela.

## Decisión que corrige el modelo anterior

**El mundo existe antes que la visita de Jack.** La regla anterior D-060 establecía erróneamente que un sitio se creaba como `LOC-*` únicamente al narrar su descubrimiento. El propietario pidió corregir el código, aun si implicaba sustituir ese mecanismo. En esta rama:

1. **Diseño previo:** el archivo `game/MERIDIAN_BAY_PREBUILT.json` define lugares permanentes de la ciudad, con identificadores y accesos coherentes. El narrador puede consultar esos lugares **sin** un turno nuevo, mediante `inspectPrebuiltMeridianBay({state})`. `inspectMeridianBay` también los distingue de propuestas sin aprobar aun si el checkpoint viejo no tiene sus filas materializadas.
2. **Inicio de escena:** `prepareMeridianBayWorld({state})` incorpora de modo determinista y reversible las fichas aprobadas al grafo de trabajo **antes** de resolver movimiento, observaciones y consecuencias. No mueve al jugador, no hace pasar tiempo, no genera eventos ni cambia el checkpoint original en la consulta.
3. **Descubrimiento:** `turn.location_discoveries` no crea edificios ni calles. Solo añade conocimiento del personaje cuando una observación concreta se puede atribuir literalmente a la escena narrada. No convierte automáticamente al jugador en conocedor de todos los lugares.
4. **Acceso y tránsito:** un acceso público confirmado significa que existe un acceso exterior pensado para usuarios, **no** que el negocio esté abierto, que el empleado esté presente o que haya inventario disponible. Los recorridos requieren conectividad explícita; no se crean atajos a partir de proximidad visual. Interiores, horarios, distancias precisas y servicios concretos quedan abiertos hasta que sean necesarios y sustentados.
5. **Persistencia:** las fichas originales sobreviven como fuente de diseño del mundo. Solo una acción libre auténtica del lector puede producir un turno 10, cuyas cinco piezas requerirán guardado atómico con journal duradero y lectura remota. La integración de esta rama en la rama narrativa sigue pendiente.

## Lugares que ya tienen diseño previo en esta rama

| Distrito confirmado | Lugar preconstruido | Función del entorno | Qué NO implica |
| --- | --- | --- | --- |
| Railgarden | **Abarrotes de Railgarden** | Suministros diarios y tránsito vecinal | Que esté abierto, quién atiende ni qué productos se compran |
| Railgarden | **Centro de atención de Railgarden** | Atención sanitaria de proximidad | Personal médico presente o una consulta realizada |
| Market Row | **Local de reparación y componentes de Noah Vale** | Negocio de Noah, cuya actividad comercial ya era conocida | Que Noah está allí ahora o que conoce el proyecto privado de Jack |
| Market Row | **Punto de recepción de Market Row** | Entregas, recepción y retiro de paquetes | Que este sea el destinatario actual de Darius |
| Market Row | **Pasaje creativo de Market Row** | Expresión y comercio cultural | Que Elena haya asistido o que haya un evento en marcha |
| Market Row | **Galería de servicios de Market Row** | Acceso peatonal a comercios y pequeñas oficinas | Empresas, empleados, contratos o servicios ya realizados |

**Total:** seis ubicaciones nuevas predefinidas (dos en Railgarden y cuatro en Market Row); se mantienen las ocho ubicaciones `LOC-*` originales y la ciudad `CITY-*`. Así, el grafo preparado tendrá **14 destinos `LOC-*` + 1 contenedor urbano**, **14 enlaces bidireccionales** (ocho previos y seis accesos de barrio). No hay calles secundarias, cruces directos entre locales ni teletransporte inventados.

Las fichas originales `MB-DES-*` de la propuesta cartográfica PR #20 eran **13 referencias**, no 13 comercios. Su clasificación 9+2+1+1 permanece válida como antecedente: esta corrección incorpora **algunas** ubicaciones antes de cualquier visita. La correspondencia con el atlas es por distrito y por `origin_opportunity_id`: por ejemplo, `BAY-RAIL-FOOD` identifica abarrotes y `BAY-MARKET-PARTS` el negocio de Noah. No copiar el JSON cartográfico antiguo sobre el catálogo activo, ni asumir que las demás propuestas ya son accesibles.

## Orientación funcional del tejido urbano

- **Railgarden** enlaza con Market Row y el hogar Wilson. Sus dos accesos nuevos están subordinados al barrio, **no** son salidas directas desde el taller. La escuela de Elena continúa sin ubicación ni llegada confirmada; Rosa tampoco recibe un vecino con dirección inventada.
- **Market Row** enlaza con Railgarden, Crosswater Plaza, Harbor Walk y Café Bruma. Los cuatro locales nuevos enlazan solamente con **Market Row**. El negocio de Noah no tiene conexión privada automática con el hogar de Jack ni con Café Bruma.
- **Crosswater** y **Harbor Walk** conservan los enlaces originales, el terminal y sus funciones; esta fase no añade instalaciones industriales transitables ni permite viajar sin ruta.

## Comportamiento de personajes sin fabricar eventos

- **Noah:** se ha predefinido su local, no una visita o un turno comercial. Su objetivo de mantener ventas y reputación sigue vigente, sin disponibilidad asumida.
- **Elena:** la ciudad puede ofrecer cultura y suministros, pero su trayecto escolar sigue pendiente de confirmar; no se fuerza un encuentro.
- **Rosa:** puede tener necesidades de barrio o recuerdos sobre establecimientos, pero no se le atribuyen visitas automáticas.
- **Darius:** un punto de recepción urbano no demuestra que su paquete haya sido entregado ni quién lo espera.
- **Jack:** el narrador conoce las seis ubicaciones por diseño; Jack solo sabe lo que ha aprendido previamente o lo que observa durante acciones controladas por el lector.

## Contratos técnicos y límites

- `tools/meridian_bay_locations.mjs`: diseño y lectura previa, comprobación de IDs, distrito y `BAY-*`, enlaces recíprocos, rechazo de falsos descubrimientos y verificación del historial de observaciones.
- `tools/meridian_bay_city.mjs`: muestra `prebuilt_world` para las seis ubicaciones ya diseñadas, mientras las demás oportunidades siguen `proposed_not_canon`.
- `tools/turn_engine.mjs`: carga una copia del diseño antes de aplicar `turn.changes`. El lugar ya existía en el diseño antes de narrar el movimiento.
- `tools/state_changes.mjs`: los eventos del jugador no pueden emitir `world_location` ni `world_location_link`; una observación válida emite `knowledge`.
- Las verificaciones estructurales **no sustituyen** la revisión de calidad de la prosa ni el protocolo del guardado real D-028/D-052.
- **No registrar accesos, hechos o servicios no confirmados** a partir de `null` o de una oportunidad futura. La visibilidad interna del narrador no implica conocimiento del personaje.

## QA y pendiente

La primera integración falló en dos pruebas que exigían que los 18 servicios potenciales se mantuvieran sin ubicación; ambas fueron actualizadas **para distinguir las seis ubicaciones preconstruidas de las doce oportunidades pendientes**, sin silenciar pruebas funcionales. En [GitHub Actions run 43358441322](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43358441322), código `ee701ec5d62106b7d7c4b9a99fa7f740bead171f`: **259/259 pruebas JavaScript**, **24/24 Python**, validador de checkpoint **PASS**; 0 fallos. Los cambios documentales posteriores no añaden código narrativo.

**Pendiente de integración:** evitar conflicto con la otra rama del atlas/PR #20, decidir el versionado de nuevos lugares antes de futuros turnos, revisar la presentación literaria real y probar el guardado remoto autorizado cuando el lector juegue un turno. No fusionar `main` sin revisión ni crear un turno 10 sintético en la rama narrativa.
