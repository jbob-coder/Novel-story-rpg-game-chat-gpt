# Meridian Bay — fragmento físico 03: Market Row → Crosswater y borde urbano terrestre

**Estado:** blueprint **editable** de una pieza terrestre. Se construyó después de los [fragmentos costeros 01 y 02](MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_02_20261117.md). No es una entrega del mapa completo ni un cambio en la partida.

[Ver plano SVG de la pieza 03](MERIDIAN_BAY_MARKET_CROSSWATER_LAND_FRAGMENT_03_20261117.svg) · [Editar geometría fuente JSON](MERIDIAN_BAY_MARKET_CROSSWATER_LAND_FRAGMENT_03_20261117.json)

## Qué terreno contiene

Se construyó el rectángulo de estudio **x=58–68.2, y=42–51** (cuadrícula reversible, no kilómetros topográficos). Son **seis conjuntos de suelo**, **doce edificios de huella irregular** y **ocho trazas de calles o accesos**. No se añade una nueva costa en una región enteramente terrestre.

El bloque incluye como referencias conocidas, **sin desplazarlas**: Market Row (58,43), Crosswater Plaza (65,42) y Crosswater Terminal (66,42). La conexión ya existente Market Row–Crosswater sigue exactamente los puntos del diseño inicial; el acceso de la plaza al terminal conserva su propia traza. Las **líneas azules** distinguen esos enlaces de lugar ya establecidos de las **calles físicas**, cuya geometría todavía es propuesta, no una carretera certificada para el jugador.

## Transformación urbana propuesta

En lugar de una retícula ordenada, hay sectores que crecieron de forma desigual:

- **Comercio antiguo:** locales y talleres sin alineaciones uniformes, con calles torcidas por parcelas anteriores.
- **Etapa de transporte:** ampliaciones alrededor de la plaza y el terminal que separan recorridos antiguos. No se dibujan vías de tren reales ni horarios.
- **Reutilización posterior:** un vial más nuevo se curva alrededor de edificios viejos; algunas manzanas conservan mezclas de viviendas y servicios.
- **Traza desaparecida:** `MX-A-BLOCKED` pasa por la zona de un edificio más reciente. Se dibuja **como recuerdo histórico bloqueado**, nunca como calle por la que Jack pueda circular.

No se fija quién vive ni trabaja en las doce huellas nuevas. Tampoco se ubica la escuela de Elena, se abren locales, se asignan eventos o se actualizan los movimientos de NPC.

## Encaje con la pieza costera 02

La parte occidental de los tramos trazados en la costa 02 empieza en un pequeño solape `x=68–68.2`. Se conservaron **dos empalmes exactos**, suficientes para que puedas ensamblar ambos planos sin ajustar a mano posiciones arbitrarias:

- Camino viejo: **(68.1,43.8)**, contacto con `HN-A-OLD` del fragmento 02.
- Vía posterior: **(68.2,46.65)**, contacto con `HN-A-NEW` del fragmento 02.

Ambos empalmes son **hipótesis cartográficas**, no conexiones añadidas al mundo jugable. El límite marítimo pertenece exclusivamente a la pieza costera y conserva su continuidad. Las tres láminas se pueden mover o revisar sin alterar la historia.

## Regla de edición y comprobación

El archivo `tools/meridian_bay_land_region_blueprint.mjs` regenera el SVG a partir del JSON y valida anclajes originales, trayectos previamente diseñados, huellas de edificios, calles que los cruzarían indebidamente y empalmes exactos con la costa. La excepción histórica bloqueada se conserva deliberadamente.

**No se han editado `game/`, `chapters/` ni guardados.** Los detalles urbanos son reversibles. Las pruebas técnicas no convierten el mapa en canon.

**Siguiente fragmento sugerido:** avanzar desde los límites de Market Row hacia Railgarden, utilizando los accesos conocidos como puntos de unión; no intentar terminar Meridian Bay de golpe.
