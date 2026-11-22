# Meridian Bay — Sección 04, evidencia de las entradas M1 y P1 (22 de noviembre de 2026)

**Estado:** investigación técnica de conexiones *narrativas conocidas* frente a accesos físicos **aún desconocidos**. **No es** la creación o admisión del fragmento físico 04. Las cajas coloreadas del SVG son solo los límites matemáticos de dos líneas de estudio; no son manzanas, parcelas ni calles.

**Rama independiente de revisión:** `work/meridian-section04-m1-p1-frontage-gate-20261122`, iniciada exactamente en [PR #122](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/122) `1daa0e8de0859bbab03361342908a265d309b86a`. PR #122 depende de #112 → #103 → #89 → #87 → #86. Todo sigue **en borrador**, sin fusiones ni efectos sobre `main` o la partida.

## Motivación y separación de autoridades

El registro de PR #122 identifica cinco tramos sin estudio físico: M1, M2, M3, P1 y P2. Los trabajos sobre **M1** y **P1** deben comenzar revisando fuentes existentes, no insertando edificios o asumiendo servidumbres para completar artificialmente el plano.

Se contrastaron los archivos **canónicos** `game/STATE.json`, `game/STARTING_LOCATIONS.md`, `chapters/CH-000.transcript.json`, el catálogo admitido de seis establecimientos, la escala de ciudad hipotética, el registro de PR #122 y la geometría histórica **no admitida** del fragmento terrestre 03 (PR #69). La nueva herramienta comprueba los siete **Git blobs exactos** antes de interpretar hechos.

| Fuente | Git blob verificado | Alcance de la autoridad |
| --- | --- | --- |
| `game/STATE.json` | `3f4e9c98a7211068faafd31d0a0acbd4260ef589` | Lugares y relaciones de vecindad **existentes**, no calles |
| `game/STARTING_LOCATIONS.md` | `0c1717e8f63d86e95e1aed431927f5a092c5b061` | Contexto urbano de apertura, plaza, comercio y puerto |
| `chapters/CH-000.transcript.json` | `1350916ead7fb1f2f15fdd635dda42e69a0a3fed` | Viaje relatado y resplandor del terminal percibido desde Café Bruma |
| `MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json` | `a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b` | Líneas desconocidas M1/P1 tomadas de PR #122 |
| `SOURCE_PR69_LAND_03_20261120.json` | `2a95eb9e50f69436cb65711daf8ff586f4ef4279` | Borrador físico previo Land 03 y traza Market–Plaza |
| `MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json` | `2e8c5ff412436a6e7d526bc0172adfca77107263` | Cuadrícula ilustrativa **sin** referencia geográfica |
| `MERIDIAN_BAY_PREBUILT_DESIGN.json` | `014586f9c2996501f3bf16b9bfb8aebaf44fd462` | Lugares comerciales admitidos, sin acceso costero localizado |

**Limitación fundamental:** un local accesible al público o una plaza pública en el mundo narrativo no demuestra en qué parcela, puerta, fachada, valla, calle o cruce peatonal pasa el camino hacia Harbor Walk. Los enlaces `LOC-` Market ↔ Harbor y Plaza ↔ Harbor no constituyen ejes de calles medidos.

## M1 — salida de Market Row

- **Ancla de lugar existente:** Market Row (`LOC-COMMERCIAL-DISTRICT`), con referencia ilustrativa histórica `(58,43)`.
- **Salida de la caja Land03:** `(58.869565,42)`, desde donde la línea de estudio sin cobertura llega a `(60,40.7)`; la caja de búsqueda incluye únicamente x=58.869565..60 y y=40.7..42.
- **La traza histórica `MX-A-MARKET-PLAZA`:** comienza en `(58,43)` y termina en Crosswater `(65,42)`. Es `existing_topology_sketch`, **no** una bifurcación física confirmada hacia Harbor Walk ni una calle legal probada.
- **Hechos de historia:** Market Row contiene comercio normal y entregas. Jack llegó a Café Bruma desde Crosswater, y el resplandor del terminal era perceptible desde la zona del café. Este último detalle exige revisar posibles alturas, reflexión o corredores visuales **antes** de ubicar edificios en la región.
- **Sin verificar:** puerta o salida peatonal precisa, división público/privado, posible traza histórica cerrada, parcelas, fachadas, cruce vial, anchura de paso, altura de construcción y visibilidad.

## P1 — salida de Crosswater Transit Plaza

- **Ancla conocida:** `LOC-CROSSWATER-PLAZA`, plaza de uso público. Referencia de dibujo `(65,42)`. El terminal está adyacente, pero eso no transforma la plaza en una entrada portuaria.
- **Geometría desconocida:** línea de estudio `(65,42) → (66.9,40.6)`, con caja mínima x=65..66.9 y y=40.6..42, **no** rectángulo de terreno despejado.
- **Cruce entre planos:** el mismo punto `(65,42)` coincide en la propuesta Land03 con el final de `MX-A-MARKET-PLAZA` y el comienzo de `MX-A-PLAZA-TERM`. Esa coincidencia conserva el lugar, **no** certifica otra calle hacia la costa ni un paso separado de buses/trenes.
- **Sin verificar:** ubicación de un cruce público hacia Harbor Walk, separación entre tránsito rodado y peatones, cerramientos, servidumbres, parcelas, visibilidad del puerto, accesibilidad, anchura y edificios.

## Entregables implementados

El [JSON de evidencia M1/P1](MERIDIAN_BAY_SECTION04_M1P1_ENTRY_EVIDENCE_20261122.json) contiene únicamente los hechos que salen de los archivos anteriores, referencias exactas de sección, cajas de búsqueda derivadas de los extremos y datos desconocidos como **`null`**, nunca como listas vacías que aparenten parcelas limpias. Los dos accesos tienen `canNavigate:false`.

El [SVG de estudio de accesos M1/P1](MERIDIAN_BAY_SECTION04_M1P1_ENTRY_EVIDENCE_20261122.svg) contrasta el fragmento histórico Land03 y sus edificios candidatos originales, las dos trazas históricas hacia Crosswater y **dos líneas de investigación** rojas. Los dos rectángulos rojizos son *solo* cajas de búsqueda calculadas. La parte en blanco **no** significa que no haya edificios; la costa y la zona portuaria tampoco quedan autorizadas para uso.

[`tools/meridian_section04_m1p1_entry_evidence.mjs`](../../tools/meridian_section04_m1p1_entry_evidence.mjs) deriva el registro JSON exactamente de fuentes fijadas, verifica todos los enlaces y protege frente a fingir servidumbres, construcciones, accesibilidad, ubicaciones o tiempo de la partida. La figura se genera sin dependencias y se comprueba byte a byte. Para regenerarla voluntariamente: `node tools/meridian_section04_m1p1_entry_evidence.mjs --write`. La importación y las pruebas son **solo lectura**.

[`tests/meridian_section04_m1p1_entry_evidence.test.mjs`](../../tests/meridian_section04_m1p1_entry_evidence.test.mjs) aporta **14 regresiones**: huellas de fuentes, los dos accesos, condiciones de historia, integridad del grafo, rechazo de derechos de paso fingidos, todos los puntos de los caminos y edificios visibles en el SVG, regeneración exacta, copia profunda y preservación de CH-000.

## Criterios para pasar de este estudio a un fragmento físico 04

1. **M1:** encontrar y justificar con evidencia regional el límite de suelo y la salida real de Market Row, diferenciando la vía hacia Crosswater de la conexión directa a Harbor Walk.
2. **P1:** justificar el acceso peatonal de Crosswater desde la plaza sin inventar pasarelas, cruces de autobuses ni acceso industrial.
3. **Control de continuidad:** todo bloque o edificio propuesto debe incorporar fuentes de diseño, contexto urbano causal y un análisis específico de la luz del terminal perceptible desde Café Bruma.
4. **Después de M1/P1:** abordar M2, P2 y M3 con la misma disciplina de parcelas, derecho de paso, obras antiguas y restricciones del borde portuario; no escoger un camino por simple ausencia de obstáculos modelados.
5. **Aceptación separada:** integrar geometría física en un estudio independiente, probar todas las intersecciones con vecinos y solicitar revisión editorial. No modificar `game/STATE.json`, los capítulos o los cinco archivos de guardado sin el protocolo apropiado.

**Recomendación técnica:** conservar el registro de PR #122 sin cambios y construir los próximos candidatos de geometría a partir de las restricciones M1/P1, distinguiendo los hechos de la historia, los bocetos de rutas y las preguntas todavía abiertas. El proyecto aún **no** dispone de un plano físico completo de la sección 04.


## Evidencia QA ejecutada — 22 de noviembre de 2026

La primera CI sobre el commit `b45c1c948828904b0218457406490af78fd7ebe4` ([Actions #45082992768](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45082992768)) detectó **una única falla de prueba por un SHA esperado mal transcrito en el test nuevo**: el origen real `game/STATE.json` coincidía con el hash correcto y el validador de fuentes no había modificado ningún archivo. Resultado de esa corrida: 534/535 Node; Python y checkpoint quedaron sin ejecutar porque el paso Node falló. La única reparación fue corregir el literal de expectativa del test.

El commit reparado `7368cab4d425dcdff1adf6e283734366b1fe7c0d` se ejecutó mediante el clon de QA temporal [PR #133](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/133), con el **mismo HEAD exacto** que la propuesta [PR #132](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/132). [GitHub Actions #45083089889](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45083089889) resultó **SUCCESS**: **535/535 tests JavaScript PASS**, **47/47 Python PASS**, y **validador de cinco archivos narrativos PASS**. La batería incluye 521 Node heredados y 14 nuevos para M1/P1.

Verificación separada de Git trees en ese commit: `main` 190 archivos, PR #122 226 y PR #132 231; **5 archivos nuevos**, **4 índices/inventario actualizados**, **0 eliminados**; inventario **231/231** sin entradas extra ni faltantes. Los cinco blobs de `game/STATE.json`, `game/SAVE_MANIFEST.json` y `chapters/CH-000.{md,events.json,transcript.json}` siguen idénticos a `main`. La historia permanece en CH-000, turno 9.

**Corte de verificación:** esta nota documental se incorporó **después** del resultado sobre `7368cab4...`. Debe ejecutarse CI de nuevo sobre el HEAD documental final antes de afirmar que todo el contenido fue probado. Ninguna de estas pruebas demuestra que una calle, una parcela o el acceso físico a Harbor Walk esté habilitado.
