# Pruebas y gates de calidad

- [Necesidades de NPC, planes y límites de información](integration_npc_needs_plans.test.mjs)
- [Restricciones causales y temporales de servicios](meridian_bay_services.test.mjs)
- [Tarea privada entre capítulos y recuperación sin duplicados](meridian_bay_phase2_integration.test.mjs)

- [tests/save_gate.test.mjs](save_gate.test.mjs)
- [Pruebas del adaptador HTTP GitHub (D-043)](github_save_adapter.test.mjs)
- [Pruebas integrales de guardado y recuperación (D-042)](save_transaction.test.mjs)
- [tests/turn_engine.test.mjs](turn_engine.test.mjs)
- [Evidence-linked context pilot (from PR #28)](context_manager.test.mjs)
- [Remote context and journal safety tests](verified_context_loader.test.mjs)
- [Pruebas de efectos causales (D-040)](state_changes.test.mjs)
- [tests/test_backstory_aster.py](test_backstory_aster.py)
- [tests/test_character_profile.py](test_character_profile.py)
- [tests/test_starting_checkpoint.py](test_starting_checkpoint.py)
- [tests/index_paths.test.mjs](index_paths.test.mjs)
- [tests/test_literal_archive_validator.py](test_literal_archive_validator.py)
- [docs/QA_SCENARIOS.md](../docs/QA_SCENARIOS.md)
- [docs/TURN_TESTING.md](../docs/TURN_TESTING.md)

- [Pruebas de consecuencias](consequences.test.mjs)

**Regla:** este índice apunta a archivos originales. No crear copias divergentes ni mover documentos canónicos sin migración probada.

**Narración:** si falla cualquier paso del guardado, detener el avance y mostrar el porcentaje de etapas comprobadas. `CONTINUAR GUARDADO` en el siguiente mensaje solo recupera el intento, no mueve a Jack.

- [Consecuencias narrativas del turno 9: mochila, reloj y Aster](test_turn9_consequences.py)

## Living World (rama de revisión)
- [Disponibilidad y rutas](living_world_availability.test.mjs)
- [Rutinas autónomas](living_world_routines.test.mjs)
- [Integración con acontecimientos y cinco archivos](living_world_coordinator.test.mjs)
- [Diagnóstico y privacidad](living_world_diagnostics.test.mjs)
- [Obligaciones persistidas, actores distantes y vencimientos](living_world_persistent_commitments.test.mjs)
- [Trayectos contextuales, referencias y recuperación literal](living_world_travel.test.mjs)
- [Capítulos e identificadores globales](chapter_management.test.mjs)
- [Transición transaccional y recuperación interrumpida](chapter_save_transaction.test.mjs)
- [Validación Python de varios capítulos](test_multichapter_validator.py)
- [Planes condicionales y obligaciones](world_plans.test.mjs)
- [Piloto sintético completo de Rosa entre capítulos](world_plan_pilot.test.mjs)
- [Catálogo y admisión de la ciudad](meridian_bay_foundation.test.mjs)
- [Estado mutable entre capítulos y frontera de admisión](location_state_integration.test.mjs)
- [Admisión independiente, journal y recuperación exacta](world_admission.test.mjs)
- [Cambios causales y disponibilidad de lugares](location_state.test.mjs)
- [Fixture sintético previo a la admisión, sin modificar el guardado real](helpers/meridian_bay_fixture.mjs)
- [Descubrimientos físicos, visitas y evidencia](meridian_bay_discovery.test.mjs)
- [Ciudad, viajes, guardado y continuidad entre capítulos](meridian_bay_integration.test.mjs)
- [Rutas y puntos intermedios](meridian_bay_prebuilt_routes.test.mjs)
- [Referencia cartográfica provisional](meridian_bay_city_scale.test.mjs)
- [Informe de resultados y límites](../docs/LIVING_WORLD_COORDINATOR_QA_20261110.md)

## Current source index supplement — audited November 17, 2026

These files already existed in the authoritative source and are listed here for discoverability; indexing them is not a change to story state.

- [github_journaled_http_integration.test.mjs](github_journaled_http_integration.test.mjs) — Combined mocked REST adapters and interrupted journaled save.
- [github_save_journal.test.mjs](github_save_journal.test.mjs) — Journal states, remote failures and ready baseline.
- [living_world_availability.test.mjs](living_world_availability.test.mjs) — Schedules, overnight windows and unknown availability.
- [living_world_commitments.test.mjs](living_world_commitments.test.mjs) — NPC review timing and context constraints.
- [living_world_coordinator.test.mjs](living_world_coordinator.test.mjs) — Reviewed NPC turn staging and journal save blocking.
- [living_world_diagnostics.test.mjs](living_world_diagnostics.test.mjs) — Private versus reader-safe review.
- [living_world_integrated_rehearsal.test.mjs](living_world_integrated_rehearsal.test.mjs) — In-memory multi-turn NPC/scene rehearsal.
- [living_world_routines.test.mjs](living_world_routines.test.mjs) — NPC route/goal routine proposals.
- [living_world_travel.test.mjs](living_world_travel.test.mjs) — Route, elapsed time and chronology guards.
- [test_checkpoint_audit.py](test_checkpoint_audit.py) — Repo-wide links, inventory, immutable Git snapshot, literal time-of-day and five-file SHA agreement.
- [Decisiones causales NPC: 19 regresiones sobre el mundo admitido](npc_causal_decisions_admitted.test.mjs)
- [Regresiones de relaciones sociales NPC sobre la ciudad admitida (Lote 09)](npc_social_relations_admitted.test.mjs)
- [Regresión de procedencia social y recuperación entre capítulos (6 escenarios)](npc_social_cross_chapter_provenance.test.mjs)
- [Pruebas de referencia fijada, memoria social y detección de falsificaciones (8 casos)](npc_social_knowledge_anchor.test.mjs)
- [Migración de referencia NPC: 14 pruebas de fuente, revisión y rechazo](npc_knowledge_anchor_migration.test.mjs)
- [Admisión de actores NPC: regresiones de identidad, privacidad y capítulos (18 escenarios)](npc_actor_introduction_admitted.test.mjs)
- [Cadenas causales abiertas de NPC: 16 regresiones sintéticas](npc_open_causal_continuations.test.mjs)
- [Memoria social: conversación, decisión posterior y recuperación entre capítulos (QA sintética)](npc_memory_social_continuity.test.mjs)
