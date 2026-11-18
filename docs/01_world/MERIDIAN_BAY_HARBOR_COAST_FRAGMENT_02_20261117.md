# Meridian Bay — fragmento físico 02: continuación de la bahía

**Estado:** plano regional de trabajo, editable y separado del mundo jugable. Esta pieza se construyó **después** de la pieza 01, no forma parte de un plano único terminado.

[Plano SVG — fragmento 02](MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_02_20261117.svg) · [Geometría fuente JSON](MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_02_20261117.json) · [Plano vecino 01](MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.svg)

## Superficie realmente construida en esta pieza

En la cuadrícula ilustrativa se dibuja **x=68–82, y=42–51**, justo al otro lado de la costa del fragmento 01. Contiene **22 vértices de ribera**, **seis zonas físicas de suelo**, **diez huellas candidatas de edificios** y **siete trazas de calle o paseo**. Son formas editables, no únicamente renglones que conectan sitios.

La costa sale **exactamente de (75.1, 42)**, la costura del primer plano, y llega a **(79.2, 51)** con entrantes, salientes y terrenos alterados. El agua queda al lado de **x creciente** solamente dentro de este fragmento. No se ha decidido cuál es el norte real de Meridian Bay, ni el límite municipal ni la ribera definitiva. El marco de 10 × 8 km del plano de estudio continúa siendo reversible.

## Capas históricas propuestas, no un barrio cuadriculado

1. **Primeros caminos y manzanas:** una calzada torcida sigue parcelas irregulares donde aparecen viviendas, talleres y comercio mezclados.
2. **Actividad portuaria posterior:** edificios de trabajo, patios y rellenos pequeños cambian algunos bordes. El camino hacia esos patios no concede entrada al puerto.
3. **Vía posterior y reutilización:** una calle más reciente rodea edificios antiguos en vez de eliminarlos; un ramal queda sin salida. Hay una **traza histórica bloqueada que pasa por debajo del terreno de una edificación posterior**, preservada para explicar un cambio urbano, **no para caminar por allí**.

La forma no se diseñó para tener una zonificación impecable. Se conservan mezclas de usos, edificios oblicuos, trazas perdidas y calles que se adaptan a terrenos de distintas épocas. **Estas etapas son hipótesis de construcción del mapa, no acontecimientos ya narrados.**

## Conexión a la historia, sin modificarla

El plano anterior ya contiene el punto establecido de **Harbor Walk (71,37)** y sus dos accesos separados desde Market Row y Crosswater. Esta pieza NO reubica ese punto, NO declara un camino nuevo desde Harbor Walk y NO sustituye la conexión directa Market Row–Harbor Walk.

Las siete trazas de esta nueva lámina son **geometría hipotética**, no vías abiertas para Jack. No se han fijado horarios, habitantes, tiendas específicas, puertas, servicio sanitario, distancias reales ni movimientos de NPC. El extremo de costa es continuidad geográfica, no un puente o carretera.

## Ensamblaje sin inventar una ciudad completa

- **Costura con fragmento 01:** (75.1,42), exacta y comprobable.
- **Costura exterior siguiente:** (79.2,51), ribera pendiente.
- **Lado terrestre:** la calle vieja acaba en (68.1,43.8) y la posterior en (68.2,46.65); sus futuros empalmes **no están autorizados** hasta construir el bloque vecino.
- La traza bloqueada `HN-A-TRACE` no es transitable, aunque parte de su recorrido coincida con un edificio más reciente.

Los SVG se derivan mediante `tools/meridian_bay_coastal_blueprints.mjs` a partir de los dos JSON. `--check` verifica continuidad, geometría terrestre, huellas y correspondencia exacta de la representación; `--render` regenera ambas láminas. **No se escriben archivos `game/` ni `chapters/`.**

**Siguiente paso:** construir el fragmento terrestre que se empalma desde x=68; solo entonces estudiar conexiones, obstáculos y circulación entre los barrios antiguos y el litoral.
