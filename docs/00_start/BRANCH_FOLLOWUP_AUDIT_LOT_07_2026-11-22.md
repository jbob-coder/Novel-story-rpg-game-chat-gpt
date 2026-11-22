# Lote 07 — Verificación de ramas nuevas, dependencias y QA de Meridian Bay (2026-11-22)

**Repositorio:** [jbob-coder/Novel-story-rpg-game-chat-gpt](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt).  
**Rama de esta adenda:** `docs/branch-followup-lot07-20261122` creada desde la rama de auditoría de [PR #83](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/83) en `5db66f51265dcb86d80f12cd80f4c567f5a4bb4a`. **No es una modificación de main ni de la partida.**  
**Base de comparación de las ramas productivas:** `main@019175c6463ff31807a0f7013d91299add94913c`. El comparador GitHub confirmó `main` idéntico a ese SHA, 0 commits de diferencia.  
**Alcance:** verificación externa de PR, HEAD, diferencias de archivos, ascendencia, fuentes por blob y CI histórica sobre commit exacto. No se vuelven a ejecutar las 108 suites históricas ni se revalida cada uno de sus 108 HEAD en esta adenda. Véanse los lotes 01–06 y el JSON de la PR #83 para el inventario completo.

## 1. Registro por rama de seguimiento

| PR / rama (HEAD comprobado) | Base; diff comprobado | CI y dictamen |
| --- | --- | --- |
| [#82](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/82) `work/npc-causal-agenda-20261120` @ `53f6dcb77965a62cf896be22cd1d97cef2088761` | `main`; 6 rutas (agenda, diagnóstico, test, documentación e índices); 0 rutas `game/` y `chapters/`. | [Run 44792327502](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44792327502) `completed/success`; draft. Contratos causales y privacidad requieren revisión antes de integrar. |
| [#83](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/83) `docs/live-branch-verification-20261120` @ `5db66f51265dcb86d80f12cd80f4c567f5a4bb4a` | `main`; 14 rutas de inventario, suites de auditoría, índices y evidencia; 0 archivos de partida. | [Run 44802352081](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44802352081) `completed/success`; draft. La auditoría previa cubre 108 ramas históricas + cinco referencias preexistentes adicionales. |
| [#84](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/84) `work/meridian-grocery-frontage-admitted-20261120` @ `ea0dcea84ff851af762454d13241fc3d597b58cc` | `main`; 8 rutas: validador y test de acceso al supermercado ya admitido, boceto de frente e índices. | [Run 44804587891](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44804587891) `completed/success`; draft. No implica apertura del local, viaje ni visita. |
| [#85](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/85) `work/meridian-clinic-frontage-admitted-20261120` @ `dc4bb38858aa271f5b5470dfe7322015ce2eca48` | `main`; 8 rutas: validador y test de frente de clínica ya admitida, boceto e índices. | [Run 44809457137](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44809457137) `completed/success`; draft. No prueba servicios médicos disponibles ni movimiento. |
| [#86](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/86) `work/harbor-coast-fragment-review-20261120` @ `79cca5c6f9106b904c5fb371fea28e183b9509ad` | `main`; 13 rutas de boceto, generador SVG, pruebas y documentación; 0 archivos de partida. | [Run 44811439451](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44811439451) `completed/success`, 445 Node, 47 Python y checkpoint PASS según el registro de PR. **BLOQUEADA para aprobación física:** quedan conflictos de calle y edificio en el dibujo. |
| [#87](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/87) `work/meridian-three-region-seam-qa-20261120` @ `3a923dab989c046b186370d2f441ad4a545c6c2f` | **Apilada sobre #86** @ `79cca5c6…`, no sobre `main`; diff exclusivo de 13 rutas, seis fuentes JSON preservadas, inspección de costuras y 16 tests. | [Run 44813211142](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44813211142) `completed/success` sobre SHA exacto mediante QA temporal #88, 461 Node, 47 Python y checkpoint PASS según el registro de PR. Draft; **no fusionar independientemente de #86**. |
| [#88](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/88) `qa/meridian-three-region-seam-ci-20261120` @ `3a923dab989c046b186370d2f441ad4a545c6c2f` | El comparador de Git devuelve **identical** frente a la rama #87 (0 commits/archivos exclusivos). Base PR a `main` solo para ejecutar QA. | **Cerrada, no fusionada.** No es séptima implementación independiente. La corrida pertenece al mismo commit de #87. |

**Evidencia de CI:** además del estado general `success` consulté los jobs de las corridas #44802352081, #44804587891, #44809457137, #44811439451 y #44813211142. En cada una, los pasos `JavaScript unit and integration suites`, `Python regression suite` y `Verify canonical saved checkpoint` figuran `success`. Las cantidades de pruebas citadas son del registro de PR, no se han reconstruido a partir de logs línea por línea en esta revisión.

**Protección del guardado:** los diffs revisados de #82–#86 frente a `main`, y el diff exclusivo de #87 frente a #86, no cambian rutas `game/`, `chapters/` ni el journal. La rama #88 es idéntica a #87. Esta comprobación de diferencias Git no sustituye un test de efectos en ejecución, pero prueba que estas PR no presentan cambios de archivo de estado/historia en sus respectivos diffs.

## 2. Custodia independiente de las seis fuentes del análisis regional

Se leyeron **dos veces por ruta**: copia archivada en #87 y archivo en commit original. Los **seis SHA Git blob coinciden exactamente** con los citados por el autor de la PR. Las copias no son un mapa jugable.

| Fuente original fijada por commit | Copia archivada en #87 | SHA Git blob confirmado |
| --- | --- | --- |
| #67 `8bdf34c5eddf4e12e34352018b2a893cb9a14056`, costa 01 | `SOURCE_PR67_COAST_01_20261120.json` | `7cb79b2113bfef7b7fbbc39539c17fd80a275cd7` |
| #67 mismo commit, costa 02 | `SOURCE_PR67_COAST_02_20261120.json` | `325a0acde67a1ce3b44576860824657a3db41695` |
| #69 `f424538e03755b62b91c6b589e9a121cc10019d3`, interior 03 | `SOURCE_PR69_LAND_03_20261120.json` | `2a95eb9e50f69436cb65711daf8ff586f4ef4279` |
| #44 `1b51a0050deb95309b4380768cb13a3139019dbc`, Market–Harbor directo A | `SOURCE_PR44_MARKET_HARBOR_20261120.json` | `e8efe8e5f6a746ab4e628f76a9deb5f71061010d` |
| #58 `b11332aa53796717cf299bebccf043d72620220e`, Market–Harbor directo B | `SOURCE_PR58_MARKET_HARBOR_20261120.json` | `280a444f6eed99a33027aea2edb48af70cc67bd0` |
| #56 `199b3843085d8b4b2ab92739357263d598757331`, Plaza–Harbor | `SOURCE_PR56_PLAZA_HARBOR_20261120.json` | `a5ac772922b4717797118b15f182207be1d1a7fb` |

La lectura comparativa recursiva de los archivos costa 01 originales (#66 @ `d5f8af27779aa49ecfa082e091f6bb57308a146a`) y corregidos (#67) confirmó **exactamente tres cambios escalares**, ninguno más:

1. `land_use_patches[1].polygon[3].x`: `72.5 → 72.25`.
2. `street_alignments[2].points[3].y`: `39.1 → 39.95`.
3. `street_alignments[2].points[4].y`: `38.9 → 39.3`.

La costa 01 de #86 es otra variante: añadió vértices al polígono de muelles pero no corrigió el trazado `HC-A-OLD`. Según las pruebas y revisión geométrica de #87, en la variante #86 hay **dos cruces estrictos calle–edificio más un punto interior** contra `HC-B-02`; en la alternativa #67 no aparecen esos tres conflictos. Esta conclusión está soportada por las pruebas del autor y la CI de #87; **no** es una inspección topográfica independiente ni autorización de obra/navegación.

Las costuras exactas registradas en los bocetos son (75.1, 42) costa 01/02; (68.1, 43.8) y (68.2, 46.65) costa 02/interior 03. Los recorridos directos #44 y #58 son candidatos alternativos distintos; ninguno puede declararse correcto solo porque encaje con un boceto. #56 aún atraviesa dos bordes del edificio candidato `HC-B-01`. El grafo de lugares guardado es una autoridad separada de estas coordenadas.

## 3. Dictamen y orden de trabajo

1. **Conservar #83 como auditoría original, no mezclar su inventario de 108 con nuevas PR.** Esta adenda añade trazabilidad de los desarrollos posteriores sin alterar sus registros por SHA ni declarar 108 suites aprobadas.
2. **No fusionar #86 ni #87 como mapa físico aceptado.** #87 depende de #86 y el conflicto del edificio `HC-B-02` sigue registrado en el padre. Priorizar una variante aislada de la corrección mínima #67 con SVG sincronizado a JSON, y compararla con #86 bajo nuevas pruebas de intersecciones.
3. **Mantener rutas #44/#58 y #56 como decisiones abiertas.** No inventar cruces, calles transitables, acceso a comercios, tiempos ni conocimiento del jugador.
4. **Revisar #82, #84 y #85 por separado.** El `success` de CI no demuestra por sí solo contrato de privacidad y persistencia de agenda, ni acceso físico confirmado a clínicas/tiendas.
5. **Preservar `main`, los cinco blobs canónicos, `CH-000` turno 9 y todos los archivos del journal.** No se fusionó ni se ejecutó un turno de historia durante este lote.

**Limitación de ejecución de esta adenda:** no hubo checkout local de GitHub (red inaccesible desde el contenedor de ejecución), ni suite nueva en esta rama de documentación. Las pruebas reportadas son corridas GitHub Actions históricas verificadas por SHA y jobs. Para declarar lista esta PR documental, revisar el diff propio, ejecutar su pipeline sobre el commit final y confirmar el índice/inventario; no presentar el `success` de otra PR como prueba de este nuevo HEAD.
