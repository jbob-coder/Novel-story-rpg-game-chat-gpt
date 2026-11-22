# Lote 07 — Puertas de integración de PR #82–#87 (2026-11-22)

**Tipo:** auditoría verificable de ramas concurrentes, **sin fusionar trabajo histórico ni ejecutar narrativa**. Fuente primaria: GitHub (metadata de PR, `compare`, árboles Git completos, ejecuciones y pasos de GitHub Actions). Evidencia congelada y verificable estructuralmente: [JSON del lote](BRANCH_INTEGRATION_GATES_LOT_07_2026-11-22.json); regresiones: [tests/branch_integration_gates_lot07.test.mjs](../../tests/branch_integration_gates_lot07.test.mjs).

**Autoridad observada:** `jbob-coder/Novel-story-rpg-game-chat-gpt`, `main` @ `019175c6463ff31807a0f7013d91299add94913c`; 42 PR abiertas en la consulta del 22 de noviembre. Las seis PR de este lote figuran **abiertas/no fusionadas**. La auditoría previa de PR #83 distingue **108 ramas históricas** y cinco refs añadidas a ese corte (113 registros): ni 108 ni 113 es una estimación vigente de cuántas ramas existen hoy.

## Verificación independiente del material protegido

Los siete árboles inspeccionados (main y las seis PR) fueron completos (`truncated=false`). Todos contienen los **mismos cinco Git blob SHA**, comprobados sobre cada árbol, no inferidos de la descripción de los agentes:

| Archivo protegido | Git blob SHA de main y las seis ramas |
| --- | --- |
| `game/SAVE_MANIFEST.json` | `897ec2e77ece4f8edf506c7058552a5dd3cdb320` |
| `game/STATE.json` | `3f4e9c98a7211068faefd31d0a0acbd4260ef589` |
| `chapters/CH-000.events.json` | `1f40c724e44f70c9b45814dc11ff1f73262c5a5f` |
| `chapters/CH-000.transcript.json` | `1350916ead7fb1f2f15fdd635dda42e69a0a3fed` |
| `chapters/CH-000.md` | `e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4` |

El **checkpoint canónico** sigue en CH-000, turno 9, día −29 (mañana), esperando una acción del propietario. El único dato de geografía *admitido* proviene de la admisión anterior; las calles diseñadas en #44/#58 y las regiones costeras siguen siendo **borradores**. Ninguna PR de este lote modifica `game/`, `chapters/` o los archivos del journal.

## Fichas verificadas individualmente

| PR | HEAD exacto | Base de comparación | Cambios Git | CI completa en HEAD |
| --- | --- | --- | ---: | --- |
| [#82](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/82) Agenda causal NPC | `53f6dcb77965` | main `019175c6463f` | 6 | [44792327502](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44792327502) — success |
| [#83](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/83) 108/113 ramas | `5db66f51265d` | main `019175c6463f` | 14 | [44802352081](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44802352081) — success |
| [#84](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/84) Frente tienda | `ea0dcea84ff8` | main `019175c6463f` | 8 | [44804587891](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44804587891) — success |
| [#85](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/85) Frente clínica | `dc4bb38858aa` | main `019175c6463f` | 8 | [44809457137](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44809457137) — success |
| [#86](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/86) Costa 01 | `79cca5c6f910` | main `019175c6463f` | 13 | [44811439451](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44811439451) — success |
| [#87](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/87) Costuras 01/02/03 | `3a923dab989c` | **#86** `79cca5c6f910` | 13 | [44813211142](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44813211142) — success (rama QA del mismo SHA) |

En las seis ejecuciones consultadas, GitHub registra `completed/success`, y los tres pasos esenciales concluyeron con éxito: suite JavaScript, suite Python y validador del checkpoint. **No** se ejecutó la suite localmente en este pase: estas son ejecuciones remotas inspeccionadas con su HEAD. El conteo de *archivos cambiados* de #87 es contra la base #86 y no contra main; su árbol completo tiene 208 blobs, frente a 199 en #86 y 190 en main.

### #82 — Agenda de NPC

Cambios identificados por `compare(main, head)`: nuevos `tools/living_world_agenda.mjs`, `tests/npc_causal_agenda.test.mjs`, documento contractual; modificados `tools/living_world_diagnostics.mjs`, `docs/01_world/INDEX.md`, inventario. Porta selectivamente lógica de la PR histórica #11 y corrige la diferencia de interfaz de `elapsedDays` frente a `targetDay` y la propiedad de obligaciones por actor. La CI confirma regresiones de *su rama*, **no** que la futura decisión de un NPC se haya ejecutado canónicamente. Gate: revisar compatibilidad con necesidades/servicios ya integrados antes de admitir el módulo; no agregar eventos ni turnos ficticios.

### #83 — Inventario verificable de ramas

La PR añadió lotes de documentación, fichero JSON de verificación y la suite `branch_audit_integrity.test.mjs`. Los 108 HEAD históricos y cinco referencias nuevas son un **corte fechado**, no un mecanismo dinámico de detección. Las **26 rutas de herramientas y 32 de pruebas** que no están en main son diferencias **por ruta**, no 58 sistemas terminados ni necesariamente únicos. Gate: conservar la procedencia de los nueve lotes originales y volver a consultar cualquier ref que cambie después del corte. Este lote 07 es complementario y no reemplaza la PR #83.

### #84 / #85 — Dos adaptaciones aisladas para Railgarden

Ambas parten del mismo main y añaden respectivamente un validador y 12 pruebas para tienda (#84), y un validador y 14 pruebas para clínica (#85). No reabren la admisión de los locales. No se certifican horarios de atención, ruta físicamente accesible ni minutos de traslado a partir de coordenadas hipotéticas.

**Superposición confirmada por diffs de archivos:** las dos PR modifican exactamente estos cuatro archivos comunes: `docs/01_world/INDEX.md`, `docs/FILE_INVENTORY.json`, `tests/INDEX.md`, `tools/INDEX.md`. No son pruebas de conflicto textual irreversible, pero **sí** obligan a reconciliar y validar el conjunto antes de integrarlas consecutivamente. Los módulos y tests nuevos tienen rutas diferenciadas. Gate: preparar rama de integración aislada, incorporar una sola, reconciliar índices y ejecutar las pruebas de ambas sobre el **nuevo** HEAD; no atribuir a esa combinación el CI individual de cada PR.

### #86 / #87 — Custodia de costa y costuras

**Dependencia exacta:** #87 tiene base `work/harbor-coast-fragment-review-20261120` @ `79cca5c6f9106b904c5fb371fea28e183b9509ad`; no es una PR independiente contra main. #87 se probó sobre una **rama QA espejo** `qa/meridian-three-region-seam-ci-20261120` con el mismo SHA exacto `3a923dab...`. Esa evidencia prueba las suites de esos bytes, pero no modifica automáticamente el comportamiento de GitHub cuando la base de #87 es otra rama.

**Desfase de trazabilidad:** la descripción de #86 cita `695a5bea234c...` como HEAD; GitHub muestra `79cca5c6f910...`. La matriz congela el HEAD efectivo verificado, y el anterior se considera histórico, no base para CI actual.

**Bloqueador geométrico real del boceto:** la reparación de #86 elimina cruces del polígono portuario con su litoral provisional, pero deja **tres hallazgos** de la calle candidata `HC-A-OLD` contra el edificio candidato `HC-B-02` (dos cruces de borde y un punto interior). La variante histórica de [#67](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/67) cambia solo tres valores escalares y elimina ambos tipos de defectos en la comprobación geométrica de #87. Es un **candidato preferible para revisión**, no un mapa físico certificado. La conexión costera 01↔02 coincide en (75.1,42) y las dos costuras interior↔costa coinciden en (68.1,43.8) y (68.2,46.65): estos son puntos de dibujo, no nuevos nodos guardados.

**Bloqueadores no resueltos:** las rutas directas #44 (cinco puntos) y #58 (seis puntos) no son idénticas; la costa de #86 fue diseñada apoyándose en #58, dependencia que no equivale a validación independiente. La propuesta Plaza–Harbor #56 cruza dos bordes del edificio candidato `HC-B-01`. Ningún boceto autoriza modificar enlaces reales ni suponer un pasaje subterráneo.

## Orden de trabajo seguro recomendado

1. Mantener #83 como referencia documental fechada y **este lote 07** como verificación de estado puntual posterior; no fusionarlos en lote sin revalidar sus HEAD.
2. Para #84/#85, probar juntos los validadores en rama aislada y reconciliar los cuatro índices compartidos sin reemplazar uno por otro.
3. Revisar #82 frente a las necesidades y casos existentes antes de habilitar nuevos resultados sociales; nunca ejecutar agendas de forma desatendida.
4. En rama aislada dependiente de #87, crear un candidato completo Coast 01 desde los tres ajustes de #67, regenerar un SVG distinguible, ejecutar la prueba de sincronía JSON/SVG y repetir la auditoría de costuras. Mantener abiertos #44/#58 y #56.
5. Antes de cualquier integración: releer `main`, las bases y heads; comparar el nuevo árbol, los cinco blobs de la partida y CI en el SHA exacto. Abrir PRs revisables. **No fusionar ni actualizar canon de manera automática.**

## Cómo verificar este registro

El JSON conserva, por PR, ref base, HEAD, estado observado, lista exacta de ficheros del diff, ejecución de CI y paso de verificación, y puertas de integración. La suite nueva comprueba cinco invariantes: unicidad de la clasificación, cinco Git blobs protegidos, identidad SHA de CI, dependencia #87→#86 y los cuatro archivos concurrentes de #84/#85. Las pruebas validan **consistencia de una captura**; no son sustituto de volver a consultar GitHub cuando cambie cualquiera de esas ramas.

**Estado de este lote:** pendiente de atribuir CI al commit final de su propia PR. Su resultado se registrará en la descripción de la PR tras ejecutarse y consultarse, no se anticipa en este documento.
