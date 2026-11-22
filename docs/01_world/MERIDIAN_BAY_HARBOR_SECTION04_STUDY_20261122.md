# Meridian Bay — sección 04: registro de estudio urbano sin plano físico (2026-11-22)

**Estado:** propuesta de **estudio de cinco subsecciones**, derivadas de trazos anteriores; **NO ES** un fragmento físico aprobado. No se han inventado calles, edificios, zonificación, infraestructura portuaria ni acceso jugable.

**Base Git:** `work/meridian-harbor-regional-coverage-20261122@616c6155a279bf0126f07ccc46536665179731b5` ([PR #112](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/112)). Esta base depende de la [PR #103](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/103), que depende de #89 → #87 → #86. Mantener todo el conjunto en borrador. **La PR #110 es un análisis de cobertura paralelo sobre #103; no fusionar #110 y #112 independientemente ni duplicar sus índices**. Este incremento reutiliza la auditoría cartográfica de #112 en lugar de recrearla.

**Autoridad narrativa:** `main@019175c6463ff31807a0f7013d91299add94913c`. La partida guardada solo acredita las conexiones amplias entre lugares, no el lugar preciso de una calle. La imagen [SVG de cobertura original](MERIDIAN_BAY_HARBOR_REGIONAL_COVERAGE_20261122.svg) sigue siendo la referencia visual no canónica; este registro añade **división por secciones** sin otra imagen potencialmente divergente.

## Qué se ha derivado de las fuentes existentes

El nuevo archivo estructurado [`MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json`](MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json) contiene exactamente las porciones de líneas **fuera de los tres rectángulos de estudios físicos existentes** (Land03, Coast02 y Coast01). Es una subdivisión del material de las PR #103/#112, **no** cinco calles de nueva construcción.

| Registro | Fuente de ruta y tramo (desde 0) | Inicio del tramo sin estudio | Fin del tramo sin estudio | Longitud ficticia |
| --- | --- | --- | --- | ---: |
| `MB-04-M1` | Market–Harbor, tramo 0 | (58.869565, 42) — sale de Land03 | (60, 40.7) | 1.722754 |
| `MB-04-M2` | Market–Harbor, tramo 1 | (60, 40.7) | (64, 38.1) | 4.770744 |
| `MB-04-M3` | Market–Harbor, tramo 2 | (64, 38.1) | (68, 36.9) — entra a Coast01 | 4.176123 |
| `MB-04-P1` | Plaza–Harbor, tramo 0 | (65, 42) — plaza existente; longitud cubierta por Land03 = 0 | (66.9, 40.6) | 2.360085 |
| `MB-04-P2` | Plaza–Harbor, tramo 1 | (66.9, 40.6) | (68, 38.635714) — entra a Coast01 | 2.251315 |

Los tres fragmentos Market suman **10.669621** unidades ficticias de línea; los dos fragmentos Plaza suman **4.611400**. Estas cantidades **no son kilómetros**, superficie urbana, duración, porcentaje construido ni longitud de aceras transitables. Los empalmes derivan de la intersección matemática de los segmentos con los límites originales de bocetos, no de mediciones geográficas. La continuidad gráfica entre dos puntos **no demuestra que exista una calle entre ellos**.

**Ventana de estudio mínima propuesta:** `x=58..68, y=36.9..42`. Es una caja de búsqueda basada en extremos de líneas fuente; no sustituye los rectángulos oficiales anteriores, no asigna parcelas y no representa el borde verdadero de un barrio. Se requiere estudiar zonas alrededor de cada segmento antes de proponer edificios o accesos, sin convertir automáticamente los vacíos del dibujo en terreno libre.

## Procedencia fijada

El módulo [`tools/meridian_harbor_section04_ledger.mjs`](../../tools/meridian_harbor_section04_ledger.mjs) exige estos cuatro SHA reales de Git blob antes de inspeccionar:

| Fuente preservada | Blob Git |
| --- | --- |
| Rutas locales PR #103 `MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json` | `aae66aae315603e37e8cb88034600446bf46d21d` |
| Coast01 propuesta PR #89 `MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json` | `139c3687c98285aff886d28422544d082768217d` |
| Coast02 histórica PR #67 `SOURCE_PR67_COAST_02_20261120.json` | `325a0acde67a1ce3b44576860824657a3db41695` |
| Land03 histórica PR #69 `SOURCE_PR69_LAND_03_20261120.json` | `2a95eb9e50f69436cb65711daf8ff586f4ef4279` |

El código reutiliza `measurePhysicalDraftCoverage` y `validateHarborRegionalCoverage` de la auditoría #112. Por tanto, valida el estado real de fuentes, la posición del jugador y los enlaces guardados. Después **regenera de forma determinista** el JSON esperado a partir de los fragmentos sin cobertura. Rechaza cambios en coordenadas, puntos históricos, nuevas secciones, edificios supuestos, estado `canNavigate`, nuevas ubicaciones, rutas del grafo o cambios en la identificación de las fuentes. La vista de inspección devuelve clones y no escribe.

## Investigación física pendiente por subsección

- **M1 — borde de Market:** comprobar el punto de salida desde Land03 y si el comercio existente tiene una continuidad pública real; la salida ilustrativa no es una boca de calle ni prueba de derecho de paso.
- **M2 — franja intermedia Market:** obtener evidencia de suelo, manzanas, accesos y obstáculos antes de diseñar un corredor. No deducir la trama urbana solo de dos waypoints.
- **M3 — llegada a Coast01:** comprobar la transición con el estudio costero y los límites hipotéticos de la industria portuaria. El punto final tiene continuidad matemática con Coast01, no accesibilidad.
- **P1 — salida de Crosswater Plaza:** determinar accesos reales entre la plaza ya guardada y la franja sin plano, conservando privacidad y restricciones del entorno de terminal.
- **P2 — llegada de Plaza a Coast01:** inspeccionar el sector anterior a la costa y la compatibilidad con la variante que evita el edificio `HC-B-01`; no desplazar edificios para hacer pasar la línea.

Estas cinco investigaciones permanecen **abiertas**. Ninguna tiene aún un uso del suelo, huellas de edificios, servidumbre o anchura medidos. No se presume que los itinerarios Market y Plaza compartan una calle porque se aproximen en la misma zona. Los antiguos #44/#58 continúan siendo alternativas; esta ficha conserva solo las líneas de estudio de #103.

## Criterios de revisión y QA

La suite [`tests/meridian_harbor_section04_ledger.test.mjs`](../../tests/meridian_harbor_section04_ledger.test.mjs) contiene **13** pruebas de fidelidad SHA, los cinco segmentos y empalmes exactos, origen de los nodos, reproducción del JSON, límites de autoridad, borrado/forja de enlaces, material no documentado y clonación de vista; confirma además los cinco blobs narrativos de `main`.

**Gate obligatorio:** ejecutar suites Node, Python y validador del checkpoint sobre el HEAD final de esta rama, revisar inventario completo y diffs, comprobar cinco blobs protegidos y cerrar sin merge cualquier PR temporal de QA. No atribuir los éxitos de #112 a este nuevo HEAD.

**Siguiente trabajo si pasa QA:** una inspección de fuentes *reales* de uso de suelo y de continuidad de fachadas para M1/P1 primero, seguida de M2/P2/M3. Solo después se podrá **proponer** geometría física diferenciada, evaluar caminos alternativos y solicitar una decisión editorial; nunca generar casas de manera arbitraria para rellenar la zona.
