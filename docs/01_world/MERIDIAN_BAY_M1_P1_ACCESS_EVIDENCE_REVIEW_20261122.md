# Meridian Bay — revisión de accesos y contexto urbano para M1 y P1 (22 de noviembre de 2026)

**Estado:** revisión cartográfica privada, basada en fuentes exactas de Git. **No es** un nuevo fragmento físico, una calle real ni un permiso de navegación. El análisis no modifica `game/STATE.json`, archivos de capítulos, diario, reloj, NPC ni movimientos del jugador.

**Rama de trabajo:** `work/meridian-m1-p1-source-access-review-20261122` construida sobre [PR #122](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/122) (`1daa0e8de0859bbab03361342908a265d309b86a`). Su cadena depende de #112 → #103 → #89 → #87 → #86. Esta revisión no sobrescribe el trabajo paralelo de #110 ni convierte ningún plano en canon. `main` permanece en `019175c6463ff31807a0f7013d91299add94913c`.

## Propósito y diferencia respecto de la auditoría Sección 04

[La ficha Sección 04](MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.md) conserva cinco porciones **sin cobertura de estudio físico**; identifica sus extremos matemáticos y advierte que los huecos no son terreno vacío. El siguiente paso útil no es dibujar casas ni mover un waypoint arbitrariamente. Esta revisión cruza **M1 y P1** con los **lugares realmente existentes** del grafo guardado, sus **anclajes de posición imprecisa** y las **calles históricas propuestas** del fragmento Land 03.

La cercanía entre el centro de un lugar y la línea de un corredor se calcula por distancia mínima punto–segmento sobre el lienzo de referencia `100×80`. Cuando la distancia es menor o igual que la **incertidumbre de colocación registrada**, el resultado indica **posible coincidencia de referencias en el dibujo**. **No identifica el área real, edificio, puerta, parcela, distancia física, acera, derecho de paso ni circulación autorizada.** El acceso público confirmado a un lugar no demuestra acceso al corredor M1/P1.

## M1 — salida comercial hacia la zona sin plano

**Registro fuente:** `MB-04-M1`, del punto `(58.869565, 42)` a `(60, 40.7)`; longitud ilustrativa `1.722754`. Empieza exactamente en el límite `y=42` de Land 03. El resto está fuera de ese estudio; la posición inicial no demuestra un cruce peatonal desde Market Row.

| Referencia ya existente | Centro de referencia del plano | Radio de incertidumbre ficticia | Distancia mínima al trazado M1 | Interpretación permitida |
| --- | --- | ---: | ---: | --- |
| `LOC-CAFE-BRUMA` | (58.8, 42) | 1.5 | **0.069565** | Cercanía ilustrativa a un café existente; su fachada, puerta o propiedad no están cartografiadas |
| `LOC-COMMERCIAL-DISTRICT` | (58, 43) | 3 | **1.325196** | Market Row existe como distrito conectado, no como perímetro o intersección medidos |
| `LOC-MARKET-BUSINESS-OFFICES` | (58.3, 42.1) | 1 | **0.578277** | La galería de servicios tiene acceso público al **lugar**, pero esto no autoriza un atajo ni la trayectoria M1 |

La salida M1 **no coincide exactamente con ningún extremo de los dos trazados `existing_topology_sketch`** del fragmento Land 03. Tampoco coincide con el borde de un polígono de uso de suelo propuesto de ese fragmento. No usar ese resultado negativo para inferir que el lado sin plano esté desocupado.

**Investigación M1 prioritaria:** determinar, mediante fuentes urbanas compatibles con el canon, el acceso público entre el borde de Market Row/Café Bruma y el comienzo de la zona que aún carece de geometría. Mantener separados el ingreso al café y la continuidad de una eventual acera; no asignar edificios ni propietarios sin evidencias.

## P1 — salida de Crosswater Plaza

**Registro fuente:** `MB-04-P1`, de `(65, 42)` a `(66.9, 40.6)`; longitud ilustrativa `2.360085`. El punto de inicio es el **anclaje de la plaza** en el boceto Land 03, no una puerta específica ni un paso peatonal aprobado.

| Referencia ya existente | Centro de referencia | Radio de incertidumbre ficticia | Distancia mínima a P1 | Interpretación permitida |
| --- | --- | ---: | ---: | --- |
| `LOC-CROSSWATER-PLAZA` | (65, 42) | 2 | **0** | P1 arranca en el centro de referencia de la plaza, pero el borde público y sus accesos precisos son desconocidos |
| `LOC-TRANSIT-TERMINAL` | (66, 42) | 1.5 | **0.593199** | La terminal es adyacente a la plaza, sin geometría de andenes, control de acceso o viales |

El punto `(65,42)` coincide **solo como geometría esquemática** con el último punto del trazado `MX-A-MARKET-PLAZA` (índice 4) y el primero de `MX-A-PLAZA-TERM` (índice 0). También está en el borde inferior del polígono **candidato** `MX-Z-TRANSIT`, que representa usos en torno a la plaza y la terminal. Esto exige revisar el borde y el tratamiento peatonal; **no** constituye una nueva intersección certificada, conexión a la terminal ni una ruta hacia Harbor Walk.

**Investigación P1 prioritaria:** estudiar salida pública de la plaza y continuidad de la acera o pasaje fuera de los accesos controlados de la terminal, antes de revisar las conexiones con P2. No asumir propiedad o servicio operativo por una etiqueta de dibujo.

## Fuentes y verificación reproducible

Todas las fuentes se leen por Git blob SHA-1 exacto, con rechazo de cambios silenciosos:

| Fuente | Blob SHA |
| --- | --- |
| Registro Section04 de [PR #122](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/122) | `a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b` |
| Canvas histórico y lugares `MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json` | `2e8c5ff412436a6e7d526bc0172adfca77107263` |
| Fragmento Land03 de PR #69, conservado sin alteraciones | `2a95eb9e50f69436cb65711daf8ff586f4ef4279` |
| Catálogo histórico de lugares preconstruidos `MERIDIAN_BAY_PREBUILT_DESIGN.json` | `014586f9c2996501f3bf16b9bfb8aebaf44fd462` |

El [informe JSON](MERIDIAN_BAY_M1_P1_ACCESS_EVIDENCE_20261122.json) es regenerable por el módulo [`tools/meridian_harbor_m1_p1_access_evidence.mjs`](../../tools/meridian_harbor_m1_p1_access_evidence.mjs), que se apoya en el validador de Sección 04 y el grafo de lugares `game/STATE.json`. Coteja cuatro orígenes, consulta acceso *al lugar* sin promover acceso *a la ruta*, y rechaza la incorporación de puertas, polígonos, nuevas vías o aprobaciones fuera de fuente. Una vista privada clonada evita que la inspección altere el checkpoint.

[Las 16 pruebas](../../tests/meridian_harbor_m1_p1_access_evidence.test.mjs) abarcan identidad de fuentes, distancia ilustrativa, clasificación de referencias, acceso público limitado, coincidencias de traza, límite `MX-Z-TRANSIT`, falsificación de acceso, alteración del grafo y preservación de los cinco blobs originales de historia.

## Criterios técnicos antes de diseñar físicamente el conector

1. **Separar autoridad:** anclaje de lugar y acceso general del grafo, referencia histórica de calle, derecho real de paso y camino jugable son evidencias distintas. La presencia de un café público o una plaza abierta no autoriza una ruta ficticia adicional.
2. **Resolver el borde:** M1 requiere una salida verificable desde la zona comercial; P1 requiere un inicio viable sin atravesar la terminal ni deducir un vado por su posición ilustrativa. El contacto con el polígono provisional no aprueba un uso del suelo.
3. **Conservar incertidumbre:** no asignar fachadas, suelo público, parcelas, anchos, pendientes, tiempos o nuevos edificios a lo que sigue sin plano. Después de M1/P1, estudiar M2/P2/M3 con fuentes atribuidas.
4. **Integración:** antes de cualquier incorporación, ejecutar la suite JavaScript, Python y validador de guardado sobre el HEAD final; comprobar inventario y cinco Git blobs de canon y cerrar la PR temporal de QA sin merge. Mantener esta rama en **draft**, no canonizar los trazados.

**Conclusión:** se ha identificado qué lugares y rasgos ya documentados pueden orientar una revisión de **M1 y P1** y dónde termina su evidencia. No se ha demostrado un camino peatonal físicamente transitado ni se ha realizado ningún avance narrativo.
