# Meridian Bay — fragmento de estudio Crosswater Plaza → Coast 01 (2026-11-22)

**Estado: revisión geométrica provisional, NO CANÓNICA.** No se ha creado una calle física, parcela, edificio, muro, cruce peatonal, acceso portuario, conexión jugable ni acción de NPC.

## Antecedentes y fuentes

La rama audit/crosswater-approach-provisional-fragment-20261122 parte del HEAD exacto 34898eb209472ad4f429c06e6d2b3df6c67f2d55 de la PR #130. Dependencias históricas de revisión: #130 → #114 → #106 → #101 → #94 → #87 → #86, sin fusión al mundo canónico. La PR #103 es hermana y su propuesta está archivada íntegramente para comparación, no para aplicación.

El archivo MERIDIAN_BAY_CROSSWATER_APPROACH_PROVISIONAL_FRAGMENT_20261122.json conserva los SHA de los seis archivos de referencia. Son el plan de escala de la ciudad (2e8c5ff412436a6e7d526bc0172adfca77107263), el corredor PR #56 (a5ac772922b4717797118b15f182207be1d1a7fb), la alternativa archivada PR #103 (aae66aae315603e37e8cb88034600446bf46d21d), Coast 01 PR #67 (7cb79b2113bfef7b7fbbc39539c17fd80a275cd7), Land 03 PR #69 (2a95eb9e50f69436cb65711daf8ff586f4ef4279) y Coast 02 (325a0acde67a1ce3b44576860824657a3db41695). Las fuentes originales se leen sin escritura ni sustitución.

**Diferencia de autoridad:** el estado del juego prueba la conexión entre los lugares Crosswater Plaza y Harbor Walk. No prueba que un trazado dibujado sea una acera, ni que los rectángulos de estudio del plano general sean parcelas o calles reales.

## Geometría derivada (únicamente centro de línea)

El rectángulo de estudio provisional x=65–68, y=38.635714–42 se calcula a partir de los extremos de los segmentos ya propuestos. **No representa ninguna parcela ni límite administrativo o físico.**

| Elemento | Fuente / coordenadas del lienzo ficticio | Estado |
| --- | --- | --- |
| Tramo compartido CW-GAP-S0 | (65,42) → (66.9,40.6), fuente PR #56 | Boceto sin detalle físico |
| Salida PR #106 A | (66.9,40.6) → (68,39.948148), entrada al rectángulo Coast 01 | Derivada por recorte, no calle nueva |
| Salida PR #103 | (66.9,40.6) → (68,38.635714), entrada al rectángulo Coast 01 | Derivada por recorte, no calle nueva |

El tramo compartido tiene longitud **2.360085 unidades ficticias**. El tramo adicional sin documentación detallada mide **1.278636** en la propuesta A y **2.251315** en la propuesta hermana. Total faltante: **3.638721** y **4.611400**, respectivamente. La alternativa hermana tiene **0.417517** unidades fuera incluso de los rectángulos de enfoque amplio. Ninguna cifra es un metro, kilómetro ni minuto de viaje.

## Relación con calles existentes en los bocetos

Dos líneas de Land 03, MX-A-MARKET-PLAZA y MX-A-PLAZA-TERM, llegan al punto aproximado (65,42) de Crosswater Plaza. La geometría de ese contacto se puede comprobar y no muestra un segundo cruce estricto con el tramo compartido; esto **no verifica** un cruce de calle construido, el sentido de circulación o un enlace seguro a la terminal.

La referencia aproximada del Transit Terminal en el plano de escala es (66,42), y su separación mínima **en el lienzo** de la línea del primer tramo es 0.593199 unidades de dibujo. Como la terminal no tiene huella ni puertas confirmadas, no puede afirmarse que la línea atraviese, evite o tenga acceso al edificio físico.

## Registro de incógnitas — NO son obstáculos confirmados

| Categoría | Estado |
| --- | --- |
| Límites de propiedad, parcelación y servidumbres | Sin información geométrica |
| Fachadas, muros, entradas y edificios concretos | Sin información geométrica |
| Ancho libre peatonal, aceras, bordillos y accesibilidad | Sin información geométrica |
| Entradas de terminal y cruces peatonales | Sin información geométrica |
| Cruces de circulación, flujo de vehículos y barreras de tráfico | Sin información geométrica |
| Paso de paseo público a áreas portuarias restringidas | Sin información geométrica |

**Obstáculos físicos comprobados en esta zona: ninguno identificado porque la información necesaria no existe en estas fuentes.** Esto no significa camino despejado. El JSON no asigna coordenadas inventadas ni permite promover estas incógnitas automáticamente a hechos.

## Decisiones todavía abiertas

Se debe diseñar y revisar el acceso público desde la plaza, localizar entradas y cruces de la terminal, definir huellas y anchos peatonales verificables y reconciliar la transición costera escogida con las demás regiones. Son tareas originales de diseño, separadas de cualquier hecho guardado del juego. No se ha seleccionado una de las variantes.

## Pruebas y aceptación

El módulo tools/meridian_bay_crosswater_approach_fragment.mjs verifica hashes de procedencia, trazados compartidos y alternativos, contactos entre líneas ya documentadas, distancia ilustrativa a la referencia de la terminal, y rechaza la inserción sin evidencia de un obstáculo, cruce físico, fuente alterada o ubicación canónica.

Los 13 casos de tests/meridian_bay_crosswater_approach_fragment.test.mjs comprueban estos controles, manipulación adversaria y preservación del checkpoint. La aceptación exige ejecutar el workflow de Node, Python y validador del estado sobre el SHA exacto, además de comparar inventario y cinco blobs narrativos con el padre y main.

**Siguiente trabajo propuesto:** crear una revisión separada del tejido urbano real de acceso usando planos originales nuevos y decisiones editoriales; hasta entonces el fragmento es un contrato de trabajo inspeccionable, no contenido transitable.
