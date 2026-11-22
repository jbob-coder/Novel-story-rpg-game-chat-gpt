# Meridian Bay — evidencia histórica y bloqueos de acceso peatonal M1/P1 (2026-11-22)

**Estado: revisión independiente, NO CANÓNICA.** Este documento no autoriza nuevas calles, parcelas, fachadas, servidumbres, negocios, puertos ni rutas jugables. `game/STATE.json` continúa definiendo solamente la adyacencia narrativa de los lugares. La historia sigue en CH-000, turno 9, sin acciones nuevas.

**Rama:** `work/meridian-m1-p1-historical-access-gates-20261122`, derivada del HEAD `8659fbdfec0e87bdaa2990254468f4a154d37d91` de [PR #126](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/126). Cadena: #126→#122→#112→#103→#89→#87→#86. La revisión de cobertura paralela #110 sigue separada de #112; no combinar índices ni duplicar archivos sin reconciliación previa. Mantener este incremento en PR **draft**, sin fusionar `main`.

## Hallazgo técnico

Se examinaron las rutas históricas de Market–Crosswater [PR #40](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/40), Market–Harbor [PR #44](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/44), Plaza–Terminal [PR #54](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/54) y Plaza–Harbor [PR #56](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/56), además del registro M1/P1 de PR #126.

**M1 (Market Row).** El tramo `(58.869565,42) → (60,40.7)` procede exactamente de recortar la primera línea ilustrativa de PR #44 `(58,43) → (60,40.7)` en el borde `y=42` de Land 03. La PR #40 dibuja una conexión **distinta**, Market Row ↔ Crosswater, y exige expresamente que el Café Bruma no reciba una puerta o esquina precisa por mera proximidad gráfica. La PR #44 presenta acera pública **candidata** y deja `passable_verified=false`, sin anchura, cruces, paramento edificado o tiempos probados. El punto M1 no coincide con un extremo certificado de calle en Land 03. **Resultado:** la existencia de Market Row, Café Bruma y la galería comercial no establece por dónde se sale hacia M1.

**P1 (Crosswater Plaza).** `(65,42) → (66.9,40.6)` comienza en el mismo **anclaje ilustrativo de plaza** utilizado por PR #40, PR #54 y PR #56. Pero PR #54 es el corredor **plaza→terminal**, no el corredor **plaza→puerto**: los campos `verified_crosswalk`, `verified_vehicle_conflict_free`, `verified_accessibility` y `verified_curb_alignment` están en `false`. PR #56 declara desconocidos el paso, la pendiente y la servidumbre pública en su primer tramo. La coincidencia de los trazos con `MX-Z-TRANSIT` sigue siendo de zonificación candidata, no un permiso. **Resultado:** P1 no dispone aún de una salida pública hacia el lado del puerto demostrada por estas fuentes, y nunca se debe confundir la ruta terminal con ella.

### Doce requisitos sin evidencia suficiente

La [matriz JSON verificable](MERIDIAN_BAY_M1_P1_HISTORICAL_EXIT_GATES_20261122.json) detalla seis requisitos para M1 y seis para P1. Cada requisito tiene `status: missing` y `authoritativeProofRef: null`, por una razón concreta: ningún documento histórico inspeccionado prueba físicamente estos elementos.

| M1 — pendiente | P1 — pendiente |
| --- | --- |
| Salida peatonal pública específica desde el frente comercial | Límite y salida peatonal concreta de la plaza |
| Situación real de puerta y fachada de Café Bruma | Separación comprobada de áreas terminales o tránsito restringido |
| Titularidad pública o servidumbre utilizable en la línea propuesta | Titularidad pública o servidumbre utilizable |
| Aceras, cruces, bordillos y anchura de paso | Cruces, bordillos y separación efectiva del tráfico |
| Conflictos de edificios, entregas y servicios | Anchura peatonal continua sin obstrucciones |
| Pendiente y accesibilidad medidas | Pendiente y accesibilidad medidas |

**El estado correcto es `BLOCKED_PHYSICAL_EXIT_NOT_ESTABLISHED`, no «calle cerrada», «calle inexistente» ni «camino aprobado».** Las doce condiciones pendientes son requisitos de comprobación y no hechos físicos negativos. Que se disponga de un anclaje, un sitio público o un dibujo de acera no prueba el derecho de paso. Estos son planos de un mundo ficticio; aquí «evidencia de derecho de paso» significa una decisión urbanística interna debidamente documentada, no una búsqueda de escrituras del mundo real.

## Integridad y custodia de las fuentes

Para que la investigación no dependa de la permanencia de cabezas de ramas históricas se archivaron **sin modificar los bytes** dos fuentes independientes:

| Fuente | Archivo incorporado | Git blob original |
| --- | --- | --- |
| PR #40 Market–Crosswater | `SOURCE_PR40_MARKET_CROSS_ACCESS_20261122.json` | `904983876226ba82451bf9e3b5d6aed8e7885d6a` |
| PR #54 Plaza–Terminal | `SOURCE_PR54_PLAZA_TERMINAL_ACCESS_20261122.json` | `8f687b97adecd3c03a4b962ef539f0b058520f0f` |

Ambas copias se cotejaron con su HEAD original y se releyeron en la rama de trabajo. El módulo exige asimismo los archivos ya preservados de PR #44 (`e8efe8e5f6a746ab4e628f76a9deb5f71061010d`), PR #56 (`a5ac772922b4717797118b15f182207be1d1a7fb`) y la evidencia actual M1/P1 de PR #126 (`464bb09f77c4c01b3c75ee2dccfc13b0b2dfafba`).

El validador [`tools/meridian_m1_p1_historical_exit_gates.mjs`](../../tools/meridian_m1_p1_historical_exit_gates.mjs) reconstruye la matriz a partir de los datos y exige igualdad con el documento controlado. Rechaza cambios silenciosos en el origen de las rutas, cruces de referencias, admisión pública, propiedad o condiciones pendientes. La inspección devuelve una copia defensiva y no escribe el guardado. Las [16 regresiones](../../tests/meridian_m1_p1_historical_exit_gates.test.mjs) prueban fuentes, subtramo exacto, diferencia plaza–terminal frente a plaza–puerto, requisitos, falsificación, conectividad y cinco blobs narrativos protegidos.

## Ruta de resolución recomendada

Primero resolver **M1-SOURCE-EXIT** y **P1-PLAZA-EXIT** mediante una propuesta editorial con fuente y justificación: identificar el límite del espacio público y el punto desde el cual un corredor **podría** comenzar, preservando accesos de comercios y terminal. Después validar servidumbre interna, conflictos de circulación/edificios, cruces, anchura, pendiente y continuidad. Solo entonces es razonable diseñar un fragmento físico con polígonos y conexiones verificables. Sin estos insumos, mover puntos o inventar fachadas sería maquillaje geométrico.

**QA de integración requerida:** Node completo, Python, checkpoint, inventario y cinco blobs canónicos en el SHA final; una PR temporal solo de CI contra `main` debe cerrarse sin merge. No usar una CI de PR #126 ni de las fuentes históricas como validación automática de esta rama.

**Límite explícito:** el grafo de sitios existentes no se altera; no se crean ni borran `LOC-*`; no se cambian horas, tráfico, NPC, Jack, capítulos o sucesos. La frontera portuaria y el acceso físico permanecen abiertos.
