# Meridian Bay — alternativas físicas conceptuales para las salidas M1 y P1 (22-11-2026)

**Estado:** estudio reversible de organización espacial. **Sin** geometría certificada, propiedad establecida, anchuras medidas, calles construidas ni rutas admitidas en el guardado. Se mantienen los 12 requisitos de prueba **pendientes** de la [auditoría histórica M1/P1](MERIDIAN_BAY_M1_P1_HISTORICAL_EXIT_GATES_20261122.md); la existencia de conexiones en `game/STATE.json` no demuestra accesibilidad peatonal por una línea del boceto.

**Rama:** `work/meridian-m1-p1-interface-concepts-20261122`, derivada del commit `3a38d41d745075373170b790c1aab92cf8da4785` de [PR #136](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/136). Cadena previa #136 → #126 → #122 → #112 → #103 → #89 → #87 → #86. La [PR #132](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/132) ya hizo el **estudio en planta con rectángulos y SVG** sobre la PR #122; este incremento **no** lo duplica ni modifica sus fuentes. #110 y #112 tienen un conflicto de informe hermano que debe reconciliarse antes de cualquier integración de ambas ramas.

## Qué se puede proponer sin falsificar el mundo

La fuente solo aporta los límites ilustrativos de M1 `(58.869565,42) → (60,40.7)` y P1 `(65,42) → (66.9,40.6)`, referencias aproximadas de comercios y terminal y doce requisitos que nadie ha resuelto. El siguiente nivel de diseño **sí** puede especificar relaciones funcionales entre frentes públicos, peatones y tráfico. **No** puede situar los elementos en parcelas, elegir lados cardinales, afirmar su existencia ni declarar una vía abierta.

Por ello el documento estructurado [`MERIDIAN_BAY_M1_P1_INTERFACE_CONCEPTS_20261122.json`](MERIDIAN_BAY_M1_P1_INTERFACE_CONCEPTS_20261122.json) proporciona **cuatro opciones a nivel de sección transversal conceptual** con cinco componentes cada una. Los nombres `existing_*` indican la existencia **del lugar en el grafo o del espacio público narrativo**, no la existencia de un carril, puerta o límite parcelario medido; `unverified_*` y `proposed_*` siguen siendo hipótesis. Los cinco componentes no tienen posición ni orientación fija y su orden no constituye una calzada real.

| Opción | Esquema de organización por examinar | Ventaja a investigar | Riesgo aún sin resolver |
| --- | --- | --- | --- |
| **M1-A: franja comercial separada** | Market Row conocido → puertas y entregas por ubicar → posible franja peatonal → separación de carga → continuación M1 sin plano | Conserva la identidad comercial del distrito sin asumir paso por Café Bruma | Las puertas de negocios, vehículos de carga y anchura de paso se desconocen |
| **M1-B: alternativa periférica** | Área comercial conocida → posible borde público → cruce a estudiar → posible franja peatonal perimetral → continuación M1 | Podría evitar interferir con entradas y entregas si se encuentra una franja pública | No se conoce un borde de dominio público ni un cruce habilitado |
| **P1-A: perímetro de plaza separado de terminal** | Plaza pública existente → límite exterior por localizar → separación de operaciones → posible franja peatonal → continuación P1 | Investiga un acceso exterior sin convertir el andén o la terminal en atajo | Límite de plaza, tráfico y propiedad aún sin documentar |
| **P1-B: cruce segregado de plaza** | Plaza pública existente → cruce por ubicar → posible cruce peatonal protegido → separación del tráfico → continuación P1 | Permite evaluar un tratamiento explícito de conflicto peatonal–vehículo | No se sabe si el cruce cabe, es público, accesible o está permitido |

**Prioridad de investigación, no elección de construcción:** empezar por **M1-A y P1-A**, por poder estudiar directamente las fronteras de los lugares ya documentados; mantener **M1-B y P1-B** como comparadores si las soluciones principales se vuelven inviables. La elección de una prioridad **no implica preferencia por un trazado físicamente factible**. Si las condiciones de propiedad, puerta, cruce o accesibilidad fallan, las alternativas deben revisarse, no forzar la geometría.

## La frontera entre propuesta física y aprobación

Para las cuatro opciones: `fixedGeometry = null`, `polygon = null`, `measuredWidthMeters = null`, `pathDistanceKm = null`, `walkingTimeMinutes = null`, `canNavigate = false` y `selectedForBuild = false`. No se concede acceso público ni paso por Café Bruma, zona operativa de la terminal o instalaciones portuarias. La ruta de Market–Harbor y la ruta de Plaza–Harbor siguen siendo vínculos del **grafo narrativo**, no carriles nuevos. M2, P2 y M3 siguen sin cartografiar.

Cada opción arrastra las **seis condiciones de admisión de su subsección**, y además destaca las cuatro más relevantes para comenzar una revisión: salida específica, conflictos comerciales y de carga en M1, límites de terminal y cruce en P1. Para aspirar a una propuesta física ubicable, se necesita decisión interna de planeamiento con evidencia de fachada, perímetro parcelario, paso público, separación de vehículos, pendiente, anchura y ausencia de conflictos con edificios existentes o previstos. Son condiciones de **un mundo ficticio**, no solicitudes de títulos de propiedad reales.

No se adoptan anchos o pendientes normativos del mundo real como si Meridian Bay tuviera una jurisdicción, ley de accesibilidad o escala métrica confirmada. Si el propietario posteriormente define la época, autoridad urbana y unidades, se podrá derivar un contrato medible y someterlo a pruebas.

## Protección de fuentes y de otros agentes

El validador [`tools/meridian_m1_p1_interface_concepts.mjs`](../../tools/meridian_m1_p1_interface_concepts.mjs) verifica antes de generar cada opción tres fuentes independientes por SHA de **Git blob**:

| Fuente | SHA |
| --- | --- |
| Registro de doce requisitos PR #136 | `c4fb60f05c605e031a753b7f5cfc6a2c89d495bb` |
| Sección 04 original PR #122 | `a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b` |
| Cruce de evidencias M1/P1 PR #126 | `464bb09f77c4c01b3c75ee2dccfc13b0b2dfafba` |

El nuevo registro se **regenera determinísticamente** del estado de fuentes. Comprueba que los doce requisitos siguen sin evidencia, que las cinco secciones del estudio siguen no navegables y que no han aparecido parcelas, aprobaciones o edificios no registrados. La vista pública de revisión devuelve un clon, no modifica `STATE`.

La suite [`tests/meridian_m1_p1_interface_concepts.test.mjs`](../../tests/meridian_m1_p1_interface_concepts.test.mjs) incluye **16 pruebas**, entre ellas integridad de fuentes, diferenciación M1-A/B y P1-A/B, posiciones originales de las líneas de estudio, seis condiciones pendientes por opción, rechazo de geometría, ancho o propiedad inventados, ausencia de navegación y verificación de los cinco archivos originales de la partida.

## Próximo trabajo verificable

1. **M1:** identificar con fuentes de mundo o decisión editorial el lado público de Market Row y posición aproximada de accesos de Café Bruma y entregas; especificar dónde *podría* caber una franja peatonal sin pasar por negocios.
2. **P1:** distinguir en una nueva propuesta la superficie pública de la plaza, acceso a terminal y zonas de tráfico/reserva; verificar condiciones de un paso hacia el exterior.
3. **Luego:** revisar M2, P2 y M3 antes de dibujar una calle completa. La omisión de edificios en una zona no cartografiada **no** demuestra terreno vacío.
4. **Integración:** reconciliar los cambios de informes hermanos (#110/#112), las ramas de estudio (#126/#132/#136) y el registro de fuentes antes de fusionar; verificar pruebas exactas del commit final y preservar los blobs de historia.

**Puerta final:** esta propuesta no es una prueba de ruta física ni una autorización de mapa. La PR debe permanecer en borrador mientras carezca de evidencia suficiente y cualquier QA temporal contra `main` debe cerrarse sin fusión.
