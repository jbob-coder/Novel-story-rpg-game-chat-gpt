# Matriz de brechas de código entre 108 ramas y la fuente narrativa — 2026-11-19

**Estado: comparación estática de archivos completada; compatibilidad funcional NO acreditada.** Fuente: `work/chat-narrative-foundation` @ `0efd2586ac8647faae10eb84695437dca430df04`. Evidencia de las otras ramas: lotes congelados `branch_checks/LOT_01.json` a `LOT_09.json` (19-11-2026). **No** se volvió a consultar en vivo el HEAD de las 108 ramas durante esta comparación.

## Resultado automático

- 108 ramas originales con `sha_match:true` en la auditoría estructural anterior; 157 archivos en la fuente narrativa, extraídos nuevamente de GitHub.
- 22 grupos de nombres comparten commit, abarcando 46 nombres.
- 2 nombres tienen el árbol de archivos idéntico al de la fuente: `work/chat-narrative-foundation`, `work/meridian-admission-handoff-20261119`.
- **28 nombres de archivo `tools/` ausentes en la fuente**, presentes en uno o más árboles históricos. No son 28 funcionalidades verificadas.
- **34 nombres de pruebas `tests/` ausentes en la fuente**, potencialmente reutilizables tras adaptación de fixture/contrato.
- 57 ramas contienen al menos un nombre de herramienta no presente en la fuente, pero la mayoría comparten los mismos módulos.
- 3 ramas no tienen los cinco archivos centrales de la partida: `main`, `work/living-world-foundation`, `work/story-rpg-foundation`.

**Importante:** un archivo con SHA diferente no implica función nueva; normalmente refleja que la rama es anterior a cambios integrados. Una ruta ausente en la fuente tampoco garantiza que su comportamiento no exista en otro módulo.

## Cinco archivos de historia: regla de preservación

Se compararon las rutas `game/SAVE_MANIFEST.json`, `game/STATE.json`, `chapters/CH-000.events.json`, `chapters/CH-000.transcript.json` y `chapters/CH-000.md`. Una rama con datos anteriores del capítulo/estado no debe copiar sus archivos narrativos a la base actual. El checkpoint de referencia sigue siendo turno 9; no se autoriza turno 10. No se modificó ningún archivo de partida en esta auditoría.

## Hallazgos de revisión de implementación seleccionada (no ensayo ejecutado)

1. **PR #10 — obligaciones persistentes.** La fuente actual contiene `tools/living_world_obligations.mjs` con un encabezado que registra una portación de PR #10; las rutinas actuales importan el validador y `tools/state_changes.mjs` gestiona el campo `commitments`. Esto constituye **evidencia de integración selectiva**, no motivo para importar todo el PR otra vez. El fichero de prueba antiguo `tests/living_world_obligations.test.mjs` no existe en la fuente; revisar cobertura actual antes de adaptarlo.
2. **PR #11 — agenda causal de NPC.** El código examinado construye propuestas privadas, sin avanzar el tiempo ni asumir que una acción ha tenido éxito. La versión de `reviewNPCCommitments` de esa rama **sí admite `targetDay`**, que se pasa desde `planNPCAgendas`; no confundir su firma con la implementación posterior en la fuente. **Incompatibilidad verificada de fixture:** `tests/meridian_bay_agenda.test.mjs` afirma que hay 9 ubicaciones, coherente con el `game/STATE.json` de su rama, mientras la fuente actual tiene **15** (14 LOC más `CITY-MERIDIAN-BAY`). No ejecutar/integrar ese test literalmente contra el estado actual sin adaptarlo.
3. **PR #12–#15 — decisiones, relaciones, necesidades y servicios.** Las ramas contienen módulos separados: `living_world_decisions.mjs`, `living_world_social.mjs`, `living_world_needs.mjs`, `meridian_bay_services.mjs`. Hay contratos de revisión, atribución y eventos causales en código, pero sus efectos **no están probados** con el estado narrativo de 15 ubicaciones ni con las versiones modernas de `turn_engine.mjs`, `state_changes.mjs` y `living_world_commitments.mjs`. Revisar las dependencias en secuencia, no arrastrar `game/STATE.json` ni `chapters/`.
4. **Rama `work/living-world-between-turns-20261112`.** Existe `tools/living_world_deferred.mjs`, cuyo código se presenta como cola de revisiones de NPC entre turnos, no ejecución continua. Este módulo no se encuentra en la fuente actual. Se requiere revisar conservación, consumo y referencia a evento de jugador antes de una portación.
5. **Ramas `qa/`.** Muchas reflejan exactamente el HEAD de una `work/`; se usan para evidencia, no se cuentan como desarrollos independientes ni se fusionan como estados narrativos.

Ninguno de estos resultados afirma haber pasado Node, Python ni la validación de un save en esta sesión. La fuente tuvo CI previa con resultado `success` en el SHA base, **no** en una futura combinación de PR pendientes.

## Módulos `tools/` cuyo nombre no existe en la fuente actual (28)

- `tools/living_world_agenda.mjs`
- `tools/living_world_decisions.mjs`
- `tools/living_world_deferred.mjs`
- `tools/living_world_needs.mjs`
- `tools/living_world_social.mjs`
- `tools/meridian_bay_city.mjs`
- `tools/meridian_bay_coastal_blueprints.mjs`
- `tools/meridian_bay_cross_harbor_corridor.mjs`
- `tools/meridian_bay_land_region_blueprint.mjs`
- `tools/meridian_bay_market_business_frontage.mjs`
- `tools/meridian_bay_market_cross_corridor.mjs`
- `tools/meridian_bay_market_crosswater_corridor.mjs`
- `tools/meridian_bay_market_culture_frontage.mjs`
- `tools/meridian_bay_market_delivery_frontage.mjs`
- `tools/meridian_bay_market_harbor_corridor.mjs`
- `tools/meridian_bay_market_harbor_direct.mjs`
- `tools/meridian_bay_plaza_harbor_corridor.mjs`
- `tools/meridian_bay_plaza_terminal_detail.mjs`
- `tools/meridian_bay_rail_market_corridor.mjs`
- `tools/meridian_bay_railgarden_clinic_detail.mjs`
- `tools/meridian_bay_railgarden_grocery_detail.mjs`
- `tools/meridian_bay_road_web.mjs`
- `tools/meridian_bay_road_web_expansion.mjs`
- `tools/meridian_bay_services.mjs`
- `tools/meridian_bay_walk_slice.mjs`
- `tools/meridian_bay_wilson_railgarden_detail.mjs`
- `tools/qa_live_context_remote_read_20261115.mjs`
- `tools/qa_live_journal_remote_20261115.mjs`

## Siguientes acciones con mejor relación riesgo-beneficio

- Crear una rama de integración independiente a partir del SHA **actual** de la fuente narrativa.
- Elegir **un módulo** por vez (primero contratos de NPC, no mapa completo), extraer dependencias exactas y crear un test con fixtures de las 15 ubicaciones que no altere la partida.
- Ejecutar suites Node, Python y validador **sobre el commit candidato**, revisar privacidad y causalidad, documentar el resultado; no fusionar a `main` hasta recibir aprobación para la operación de integración.
- Mantener [la matriz JSON](BRANCH_SOURCE_GAP_MATRIX_2026-11-19.json) y [el tablero de trabajo](SEGUIMIENTO_DEL_DESARROLLO.md) como índices, no como una segunda fuente de canon.

## Comparación por rama

Columnas: `Herr.` = nombres de `tools/` no presentes en la base; `Pruebas` = nombres de `tests/` no presentes; `Otros` = otros nombres adicionales (generalmente documentos y planos). Los números son **comparación de rutas**, no de nuevas capacidades o líneas de código. La [matriz JSON](BRANCH_SOURCE_GAP_MATRIX_2026-11-19.json) incluye las rutas exactas y SHAs por rama.

| Rama | Clase | Herr. | Pruebas | Otros | Interpretación |
| --- | --- | ---: | ---: | ---: | --- |
| [`audit/independent-checkpoint-verification-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/audit/independent-checkpoint-verification-20261117) | audit | 0 | 0 | 0 | histórico |
| [`audit/living-world-critical-review-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/audit/living-world-critical-review-20261112) | audit | 0 | 0 | 1 | histórico |
| [`audit/recovery-edge-cases-and-checkpoint-crosscheck-20261118`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/audit/recovery-edge-cases-and-checkpoint-crosscheck-20261118) | audit | 0 | 0 | 0 | HEAD compartido |
| [`audit/world-plan-npc-integration-20261114`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/audit/world-plan-npc-integration-20261114) | audit | 0 | 2 | 1 | histórico |
| [`backup/before-meridian-world-admission-20261118`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/backup/before-meridian-world-admission-20261118) | backup | 0 | 0 | 0 | HEAD compartido |
| [`backup/narrative-before-20261115-readiness-integration`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/backup/narrative-before-20261115-readiness-integration) | backup | 0 | 0 | 0 | HEAD compartido |
| [`backup/narrative-before-verified-context-20261115`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/backup/narrative-before-verified-context-20261115) | backup | 0 | 0 | 0 | histórico |
| [`journal/living-world-save-attempts`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/journal/living-world-save-attempts) | journal | 0 | 0 | 3 | histórico |
| [`journal/qa-live-journal-runtime-43767698159`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/journal/qa-live-journal-runtime-43767698159) | journal | 0 | 0 | 2 | histórico |
| [`journal/qa-living-world-smoke-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/journal/qa-living-world-smoke-20261112) | journal | 0 | 0 | 1 | histórico |
| [`journal/qa-narrative-five-file-smoke-20261115`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/journal/qa-narrative-five-file-smoke-20261115) | journal | 0 | 0 | 2 | histórico |
| [`journal/qa-world-admission-20261118`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/journal/qa-world-admission-20261118) | journal | 0 | 0 | 1 | histórico |
| [`main`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/main) | work/main | 0 | 0 | 0 | sin 5 archivos completos |
| [`qa/chatgpt-native-journal-transport-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/chatgpt-native-journal-transport-20261117) | QA | 0 | 0 | 0 | histórico |
| [`qa/crosswater-harbor-corridor-detail-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/crosswater-harbor-corridor-detail-ci-20261116) | QA | 5 | 5 | 13 | HEAD compartido |
| [`qa/live-journal-runtime-43767698159`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/live-journal-runtime-43767698159) | QA | 0 | 0 | 0 | histórico |
| [`qa/living-world-integration-20261110`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/living-world-integration-20261110) | QA | 0 | 0 | 1 | histórico |
| [`qa/living-world-overnight-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/living-world-overnight-20261112) | QA | 0 | 0 | 1 | histórico |
| [`qa/living-world-private-chapter-20261110`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/living-world-private-chapter-20261110) | QA | 0 | 0 | 1 | histórico |
| [`qa/living-world-reliability-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/living-world-reliability-20261112) | QA | 0 | 0 | 1 | histórico |
| [`qa/living-world-reliability-v2-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/living-world-reliability-v2-20261112) | QA | 0 | 0 | 1 | histórico |
| [`qa/living-world-reliability-v3-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/living-world-reliability-v3-20261112) | QA | 0 | 0 | 1 | histórico |
| [`qa/living-world-time-windows-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/living-world-time-windows-20261112) | QA | 0 | 0 | 1 | histórico |
| [`qa/meridian-bay-coast-fragment-02-ci-20261117-a`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-coast-fragment-02-ci-20261117-a) | QA | 11 | 12 | 28 | HEAD compartido |
| [`qa/meridian-bay-market-business-frontage-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-market-business-frontage-ci-20261116) | QA | 9 | 9 | 21 | HEAD compartido |
| [`qa/meridian-bay-market-cross-detail-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-market-cross-detail-ci-20261116) | QA | 4 | 4 | 9 | HEAD compartido |
| [`qa/meridian-bay-market-crosswater-detail-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-market-crosswater-detail-ci-20261116) | QA | 4 | 4 | 9 | HEAD compartido |
| [`qa/meridian-bay-market-culture-frontage-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-market-culture-frontage-ci-20261116) | QA | 8 | 8 | 19 | HEAD compartido |
| [`qa/meridian-bay-market-delivery-frontage-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-market-delivery-frontage-ci-20261116) | QA | 7 | 7 | 17 | HEAD compartido |
| [`qa/meridian-bay-market-harbor-detail-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-market-harbor-detail-ci-20261116) | QA | 6 | 6 | 15 | HEAD compartido |
| [`qa/meridian-bay-market-harbor-section5-ci-20261116-a`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-market-harbor-section5-ci-20261116-a) | QA | 7 | 7 | 15 | HEAD compartido |
| [`qa/meridian-bay-physical-inland-fragment-03-ci-20261117-a`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-physical-inland-fragment-03-ci-20261117-a) | QA | 12 | 14 | 31 | HEAD compartido |
| [`qa/meridian-bay-plaza-harbor-corridor-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-plaza-harbor-corridor-ci-20261116) | QA | 6 | 6 | 13 | HEAD compartido |
| [`qa/meridian-bay-plaza-terminal-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-plaza-terminal-ci-20261116) | QA | 5 | 5 | 11 | HEAD compartido |
| [`qa/meridian-bay-railgarden-clinic-ci-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-railgarden-clinic-ci-20261117) | QA | 10 | 10 | 22 | HEAD compartido |
| [`qa/meridian-bay-railgarden-grocery-ci-20261116-a`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-railgarden-grocery-ci-20261116-a) | QA | 9 | 9 | 19 | HEAD compartido |
| [`qa/meridian-bay-road-web-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-road-web-ci-20261116) | QA | 1 | 1 | 3 | HEAD compartido |
| [`qa/meridian-bay-road-web-slice2-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-road-web-slice2-ci-20261116) | QA | 2 | 2 | 5 | HEAD compartido |
| [`qa/meridian-bay-wilson-railgarden-detail-ci-20261116-a`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/meridian-bay-wilson-railgarden-detail-ci-20261116-a) | QA | 8 | 8 | 17 | HEAD compartido |
| [`qa/narrative-five-file-journal-smoke-20261115`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/narrative-five-file-journal-smoke-20261115) | QA | 0 | 0 | 0 | histórico |
| [`qa/rail-market-corridor-detail-ci-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/rail-market-corridor-detail-ci-20261116) | QA | 2 | 2 | 5 | HEAD compartido |
| [`qa/story-save-recovery-d043-20261110`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/story-save-recovery-d043-20261110) | QA | 0 | 0 | 0 | histórico |
| [`qa/trigger-live-context-read-20261115`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/trigger-live-context-read-20261115) | QA | 1 | 0 | 1 | histórico |
| [`qa/trigger-live-journal-20261115`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/trigger-live-journal-20261115) | QA | 1 | 0 | 1 | histórico |
| [`qa/world-admission-recovery-20261118`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/qa/world-admission-recovery-20261118) | QA | 0 | 0 | 0 | histórico |
| [`work/chapter-plan-pilot-20261113`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/chapter-plan-pilot-20261113) | work/main | 0 | 0 | 0 | histórico |
| [`work/chat-narrative-foundation`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/chat-narrative-foundation) | work/main | 0 | 0 | 0 | idéntico |
| [`work/chatgpt-native-journal-readiness-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/chatgpt-native-journal-readiness-20261117) | work/main | 0 | 0 | 0 | histórico |
| [`work/checkpoint-audit-date-precision-20261118`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/checkpoint-audit-date-precision-20261118) | work/main | 0 | 0 | 0 | histórico |
| [`work/connector-transport-qa-handoff-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/connector-transport-qa-handoff-20261117) | work/main | 0 | 0 | 0 | histórico |
| [`work/context-retrieval-pilot-20261114`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/context-retrieval-pilot-20261114) | work/main | 1 | 3 | 2 | histórico |
| [`work/journal-handoff-fast-resume-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/journal-handoff-fast-resume-20261117) | work/main | 0 | 0 | 0 | histórico |
| [`work/literal-recovery-contextual-time-20261113`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/literal-recovery-contextual-time-20261113) | work/main | 0 | 0 | 0 | histórico |
| [`work/living-world-between-turns-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/living-world-between-turns-20261112) | work/main | 3 | 2 | 3 | histórico |
| [`work/living-world-design-review-20261110`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/living-world-design-review-20261110) | work/main | 0 | 0 | 0 | histórico |
| [`work/living-world-foundation`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/living-world-foundation) | work/main | 0 | 1 | 6 | sin 5 archivos completos |
| [`work/living-world-overnight-availability-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/living-world-overnight-availability-20261112) | work/main | 0 | 0 | 0 | histórico |
| [`work/living-world-persistent-commitments-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/living-world-persistent-commitments-20261112) | work/main | 0 | 1 | 2 | histórico |
| [`work/living-world-private-chapter-20261110`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/living-world-private-chapter-20261110) | work/main | 0 | 0 | 0 | histórico |
| [`work/living-world-reliability-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/living-world-reliability-20261112) | work/main | 0 | 0 | 0 | histórico |
| [`work/living-world-time-interval-hardening-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/living-world-time-interval-hardening-20261112) | work/main | 0 | 0 | 0 | HEAD compartido |
| [`work/meridian-admission-handoff-20261119`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-admission-handoff-20261119) | work/main | 0 | 0 | 0 | idéntico |
| [`work/meridian-bay-atlas-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-atlas-20261112) | work/main | 0 | 0 | 1 | histórico |
| [`work/meridian-bay-causal-decisions-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-causal-decisions-20261112) | work/main | 3 | 3 | 4 | histórico |
| [`work/meridian-bay-causal-routines-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-causal-routines-20261112) | work/main | 2 | 2 | 3 | histórico |
| [`work/meridian-bay-city-scale-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-city-scale-20261112) | work/main | 6 | 8 | 12 | histórico |
| [`work/meridian-bay-core-integrated-atlas-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-core-integrated-atlas-20261117) | work/main | 10 | 10 | 22 | HEAD compartido |
| [`work/meridian-bay-corridor-detail-cross-harbor-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-corridor-detail-cross-harbor-20261116) | work/main | 5 | 5 | 13 | HEAD compartido |
| [`work/meridian-bay-corridor-detail-market-cross-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-corridor-detail-market-cross-20261116) | work/main | 4 | 4 | 9 | HEAD compartido |
| [`work/meridian-bay-corridor-detail-market-harbor-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-corridor-detail-market-harbor-20261116) | work/main | 6 | 6 | 15 | HEAD compartido |
| [`work/meridian-bay-corridor-detail-rail-market-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-corridor-detail-rail-market-20261116) | work/main | 2 | 2 | 5 | HEAD compartido |
| [`work/meridian-bay-district-blueprint-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-district-blueprint-20261112) | work/main | 0 | 1 | 3 | HEAD compartido |
| [`work/meridian-bay-harbor-coast-fragment-02-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-harbor-coast-fragment-02-20261117) | work/main | 11 | 12 | 28 | HEAD compartido |
| [`work/meridian-bay-harbor-coast-fragment-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-harbor-coast-fragment-20261117) | work/main | 10 | 10 | 25 | histórico |
| [`work/meridian-bay-market-business-frontage-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-market-business-frontage-20261116) | work/main | 9 | 9 | 21 | HEAD compartido |
| [`work/meridian-bay-market-crosswater-detail-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-market-crosswater-detail-20261116) | work/main | 4 | 4 | 9 | HEAD compartido |
| [`work/meridian-bay-market-crosswater-land-fragment-03-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-market-crosswater-land-fragment-03-20261117) | work/main | 12 | 14 | 31 | HEAD compartido |
| [`work/meridian-bay-market-culture-frontage-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-market-culture-frontage-20261116) | work/main | 8 | 8 | 19 | HEAD compartido |
| [`work/meridian-bay-market-delivery-frontage-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-market-delivery-frontage-20261116) | work/main | 7 | 7 | 17 | HEAD compartido |
| [`work/meridian-bay-market-harbor-detail-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-market-harbor-detail-20261116) | work/main | 7 | 7 | 15 | HEAD compartido |
| [`work/meridian-bay-needs-tradeoffs-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-needs-tradeoffs-20261112) | work/main | 5 | 5 | 6 | histórico |
| [`work/meridian-bay-phase1-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-phase1-20261116) | work/main | 0 | 0 | 0 | histórico |
| [`work/meridian-bay-plaza-harbor-detail-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-plaza-harbor-detail-20261116) | work/main | 6 | 6 | 13 | HEAD compartido |
| [`work/meridian-bay-plaza-terminal-detail-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-plaza-terminal-detail-20261116) | work/main | 5 | 5 | 11 | HEAD compartido |
| [`work/meridian-bay-prebuilt-integration-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-prebuilt-integration-20261112) | work/main | 6 | 7 | 10 | histórico |
| [`work/meridian-bay-prebuilt-routes-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-prebuilt-routes-20261112) | work/main | 6 | 8 | 11 | histórico |
| [`work/meridian-bay-prebuilt-world-fix-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-prebuilt-world-fix-20261112) | work/main | 6 | 7 | 9 | histórico |
| [`work/meridian-bay-railgarden-clinic-detail-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-railgarden-clinic-detail-20261117) | work/main | 10 | 10 | 22 | HEAD compartido |
| [`work/meridian-bay-railgarden-grocery-detail-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-railgarden-grocery-detail-20261116) | work/main | 9 | 9 | 19 | HEAD compartido |
| [`work/meridian-bay-railgarden-marketrow-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-railgarden-marketrow-20261112) | work/main | 0 | 1 | 3 | HEAD compartido |
| [`work/meridian-bay-railgarden-regional-map-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-railgarden-regional-map-20261117) | work/main | 10 | 10 | 22 | HEAD compartido |
| [`work/meridian-bay-road-growth-slice1-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-road-growth-slice1-20261116) | work/main | 1 | 1 | 3 | HEAD compartido |
| [`work/meridian-bay-road-growth-slice2-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-road-growth-slice2-20261116) | work/main | 2 | 2 | 5 | HEAD compartido |
| [`work/meridian-bay-road-growth-slice3-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-road-growth-slice3-20261116) | work/main | 2 | 2 | 7 | histórico |
| [`work/meridian-bay-route-choices-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-route-choices-20261112) | work/main | 1 | 1 | 3 | histórico |
| [`work/meridian-bay-services-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-services-20261112) | work/main | 6 | 6 | 7 | histórico |
| [`work/meridian-bay-social-relations-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-social-relations-20261112) | work/main | 4 | 4 | 5 | histórico |
| [`work/meridian-bay-visitables-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-visitables-20261112) | work/main | 6 | 7 | 8 | histórico |
| [`work/meridian-bay-walk-slice-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-walk-slice-20261112) | work/main | 1 | 1 | 2 | histórico |
| [`work/meridian-bay-wilson-railgarden-detail-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/meridian-bay-wilson-railgarden-detail-20261116) | work/main | 8 | 8 | 17 | HEAD compartido |
| [`work/narrative-continuous-scenes-20261112`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/narrative-continuous-scenes-20261112) | work/main | 0 | 0 | 1 | histórico |
| [`work/narrative-journal-http-e2e-20261115`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/narrative-journal-http-e2e-20261115) | work/main | 0 | 0 | 0 | histórico |
| [`work/narrative-verified-context-20261115`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/narrative-verified-context-20261115) | work/main | 0 | 0 | 0 | histórico |
| [`work/npc-needs-chapter-bridge-20261114`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/npc-needs-chapter-bridge-20261114) | work/main | 1 | 3 | 2 | histórico |
| [`work/persistent-obligation-review-20261115`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/persistent-obligation-review-20261115) | work/main | 0 | 0 | 0 | histórico |
| [`work/repository-complete-checkpoint-20261117`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/repository-complete-checkpoint-20261117) | work/main | 0 | 0 | 0 | histórico |
| [`work/story-rpg-foundation`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/story-rpg-foundation) | work/main | 0 | 0 | 1 | sin 5 archivos completos |
| [`work/world-admission-location-state-20261116`](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/work/world-admission-location-state-20261116) | work/main | 0 | 0 | 0 | histórico |

**Criterio de cierre pendiente:** verificación semántica y ejecución de pruebas sobre las variantes realmente relevantes; no se declara que las 108 ramas pasen QA funcional.
