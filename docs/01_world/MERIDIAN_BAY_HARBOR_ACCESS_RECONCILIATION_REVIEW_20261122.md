# Meridian Bay — Harbor Walk: revisión conjunta de accesos propuestos (2026-11-22)

**Ámbito:** comparación geométrica reproducible y **no canónica** de los accesos históricos PR #44, PR #58 y PR #56 sobre el **fragmento costero 01 corregido** de PR #67 (variante en [PR #89](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/89)). No hay autorización para nuevos caminos, distancias, permisos del puerto ni movimientos narrativos.

**Rama independiente de trabajo:** `work/meridian-harbor-corridor-reconciliation-20261122` — basada en la cabeza verificable `964d84698f65db0ea41d7617bf5b9f22dd85db8f` de PR #89. Si cambian los antecesores #86/#87/#89, deben reexaminarse estas comparaciones antes de integrar.

## Fuentes y procedencia

Se usan **sin modificar** los cuatro JSON existentes en PR #89:

| Diseño histórico | JSON conservado | Git blob del JSON |
| --- | --- | --- |
| Market Row ↔ Harbor Walk, PR #44 | `SOURCE_PR44_MARKET_HARBOR_20261120.json` | `e8efe8e5f6a746ab4e628f76a9deb5f71061010d` |
| Market Row ↔ Harbor Walk, PR #58 | `SOURCE_PR58_MARKET_HARBOR_20261120.json` | `280a444f6eed99a33027aea2edb48af70cc67bd0` |
| Crosswater Plaza ↔ Harbor Walk, PR #56 | `SOURCE_PR56_PLAZA_HARBOR_20261120.json` | `a5ac772922b4717797118b15f182207be1d1a7fb` |
| Coast 01 corregida desde PR #67, preparada en PR #89 | `MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json` | `139c3687c98285aff886d28422544d082768217d` |

El material sigue siendo un boceto sin orientación geográfica certificada. El grafo de lugares en `game/STATE.json` es autoridad únicamente para la **existencia de conexiones entre lugares**, no para determinar una calle específica o una distancia real.

## Conflictos detectados en la geometría fuente

| Ruta | Cruces estrictos con calle antigua bloqueada `HC-A-OLDTRACE` | Cruces con zona de actividad portuaria candidata `HC-Z-FREIGHT` | Cruces con edificios candidatos |
| --- | ---: | ---: | ---: |
| PR #44 original | 1 | 0 | 0 |
| PR #58 original | 1 | 2, y además el punto 4 cae dentro del polígono | 0 |
| PR #56 original | 0 | 0 | 2 cruces con `HC-B-01` |
| **Variante PR #44 revisada aquí** | **0** | **0** | **0** |
| **Variante PR #56 revisada aquí** | **0** | **0** | **0** |

Son **intersecciones entre trazados hipotéticos**, no obstrucciones probadas en una vía real. Tampoco se ha revisado el terreno urbano fuera del fragmento 01.

## Dos correcciones provisionales y de bajo alcance

**A. Market Row → Harbor Walk: preferir PR #44 para este *estudio local*, no como canon.**

Partimos de los cinco puntos históricos PR #44, con el enlace ya existente `LOC-COMMERCIAL-DISTRICT ↔ LOC-HARBOR-WALK`. Insertamos un único punto nuevo `MB-MH-REVIEW-BEND-20261122` en **`(69,37.6)`**, entre el punto fuente `MB-MH-N3 (68,36.9)` y Harbor Walk `MB-MH-N4 (71,37)`. Los cinco puntos históricos mantienen sus coordenadas.

La separación mínima calculada respecto de la traza bloqueada aumenta a **aprox. 0.216 unidades del lienzo ficticio**. Esto es una métrica de geometría 2D, **no una separación peatonal aprobada**, ancho de acera, distancia física ni garantía de circulación.

La vieja propuesta PR #58 queda **conservada para futuras comparaciones**: su punto `(69.5,36.7)` encajaba con la cola `HC-A-MARKET` de Coast 01, pero esa coincidencia dependía de que el boceto costero se dibujó usando precisamente PR #58, y su ruta interna toca la zona portuaria hipotética. La variante aquí propuesta incluye por separado una **cola costera de reemplazo solamente en la vista de revisión**: `(69,37.6) → (71,37)`. La geometría original de PR #67/PR #89 permanece intacta y disponible para auditoría.

**B. Crosswater Plaza → Harbor Walk: rectificar el punto intermedio de PR #56.**

Se conserva toda la secuencia de cinco puntos y su conexión real `LOC-CROSSWATER-PLAZA ↔ LOC-HARBOR-WALK`. Solo cambia el punto de diseño `MB-PH-N2`:

- Coordenada histórica: `(68.9,39.15)`.
- Coordenada propuesta: **`(68.3,38.1)`**.

Con ese cambio, el tramo propuesto evita la huella provisional `HC-B-01` que cruzaba antes. La cola `MB-PH-N3 (70.1,37.85) → Harbor Walk (71,37)` conserva exactamente la misma geometría de la costa histórica.

**Comparación entre las dos rutas revisadas:** ninguna presenta cruces estrictos adicionales entre ellas antes del destino compartido en Harbor Walk. No se ha creado una intersección nueva, pasarela, conexión jugable ni acceso al puerto. La revisión original de Coast 01 de PR #67 mantiene sus invariantes; solo se superpone la nueva cola de Market Row a una **copia desprendida en memoria**.

## Entregables reproducibles

El archivo [JSON de reconciliación](MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json) conserva manifest de fuentes, parches mínimos, nodos propuestos, reemplazo de cola solo en esta propuesta y todas las restricciones de no admisión. No sustituye ningún JSON histórico.

El [SVG comparativo](MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.svg) muestra la costa, edificios candidatos, zona portuaria, traza bloqueada, tres rutas históricas y las dos alternativas evaluadas. Su texto identifica expresamente **NO CANÓNICAS** y **NO VERIFICADOS** fuera de la primera región; ninguna ruta se marca abierta al jugador.

El código [`tools/meridian_bay_harbor_access_reconciliation.mjs`](../../tools/meridian_bay_harbor_access_reconciliation.mjs) verifica hashes históricos de fuente, conservación de enlaces de lugares, cambios geométricos permitidos, cruces de polígonos/zonas, costa y traza interrumpida; también exige un margen estrictamente positivo frente a edificios y la traza bloqueada, limitado a unidades ilustrativas. Recalcula la figura SVG desde los datos y expone una vista privada clonada; **no escribe al importar**. Solo `node tools/meridian_bay_harbor_access_reconciliation.mjs --write` regenera el SVG.

[`tests/meridian_bay_harbor_access_reconciliation.test.mjs`](../../tests/meridian_bay_harbor_access_reconciliation.test.mjs) comprueba las fuentes byte-idénticas, el diagnóstico de cada boceto, ambos cambios mínimos, el encaje de las colas, el grafo real, todas las coordenadas del SVG, recuperación de estado inalterado y el rechazo de propuestas alteradas. Requiere pasar la suite completa JavaScript + Python + validador del checkpoint sobre el HEAD final.

## Limitaciones antes de cualquier integración física

- La prueba de no intersección solo cubre **edificios, polígonos y trazas conocidos del fragmento costero 01**. Gran parte de cada acceso atraviesa una región urbana aún no validada contra todos los planos colindantes.
- No se ha comprobado existencia de suelo público, aceras, cruces peatonales, pendientes, vallas, horarios, edificios todavía no modelados ni accesibilidad.
- Una zona de suelo y una calle antigua bloqueada son hipótesis de diseño. La preferencia local PR #44 no declara inválida la PR #58 en la narración ni decide definitivamente el trazado.
- No se alteraron `game/STATE.json`, los otros cuatro archivos canónicos de guardado, el reloj de ficción, NPCs, lugares o historial de Jack.
- El siguiente avance seguro es contrastar las secciones fuera de Coast 01 contra los fragmentos territoriales pertinentes y sus edificios antes de revisar esta variante para integración.

**Recomendación técnica:** usar el desvío PR #44 y la rectificación PR #56 como **hipótesis coordinadas** para la siguiente revisión regional; conservar #58 y la cola original para trazabilidad. No fusionar todavía ni narrar recorrido alguno a partir de las coordenadas.
