# Meridian Bay — auditoría de evidencia del acceso Plaza–Coast 01 (22-11-2026)

**Estado: ingeniería comparativa no canónica.** No aprueba edificios, calles físicas, pasos peatonales, accesos al puerto, rutas jugables ni acciones de NPC. La rama audit/plaza-harbor-approach-evidence-gap-20261122 se basa en el HEAD confirmado de PR #114 (26560ccc1fb859cc7372967b54d7354c854fc92a); las ramas ascendientes #106, #101, #94, #87 y #86 siguen sujetas a revisión. Nunca fusionar independientemente con main.

## Autoridad de fuentes (Git blobs fijados)

- Plan general original: MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json, 2e8c5ff412436a6e7d526bc0172adfca77107263.
- Ruta original Plaza–Harbor PR #56: SOURCE_PR56_PLAZA_HARBOR_20261120.json, a5ac772922b4717797118b15f182207be1d1a7fb.
- Variante hermana PR #103, copia de solo lectura: SOURCE_PR103_HARBOR_ACCESS_RECONCILIATION_20261122.json, aae66aae315603e37e8cb88034600446bf46d21d.
- Coast 01 PR #67: SOURCE_PR67_COAST_01_20261120.json, 7cb79b2113bfef7b7fbbc39539c17fd80a275cd7.
- Land 03 PR #69: SOURCE_PR69_LAND_03_20261120.json, 2a95eb9e50f69436cb65711daf8ff586f4ef4279.
- Coast 02 PR #67: SOURCE_PR67_COAST_02_20261120.json, 325a0acde67a1ce3b44576860824657a3db41695.

El grafo guardado demuestra que Crosswater Plaza y Harbor Walk están vinculados a nivel de **lugares**, no que exista un pasillo físico con esos puntos ilustrativos. La plaza (65,42) y la terminal (66,42) son referencias aproximadas; el plan general declara que sus huellas físicas no están definidas. Las cajas MB-FOCUS-CROSS, MB-FOCUS-TERM y MB-FOCUS-HARBOR son **áreas de planificación no confirmadas**, no vías.

## Continuidad de la sección faltante

Las dos variantes parten de (65,42) hacia (66.9,40.6); ese **primer tramo entero, de 2.360085 unidades gráficas**, está fuera de los tres fragmentos geométricos detallados. Aunque está dentro del enfoque general de Crosswater, el dato no añade ninguna calle ni edificio verificados.

En el siguiente tramo se entra en el rectángulo de estudio Coast 01 en puntos diferentes:

| Comprobación sobre bocetos | PR #106 opción A | PR #103 hermana |
| --- | ---: | ---: |
| N2 propuesto | (69.6,39) | (68.3,38.1) |
| Primera entrada al **rectángulo** Coast 01 | **(68,39.948148)** | **(68,38.635714)** |
| Longitud total del boceto | 7.990491 | 8.280615 |
| Longitud fuera de fragmentos **detallados** | **3.638721** | **4.611400** |
| De lo anterior, dentro de enfoque **general** sin detalle físico | **3.638721** | **4.193883** |
| Fuera de fragmentos detallados **y** enfoques generales | **0** | **0.417517** |

Los valores representan **unidades ficticias de dibujo**, no kilómetros, metros, derechos de paso, ancho de acera ni minutos de viaje.

En la opción #103 el último espacio sin detalle ni enfoque general discurre aproximadamente entre (67.796,39) y (68,38.635714). Es un **vacío documental entre rectángulos de estudio**. No prueba la presencia de agua, un terreno prohibido o la inexistencia de la conexión entre lugares. Tampoco el hecho de que el vacío de #106 esté dentro de un enfoque general constituye evidencia de acceso.

## Incógnitas y criterios antes de integrar

**No están documentados** los límites reales de parcelas o muros junto al tramo (65,42)→(66.9,40.6); trazado y anchura de aceras; pendientes, barreras y accesibilidad; cruces peatonales próximos al área de la terminal; entradas reales del transporte; servidumbres de paso y transición a suelo de uso portuario. No se pueden suponer por cercanía de coordenadas ni inventar edificios para llenar el hueco.

**Siguiente diseño admisible:** preparar un pequeño fragmento **provisional** de acceso Crosswater–Coast 01 con trazabilidad a fuentes, conservar el trazado histórico intacto, separar decisiones nuevas del mundo de hechos del checkpoint, comprobar su contacto con Coast 01 y las variantes #106/#103 y someterlo a revisión editorial. Mientras falte esa evidencia, **ninguna variante queda seleccionada**.

## Herramienta y pruebas

- tools/meridian_bay_plaza_approach_evidence_gap.mjs: verifica los seis blobs históricos, invoca la revisión superior del grafo, recorta segmentos contra la unión de rectángulos detallados y de enfoque general, localiza entradas a Coast 01 y mantiene la ausencia de autoridad física.
- tests/meridian_bay_plaza_approach_evidence_gap.test.mjs: **14** pruebas de proveniencia, puntos, cobertura, superposición de rectángulos, geometría inválida y preservación del estado guardado.
- Verificación exigida: CI Node + Python + checkpoint, sobre el commit de implementación **exacto**, revisión del inventario y comparación independiente de los cinco blobs narrativos contra PR #114 y main.

**Recomendación:** documentar primero la geometría y el carácter público/privado del tramo Plaza→(66.9,40.6). No escoger automáticamente PR #106 por registrar menos distancia sin detalle, ni PR #103 por su mayor separación local de edificios candidatos.
