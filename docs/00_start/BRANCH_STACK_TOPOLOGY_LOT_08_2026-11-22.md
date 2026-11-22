# Lote 08 — Auditoría de dependencias de PR #88–#112 (2026-11-22)

**Alcance:** captura verificable de ramas GitHub y comparaciones exclusivas; **no es autoridad flotante**, aprobación de fusiones, admisión física de rutas ni continuación narrativa. [Matriz de SHA, bases, rutas y CI](BRANCH_STACK_TOPOLOGY_LOT_08_2026-11-22.json); [regresión de invariantes](../../tests/branch_stack_topology_lot08.test.mjs). El corte documenta las 25 PR numeradas 88–112, incluyendo espejos QA y una PR sustituida. Las verificaciones proceden de metadatos de GitHub, `compare` y ejecuciones asociadas al SHA exacto; no se reproducen los tests históricamente desde este informe.

**Base revisada:** `main@019175c6463ff31807a0f7013d91299add94913c`; rama documental del lote iniciada desde la integración probada [PR #99](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/99) @ `fa3fe37ca48724f66559cbbc380af1b1a9d0464e`. Los 5 archivos protegidos tienen identidad Git blob documentada en la matriz. CH-000 sigue en turno 9 pendiente de decisión del jugador. Todos los diffs exclusivos de las 13 PR productivas/documentales abiertas en este corte evitan `game/`, `chapters/` y `journal/`.

## Ramas de trabajo y auditoría: estado observado por PR

| PR y alcance | HEAD (12) | Base | Archivos exclusivos | CI coincidente con HEAD |
| --- | --- | --- | ---: | --- |
| [#89](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/89) Coast01 candidata (JSON+SVG) | `964d84698f65` | `work/meridian-three-region-seam-qa-20261120` | 9 | [45069896585](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45069896585) success |
| [#91](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/91) documentación NPC | `206e472fed44` | `main` | 3 | [45069966757](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45069966757) success |
| [#92](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/92) custodia de lotes | `32e847beaff4` | `docs/live-branch-verification-20261120` | 3 | sin ejecución observada |
| [#94](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/94) SVG costero alternativo | `070f36dac9fe` | `work/meridian-three-region-seam-qa-20261120` | 8 | [45070220388](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45070220388) success |
| [#96](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/96) contactos de corredores | `109059cca914` | `work/meridian-coast-pr67-candidate-20261122` | 7 | [45070449859](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45070449859) success |
| [#98](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/98) decisiones NPC | `b858c5c5cd0d` | `work/npc-causal-agenda-20261120` | 8 | [45070633853](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45070633853) success |
| [#99](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/99) integración documental | `fa3fe37ca487` | `docs/branch-followup-lot07-20261122` | 6 | [45081289641](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081289641) success |
| [#101](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/101) comparador rutas | `819a05969659` | `work/harbor-coast-pr67-svg-review-20261122` | 7 | [45070669045](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45070669045) success |
| [#103](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/103) accesos Harbor | `a04712478fad` | `work/meridian-coast-pr67-candidate-20261122` | 9 | [45071254273](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45071254273) success |
| [#106](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/106) variantes Plaza–Harbor | `b22e05f1c473` | `audit/harbor-route-alternatives-20261122` | 8 | [45081371685](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081371685) success |
| [#108](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/108) contactos NPC | `bf2edd9c6e86` | `work/npc-causal-decisions-admitted-20261122` | 9 | [45081562236](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081562236) success |
| [#110](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/110) cobertura territorial | `f93e1e6c097f` | `work/meridian-harbor-corridor-reconciliation-20261122` | 7 | [45081566934](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081566934) success |
| [#112](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/112) cobertura territorial | `616c6155a279` | `work/meridian-harbor-corridor-reconciliation-20261122` | 8 | [45081672029](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081672029) success |

**PR #93**, HEAD `e9a3ff2c8913`, quedó **cerrada sin fusionar** por duplicación controlada: sus tres archivos únicos de evidencia y regresión fueron conservados byte por byte dentro de PR #99. La rama y su historia Git permanecen, y #99 tiene CI combinada sobre el HEAD exacto.

## Espejos de QA: no contarlos como implementaciones

| PR QA | PR de origen | SHA idéntico | Estado en este corte | CI por mismo HEAD |
| --- | ---: | --- | --- | --- |
| [#88](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/88) | #87 | `3a923dab989c` | closed, sin merge | [44813211142](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44813211142) success |
| [#90](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/90) | #89 | `964d84698f65` | closed, sin merge | [45069896585](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45069896585) success |
| [#95](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/95) | #94 | `070f36dac9fe` | closed, sin merge | [45070220388](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45070220388) success |
| [#97](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/97) | #96 | `109059cca914` | closed, sin merge | [45070449859](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45070449859) success |
| [#100](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/100) | #98 | `b858c5c5cd0d` | closed, sin merge | [45070633853](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45070633853) success |
| [#102](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/102) | #101 | `819a05969659` | closed, sin merge | [45070669045](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45070669045) success |
| [#104](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/104) | #103 | `a04712478fad` | closed, sin merge | [45071254273](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45071254273) success |
| [#105](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/105) | #99 | `fa3fe37ca487` | closed, sin merge | [45081289641](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081289641) success |
| [#107](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/107) | #106 | `b22e05f1c473` | closed, sin merge | [45081371685](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081371685) success |
| [#109](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/109) | #108 | `bf2edd9c6e86` | closed, sin merge | [45081562236](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081562236) success |
| [#111](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/111) | #110 | `f93e1e6c097f` | closed, sin merge | [45081566934](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081566934) success |

Los **11 registros QA** no representan once implementaciones nuevas: cada uno comparte exactamente los bytes del HEAD de su PR de origen (o, para #88, de la #87 anterior al corte). Una ejecución disparada desde un espejo QA prueba ese commit, pero no convierte automáticamente en independiente una PR apilada. No fusionar las ramas QA.

## Dependencias reales y puertas de integración

**Documentación:** #83 → #92 → #99. El lote actual se apila después de #99. #92 no muestra ejecución individual para su SHA en la muestra de ejecuciones consultada; el árbol **combinado #99** sí pasó CI en [45081289641](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081289641), con 434/434 Node, 47/47 Python y checkpoint PASS. Confirmar SHA de todos los padres antes de cualquier fusión. No integrar #93 como segundo lote separado.

**NPC:** #82 → #98 → #108. #91 es análisis independiente de compatibilidad. Las pruebas de ramas exitosas no habilitan automáticamente conducta NPC, ni resuelven solas privacidad, persistencia, propiedad del intervalo causal o reejecución frente al turno 9; se requiere revisión del contrato sobre la cadena completa.

**Geografía costera:** #86 → #87 → dos candidatas hermanas **#89** (costa PR67 JSON+SVG) y **#94** (variante SVG). Desde #89 salen #96 (diagnóstico de contactos) y #103 (reconciliación de accesos); desde #94 sale #101 y luego #106 (comparaciones Plaza–Harbor). **No tratar ramas hermanas como una secuencia ni elegir automáticamente un dibujo.** Las rutas #44 y #58 siguen siendo variantes distintas; #56 sigue siendo propuesta. Ninguna de estas PR autoriza rutas jugables ni tiempos de viaje.

**Hallazgo crítico #110 vs #112:** ambas nacen en #103 @ `a04712478fad6ab3f367d3af2eb1f14ee55013e2` y modifican la **misma ruta** `docs/01_world/MERIDIAN_BAY_HARBOR_REGIONAL_COVERAGE_AUDIT_20261122.md` con blobs distintos:

- #110: `7f50b39554ad59e1437aa9b39af10cdb3d80010c` (módulo `meridian_harbor_region_coverage.mjs`, test homónimo).
- #112: `175e79f84667c1109d7da72c553cc79f5b5ebc48` (otro módulo `meridian_bay_harbor_region_coverage.mjs`, test propio y SVG).

Las dos pruebas geométricas registran **69.7200%** de línea propuesta Market–Harbor y **55.6891%** Plaza–Harbor sin cobertura dentro de los tres rectángulos de boceto consultados. Estas cifras **no** equivalen a territorio físico, kilómetros, minutos ni una autorización. **Puerta:** seleccionar o combinar la implementación útil, revisar intersecciones y el SVG, conservar el informe técnico con ambas procedencias y reconciliar índices/inventario; después ejecutar CI del conjunto sobre un SHA nuevo. Nunca sobrescribir el documento de una rama con el de la otra por orden de merge.

**Integración entre carpetas:** múltiples PR de geografía y NPC actualizan `docs/FILE_INVENTORY.json`, `docs/01_world/INDEX.md`, `tools/INDEX.md` y `tests/INDEX.md`; compartir esas rutas requiere un merge revisado, un inventario sin duplicados y pruebas combinadas, no la copia total de la última versión.

## Dictamen al cierre del corte

- Total: **25 PR** en el intervalo #88–#112; **11** espejos QA; **13** PR de trabajo/documentación abiertas y una PR cerrada sustituida (#93).
- Estados CI por SHA en la muestra consultada: **24** registros PR coinciden con ejecuciones concluidas con éxito, incluyendo alias QA; **#92** sin ejecución individual observada. **No** contar un mismo SHA/ejecución varias veces como suites independientes.
- `main` y la partida no se modificaron al levantar esta matriz. El lote no fusiona ramas, no mueve al personaje ni admite cartas, mapas o decisiones sociales como hechos ocurridos.
- Siguiente paso: revisar específicamente la duplicidad de #110/#112, luego verificar la dependencia y los índices de las ramas geográficas en una rama de integración controlada; mantener la secuencia de documentación #83→#92→#99.

**Limitación:** el estado de PR y de GitHub Actions es una fotografía fechada. Si llega una nueva confirmación, commit o PR posterior al corte, consultar nuevamente GitHub; los tests del lote comprueban consistencia local del archivo, no disponibilidad remota en tiempo real.
