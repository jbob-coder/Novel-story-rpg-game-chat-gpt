# Lote 09 — Seguimiento de PR #113–#123, derivados y cambio de base de #112 (2026-11-22)

**Autoridad:** captura puntual de GitHub, sin merge, sin entrada narrativa y sin admisión de nuevas rutas. [Datos estructurados](BRANCH_FOLLOWUP_LOT_09_2026-11-22.json), [regresiones](../../tests/branch_followup_lot09.test.mjs). No representa un registro dinámico. Se toma la rama documental probada [#116](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/116) @ `eb50f8d13bf104a4cee3929d908d8f19e100b218` como padre, sin alterar sus lotes históricos.

## Revisión individual de cuatro aportaciones y siete espejos QA

| PR | Cambio exclusivo observado frente a su base | Base SHA | HEAD SHA | CI de mismo HEAD |
| --- | --- | --- | --- | --- |
| [#114](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/114) — Cobertura Plaza–Harbor entre propuestas | 8 rutas | `b22e05f1c473` | `26560ccc1fb8` | [45082224757](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45082224757) — success |
| [#116](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/116) — Auditoría lot08 de 25 PR | 6 rutas | `fa3fe37ca487` | `eb50f8d13bf1` | [45082103323](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45082103323) — success |
| [#118](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/118) — Proveniencia social NPC entre capítulos | 6 rutas | `bf2edd9c6e86` | `414896744036` | [45082203999](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45082203999) — success |
| [#122](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/122) — Sección 04: 5 subsecciones sin plano físico | 8 rutas | `f2e71276be59` | `1daa0e8de085` | [45082178726](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45082178726) — success |

Los **siete espejos QA** de esta franja no son implementaciones independientes. Cada uno comparte un SHA exacto con la PR correspondiente (el origen #112 para #113 queda fuera del intervalo 113–123):

| PR temporal | Origen y SHA idéntico | Estado observado |
| --- | --- | --- |
| [#113](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/113) | #112 @ `f2e71276be59` | closed, sin merge |
| [#115](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/115) | #114 @ `26560ccc1fb8` | closed, sin merge |
| [#117](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/117) | #116 @ `eb50f8d13bf1` | closed, sin merge |
| [#119](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/119) | #118 @ `414896744036` | closed, sin merge |
| [#120](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/120) | #114 @ `26560ccc1fb8` | closed, sin merge |
| [#121](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/121) | #114 @ `26560ccc1fb8` | closed, sin merge |
| [#123](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/123) | #122 @ `1daa0e8de085` | closed, sin merge |

De **11 fichas de PR**, solo existen **5 ejecuciones GitHub Actions distintas** asociadas a los cinco SHA examinados. Los alias no multiplican la evidencia de pruebas. Cada ejecución consultada terminó `completed/success` para su cabeza correspondiente en la captura, pero este lote no reejecuta suites antiguas.

## Seguimiento de la revisión de PR #112

Entre el corte del lote 08 y esta consulta, la PR #112 avanzó de `616c6155a279bf0126f07ccc46536665179731b5` a **`f2e71276be59fd09ea6684ef4e80232ed2f71f17`**: un solo commit, **nueve líneas añadidas** y cero eliminadas, todas en su informe de cobertura. La cabeza final pasó [CI #45081816210](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081816210). El lote 08 conserva correctamente el corte histórico anterior y **no debe reescribirse** como si el SHA nunca hubiese sido válido.

**Discrepancia de fuente puntual:** la PR #122 depende ya de #112 @ `f2e712...`, pero su informe `MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.md` todavía identifica en la línea «Base Git» el SHA histórico `616c6155...`. Se registró una [observación en #122](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/122) (comentario 7087441989), solicitando aclarar **base actual frente a revisión de origen**. Es una corrección de trazabilidad, no prueba de que sus fórmulas o bocetos estén mal.

## Conflicto de propiedad documental #110/#112

Los dos trabajos proceden de #103, estudian las mismas cuatro fuentes por blob Git y producen la misma cobertura de líneas ilustrativas. #110 aporta `tools/meridian_harbor_region_coverage.mjs` (funciones de recorte, unión y detección de edificios) y **16 pruebas**. #112 aporta `tools/meridian_bay_harbor_region_coverage.mjs`, análisis adicional de bordes, bloqueos/rasgos costeros, un **SVG regenerable** y **19 pruebas**. **No son dos aprobaciones de terreno**. Las dos ramas escriben la misma ruta de informe de cobertura regional con SHA distintos. Se deben evaluar comprobaciones distintas antes de elegir una implementación, no fusionar a ciegas dos módulos casi paralelos.

**Dependencia nueva:** la PR #122 importa funciones de medición de #112 y crea un ledger no canónico para M1, M2, M3, P1 y P2; por tanto, integrar primero #110 en vez de #112 obligaría a resolver el contrato importado por #122. Para conservar continuidad técnica sin imponer una selección narrativa, **la opción de integración preferente a revisar es #112→#122**, reteniendo pruebas no redundantes de #110 solo después de una comparación de bordes y errores. Esto es una recomendación de arquitectura y no una fusión.

**Cadena adicional de NPC:** #108 → #118; añade comprobación de procedencia de conocimiento social entre capítulos cerrados. El CI exacto de #118 aprueba regresiones de su rama, no implica que haya ocurrido nueva interacción de NPC ni autoriza la continuación del turno 9.

**Comparación alternativa Plaza–Harbor:** #106 → #114. #114 verifica relaciones entre variantes de corredor y una fuente de #103; no añade acceso jugable ni equivale a verificar calles no cartografiadas. También modifica los índices comunes usados por varias PR geográficas.

## Puertas de integración

1. Confirmar los **HEAD y bases actuales** de las PR candidatas antes de realizar cualquier integración; este archivo registra únicamente el corte fechado.
2. Resolver la procedencia en #122 e inspeccionar contra #110 las pruebas no duplicadas antes de aceptar #112 como implementación base de la zona no estudiada.
3. Mantener los espejos QA fuera de merges y cerrar solo aquellos bajo custodia de la rama correspondiente tras asegurar evidencia.
4. Reconciliar `docs/FILE_INVENTORY.json`, `docs/01_world/INDEX.md`, `tests/INDEX.md` y `tools/INDEX.md` sin sobrescribir trabajo concurrente; volver a probar todas las suites sobre el **nuevo SHA combinado**.
5. Preservar los cinco blobs de guardado, el journal, las rutas del grafo y CH-000 turno 9. No construir calles, mover al jugador ni crear eventos por el resultado de un boceto.

**Limitación:** `completed/success` en GitHub demuestra la ejecución específica del HEAD indicado, no demuestra cobertura física, corrección de diseño urbano o compatibilidad funcional integral entre ramas hermanas. Los SHA de la partida de la matriz se revalidan por las pruebas de este lote.
