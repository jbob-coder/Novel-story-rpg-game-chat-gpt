# Meridian Bay — M1 Market Row: franja de estudio y prueba de la costura Land 03 (2026-11-22)

**Estado:** análisis geométrico **reversible y NO CANÓNICO** de la salida de Market Row. Se propone una zona gráfica en torno al **primer tramo ya dibujado** de la ruta Market→Harbor; **no** existe evidencia de acera física, derecho de paso, anchura, titularidad de terrenos, puerta, circulación segura o accesibilidad. Ninguna cifra es una medida de obra o una distancia real. La partida sigue en CH-000, turno 9.

**Rama:** `work/meridian-market-m1-frontage-clearance-20261122`, basada en [PR #142](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/142) HEAD `ef6c3340446d21704608c678d04a5eeb2f64eb6b`, apilada sobre #136 → #126 → #122 → #112 → #103 → #89 → #87 → #86. La rama paralela [PR #146](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/146) está estudiando el **frente de Crosswater Plaza (P1)**; no se modifica ni se duplica. La [PR #132](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/132) ya publicó rectángulos de búsqueda y SVG de M1/P1; este incremento se limita a **cribado geométrico del tramo M1**.

## Pregunta técnica investigada

¿Dónde podría revisarse la separación relativa entre un futuro paso peatonal, fachadas y entregas de Market Row sin inventar sus posiciones?

La PR #44 conservada como fuente dibuja su primer tramo `(58,43) → (60,40.7)`; el registro Sección 04 de PR #122 **recorta** la parte sin plano en el límite `y=42`, dejando M1 desde `(58.869565,42)` hasta `(60,40.7)`. Es una operación geométrica comprobable, **no** una calle autorizada. La longitud central de M1 en unidades del lienzo es aproximadamente `1.722754`. El primer fragmento Land 03 termina en `y=42`, y su trazado Market–Plaza es una **hipótesis de conectividad**, no un plano de bordillos.

El archivo [`MERIDIAN_BAY_MARKET_M1_FRONTAGE_ENVELOPE_20261122.json`](MERIDIAN_BAY_MARKET_M1_FRONTAGE_ENVELOPE_20261122.json) incluye tres cuadriláteros generados por desplazamientos **perpendiculares a la línea de M1**, calculados a partir de sus coordenadas históricas. Los valores son en **unidades abstractas del lienzo 100×80**, seleccionados para investigar gráficamente; **0.12 unidades NO significan 0.12 m ni garantizan anchura legal o peatonal**.

| Franja de investigación | Desplazamiento gráfico respecto del eje | Función de estudio | Superficie de dibujo que solapa el rectángulo de estudio Land 03 |
| --- | --- | --- | ---: |
| M1-CLEAR-STRIP-INQUIRY | −0.12…+0.12 unidades | Hipótesis de franja peatonal, sin certificar paso | **0.006261** unidades de lienzo² |
| M1-LATERAL-A-INQUIRY | +0.12…+0.45 unidades | Zona lateral para buscar conflictos de fachadas, puertas o entregas | **0.081782** unidades de lienzo² |
| M1-LATERAL-B-INQUIRY | −0.45…−0.12 unidades | Segunda zona lateral, sin afirmar que un café esté de este lado | **0** unidades de lienzo² |

**Hallazgo geométrico nuevo:** aunque la **línea central** de M1 solo **toca** Land 03 en su extremo de inicio, la franja peatonal ilustrativa y una zona lateral **sí se adentran en el rectángulo de estudio Land 03**. Sería incorrecto considerar toda la huella lateral «fuera de los planos» por la cobertura de la línea central, o considerar el pequeño solapamiento «calle pública ya estudiada». Ningún rectángulo representa una parcela o fachada medida.

Los tres cuadriláteros quedan dentro del amplio **sobre de atención de Market Row** (`MB-FOCUS-MARKET`) que figura en el plan de escala urbano; ese sobre tampoco tiene límites catastrales aprobados. El dibujo no fija lado cardinal, material, pendiente, acceso comercial, parada de entrega ni nueva geometría de edificios.

## Cribado de los doce edificios históricos Land 03

El módulo intersecta geométricamente cada franja con los **12 polígonos candidatos** de `SOURCE_PR69_LAND_03_20261120.json`. Cuenta como contacto tanto los cruces de bordes como el contacto tangencial o la inclusión completa. **Resultado del registro actual: 0 contactos de las tres franjas con esos 12 polígonos**.

Esta constatación es estrictamente de las **formas candidatas registradas** dentro de **Land 03**. M1 se encuentra esencialmente **fuera del área cartografiada**; sus fachadas, callejones, muros y parcelas reales del mundo ficticio siguen siendo desconocidos. **Cero cruces con los 12 edificios históricos no significa espacio vacío, paso legal, anchura adecuada ni ruta segura.** Ninguna forma de edificio fue trasladada para «hacer caber» el corredor.

Las referencias aproximadas a Café Bruma, Market Row y la galería de servicios conservan su incertidumbre del plan antiguo. Ni el centro de un negocio ni su `public_area` demuestran dónde están sus puertas o sus zonas de carga. La PR #40 documenta que la esquina de Café Bruma y la trayectoria precisa de la luz del terminal siguen sin determinar; la franja no puede convertirse en un muro o fachada que contradiga esa escena.

## Valor práctico para el desarrollo

La opción **M1-A** de PR #142 puede estudiarse primero: mantener separadas, a nivel de diseño, la circulación de peatones y las entradas/operaciones comerciales; comparar después **M1-B** si no aparece un límite público compatible. Se prohíbe seleccionar una franja construida, inventar una servidumbre o convertir cualquiera de estas coordenadas en navegación **hasta satisfacer los seis requisitos pendientes de M1** del informe histórico #136. P1 y M2/P2/M3 quedan intactos.

Próximo paso con valor de ingeniería: documentar una **propuesta editorial de límite público** con evidencia de fachadas y usos de suelo entre Market Row y el borde y=42; inspeccionar puertas, entregas, aceras, cruces y pendientes. Una vez exista esa decisión, evaluar la factibilidad geométrica **contra el nuevo fragmento de edificios** y rehacer las pruebas con SHA de fuente nuevo. Sin nuevas fuentes, seguir aumentando el ancho gráfico sería especulación, no desarrollo del mundo.

## Evidencia exacta y verificador

[`tools/meridian_market_m1_frontage_envelope.mjs`](../../tools/meridian_market_m1_frontage_envelope.mjs) lee y exige estos seis Git blobs de forma inmutable:

| Procedencia | SHA de Git blob |
| --- | --- |
| Conceptos M1/P1 PR #142 | `593b332e69e4eecdfeaa5217ad7464a230e1bad2` |
| Sección 04 PR #122 | `a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b` |
| Ruta Market→Harbor PR #44 | `e8efe8e5f6a746ab4e628f76a9deb5f71061010d` |
| Frente Market–Crosswater PR #40 | `904983876226ba82451bf9e3b5d6aed8e7885d6a` |
| Interior Land 03 PR #69 | `2a95eb9e50f69436cb65711daf8ff586f4ef4279` |
| Plan de escala urbano | `2e8c5ff412436a6e7d526bc0172adfca77107263` |

El código incluye recorte de polígonos a un rectángulo, detección inclusiva de contactos de polígonos (incluidas tangencias y contención), creación determinista de cuadriláteros de investigación y validación por igualdad del JSON generado. Rechaza fuentes alteradas, líneas nuevas, edificio candidato que interseca la franja, una ruta aprobada falsamente o modificaciones a la estructura actual de rutas. La inspección es **read-only** y devuelve un clon. La suite [`tests/meridian_market_m1_frontage_envelope.test.mjs`](../../tests/meridian_market_m1_frontage_envelope.test.mjs) añade **20 regresiones** de geometría, fronteras, solapamiento, fidelidad, sabotaje de datos, inventario y preservación de los cinco blobs narrativos.

**Integración:** correr suites Node, Python, checkpoint e inventario en el **commit exacto final** mediante espejo temporal de QA contra `main`, cerrándolo sin fusionar; revisar los cinco blobs de partida. Mantener esta rama **draft** y no convertir una sugerencia gráfica en un corredor jugable.
