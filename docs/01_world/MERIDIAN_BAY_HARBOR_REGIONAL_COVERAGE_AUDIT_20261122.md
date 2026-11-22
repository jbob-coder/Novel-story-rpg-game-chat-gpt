# Meridian Bay — auditoría de cobertura regional de rutas hacia Harbor Walk (2026-11-22)

**Condición:** auditoría de ingeniería privada; **no** se admite un mapa físico, ruta, edificio, derecho de paso ni viaje.  
**Repositorio:** `jbob-coder/Novel-story-rpg-game-chat-gpt`.  
**Rama:** `work/meridian-harbor-region-coverage-20261122`, apilada sobre [PR #103](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/103) en `a04712478fad6ab3f367d3af2eb1f14ee55013e2`. La PR #103 es una propuesta local sobre #89 → #87 → #86; ninguna está fusionada en `main`.  
**Autoridad narrativa:** `main@019175c6463ff31807a0f7013d91299add94913c`. Se conservan `CH-000` turno 9 y cinco blobs narrativos, sin crear eventos ni mover al jugador.

## Hallazgo de cobertura, cuantificado sin inventar calles

La [PR #103](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/103) reduce cruces de las rutas candidatas con obstáculos dibujados dentro del fragmento Coast 01. **Eso no garantiza continuidad entre los barrios y la costa.**

Se calcularon las longitudes geométricas de **cada tramo recto** de los dos desvíos de PR #103 y la **unión sin doble conteo** de los intervalos que caen dentro de los rectángulos ilustrativos de Coast 01, Coast 02 e interior Land 03. Estos rectángulos indican **ámbitos de boceto disponibles, no terrenos medidos ni calles transitables**.

| Corredor candidato | Longitud de línea en unidades del lienzo ficticio | Dentro de rectángulos de boceto | Fuera de los tres rectángulos | Proporción sin un fragmento de referencia |
| --- | ---: | ---: | ---: | ---: |
| Market Row → Harbor Walk, variante PR #44 con desvío | 15.303534 | 4.633913 | **10.669621** | **69.7200 %** |
| Crosswater Plaza → Harbor Walk, variante PR #56 con rodeo | 8.280615 | 3.669215 | **4.611400** | **55.6891 %** |

**No convertir estas cifras a kilómetros, duración, anchuras o indicadores de seguridad.** Son unidades del lienzo de diseño `100×80`, sin escala física aprobada.

### Dónde faltan piezas

- **Market Row → Harbor Walk:** el tramo 0 comienza dentro de Land 03 y sale de su rectángulo al cruzar el borde `y=42`, aproximadamente en **(58.869565, 42)**. A partir de ahí, los tramos completos 1 y 2 y la última parte del 0 están **fuera de los tres rectángulos**. La ruta entra en el borde de Coast 01 en **(68, 36.9)** y sus dos tramos finales quedan dentro de su rectángulo.
- **Crosswater Plaza → Harbor Walk:** el tramo 0 empieza en el borde `(65,42)` pero no tiene **longitud** cubierta por Land 03 (un punto no constituye una carretera). El tramo 1 entra en Coast 01 cerca de **(68, 38.635714)**. Antes de ese punto no hay cobertura lineal de estos tres bocetos. Los tramos 2 y 3 permanecen en el rectángulo Coast 01.
- **Coast 02** no cubre ningún tramo positivo de estas dos rutas ilustradas. Su costa y sus calles candidatas siguen documentadas, pero no sirven como evidencia de las zonas faltantes de los accesos propuestos.
- Los 28 edificios candidatos ya dibujados entre Coast 01 (6), Coast 02 (10) y Land 03 (12) **no producen contactos de arista ni muestras interiores en las dos rutas revisadas** bajo el nuevo control geométrico. Esto **no** demuestra que el terreno desconocido esté libre de edificios; no se ha cartografiado.

La brecha primordial es el **conector urbano entre Market Row / Crosswater Plaza y el borde de Coast 01, especialmente en `x<68` y `y<42`**. El hueco no implica terreno vacío, carretera bloqueada, agua, barrio ausente ni permiso para inventar infraestructura. Requiere un **fragmento de referencia adicional**, con su propia procedencia, continuidad y revisión de usos de suelo, si se desea aprobar posteriormente una geometría específica.

## Evidencia y código inspeccionable

El módulo [`tools/meridian_harbor_region_coverage.mjs`](../../tools/meridian_harbor_region_coverage.mjs) lee cuatro fuentes por **Git blob SHA** antes de razonar:

| Fuente | SHA de blob verificado |
| --- | --- |
| Propuesta local PR #103: `MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json` | `aae66aae315603e37e8cb88034600446bf46d21d` |
| Costa 01 candidata PR #89: `MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json` | `139c3687c98285aff886d28422544d082768217d` |
| Costa 02 histórica PR #67: `SOURCE_PR67_COAST_02_20261120.json` | `325a0acde67a1ce3b44576860824657a3db41695` |
| Interior 03 histórico PR #69: `SOURCE_PR69_LAND_03_20261120.json` | `2a95eb9e50f69436cb65711daf8ff586f4ef4279` |

Funciones: `clipToStudyBox` recorta un segmento contra límites rectangulares, descartando contactos de longitud cero; `analyzeStudyBoxCoverage` une intervalos solapados y registra extremos y tramos aún sin referencia, sin duplicar longitud; `candidateBuildingContacts` examina las huellas documentadas, incluidos vértices en bordes y tramos completamente interiores; `inspectHarborRegionalCoverage` vuelve a validar la PR #103 y sus enlaces de lugares guardados, devuelve informe clonado y **rechaza un cambio no revisado** en las proporciones medidas. No escribe archivos ni altera estado durante importación o consulta.

La suite [`tests/meridian_harbor_region_coverage.test.mjs`](../../tests/meridian_harbor_region_coverage.test.mjs) añade **16 regresiones**: hashes de fuente, recorte de segmentos y rectángulos, contactos puntuales, fronteras, solapamientos sin doble conteo, proporciones y extremos concretos, colisiones hipotéticas de edificios, errores geométricos, rechazo de enlaces ausentes, independencia del preview y los cinco blobs narrativos protegidos.

## Puerta de integración y próximo incremento

**No aprobar físicamente** el corredor de Market–Harbor ni el de Plaza–Harbor basándose únicamente en un SVG o en la PR #103. El siguiente incremento recomendable es **cartografiar por secciones el conector urbano no cubierto** mediante una nueva propuesta no canónica anclada a los puntos de borde documentados; verificar edificios, accesos y relaciones sin crear calles jugables. Posteriormente contrastar las rutas contra ese nuevo fragmento y resolver diferencias #44/#58 mediante revisión fundamentada.

**Prueba requerida:** Node completo, Python y validador del checkpoint en el **HEAD exacto final** de esta nueva rama, más inventario y cinco blobs narrativos. No usar éxitos históricos de las PR #89/#103 como si fueran resultados de esta rama. Cualquier QA contra `main` debe hacerse mediante un espejo temporal del mismo SHA y cerrarse sin fusión. La rama permanece en borrador hasta superar esos controles.
