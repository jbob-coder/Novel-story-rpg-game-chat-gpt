# Lote 12 — Revisión transversal de migración NPC y propuestas urbanas (2026-11-22)

**Alcance:** auditoría de ramas y procedencia, no decisión de integración ni cambio de partida. Derivado del HEAD exacto de [PR #144](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/144) `fa8fc08d36170ed31ccb4d996f248b01092003f3`. La [matriz estructurada](BRANCH_CROSS_FAMILY_LOT_12_2026-11-22.json) almacena SHA de cabeza/base, nombres de archivos exclusivos, cuatro ejecuciones CI únicas y espejos QA. Las [pruebas estructurales](../../tests/branch_cross_family_lot12.test.mjs) revisan los hechos que el informe puede comprobar localmente. GitHub debe consultarse de nuevo antes de fusionar: esta ficha es un corte **fechado**.

**Checkpoint protegido:** `main@019175c6463ff31807a0f7013d91299add94913c`, CH-000 turno 9; los cinco blobs guardados siguen siendo la autoridad narrativa. No se admitieron movimientos, nuevas ubicaciones, rutas, NPC ni eventos.

## PR revisadas por separado

| PR de trabajo | Base directa | Propósito exclusivo | QA sobre HEAD exacto |
| --- | --- | --- | --- |
| [#138](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/138) `e9ff3c7496495c77e338654ed9045fa3d66aac64` | [#127](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/127) `ae42f871e3ef336dc69a23dca1ba8e861b30cc8d` | **Migración NPC solo candidata**, 14 tests sintéticos; no escribe ancla ni partida. | [45083442698](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45083442698): **498/498 JS**, 47/47 Python, checkpoint PASS |
| [#140](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/140) `190cff8a4eb1d3bdb9a8e44a76b57255fe91e245` | [#130](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/130) `34898eb209472ad4f429c06e6d2b3df6c67f2d55` | Franja de estudio Crosswater → Coast 01 y dos alternativas; **6 incertidumbres** pendientes. 13 tests nuevos. | [45083380584](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45083380584): **527/527 JS**, 47/47 Python, checkpoint PASS |
| [#142](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/142) `ef6c3340446d21704608c678d04a5eeb2f64eb6b` | [#136](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/136) `3a38d41d745075373170b790c1aab92cf8da4785` | Cuatro opciones conceptuales de interfaz M1/P1, **12 requisitos pendientes**. 16 tests nuevos. | [45083620986](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45083620986): **569/569 JS**, 47/47 Python, checkpoint PASS |
| [#146](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/146) `5c2b46d08e89d68c614775bf97b770ae6b39b8c2` | [#140](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/140) `190cff8a4eb1d3bdb9a8e44a76b57255fe91e245` | Bandas y marcadores gráficos de investigación, **5 verificaciones físicas desconocidas**. 15 tests nuevos. | [45083815316](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45083815316): **542/542 JS**, 47/47 Python, checkpoint PASS |

Las PR **#139→#138, #141→#140, #143→#142 y #147→#146** fueron espejos solo para ejecutar CI sobre **el mismo SHA de origen**; quedaron cerradas sin merge. **Ocho PR no equivalen a ocho implementaciones ni ocho ejecuciones independientes**: son cuatro cambios de trabajo y cuatro ejecuciones verificadas. Los tests de cada rama no prueban una combinación que aún no existe.

## Límite de seguridad: PR #138

La rama NPC #138 depende de #127 → #118 → #108 → #98 → #82. Su código `tools/living_world_knowledge_migration.mjs` recibe un snapshot completo y los **cinco archivos crudos**, comprueba consistencia de JSON/relato, su formato Git blob y la reconstrucción causal del conocimiento NPC. Propone un futuro punto de referencia solo si hay turno/evento posterior y revisión declarada, sin cambios en el conjunto de personajes.

**Resultado por operación:**
- `promote_checkpoint`: solo `candidate_only_requires_external_review` para un futuro checkpoint válido; **jamás** promociona automáticamente.
- `register_npc`: bloqueada hasta introducir identidad y evento de creación causal.
- `forget`: bloqueada hasta existir un evento y reconstrucción causal explícitos.

Todas las propuestas conservan `applied:false`, `verifiedRemoteCommit:false` y `ownerApproved:false`. El campo `observedHead` verifica **formato SHA**, **no autenticidad remota** del árbol Git. `proposalDigest` comprueba integridad determinista local y **no es una firma ni decisión del propietario**. La referencia fija original se mantiene en CH-000/turno 9/EV-000029 con 29 entradas de siete NPC.

**Puerta que falta implementar:** comprobación independiente de que HEAD contiene exactamente los cinco blobs, autorización editorial explícita, comparación de HEAD antes de escribir, journal de cambios y readback. El hecho de que los tests sintéticos produzcan turno 10 o conocimiento añadido **no significa que haya sucedido** en el juego.

## Límite cartográfico: PR #140, #142 y #146

- **#140:** calcula únicamente una caja de estudio aproximada y el tramo Crosswater `(65,42) → (66.9,40.6)`; compara las dos entradas ilustrativas a Coast 01 sin transformarlas en calles. Conserva seis incógnitas de parcelas, muros, aceras, terminal, tráfico y transición portuaria.
- **#142:** conserva cuatro conceptos sin posición física — **M1-A, M1-B, P1-A, P1-B** — que requieren doce controles de acceso M1/P1 heredados de #136. Los campos de geometría, anchura real, tiempo de viaje y selección para construir permanecen `null` o `false`.
- **#146:** desciende directamente de #140; dibuja un **semiancho de banda técnica 0.12** y una franja de inspección 0.45 en unidades del lienzo ficticio, **no metros**. Examina dos laterales, dos puntos de revisión y cinco problemas sin resolver de propiedad, muros, accesibilidad, cruces y puerto. No selecciona una de las dos variantes.

La cadena de Crosswater es **#86 → #87 → #94 → #101 → #106 → #114 → #130 → #140 → #146**; la de M1/P1 **#86 → #87 → #89 → #103 → #112 → #122 → #126 → #136 → #142**. **Son caminos de revisión diferentes**, no una sola rama sucesiva. El conflicto de informe #110/#112 y la incorporación no resuelta de #132 siguen siendo puertas de integración, sin resolverlas por orden de merge.

## Conflictos de índice y prioridad técnica

Las cuatro ramas de trabajo modifican los mismos cuatro archivos frente a sus respectivas bases: `docs/01_world/INDEX.md`, `docs/FILE_INVENTORY.json`, `tests/INDEX.md`, `tools/INDEX.md`. Los **módulos e informes propios** ocupan rutas diferentes, pero si se toma la última versión completa de un índice se pierden las referencias de las otras ramas.

La revisión propone **dos rutas de integración separadas**: la NPC requiere una auditoría de permisos, migración y causalidad antes de aplicación; la geográfica requiere decidir y documentar procedencia y geometría, sin construir sobre huecos de plano. Integrarlas solo cuando cada serie tenga cabeza y bases actualizadas, índices reconciliados, inventario completo, tests del **nuevo HEAD combinado** y coincidencia de los cinco blobs del guardado.

**Dictamen:** los cuatro HEAD históricos pasaron sus CI individuales. La rama de esta auditoría solo documenta dependencias y guardas; **no certifica aún ningún merge entre ellas** ni aprueba un cambio físico o narrativo. La PR #132 tiene además un SHA mal transcrito en su informe (comentario 7087596687), y la procedencia de #122 sigue pendiente de aclaración (comentario 7087441989); ambas deben verificarse de nuevo al examinar sus versiones actuales.
